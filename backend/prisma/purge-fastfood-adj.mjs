// Purge: mass fast-food chains (Бургер Кинг, Вкусно и точка, Ростикс, KFC…) and
// single-adjective dish names ("Малиновый"). Owner rule 13.07.2026. Not soft —
// these are removed with their menu links/reviews/favorites.
import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url', 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const FF = /бургер.?кинг|burger.?king|вкусно.?и.?точка|vkusnoitochka|ростикс|rostic|kfc|макдо|mcdonald|subway|сабвэй|додо.?экспресс|теремок|крошка.?картошка|стардог|stardog|hesburger/i;
const del = async (id) => {
  await p.menuLink.deleteMany({ where: { OR: [{ itemId: id }, { venueId: id }] } }).catch(()=>{});
  await p.review.deleteMany({ where: { listingId: id } }).catch(()=>{});
  await p.favorite.deleteMany({ where: { listingId: id } }).catch(()=>{});
  await p.interaction.deleteMany({ where: { listingId: id } }).catch(()=>{});
  await p.dislike.deleteMany({ where: { itemId: id } }).catch(()=>{});
  await p.listing.delete({ where: { id } }).catch(()=>{});
};
// 1) fast-food venues + their items (items only linked to those venues)
const venues = await p.listing.findMany({ where: { type: 'RESTAURANT' }, select: { id: true, name: true, website: true } });
let ffV = 0;
for (const v of venues) {
  if (FF.test(v.name) || FF.test(v.website ?? '')) { await del(v.id); ffV++; console.log('фастфуд-заведение:', v.name); }
}
// 2) single-adjective dish/drink names
const items = await p.listing.findMany({ where: { type: { in: ['DISH', 'DRINK'] } }, select: { id: true, name: true } });
let adj = 0;
for (const it of items) {
  const w = it.name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (w.length === 1 && /(ый|ий|ой|ая|яя|ое|ее|ые)$/.test(w[0]) && w[0].length >= 5) {
    await del(it.id); adj++; console.log('прилагательное:', it.name);
  }
}
// 3) orphan items left with zero menu links after venue removal are KEPT (hidden
//    from menu per the earlier rule) — not deleted
console.log(`Итог: фастфуд-заведений=${ffV}, блюд-прилагательных=${adj}`);
await p.$disconnect();
