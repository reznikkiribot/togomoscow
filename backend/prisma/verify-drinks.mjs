// STRICT category-aware re-verification: a COFFEE/TEA/DRINK card photo must
// show a BEVERAGE, not plates of food (the «hoop Эфиопия анаэробная» case —
// an Ethiopian food spread on a coffee card). Failures → photoUrl NULL and the
// item joins gen-todo.json for local generation.
//   node prisma/verify-drinks.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const dry = process.argv.includes('--dry');

console.log('загружаю CLIP…');
const t = await import('@xenova/transformers');
t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
const { RawImage } = t;
console.log('CLIP готов');

const APP = 'https://togomoscow-production.up.railway.app';
async function beverageScore(url) {
  try {
    const abs = url.startsWith('/') ? APP + url : url;
    const r = await fetch(abs, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const img = await RawImage.fromBlob(new Blob([new Uint8Array(await r.arrayBuffer())]));
    const labels = [
      'a photo of a drink or beverage in a cup, glass or bottle',
      'a photo of food dishes on plates',
      'a photo of an unrelated object or scene',
    ];
    const out = await zs(img, labels);
    return out.find((o) => o.label === labels[0])?.score ?? 0;
  } catch {
    return null; // unreachable photo → leave as is, don't punish
  }
}

// every DRINK + anything in explicitly drink-like categories
const items = await p.listing.findMany({
  where: {
    photoUrl: { not: null },
    OR: [
      { type: 'DRINK' },
      { category: { in: ['Кофе', 'Чай', 'Напитки', 'Коктейли', 'Лимонады', 'Смузи'] } },
    ],
  },
  select: { id: true, name: true, category: true, photoUrl: true },
});
console.log(`к проверке напитков: ${items.length}`);
let ok = 0, nulled = 0, skipped = 0;
const newTodo = [];
for (const it of items) {
  const s = await beverageScore(it.photoUrl);
  if (s == null) { skipped++; continue; }
  if (s >= 0.45) { ok++; continue; }
  nulled++;
  console.log(`✗ ${it.name} [${it.category}] напиток-скор ${s.toFixed(2)} → фото снято`);
  newTodo.push({ id: it.id, name: it.name });
  if (!dry) await p.listing.update({ where: { id: it.id }, data: { photoUrl: null } }).catch(() => {});
}
// merge the failures into gen-todo.json so the running generator picks them up
if (newTodo.length && !dry) {
  const f = path.join(__dirname, 'gen-todo.json');
  const todo = JSON.parse(fs.readFileSync(f, 'utf8'));
  const known = new Set(todo.mismatches.map((m) => m.id));
  for (const n of newTodo) {
    if (known.has(n.id)) continue;
    const cat = (items.find((i) => i.id === n.id)?.category ?? '').toLowerCase();
    const en = /кофе/.test(cat) ? 'specialty coffee drink in a glass cup'
      : /чай/.test(cat) ? 'tea in a glass'
      : /коктейл/.test(cat) ? 'craft cocktail in a glass'
      : 'refreshing drink in a glass';
    todo.mismatches.push({ id: n.id, name: n.name, en });
  }
  fs.writeFileSync(f, JSON.stringify(todo, null, 1));
}
console.log(`Итог: ок=${ok} снято=${nulled} недоступно=${skipped}; добавлено в генерацию: ${newTodo.length}`);
await p.$disconnect();
