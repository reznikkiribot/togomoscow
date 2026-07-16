// RETRO-CLEAN (16.07.2026): remove absurd stock/enriched photos from dish & drink
// cards — e.g. a street kitchen with people on a filter-coffee card. For every
// stored listing photo that is NOT ai-generated (aigen- passed CLIP already) and
// NOT a user's review photo, CLIP checks "is this a plated dish/drink at all,
// or people / street scene / screenshot / logo?" Failures → photoUrl = NULL
// (the card falls back to the illustrative placeholder until a real review photo).
//   node prisma/retro-clean-stock.mjs [--dry] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim() + '?connect_timeout=30&connection_limit=1';
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const dry = process.argv.includes('--dry');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const BASE = 'https://togomoscow-production.up.railway.app';

console.log('загружаю CLIP…');
const t = await import('@xenova/transformers');
t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
const MODEL = 'Xenova/clip-vit-base-patch32';
const embedder = await t.pipeline('image-feature-extraction', MODEL);
const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL);
const LABELS = [
  'professional photo of a plated dish, drink, dessert or packaged food product', // 0 = ok
  'a photo with people, faces or someone cooking on the street',
  'a street scene, building, market or outdoor place',
  'a screenshot, chart, document, logo or text',
];
const { text_embeds } = await textModel(tokenizer(LABELS, { padding: true, truncation: true }));
const [ln, ldim] = text_embeds.dims;
const labelVecs = [];
for (let i = 0; i < ln; i++) {
  const v = Array.from(text_embeds.data.slice(i * ldim, (i + 1) * ldim));
  const nrm = Math.hypot(...v) || 1;
  labelVecs.push(v.map((x) => x / nrm));
}
console.log('CLIP готов');
const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
async function scoreUrl(url) {
  const full = url.startsWith('http') ? url : BASE + url;
  const r = await fetch(full, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) return { dead: true };
  const img = await RawImage.fromBlob(new Blob([new Uint8Array(Buffer.from(await r.arrayBuffer()))]));
  const out = await embedder(img, { pooling: 'mean', normalize: true });
  const v = Array.from(out.data);
  const nrm = Math.hypot(...v) || 1;
  const iv = v.map((x) => x / nrm);
  const logits = labelVecs.map((lv) => cos(iv, lv) * 100);
  const mx = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - mx));
  const sum = exps.reduce((a, b) => a + b, 0);
  return { food: exps[0] / sum, top: logits.indexOf(mx) };
}

const retry = async (fn) => {
  for (let a = 1; a <= 6; a++) {
    try { return await fn(); } catch (e) { if (a === 6) throw e; await new Promise((r) => setTimeout(r, a * 4000)); }
  }
};

// photos that came from USERS (review galleries) — never touch those
const reviews = await retry(() => p.review.findMany({ select: { photoUrls: true } }));
const userPhotos = new Set(reviews.flatMap((r) => r.photoUrls ?? []));

const items = await retry(() => p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { not: null } },
  select: { id: true, name: true, photoUrl: true, photos: true },
}));
const todo = items.filter((l) =>
  l.photoUrl &&
  !l.photoUrl.includes('aigen-') && // AI photos already CLIP-verified at creation
  !userPhotos.has(l.photoUrl),
);
console.log(`к проверке: ${todo.length} из ${items.length} (aigen и юзерские пропущены)`);

let cleared = 0, ok = 0, dead = 0, n = 0;
const log = [];
for (const l of todo) {
  if (n >= LIMIT) break;
  n++;
  try {
    const s = await scoreUrl(l.photoUrl);
    if (s.dead) { dead++; continue; }
    if (s.food >= 0.5 && s.top === 0) { ok++; continue; }
    log.push({ id: l.id, name: l.name, photoUrl: l.photoUrl, food: +s.food.toFixed(2), top: LABELS[s.top] });
    console.log(`  снять: ${l.name} (food=${s.food.toFixed(2)}, top=${s.top})`);
    if (!dry) await retry(() => p.listing.update({ where: { id: l.id }, data: { photoUrl: null } }));
    cleared++;
    if (cleared % 20 === 0) fs.writeFileSync(path.join(__dirname, 'retro-clean-log.json'), JSON.stringify(log, null, 1));
  } catch { /* transient — leave for next run */ }
  if (n % 50 === 0) console.log(`  …проверено ${n}`);
}
fs.writeFileSync(path.join(__dirname, 'retro-clean-log.json'), JSON.stringify(log, null, 1));
console.log(`Итог: проверено=${n}, ок=${ok}, снято=${cleared}, битых=${dead}${dry ? ' (DRY)' : ''}`);
await p.$disconnect();
