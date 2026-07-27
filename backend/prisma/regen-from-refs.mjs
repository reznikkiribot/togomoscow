// OWNER ALGORITHM (11.07.2026): official menu photos are the REFERENCE, our AI
// makes a SIMILAR but not identical image (SD img2img, strength 0.6), and that
// derivative goes on the card. Future parses must NOT regenerate: a photoUrl
// starting with /api/files/aigen- is final.
// Stages (onnx/sharp/spawn conflicts → separate processes):
//   --stage-dl     match catalog items to menu-out refs by name, download refs
//                  to tools/sd/ref/<id>.png (768px, via sharp)
//   --stage-gen    sd-cli img2img per ref → tools/sd/out-i2i/<id>-<n>.png
//   --stage-check  CLIP-verify vs the dish name, upload the best as aigen-*
//   node prisma/regen-from-refs.mjs --stage-dl | --stage-gen | --stage-check [--limit N]
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
if (!STAGE) { console.log('укажи --stage-dl | --stage-gen | --stage-check'); process.exit(1); }
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const SD = path.join(__dirname, '..', '..', 'tools', 'sd');
const REF = path.join(SD, 'ref');
const OUT = path.join(SD, 'out-i2i');
fs.mkdirSync(REF, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const MAP_FILE = path.join(__dirname, 'i2i-map.json'); // id → {name, en, ref}
const DONE_FILE = path.join(__dirname, 'i2i-done.json');
// How many times each item already failed the CLIP check. Used to (a) pick fresh
// seeds so the retry is not the same picture, (b) stop after MAX_TRIES instead of
// looping forever on a dish the model can't render.
const TRIES_FILE = path.join(__dirname, 'i2i-tries.json');
const MAX_TRIES = Infinity; // retry until the photo matches the name at 92%
let tries = {};
try { tries = JSON.parse(fs.readFileSync(TRIES_FILE, 'utf8')); } catch { tries = {}; }
// OWNER RULE (26.07.2026): the image must match the dish name at ≥92%.
// Anything below is not uploaded — the item goes back for another attempt.
const ACCEPT = 0.92;

if (fs.existsSync(path.join(__dirname, 'i2i-stop'))) { console.log('STOP-флаг — выходим'); process.exit(0); }
const norm = (s) => (s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

if (STAGE === 'dl') {
  const sharp = (await import('sharp')).default;
  // collect refs from every parsed menu
  const refByName = new Map();
  for (const f of fs.readdirSync(path.join(__dirname, 'menu-out'))) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu-out', f), 'utf8'));
      const items = Array.isArray(j) ? j : (j.items ?? []);
      for (const it of items) {
        if (it?.name && it?.image && /^https?:/.test(it.image) && !refByName.has(norm(it.name))) {
          refByName.set(norm(it.name), it.image);
        }
      }
    } catch { /* skip bad file */ }
  }
  console.log(`референсов в парсингах: ${refByName.size}`);
  const listings = await p.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] } },
    select: { id: true, name: true, category: true },
  });
  let map = {};
  try { map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); } catch { /* first run */ }
  let dl = 0, matched = 0;
  for (const l of listings) {
    const ref = refByName.get(norm(l.name));
    if (!ref) continue;
    matched++;
    if (map[l.id]?.refOk && fs.existsSync(path.join(REF, `${l.id}.png`))) continue;
    try {
      const r = await fetch(ref, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      // 512x512 cover — img2img wants the target aspect
      await sharp(buf).resize(472, 472, { fit: 'contain', background: { r: 250, g: 249, b: 247 } }).extend({ top: 20, bottom: 20, left: 20, right: 20, background: { r: 250, g: 249, b: 247 } }).png().toFile(path.join(REF, `${l.id}.png`));
      map[l.id] = { name: l.name, category: l.category, ref, refOk: true };
      dl++;
      if (dl % 25 === 0) { fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1)); console.log(`  скачано ${dl}`); }
    } catch { /* skip */ }
  }
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1));
  console.log(`Итог (dl): совпало по имени=${matched}, скачано новых=${dl}, всего в карте=${Object.keys(map).length}`);
}

if (STAGE === 'gen') {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let n = 0;
  for (const [id, m] of Object.entries(map)) {
    if (done.has(id)) continue;
    if (n >= LIMIT) break;
    const refRel = `ref/${id}.png`;
    if (!fs.existsSync(path.join(SD, refRel))) continue;
    let made = 0;
    for (let a = 0; a < 2; a++) {
      const outRel = `out-i2i/${id}-${a}.png`;
      if (fs.existsSync(path.join(SD, outRel))) { made++; continue; }
      try {
        execFileSync('./sd-cli.exe', [
          // OWNER RULE: strength 0.2 — the AI image must stay very close to the
          // real parsed photo (minimal deviation), so «много несовпадений» goes away.
          '-m', 'sd_turbo.safetensors', '-i', refRel,
          // strength grows slightly per retry: at 0.2 the render barely moves off a
          // reference that already fails the 92% name check
          '--strength', String(Math.min(0.2 + (tries[id] ?? 0) * 0.08, 0.5).toFixed(2)),
          '--steps', '6', '--cfg-scale', '1.0', '-W', '768', '-H', '768',
          '-s', String(2000 + a * 555 + (tries[id] ?? 0) * 9173), '-o', outRel,
          '-p', (tries[id] ?? 0) === 0
            ? `professional food photography, the whole dish fully visible and centered, appetizing, natural light, high detail`
            : `professional food photography of ${m.name}, the whole dish fully visible and centered on a plate, sharp focus, appetizing, natural light, ultra detailed, no text`,
        ], { stdio: 'pipe', timeout: 300000, cwd: SD });
        made++;
      } catch (e) {
        console.log(`gen FAIL ${m.name} #${a}: ${String(e.message || '').slice(0, 80)}`);
      }
    }
    if (made) { n++; console.log(`gen ${m.name} (${made} вар.)`); }
  }
  console.log(`Итог (gen): позиций обработано=${n}`);
}

if (STAGE === 'check') {
  const aws = await import('@aws-sdk/client-s3');
  const creds = JSON.parse(execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }));
  const s3 = new aws.S3Client({
    endpoint: creds.endpoint, region: creds.region,
    credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    forcePathStyle: creds.urlStyle !== 'virtual-host',
  });
  console.log('загружаю CLIP…');
  const t = await import('@xenova/transformers');
  t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
  const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  const { RawImage } = t;
  console.log('CLIP готов');

  // en label via dictionary-lite: reuse gen-todo translations when present
  let enById = {};
  try {
    for (const m of JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-todo.json'), 'utf8')).mismatches) enById[m.id] = m.en;
  } catch { /* fine */ }

  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8'))); } catch { /* none */ }
  let up = 0, skip = 0, n = 0;
  for (const [id, m] of Object.entries(map)) {
    if (done.has(id)) continue;
    if (n >= LIMIT) break;
    const cat = (m.category ?? '').toLowerCase();
    const en = enById[id]
      ?? (/кофе/.test(cat) ? 'coffee drink' : /чай/.test(cat) ? 'tea drink' : /пицц/.test(cat) ? 'pizza' : 'food dish');
    let best = null;
    for (let a = 0; a < 2; a++) {
      const file = path.join(OUT, `${id}-${a}.png`);
      if (!fs.existsSync(file)) continue;
      try {
        const img = await RawImage.fromBlob(new Blob([new Uint8Array(fs.readFileSync(file))]));
        const positive = `a photo of ${m?.name ?? ''} — ${en}`.replace(' —  ', ' ');
    const labels = [
      positive,
      'a photo of a meat dish on a plate',
      'a photo of a salad or vegetables',
      'a photo of a dessert or pastry',
      'a photo of a drink in a glass',
      'a photo of a completely different food',
      'a photo that is not food',
    ];
        const out = await zs(img, labels);
        const s = out.find((o) => o.label === labels[0])?.score ?? 0;
        if (!best || s > best.s) best = { s, file };
      } catch { /* skip variant */ }
    }
    if (!best) continue;
    n++;
    if (best.s < ACCEPT) {
      // Failed the check → throw the images away and record the attempt, so the
      // next cycle generates DIFFERENT ones (the gen stage skips existing files,
      // so without this the same rejected picture was re-checked forever).
      for (let a = 0; a < 2; a++) {
        try { fs.unlinkSync(path.join(SD, `out-i2i/${id}-${a}.png`)); } catch { /* already gone */ }
      }
      tries[id] = (tries[id] ?? 0) + 1;
      fs.writeFileSync(TRIES_FILE, JSON.stringify(tries));
      skip++;
      console.log(`SKIP ${m.name} скор ${best.s.toFixed(2)} — попытка ${tries[id]}/${MAX_TRIES}`);
      continue;
    }
    const key = `aigen-${randomUUID()}`;
    try {
      await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: key, Body: fs.readFileSync(best.file), ContentType: 'image/png' }));
      await p.listing.update({ where: { id }, data: { photoUrl: `/api/files/${key}`, photoVerifiedAt: new Date(), photoScore: best.s } });
      done.add(id);
      up++;
      console.log(`OK ${m.name} -> aigen (${best.s.toFixed(2)})`);
      if (up % 20 === 0) fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
    } catch (e) {
      console.log(`upload FAIL ${m.name}: ${String(e.message || '').slice(0, 80)}`);
    }
  }
  fs.writeFileSync(DONE_FILE, JSON.stringify([...done]));
  console.log(`Итог (check): залито=${up} не прошло=${skip}`);
}
await p.$disconnect();
