import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url', 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const strip = (s) => norm(s).replace(/^(паста|пицца|салат|суп|ролл|роллы|напиток|коктейль)\s+/, '');
const items = await p.listing.findMany({ where: { type: { in: ['DISH', 'DRINK'] } }, select: { id: true, name: true, type: true, reviewCount: true } });
const groups = new Map();
for (const it of items) {
  const k = it.type + '|' + strip(it.name);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(it);
}
const dupes = [...groups.values()].filter((g) => g.length > 1);
for (const g of dupes) console.log(g.map((x) => `${x.name}(${x.reviewCount})`).join(' <-> '));
console.log('групп дублей:', dupes.length);
fs.writeFileSync('prisma/dupes.json', JSON.stringify(dupes, null, 1));
await p.$disconnect();
