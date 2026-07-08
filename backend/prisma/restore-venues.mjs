// Restores the FULL venue catalog into the (near-empty) Railway DB from
// exports/venues.json — the snapshot exported from the local DB before the move.
// Insert-only (createMany + skipDuplicates): never deletes or overwrites data.
// Ratings are imported as 0 per the real-ratings rule: only real APPROVED reviews count.
//
//   DATABASE_URL=<railway> node prisma/restore-venues.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATABASE_URL: prefer the env (Railway), fall back to .railway-db-url, then .env
if (!process.env.DATABASE_URL) {
  const f = path.join(__dirname, '..', '.railway-db-url');
  if (fs.existsSync(f)) process.env.DATABASE_URL = fs.readFileSync(f, 'utf8').trim();
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const raw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'exports', 'venues.json'), 'utf8'),
);
const rows = Array.isArray(raw) ? raw : raw.venues ?? raw.listings ?? [];
console.log(`export records: ${rows.length}`);

// a handful of export rows carry numbers as STRINGS ("3", "55.79") — coerce, NaN → null
const num = (x) => {
  if (x == null || x === '') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};
const str = (x) => (x == null || x === '' ? null : String(x));

// branchCount>1 ⇒ chain: restore groupKey=lower(name) so branches collapse into one
// card (mirrors the old lower(brand||name) convention; singles keep groupKey=null).
const toListing = (v) => ({
  id: v.id, // keep original ids — menu links / references stay valid
  type: 'RESTAURANT',
  name: String(v.name ?? 'Без названия'),
  category: str(v.category),
  cuisine: str(v.cuisine),
  address: str(v.address),
  lat: num(v.lat),
  lng: num(v.lng),
  phone: str(v.phone),
  website: str(v.website),
  priceLevel: num(v.priceLevel) != null ? Math.round(num(v.priceLevel)) : null,
  hours: str(v.hours),
  source: str(v.source) ?? 'export-restore',
  externalId: str(v.externalId) ?? v.id,
  groupKey: (num(v.branchCount) ?? 1) > 1 ? (v.name ?? '').toLowerCase().trim() || null : null,
  avgRating: 0,
  reviewCount: 0,
});

const dry = process.argv.includes('--dry');
if (dry) {
  const sample = toListing(rows[0]);
  console.log('[DRY] sample row:', JSON.stringify(sample, null, 1).slice(0, 500));
  const chains = rows.filter((v) => (v.branchCount ?? 1) > 1).length;
  console.log(`[DRY] would insert up to ${rows.length} venues (${chains} chain rows)`);
  await p.$disconnect();
  process.exit(0);
}

const before = await p.listing.count({ where: { type: 'RESTAURANT' } });
let inserted = 0;
const CHUNK = 250;
let client = p;
for (let i = 0; i < rows.length; i += CHUNK) {
  // the query engine leaks on long createMany streaks (Windows) → fresh client every 2k rows
  if (i > 0 && i % 2000 === 0) {
    await client.$disconnect();
    client = new PrismaClient();
  }
  const chunk = rows.slice(i, i + CHUNK).map(toListing);
  const r = await client.listing.createMany({ data: chunk, skipDuplicates: true });
  inserted += r.count;
  process.stdout.write(`\r${Math.min(i + CHUNK, rows.length)}/${rows.length} (+${inserted})`);
}
const after = await client.listing.count({ where: { type: 'RESTAURANT' } });
console.log(`\nvenues: ${before} → ${after} (inserted ${inserted})`);
await client.$disconnect();
