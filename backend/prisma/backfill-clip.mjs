// CLIP image embeddings for every dish/drink photo → enables fast, accurate, language-
// independent photo recognition (image-to-image). Idempotent: skips items already
// embedded unless --all. Run: node prisma/backfill-clip.mjs [--all]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const { pipeline, env } = await import('@xenova/transformers');
env.cacheDir = path.join(__dirname, '..', '.models-cache');
const p = new PrismaClient();

console.log('loading CLIP…');
const ex = await pipeline('image-feature-extraction', process.env.CLIP_MODEL || 'Xenova/clip-vit-base-patch32');
console.log('CLIP ready');

// PHOTO_BASE lets us embed the aigen-* photos straight from prod's bucket instead
// of a local dev server. Default to prod so a run without a local server works.
const PHOTO_BASE = process.env.PHOTO_BASE || 'https://togomoscow-production.up.railway.app';
const resolve = (u) => (u.startsWith('http') ? u : `${PHOTO_BASE}${u}`);
const all = process.argv.includes('--all');

const items = await p.$queryRawUnsafe(
  `SELECT id, name, photo_url AS "photoUrl", array_length(image_embedding,1) AS have
     FROM listings WHERE type::text IN ('DISH','DRINK') AND photo_url IS NOT NULL`,
);
console.log(`items with photo: ${items.length}`);
let done = 0, skip = 0, fail = 0;
for (const it of items) {
  if (!all && it.have) { skip++; continue; }
  try {
    // transformers.js reads a URL/path directly (data URIs aren't supported in v2)
    const out = await ex(resolve(it.photoUrl), { pooling: 'mean', normalize: true });
    const lit = '{' + Array.from(out.data).join(',') + '}';
    await p.$executeRawUnsafe(`UPDATE listings SET image_embedding = $1::float8[] WHERE id = $2`, lit, it.id);
    done++;
    if (done % 50 === 0) console.log(`  embedded ${done}…`);
  } catch (e) { fail++; }
}
console.log(`\nCLIP embedded: ${done}, skipped: ${skip}, failed: ${fail}`);
await p.$disconnect();
