// PER-VENUE AI photos (owner rule 12.07.2026): each chain's own menu photo of a
// dish is the reference; we generate our OWN image from it and store it on that
// chain's menu links (menuLink.photoUrl). Same dish at a different chain → a
// different photo. Rotating "попробуйте в" rotates the image.
//
// Keyed by (domain, dish name): all a chain's branches share the chain menu photo,
// so one generation fills every branch's link for that dish.
// Stages (onnx/sharp/spawn conflicts → separate processes):
//   --stage-dl     from menu-out files: match (chain venues × dish) links, download
//                  the chain's menu photo to tools/sd/refv/<domain>__<slug>.png
//   --stage-refcheck  CLIP-reject collage/grid references before generation
//   --stage-gen    sd img2img per ref → tools/sd/outv/<domain>__<slug>-<n>.png
//   --stage-check  CLIP-verify vs the dish name, upload, set menuLink.photoUrl for
//                  every link of that (domain, dish)
// Add --recheck to stage-check to revalidate previously uploaded entries.
//   node prisma/regen-per-venue.mjs --stage-dl|--stage-gen|--stage-check [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { isJunk, normalizeMenuName } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const rawDbUrl = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const dbSeparator = rawDbUrl.includes('?') ? '&' : '?';
process.env.DATABASE_URL = `${rawDbUrl}${dbSeparator}connect_timeout=30&connection_limit=1`;
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const STAGE = process.argv.includes('--stage-dl') ? 'dl'
  : process.argv.includes('--stage-refcheck') ? 'refcheck'
    : process.argv.includes('--stage-gen') ? 'gen'
      : process.argv.includes('--stage-check') ? 'check' : null;
if (!STAGE) { console.log('--stage-dl | --stage-refcheck | --stage-gen | --stage-check'); process.exit(1); }
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const RECHECK = process.argv.includes('--recheck');
const SD = path.join(__dirname, '..', '..', 'tools', 'sd');
const REF = path.join(SD, 'refv');
const OUT = path.join(SD, 'outv');
fs.mkdirSync(REF, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const MAP_FILE = path.join(__dirname, 'perv-map.json');
const DONE_FILE = path.join(__dirname, 'perv-done.json');
const NAME_ACCEPT = 0.72;
const NAME_MIN_SIM = 0.20;
const NAME_MARGIN = 0.01;
const REF_SIM = 0.86;
const COLLAGE_ACCEPT = 0.68;
const norm = (s) => (s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// the public DB proxy drops connections randomly (P1001) — retry, don't die mid-run
const retryDb = async (fn) => {
  for (let a = 1; a <= 6; a++) {
    try { return await fn(); } catch (e) {
      // a moved/merged link (dupe-merge relinked the item) is NOT transient —
      // don't burn minutes retrying a record that will never exist; skip at once
      if (e?.code === 'P2025' || /depends on one or more records/i.test(String(e.message))) throw e;
      if (a === 6) throw e;
      console.log(`  db retry ${a}: ${String(e.message || '').split('\n').filter(Boolean).slice(-1)[0].slice(0, 60)}`);
      await new Promise((r) => setTimeout(r, a * 5000));
    }
  }
};
// ASCII-only key — sd-cli.exe cannot open Cyrillic file paths on Windows
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
const key = (domain, name) => `${domain.replace(/[^a-z0-9]/gi, '').slice(0, 12)}_${hash(domain + '|' + norm(name))}`;
const currentMapKey = (mapKey, item) => mapKey === key(item.domain, normalizeMenuName(item.name));

// A grid collage creates a long, sharp seam through much of the image. Requiring
// either one very strong seam or crossing medium seams avoids treating pizza
// slice edges and plate rims as collages.
async function sharpCollageSignal(sharp, input) {
  const { data, info } = await sharp(input)
    .resize(256, 256, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  function strongest(vertical) {
    const lineCount = vertical ? width : height;
    const span = vertical ? height : width;
    let best = { mean: 0, persistent: 0, at: 0 };
    for (let line = Math.floor(lineCount * 0.12); line < Math.ceil(lineCount * 0.88); line++) {
      let total = 0, persistent = 0;
      for (let pos = 0; pos < span; pos++) {
        const a = vertical ? data[pos * width + line - 1] : data[(line - 1) * width + pos];
        const b = vertical ? data[pos * width + line] : data[line * width + pos];
        const delta = Math.abs(a - b);
        total += delta;
        if (delta >= 38) persistent++;
      }
      const candidate = { mean: total / span, persistent: persistent / span, at: line };
      if (candidate.mean * candidate.persistent > best.mean * best.persistent) best = candidate;
    }
    return best;
  }
  const vertical = strongest(true);
  const horizontal = strongest(false);
  const strong = [vertical, horizontal].some((s) => s.mean >= 32 && s.persistent >= 0.68);
  const crossing = [vertical, horizontal].every((s) => s.mean >= 23 && s.persistent >= 0.48);
  return { collage: strong || crossing, vertical, horizontal };
}

async function loadClipTools() {
  console.log('загружаю CLIP…');
  const t = await import('@xenova/transformers');
  t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
  const model = 'Xenova/clip-vit-base-patch32';
  const embedder = await t.pipeline('image-feature-extraction', model);
  const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
  const tokenizer = await AutoTokenizer.from_pretrained(model);
  const textModel = await CLIPTextModelWithProjection.from_pretrained(model);
  const textVecCache = new Map();
  async function textVecs(labels) {
    const cacheKey = labels.join('|');
    if (textVecCache.has(cacheKey)) return textVecCache.get(cacheKey);
    const { text_embeds } = await textModel(tokenizer(labels, { padding: true, truncation: true }));
    const [count, dim] = text_embeds.dims;
    const vecs = [];
    for (let i = 0; i < count; i++) {
      const vector = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim));
      const length = Math.hypot(...vector) || 1;
      vecs.push(vector.map((value) => value / length));
    }
    textVecCache.set(cacheKey, vecs);
    return vecs;
  }
  const cos = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  async function embedFile(file) {
    const image = await RawImage.fromBlob(new Blob([new Uint8Array(fs.readFileSync(file))]));
    const out = await embedder(image, { pooling: 'mean', normalize: true });
    const vector = Array.from(out.data);
    const length = Math.hypot(...vector) || 1;
    return vector.map((value) => value / length);
  }
  function probabilities(imageVector, textVectors) {
    const similarities = textVectors.map((vector) => cos(imageVector, vector));
    const logits = similarities.map((similarity) => similarity * 100);
    const max = Math.max(...logits);
    const exp = logits.map((logit) => Math.exp(logit - max));
    const total = exp.reduce((sum, value) => sum + value, 0);
    return { similarities, probabilities: exp.map((value) => value / total) };
  }
  console.log('CLIP готов');
  return { cos, embedFile, probabilities, textVecs };
}

const COLLAGE_LABELS = [
  'a food collage or grid showing multiple separate dishes and photos',
  'one single dish in one continuous photograph',
];

if (STAGE === 'dl') {
  const sharp = (await import('sharp')).default;
  let map = {};
  try { map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); } catch { /* first run */ }
  let dl = 0, mapped = 0;
  for (const f of fs.readdirSync(path.join(__dirname, 'menu-out'))) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu-out', f), 'utf8'));
    const domain = (j.domain || f.replace('.json', '')).replace(/^www\./, '');
    const items = Array.isArray(j) ? j : (j.items ?? []);
    const withImg = items.filter((it) => it?.name && it?.image && /^https?:/.test(it.image));
    if (!withImg.length) continue;
    // this chain's venue ids
    const venues = await retryDb(() => p.listing.findMany({
      where: { type: 'RESTAURANT', website: { contains: domain } },
      select: { id: true },
    }));
    if (!venues.length) continue;
    const venueIds = venues.map((v) => v.id);
    for (const it of withImg) {
      const itemName = normalizeMenuName(it.name);
      if (!itemName || isJunk(itemName)) continue;
      const k = key(domain, itemName);
      // which catalog item(s) do this chain's links point at for this dish name?
      const links = await retryDb(() => p.menuLink.findMany({
        where: { venueId: { in: venueIds }, item: { name: { equals: itemName, mode: 'insensitive' } } },
        select: { venueId: true, itemId: true, photoUrl: true },
      }));
      if (!links.length) continue;
      mapped++;
      map[k] = { domain, name: itemName, image: it.image, links: links.map((l) => [l.venueId, l.itemId]) };
      const refFile = path.join(REF, k + '.png');
      if (fs.existsSync(refFile)) {
        try {
          const signal = await sharpCollageSignal(sharp, refFile);
          if (signal.collage) {
            map[k].rejected = 'sharp-collage';
            console.log(`  reject ref ${itemName}: grid seams v=${signal.vertical.persistent.toFixed(2)} h=${signal.horizontal.persistent.toFixed(2)}`);
          }
        } catch { /* the check stage will reject unreadable references */ }
        continue;
      }
      try {
        const r = await fetch(it.image, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        const signal = await sharpCollageSignal(sharp, buf);
        if (signal.collage) {
          map[k].rejected = 'sharp-collage';
          console.log(`  reject ref ${itemName}: grid seams v=${signal.vertical.persistent.toFixed(2)} h=${signal.horizontal.persistent.toFixed(2)}`);
          continue;
        }
        // OWNER FRAMING RULE (12.07.2026): the dish fills ~75% of the frame and
        // sits slightly HIGH, so the card crop (top band) shows the food while the
        // lower part revealed on open is just background. Cover-crop keeps it large.
        await sharp(buf)
          .resize(512, 512, { fit: 'cover', position: 'top' })
          .png()
          .toFile(path.join(REF, k + '.png'));
        dl++;
        if (dl % 25 === 0) { fs.writeFileSync(MAP_FILE, JSON.stringify(map)); console.log(`  скачано ${dl}`); }
      } catch { /* skip */ }
    }
  }
  fs.writeFileSync(MAP_FILE, JSON.stringify(map));
  console.log(`Итог (dl): (сеть×блюдо)=${mapped}, рефов скачано=${dl}, в карте=${Object.keys(map).length}`);
}

if (STAGE === 'refcheck') {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const clip = await loadClipTools();
  const collageVecs = await clip.textVecs(COLLAGE_LABELS);
  let checked = 0, rejected = 0;
  for (const [k, item] of Object.entries(map)) {
    if (!currentMapKey(k, item)) continue;
    if (item.rejected === 'sharp-collage') { rejected++; continue; }
    const refFile = path.join(REF, `${k}.png`);
    if (!fs.existsSync(refFile)) continue;
    try {
      const imageVec = await clip.embedFile(refFile);
      const result = clip.probabilities(imageVec, collageVecs);
      const collageProbability = result.probabilities[0];
      checked++;
      if (collageProbability >= COLLAGE_ACCEPT) {
        item.rejected = 'clip-collage';
        rejected++;
        console.log(`  reject ref ${item.name}: CLIP collage=${collageProbability.toFixed(2)}`);
      } else if (item.rejected) {
        delete item.rejected;
      }
    } catch (error) {
      item.rejected = 'unreadable-reference';
      rejected++;
      console.log(`  reject ref ${item.name}: ${String(error?.message ?? error).slice(0, 80)}`);
    }
  }
  fs.writeFileSync(MAP_FILE, JSON.stringify(map));
  console.log(`Итог (refcheck): проверено=${checked}, коллажей/битых=${rejected}`);
}

if (STAGE === 'gen') {
  // Run semantic collage detection in a clean child process before sd-cli. This
  // preserves the proven process isolation between ONNX and the native generator.
  execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--stage-refcheck'], {
    cwd: path.join(__dirname, '..'), stdio: 'inherit', timeout: 60 * 60_000,
  });
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let n = 0;
  for (const k of Object.keys(map)) {
    if (!currentMapKey(k, map[k])) continue;
    if (map[k].rejected) continue;
    if (done.has(k)) continue;
    if (n >= LIMIT) break;
    const ref = `refv/${k}.png`;
    if (!fs.existsSync(path.join(SD, ref))) continue;
    let made = 0;
    for (let a = 0; a < 2; a++) {
      const outRel = `outv/${k}-${a}.png`;
      if (fs.existsSync(path.join(SD, outRel))) { made++; continue; }
      try {
        // OWNER RULE 16.07.2026: strength 0.2 — the copy stays maximally faithful
        // to the official reference (0.45 mutated strawberries into raspberries,
        // 0.35 turned a wok pasta into a soup); we only "re-shoot", not re-invent
        execFileSync('./sd-cli.exe', [
          '-m', 'sd_turbo.safetensors', '-i', ref, '--strength', '0.2',
          '--steps', '6', '--cfg-scale', '1.0', '-W', '512', '-H', '512',
          '-s', String(3000 + a * 555), '-o', outRel,
          '-p', `professional food photography, the dish fills most of the frame in the upper part, appetizing, natural light, soft blurred background below, high detail`,
        ], { stdio: 'pipe', timeout: 300000, cwd: SD });
        made++;
      } catch (e) { console.log(`gen FAIL ${k} #${a}: ${String(e.message || '').slice(0, 70)}`); }
    }
    if (made) { n++; if (n % 20 === 0) console.log(`  gen ${n}`); }
  }
  console.log(`Итог (gen): обработано=${n}`);
}

if (STAGE === 'check') {
  const aws = await import('@aws-sdk/client-s3');
  // railway CLI hits backboard over the network — transient resets (10054) killed
  // whole runs before, so retry with backoff instead of dying on the first drop
  let creds = null;
  for (let att = 1; att <= 5; att++) {
    try {
      creds = JSON.parse(execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }));
      break;
    } catch (e) {
      console.log(`bucket credentials attempt ${att}/5 failed: ${String(e.message || '').split('\n')[0].slice(0, 90)}`);
      if (att === 5) throw e;
      await new Promise((r) => setTimeout(r, att * 5000));
    }
  }
  const s3 = new aws.S3Client({
    endpoint: creds.endpoint, region: creds.region,
    credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    forcePathStyle: creds.urlStyle !== 'virtual-host',
  });
  const clip = await loadClipTools();
  const collageVecs = await clip.textVecs(COLLAGE_LABELS);
  // Prefer the maintained translation cache, then ask the local qwen model. A
  // generic fallback is intentionally forbidden: no exact translation means no upload.
  let enByName = {};
  try { for (const m of JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-todo.json'), 'utf8')).mismatches) enByName[norm(m.name)] = m.en; } catch { /* fine */ }
  const usefulEnglish = (value) => {
    const text = String(value ?? '').trim().toLowerCase();
    return /^[a-z0-9][a-z0-9 -]{1,59}$/.test(text)
      && !/^(?:restaurant )?(?:plated )?(?:food|dish|drink|meal)$|^italian (?:pizza|pasta dish)$|^(?:refreshing|specialty) (?:drink|coffee drink)(?: in a (?:glass|cup))?$/.test(text);
  };
  const liveTranslations = new Map();
  async function englishName(name) {
    const normalizedName = norm(name);
    if (liveTranslations.has(normalizedName)) return liveTranslations.get(normalizedName);
    let translated = null;
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          model: process.env.OLLAMA_TEXT_MODEL || 'qwen2.5:3b',
          prompt: `Translate this Russian menu item into a precise short English food-photo description (2-6 words). Preserve the main ingredient and dish type. Reply only in English: ${name}`,
          stream: false,
          options: { temperature: 0 },
        }),
      });
      if (response.ok) {
        const json = await response.json();
        const candidate = String(json.response ?? '').trim().split(/\r?\n/)[0].replace(/["'.]/g, '').toLowerCase();
        if (usefulEnglish(candidate)) translated = candidate;
      }
    } catch { /* use the maintained cache below */ }
    if (!translated) {
      const cached = enByName[normalizedName];
      if (usefulEnglish(cached)) translated = cached.trim().toLowerCase();
    }
    liveTranslations.set(normalizedName, translated);
    return translated;
  }

  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  async function clearPhotos(item) {
    for (const [venueId, itemId] of item.links) {
      await retryDb(() => p.menuLink.update({
        where: { venueId_itemId: { venueId, itemId } },
        data: { photoUrl: null },
      })).catch(() => {});
    }
  }
  let up = 0, verified = 0, skip = 0, n = 0;
  for (const k of Object.keys(map)) {
    if (n >= LIMIT) break;
    const m = map[k];
    if (!currentMapKey(k, m)) continue;
    if (m.rejected) {
      await clearPhotos(m);
      done.delete(k);
      skip++; n++;
      console.log(`  reject ${m.name}: ${m.rejected}`);
      continue;
    }
    const wasDone = done.has(k);
    if (wasDone && !RECHECK) continue;
    const en = await englishName(m.name);
    if (!en) {
      await clearPhotos(m);
      done.delete(k);
      skip++; n++;
      console.log(`  reject ${m.name}: нет точного EN-перевода`);
      continue;
    }
    const nameLabels = [
      `a close-up food photo of ${en}`,
      `${en} served as one restaurant dish`,
      'a bowl of plain sauce or dip without a main dish',
      'a different unrelated restaurant dish',
      'a food collage showing multiple dishes',
      'a restaurant menu, advertisement, or product package',
    ];
    const nameVecs = await clip.textVecs(nameLabels);
    let refVec = null, refCollage = 1;
    const refFile = path.join(REF, `${k}.png`);
    if (fs.existsSync(refFile)) {
      try {
        refVec = await clip.embedFile(refFile);
        const result = clip.probabilities(refVec, collageVecs);
        refCollage = result.probabilities[0];
      } catch { /* rejected below */ }
    }
    if (!refVec || refCollage >= COLLAGE_ACCEPT) {
      await clearPhotos(m);
      done.delete(k);
      skip++; n++;
      console.log(`  reject ${m.name}: референс отсутствует/коллаж (${refCollage.toFixed(2)})`);
      continue;
    }
    let best = null;
    for (let a = 0; a < 2; a++) {
      const file = path.join(OUT, `${k}-${a}.png`);
      if (!fs.existsSync(file)) continue;
      try {
        const imgVec = await clip.embedFile(file);
        const collageResult = clip.probabilities(imgVec, collageVecs);
        const collage = collageResult.probabilities[0];
        if (collage >= COLLAGE_ACCEPT) continue;
        const nameResult = clip.probabilities(imgVec, nameVecs);
        const nameProbability = nameResult.probabilities[0] + nameResult.probabilities[1];
        const nameSimilarity = Math.max(nameResult.similarities[0], nameResult.similarities[1]);
        const negativeSimilarity = Math.max(...nameResult.similarities.slice(2));
        const nameMargin = nameSimilarity - negativeSimilarity;
        const refSim = clip.cos(imgVec, refVec);
        const candidate = { nameProbability, nameSimilarity, nameMargin, refSim, file };
        if (!best || candidate.nameProbability + candidate.refSim > best.nameProbability + best.refSim) best = candidate;
      } catch { /* skip variant */ }
    }
    if (!best) {
      await clearPhotos(m);
      done.delete(k);
      skip++; n++;
      console.log(`  reject ${m.name}: нет одиночного читаемого кандидата`);
      continue;
    }
    n++;
    if (best.nameProbability < NAME_ACCEPT || best.nameSimilarity < NAME_MIN_SIM || best.nameMargin < NAME_MARGIN || best.refSim < REF_SIM) {
      await clearPhotos(m);
      done.delete(k);
      skip++;
      console.log(`  reject ${m.name}: name=${best.nameProbability.toFixed(2)} sim=${best.nameSimilarity.toFixed(2)} margin=${best.nameMargin.toFixed(2)} ref=${best.refSim.toFixed(2)}`);
      continue;
    }
    if (wasDone) {
      verified++;
      continue;
    }
    const keyName = `aigen-${randomUUID()}`;
    try {
      await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: keyName, Body: fs.readFileSync(best.file), ContentType: 'image/png' }));
      const url = `/api/files/${keyName}`;
      // set on EVERY link of this (chain × dish)
      for (const [venueId, itemId] of m.links) {
        await retryDb(() => p.menuLink.update({ where: { venueId_itemId: { venueId, itemId } }, data: { photoUrl: url } })).catch(() => {});
      }
      done.add(k);
      up++;
      if (up % 20 === 0) { fs.writeFileSync(DONE_FILE, JSON.stringify([...done])); console.log(`  залито ${up}`); }
    } catch (e) { console.log(`upload FAIL ${k}: ${String(e.message || '').slice(0, 70)}`); }
  }
  fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
  console.log(`Итог (check): залито=${up} подтверждено=${verified} не прошло=${skip} обработано=${n}`);
}
await p.$disconnect();
