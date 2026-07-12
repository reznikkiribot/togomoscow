import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url', 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const links = await p.menuLink.updateMany({ where: { price: { gt: 100000 } }, data: { price: null } });
console.log('menu links cleared (price>100k):', links.count);
// review attributes.price — raw SQL clamp
const revs = await p.review.findMany({ where: { NOT: { attributes: { equals: null } } }, select: { id: true, attributes: true } });
let fixed = 0;
for (const r of revs) {
  const a = r.attributes;
  if (a && typeof a === 'object' && typeof a.price === 'number' && a.price > 100000) {
    await p.review.update({ where: { id: r.id }, data: { attributes: { ...a, price: null } } });
    fixed++;
  }
}
console.log('review prices cleared:', fixed);
await p.$disconnect();
