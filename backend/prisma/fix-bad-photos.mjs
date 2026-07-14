// Null obviously-wrong catalog photos so they regenerate with the right subject:
// «Свежая клубника» got a raspberry, «Пицца Том ям» got soup (name-noun lost).
import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url', 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
// pizzas whose photo isn't a pizza; strawberry that's a raspberry; etc.
const bad = await p.listing.findMany({
  where: { type: { in: ['DISH','DRINK'] }, OR: [
    { name: { contains: 'клубник', mode: 'insensitive' } },
    { AND: [{ name: { contains: 'пицц', mode: 'insensitive' } }, { name: { contains: 'том ям', mode: 'insensitive' } }] },
  ] },
  select: { id: true, name: true },
});
for (const b of bad) { await p.listing.update({ where: { id: b.id }, data: { photoUrl: null } }); console.log('сброшено фото:', b.name); }
console.log('всего:', bad.length);
await p.$disconnect();
