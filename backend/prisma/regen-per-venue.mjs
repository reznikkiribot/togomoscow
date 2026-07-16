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
//   --stage-gen    sd img2img per ref → tools/sd/outv/<domain>__<slug>-<n>.png
//   --stage-check  CLIP-verify vs the dish name, upload, set menuLink.photoUrl for
//                  every link of that (domain, dish)
//   node prisma/regen-per-venue.mjs --stage-dl|--stage-gen|--stage-check [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const STAGE = process.argv.includes('--stage-dl') ? 'dl' : process.argv.includes('--stage-gen') ? 'gen' : process.argv.includes('--stage-check') ? 'check' : null;
if (!STAGE) { console.log('--stage-dl | --stage-gen | --stage-check'); process.exit(1); }
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const SD = path.join(__dirname, '..', '..', 'tools', 'sd');
const REF = path.join(SD, 'refv');
const OUT = path.join(SD, 'outv');
fs.mkdirSync(REF, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const MAP_FILE = path.join(__dirname, 'perv-map.json');
const DONE_FILE = path.join(__dirname, 'perv-done.json');
const ACCEPT = 0.5;
const norm = (s) => (s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// ASCII-only key — sd-cli.exe cannot open Cyrillic file paths on Windows
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
const key = (domain, name) => `${domain.replace(/[^a-z0-9]/gi, '').slice(0, 12)}_${hash(domain + '|' + norm(name))}`;

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
    const venues = await p.listing.findMany({
      where: { type: 'RESTAURANT', website: { contains: domain } },
      select: { id: true },
    });
    if (!venues.length) continue;
    const venueIds = venues.map((v) => v.id);
    for (const it of withImg) {
      const k = key(domain, it.name);
      // which catalog item(s) do this chain's links point at for this dish name?
      const links = await p.menuLink.findMany({
        where: { venueId: { in: venueIds }, item: { name: { equals: it.name, mode: 'insensitive' } } },
        select: { venueId: true, itemId: true, photoUrl: true },
      });
      if (!links.length) continue;
      mapped++;
      map[k] = { domain, name: it.name, image: it.image, links: links.map((l) => [l.venueId, l.itemId]) };
      if (fs.existsSync(path.join(REF, k + '.png'))) continue;
      try {
        const r = await fetch(it.image, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
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

if (STAGE === 'gen') {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let n = 0;
  for (const k of Object.keys(map)) {
    if (done.has(k)) continue;
    if (n >= LIMIT) break;
    const ref = `refv/${k}.png`;
    if (!fs.existsSync(path.join(SD, ref))) continue;
    let made = 0;
    for (let a = 0; a < 2; a++) {
      const outRel = `outv/${k}-${a}.png`;
      if (fs.existsSync(path.join(SD, outRel))) { made++; continue; }
      try {
        // strength 0.45 mutated ingredients (strawberries → raspberries, 16.07.2026);
        // 0.35 keeps the dish faithful while still redrawing the details
        execFileSync('./sd-cli.exe', [
          '-m', 'sd_turbo.safetensors', '-i', ref, '--strength', '0.35',
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
  console.log('загружаю CLIP…');
  const t = await import('@xenova/transformers');
  t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
  // ONE vision tower (feature-extraction) + text tower for labels — the zero-shot
  // pipeline would load a second full vision copy (OOM lesson). Embeddings let us
  // also verify the result against the official REFERENCE, not just the name.
  const MODEL = 'Xenova/clip-vit-base-patch32';
  const embedder = await t.pipeline('image-feature-extraction', MODEL);
  const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
  const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL);
  const textVecCache = new Map();
  async function textVecs(labels) {
    const ck = labels.join('|');
    if (textVecCache.has(ck)) return textVecCache.get(ck);
    const { text_embeds } = await textModel(tokenizer(labels, { padding: true, truncation: true }));
    const [nn, dim] = text_embeds.dims;
    const vecs = [];
    for (let i = 0; i < nn; i++) {
      const v = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim));
      const nrm = Math.hypot(...v) || 1;
      vecs.push(v.map((x) => x / nrm));
    }
    textVecCache.set(ck, vecs);
    return vecs;
  }
  const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  async function embedFile(file) {
    const img = await RawImage.fromBlob(new Blob([new Uint8Array(fs.readFileSync(file))]));
    const out = await embedder(img, { pooling: 'mean', normalize: true });
    const v = Array.from(out.data);
    const nrm = Math.hypot(...v) || 1; // pipeline output is NOT unit-length — normalize
    return v.map((x) => x / nrm);
  }
  // softmax over cosine sims ×100 (CLIP logit scale) — same math as the backend
  function textScore(imgVec, vecs) {
    const logits = vecs.map((v) => cos(imgVec, v) * 100);
    const mx = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - mx));
    return exps[0] / exps.reduce((a, b) => a + b, 0);
  }
  const REF_SIM = 0.82; // generated image must stay CLOSE to the official reference
  console.log('CLIP готов');
  // dish english labels from gen-todo (best-effort)
  let enByName = {};
  try { for (const m of JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-todo.json'), 'utf8')).mismatches) enByName[norm(m.name)] = m.en; } catch { /* fine */ }

  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let up = 0, skip = 0, n = 0;
  for (const k of Object.keys(map)) {
    if (done.has(k)) continue;
    if (n >= LIMIT) break;
    const m = map[k];
    const en = enByName[norm(m.name)] ?? 'restaurant plated dish';
    const labels = await textVecs([`a photo of ${en}`, 'a photo of an unrelated object or scene']);
    // the official reference embedding — the generated shot must stay close to it
    let refVec = null;
    const refFile = path.join(REF, `${k}.png`);
    if (fs.existsSync(refFile)) { try { refVec = await embedFile(refFile); } catch { /* no ref check */ } }
    let best = null;
    for (let a = 0; a < 2; a++) {
      const file = path.join(OUT, `${k}-${a}.png`);
      if (!fs.existsSync(file)) continue;
      try {
        const imgVec = await embedFile(file);
        const s = textScore(imgVec, labels);
        const refSim = refVec ? cos(imgVec, refVec) : null;
        if (!best || s + (refSim ?? 0) > best.s + (best.refSim ?? 0)) best = { s, refSim, file };
      } catch { /* skip variant */ }
    }
    if (!best) continue;
    n++;
    if (best.s < ACCEPT || (best.refSim != null && best.refSim < REF_SIM)) {
      skip++;
      if (best.refSim != null && best.refSim < REF_SIM) console.log(`  reject ${m.name}: ушло от референса (sim=${best.refSim.toFixed(2)})`);
      continue;
    }
    const keyName = `aigen-${randomUUID()}`;
    try {
      await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: keyName, Body: fs.readFileSync(best.file), ContentType: 'image/png' }));
      const url = `/api/files/${keyName}`;
      // set on EVERY link of this (chain × dish)
      for (const [venueId, itemId] of m.links) {
        await p.menuLink.update({ where: { venueId_itemId: { venueId, itemId } }, data: { photoUrl: url } }).catch(() => {});
      }
      done.add(k);
      up++;
      if (up % 20 === 0) { fs.writeFileSync(DONE_FILE, JSON.stringify([...done])); console.log(`  залито ${up}`); }
    } catch (e) { console.log(`upload FAIL ${k}: ${String(e.message || '').slice(0, 70)}`); }
  }
  fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
  console.log(`Итог (check): залито=${up} не прошло=${skip} обработано=${n}`);
}
await p.$disconnect();
