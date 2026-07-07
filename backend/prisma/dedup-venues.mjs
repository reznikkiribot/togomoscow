// Cleans venue names (unify backtick/curly apostrophes → straight ') and merges
// EXACT duplicates (same normalized name + same address). Branches with different
// addresses are preserved. Menu links are reassigned to the kept venue.
const norm = (s) => (s ?? '').toLowerCase().replace(/[`'’‘"]/g, "'").replace(/\s+/g, ' ').trim();

async function main() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://yelp:yelp_dev_password@localhost:5432/yelp?schema=public';
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const all = await prisma.listing.findMany({
    where: { type: 'RESTAURANT' },
    select: { id: true, name: true, address: true, reviewCount: true, photoUrl: true },
  });

  // 1) normalize apostrophes/quotes in the displayed name
  let renamed = 0;
  for (const v of all) {
    const clean = v.name.replace(/[`’‘]/g, "'").replace(/\s+/g, ' ').trim();
    if (clean !== v.name) {
      await prisma.listing.update({ where: { id: v.id }, data: { name: clean } });
      v.name = clean;
      renamed++;
    }
  }

  // 2) group exact dupes: same normalized name AND same address (both required)
  const groups = new Map();
  for (const v of all) {
    if (!v.address || !v.address.trim()) continue;
    const key = norm(v.name) + '|' + v.address.toLowerCase().trim();
    (groups.get(key) ?? groups.set(key, []).get(key)).push(v);
  }

  let merged = 0;
  for (const [, vs] of groups) {
    if (vs.length < 2) continue;
    vs.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0));
    const keeper = vs[0];
    for (const dup of vs.slice(1)) {
      // reassign this dup's menu links to the keeper (skip clashes)
      const links = await prisma.menuLink.findMany({ where: { venueId: dup.id } });
      for (const l of links) {
        const clash = await prisma.menuLink.findUnique({
          where: { venueId_itemId: { venueId: keeper.id, itemId: l.itemId } },
        });
        if (clash) await prisma.menuLink.delete({ where: { id: l.id } });
        else await prisma.menuLink.update({ where: { id: l.id }, data: { venueId: keeper.id } });
      }
      try {
        await prisma.listing.delete({ where: { id: dup.id } });
        merged++;
      } catch {
        /* has reviews/favorites — leave it */
      }
    }
  }

  console.log(`Имена нормализованы: ${renamed}. Дублей удалено: ${merged}.`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
