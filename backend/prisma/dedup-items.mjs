// Collapses duplicate dish/drink items that are the same thing with extra/reordered
// words or size variants — e.g. "Латте 300мл", "Латте 400мл", "Матча латте",
// "Латте Матча" → one item. Re-points menu links / reviews / favorites to the
// keeper, then deletes the duplicates.   Run: node prisma/dedup-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const SIZE = /\b\d+([.,]\d+)?\s*(мл|ml|л|l|гр|г|g|кг|kg|шт|oz)\b|\b\d{2,4}\b|\b0[.,]\d\b/gi;
const SIZEWORD = /\b(больш\w*|маленьк\w*|средн\w*|гранд\w*|grande|venti|венти|tall|мини|макси|порц\w*|двойн\w*)\b/gi;

// generic dish-TYPE words: "Паста Болоньезе" ≡ "Болоньезе", "Салат Цезарь" ≡ "Цезарь".
// Dropped from the canonical key (grouping only) so the same dish under a bare name
// and under a "тип + название" name collapse into one. The distinctive word stays.
const GENERIC = new Set([
  'паста', 'пицца', 'салат', 'суп', 'боул', 'поке', 'ролл', 'роллы', 'сет', 'сэндвич',
  'сендвич', 'бургер', 'десерт', 'каша', 'смузи', 'лимонад', 'пирог', 'пирожок',
  'напиток', 'блюдо', 'горячее', 'закуска',
]);

// canonical key: lowercase, strip sizes, drop generic type-words, sort (order-independent)
function canon(name) {
  const n = name
    .toLowerCase()
    .replace(SIZE, ' ')
    .replace(SIZEWORD, ' ')
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // keep multi-letter words and any number token (so "Молоко 8%" ≠ "Молоко 3,6%"),
  // drop lone single letters (noise)
  const words = n.split(' ').filter((w) => w.length > 1 || /\d/.test(w));
  // drop generic type-words — but only if a distinctive word remains ("Паста" alone stays)
  const distinctive = words.filter((w) => !GENERIC.has(w));
  return (distinctive.length ? distinctive : words).sort().join(' ');
}
// display name with size noise stripped (keeps word order)
function cleanName(name) {
  return name.replace(SIZE, ' ').replace(SIZEWORD, ' ').replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim() || name;
}

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, type: true, name: true, category: true, reviewCount: true, photoUrl: true },
});
const groups = new Map();
for (const it of items) {
  const c = canon(it.name);
  if (!c) continue;
  // GUARD: the category is part of the key, so a bare name only merges with a
  // "тип + название" variant of the SAME category. This is what keeps «Паста
  // Болоньезе»≡«Болоньезе» (both Итальянская) while «Пицца Том ям» (Пицца) /
  // «Паста Том ям» (Паста) / «Том ям» (Тайская) stay three distinct dishes.
  const key = it.type + '|' + (it.category ?? '') + '|' + c;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(it);
}

let merged = 0, removed = 0;
for (const [, arr] of groups) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0) || a.name.length - b.name.length);
  const keeper = arr[0];
  const dups = arr.slice(1);
  if (dry) {
    console.log(`KEEP «${cleanName(keeper.name)}»  ⇐  ${dups.map((d) => `«${d.name}»`).join(', ')}`);
    merged++; removed += dups.length;
    continue;
  }
  for (const d of dups) {
    const links = await p.menuLink.findMany({ where: { itemId: d.id } });
    for (const l of links) {
      await p.menuLink.upsert({
        where: { venueId_itemId: { venueId: l.venueId, itemId: keeper.id } },
        create: { venueId: l.venueId, itemId: keeper.id, status: l.status, price: l.price, addedByUserId: l.addedByUserId },
        update: { price: l.price ?? undefined },
      }).catch(() => {});
    }
    const revs = await p.review.findMany({ where: { listingId: d.id }, select: { id: true, userId: true } });
    for (const r of revs) {
      const clash = await p.review.findUnique({ where: { listingId_userId: { listingId: keeper.id, userId: r.userId } } }).catch(() => null);
      if (clash) await p.review.delete({ where: { id: r.id } }).catch(() => {});
      else await p.review.update({ where: { id: r.id }, data: { listingId: keeper.id } }).catch(() => {});
    }
    await p.favorite.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.dislike.updateMany({ where: { itemId: d.id }, data: { itemId: keeper.id } }).catch(() => {});
    await p.listing.delete({ where: { id: d.id } }).catch(() => {});
    removed++;
  }
  const rc = await p.review.count({ where: { listingId: keeper.id, status: 'APPROVED' } });
  await p.listing.update({ where: { id: keeper.id }, data: { name: cleanName(keeper.name), reviewCount: rc } }).catch(() => {});
  merged++;
}
console.log(`\n${dry ? '[DRY] ' : ''}groups merged: ${merged}, duplicates removed: ${removed}`);
await p.$disconnect();
