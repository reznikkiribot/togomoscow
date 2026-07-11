// Detects BLACK-AND-WHITE / near-grayscale photos across the whole catalog
// (dishes, drinks, venues). Uses sharp channel stats on 200px thumbnails: if the
// mean per-pixel color deviation is tiny, the photo is effectively monochrome.
// Failures → photoUrl NULL + queued into gen-todo.json for regeneration.
//   node prisma/check-grayscale.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const sharp = (await import('sharp')).default;
const p = new PrismaClient();
const dry = process.argv.includes('--dry');
const APP = 'https://togomoscow-production.up.railway.app';

async function saturation(url) {
  try {
    const abs = url.startsWith('/') ? `${APP}${url}${url.includes('?') ? '' : '?w=200'}` : url;
    const r = await fetch(abs, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const { data, info } = await sharp(buf).resize(64, 64, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
    if (info.channels < 3) return 0; // 1-2 channels = definitely grayscale
    let dev = 0;
    const px = info.width * info.height;
    for (let i = 0; i < px; i++) {
      const o = i * info.channels;
      const r0 = data[o], g0 = data[o + 1], b0 = data[o + 2];
      const mean = (r0 + g0 + b0) / 3;
      dev += (Math.abs(r0 - mean) + Math.abs(g0 - mean) + Math.abs(b0 - mean)) / 3;
    }
    return dev / px; // 0 = pure grayscale; food photos are typically 15-40
  } catch {
    return null;
  }
}

const items = await p.listing.findMany({
  where: { photoUrl: { not: null } },
  select: { id: true, name: true, type: true, category: true, photoUrl: true },
});
console.log(`к проверке фото: ${items.length}`);
let mono = 0, ok = 0, dead = 0;
const flagged = [];
for (const it of items) {
  const s = await saturation(it.photoUrl);
  if (s == null) { dead++; continue; }
  if (s < 5) {
    mono++;
    flagged.push(it);
    console.log(`✗ ч/б: ${it.name} [${it.type}] насыщенность ${s.toFixed(1)}`);
  } else ok++;
}
if (!dry && flagged.length) {
  const f = path.join(__dirname, 'gen-todo.json');
  const todo = JSON.parse(fs.readFileSync(f, 'utf8'));
  const known = new Set(todo.mismatches.map((m) => m.id));
  let done = new Set();
  try { done = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'generated-ok.json'), 'utf8'))); } catch { /* none */ }
  for (const it of flagged) {
    if (it.type === 'RESTAURANT') {
      // venues just fall back to category stock — no generation needed
      await p.listing.update({ where: { id: it.id }, data: { photoUrl: null } }).catch(() => {});
      continue;
    }
    await p.listing.update({ where: { id: it.id }, data: { photoUrl: null } }).catch(() => {});
    done.delete(it.id);
    for (let a = 0; a < 3; a++) {
      const png = path.join(__dirname, '..', '..', 'tools', 'sd', 'out', `${it.id}-${a}.png`);
      if (fs.existsSync(png)) fs.unlinkSync(png);
    }
    if (!known.has(it.id)) {
      const cat = (it.category ?? '').toLowerCase();
      const en = /кофе/.test(cat) ? 'specialty coffee drink in a cup'
        : it.type === 'DRINK' ? 'refreshing drink in a glass' : 'restaurant plated dish, colorful';
      todo.mismatches.push({ id: it.id, name: it.name, en });
    }
  }
  fs.writeFileSync(f, JSON.stringify(todo, null, 1));
  fs.writeFileSync(path.join(__dirname, 'generated-ok.json'), JSON.stringify([...done]));
}
console.log(`Итог: цветных=${ok} ч/б=${mono} недоступно=${dead}`);
await p.$disconnect();
