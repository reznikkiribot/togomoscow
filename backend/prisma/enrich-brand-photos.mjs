// Real photos for the seeded beer/wine brands via Pexels (free, commercial, no
// attribution). Queries "<brand> beer|wine" so results are always relevant drink
// shots (never an off-topic person). Falls back to a generic beer/wine query.
// Needs PEXELS_API_KEY in backend/.env. Run: node prisma/enrich-brand-photos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
process.env.DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
const KEY = env.PEXELS_API_KEY;

async function search(q) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) return null;
  const data = await res.json();
  const p = data.photos?.[0];
  return p?.src?.large ?? p?.src?.medium ?? null;
}

async function main() {
  if (!KEY) {
    console.log('Нет PEXELS_API_KEY в backend/.env');
    return;
  }
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const items = await prisma.listing.findMany({
    where: { type: 'DRINK', category: { in: ['Пиво', 'Вино'] }, brand: { not: null }, photoUrl: null },
    select: { id: true, name: true, brand: true, category: true },
  });
  let ok = 0;
  let fallback = 0;
  for (const it of items) {
    const kind = it.category === 'Пиво' ? 'beer' : 'wine';
    let url = await search(`${it.brand} ${kind}`);
    if (url) ok++;
    else {
      url = await search(kind === 'beer' ? 'craft beer glass' : 'wine glass bottle');
      if (url) fallback++;
    }
    if (url) await prisma.listing.update({ where: { id: it.id }, data: { photoUrl: url } });
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`Бренды: ${items.length}. По бренду: ${ok}, по категории: ${fallback}.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
