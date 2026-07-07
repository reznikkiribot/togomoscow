// Assigns free, commercial-use Pexels photos to venues, MATCHED to each venue's
// cuisine/type (burger joint vs pizzeria vs coffee shop vs steakhouse…), so a
// Burger King looks like fast food, not a fine-dining wine bar. Round-robin within
// each pool for variety. Overwrites photoUrl (current venue photos are stock).
// Needs PEXELS_API_KEY in backend/.env.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
process.env.DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
const KEY = env.PEXELS_API_KEY;

const QUERIES = {
  coffee: ['coffee shop interior', 'cozy cafe interior', 'latte art cafe'],
  bar: ['cocktail bar interior', 'pub interior', 'bar counter drinks'],
  burger: ['burger restaurant', 'burger and fries', 'fast food burger'],
  pizza: ['pizzeria interior', 'pizza restaurant', 'wood fired pizza'],
  sushi: ['sushi restaurant', 'japanese restaurant interior', 'sushi platter'],
  steak: ['steakhouse interior', 'grilled steak dinner'],
  georgian: ['georgian food khinkali', 'khachapuri'],
  asian: ['asian restaurant interior', 'noodle bar', 'wok food'],
  seafood: ['seafood restaurant', 'fresh seafood platter'],
  dessert: ['bakery cafe interior', 'dessert cafe', 'pastry shop'],
  rest: ['restaurant interior', 'modern restaurant', 'cozy restaurant table'],
};

function poolKey(v) {
  const s = `${v.cuisine ?? ''} ${v.name} ${v.category ?? ''}`.toLowerCase();
  if (/burger|бургер/.test(s)) return 'burger';
  if (/pizza|пицц/.test(s)) return 'pizza';
  if (/sushi|суши|japan|япон|ramen|рамен|роллы/.test(s)) return 'sushi';
  if (/steak|стейк|мясо|grill|гриль|bbq|барбекю/.test(s)) return 'steak';
  if (/georg|грузин|хачапур|хинкал/.test(s)) return 'georgian';
  if (/sea_?food|морепрод|рыб|fish/.test(s)) return 'seafood';
  if (/dessert|десерт|bakery|пекарн|конди|торт|cake|пончи|выпечк/.test(s)) return 'dessert';
  if (/asian|азиат|thai|тай|chinese|кита|noodle|лапш|\bwok\b|вок|pan_?asian/.test(s)) return 'asian';
  if (/coffee|кофе|кафе|\bcafe\b|espresso|эспрессо/.test(s)) return 'coffee';
  if (/\bbar\b|бар|pub|паб|beer|пив|wine|вин|коктейл/.test(s)) return 'bar';
  return 'rest';
}

async function pool(queries) {
  const out = [];
  for (const q of queries) {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=50&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: KEY } });
    if (!res.ok) continue;
    const data = await res.json();
    for (const p of data.photos ?? []) {
      const src = p?.src?.large ?? p?.src?.medium;
      if (src && !out.includes(src)) out.push(src);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return out;
}

async function main() {
  if (!KEY) { console.log('Нет PEXELS_API_KEY в backend/.env'); return; }
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const pools = {};
  for (const [k, qs] of Object.entries(QUERIES)) {
    pools[k] = await pool(qs);
    console.log(`pool ${k}: ${pools[k].length}`);
  }
  if (!pools.rest.length) { console.log('Pexels пусто — прерываю.'); await prisma.$disconnect(); return; }

  const venues = await prisma.listing.findMany({
    where: { type: 'RESTAURANT' },
    select: { id: true, name: true, category: true, cuisine: true },
  });
  const ctr = {};
  let n = 0;
  for (const v of venues) {
    const key = poolKey(v);
    const p = pools[key].length ? pools[key] : pools.rest;
    const i = ctr[key] ?? 0; ctr[key] = i + 1;
    const url = p[i % p.length];
    if (url) { await prisma.listing.update({ where: { id: v.id }, data: { photoUrl: url } }); n++; }
  }
  console.log(`Обновлено заведений: ${n} из ${venues.length}. Распределение:`, ctr);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
