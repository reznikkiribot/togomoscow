// "Раф кофе" == "Раф": strips a REDUNDANT trailing "кофе" from drink names
// ("Раф кофе"→"Раф", "Латте кофе"→"Латте", "Флэт уайт кофе"→"Флэт уайт") and merges
// the resulting duplicates into one item (re-points menu links / reviews / favorites /
// dislikes / interactions to the keeper, then deletes the dupes).
//
// Only the TRAILING word is stripped — a leading "Кофе …" ("Кофе по-венски", "Кофе
// Гляссе", or the plain "Кофе") is a real name and is left untouched.
//
// Safe to re-run after every future parse (idempotent). Run: node prisma/dedup-coffee-names.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// strip a redundant trailing "кофе" (repeatedly, e.g. "Раф кофе кофе"); never empty,
// never touches a leading "Кофе …".
function stripKofe(name) {
  let n = (name ?? '').trim();
  let prev;
  do { prev = n; n = n.replace(/[\s,]+кофе\s*$/i, '').trim(); } while (n !== prev && n);
  return n || (name ?? '').trim();
}

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: 'DRINK' },
  select: { id: true, name: true, reviewCount: true, photoUrl: true },
});

// group by the cleaned (lowercased) name — only where cleaning actually changes something,
// or where a same-clean-name duplicate already exists.
const groups = new Map();
for (const it of items) {
  const clean = stripKofe(it.name);
  const key = clean.toLowerCase().replace(/ё/g, 'е');
  if (!groups.has(key)) groups.set(key, { clean, arr: [] });
  groups.get(key).arr.push(it);
}

// SAFETY: only act when the group has ≥2 items — i.e. an item WITHOUT the trailing
// "кофе" already exists ("Раф" for "Раф кофе"). That's the only reliable signal that
// "кофе" is redundant. A lone "Айриш кофе" / "Малиновый кофе" (no plain twin) is a real
// name and is left untouched.
let renamed = 0, merged = 0, removed = 0;
for (const [, { clean, arr }] of groups) {
  if (arr.length < 2) continue;

  arr.sort((a, b) => b.reviewCount - a.reviewCount || (b.photoUrl ? 1 : 0) - (a.photoUrl ? 1 : 0) || a.name.length - b.name.length);
  const keeper = arr[0];
  const dups = arr.slice(1);

  if (dry) {
    console.log(`KEEP «${clean}»  ⇐  ${dups.map((d) => `«${d.name}»`).join(', ')}`);
    merged++; removed += dups.length; renamed += keeper.name !== clean ? 1 : 0;
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
    await p.interaction.updateMany({ where: { listingId: d.id }, data: { listingId: keeper.id } }).catch(() => {});
    await p.listing.delete({ where: { id: d.id } }).catch(() => {});
    removed++;
  }
  const rc = await p.review.count({ where: { listingId: keeper.id, status: 'APPROVED' } });
  const data = { reviewCount: rc };
  if (keeper.name !== clean) { data.name = clean; renamed++; }
  await p.listing.update({ where: { id: keeper.id }, data }).catch(() => {});
  if (dups.length) merged++;
}
console.log(`\n${dry ? '[DRY] ' : ''}renamed: ${renamed}, groups merged: ${merged}, duplicates removed: ${removed}`);
await p.$disconnect();
