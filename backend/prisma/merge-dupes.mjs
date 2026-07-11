// Merges duplicate catalog items (Карбонара <-> Паста Карбонара etc).
// Safety: a group merges ONLY when categories are compatible — a pizza and a
// soup that share a stripped name stay separate. Keeps the item with more
// reviews (then more menu links), moves links/reviews/favorites, recounts.
import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url', 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const strip = (s) => norm(s).replace(/^(паста|пицца|салат|суп|ролл|роллы|напиток|коктейль)\s+/, '');
const kind = (name, cat) => {
  const n = norm(name); const c = (cat ?? '').toLowerCase();
  if (/^пицца /.test(n) || /пицц/.test(c)) return 'pizza';
  if (/^паста /.test(n) || /паст/.test(c)) return 'pasta';
  if (/^суп /.test(n) || /суп/.test(c)) return 'soup';
  if (/^салат /.test(n) || /салат/.test(c)) return 'salad';
  return 'any';
};
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, name: true, type: true, category: true, reviewCount: true, _count: { select: { servedAt: true } } },
});
const groups = new Map();
for (const it of items) {
  const k = it.type + '|' + strip(it.name);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(it);
}
let merged = 0, skipped = 0;
for (const g of [...groups.values()].filter((x) => x.length > 1)) {
  const kinds = new Set(g.map((x) => kind(x.name, x.category)));
  kinds.delete('any');
  if (kinds.size > 1) { skipped++; console.log('SKIP (разные блюда):', g.map((x) => x.name).join(' | ')); continue; }
  g.sort((a, b) => b.reviewCount - a.reviewCount || b._count.servedAt - a._count.servedAt || a.name.length - b.name.length);
  const keep = g[0];
  for (const dupe of g.slice(1)) {
    const links = await p.menuLink.findMany({ where: { itemId: dupe.id } });
    for (const l of links) {
      await p.menuLink.upsert({
        where: { venueId_itemId: { venueId: l.venueId, itemId: keep.id } },
        create: { venueId: l.venueId, itemId: keep.id, status: l.status, price: l.price },
        update: {},
      }).catch(() => {});
    }
    await p.menuLink.deleteMany({ where: { itemId: dupe.id } });
    const revs = await p.review.findMany({ where: { listingId: dupe.id }, select: { id: true, userId: true } });
    for (const r of revs) {
      const clash = await p.review.findFirst({ where: { listingId: keep.id, userId: r.userId } });
      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
      else await p.review.update({ where: { id: r.id }, data: { listingId: keep.id } }).catch(() => {});
    }
    await p.favorite.deleteMany({ where: { listingId: dupe.id } });
    await p.interaction.deleteMany({ where: { listingId: dupe.id } });
    await p.listing.delete({ where: { id: dupe.id } }).catch(() => {});
    console.log(`MERGE: «${dupe.name}» → «${keep.name}»`);
    merged++;
  }
  const agg = await p.review.aggregate({ where: { listingId: keep.id, status: 'APPROVED' }, _avg: { rating: true }, _count: true });
  await p.listing.update({
    where: { id: keep.id },
    data: { reviewCount: agg._count, avgRating: agg._avg.rating ?? 0 },
  }).catch(() => {});
}
console.log(`Итог: слито=${merged}, пропущено-разных=${skipped}`);
await p.$disconnect();
