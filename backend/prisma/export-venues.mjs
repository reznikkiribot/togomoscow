// Dumps ALL venues + their contacts/sources/counts to exports/venues.json and
// exports/venues.csv (UTF-8 BOM, Excel/Sheets-friendly). Columns = one per field.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const COLS = [
  'id', 'name', 'category', 'cuisine', 'city', 'address', 'lat', 'lng', 'phone',
  'website', 'telegram', 'vk', 'priceLevel', 'avgRating', 'reviewCount',
  'branchCount', 'hours', 'source', 'externalId', 'sourcesCount', 'eventsCount',
];

function inMoscow(lat, lng) {
  return lat != null && lng != null && lat > 55.0 && lat < 56.2 && lng > 36.7 && lng < 38.3;
}
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const outDir = path.join(__dirname, '..', '..', 'exports');
  fs.mkdirSync(outDir, { recursive: true });

  const rows = [];
  const pageSize = 2000;
  for (let skip = 0; ; skip += pageSize) {
    const batch = await prisma.listing.findMany({
      where: { type: 'RESTAURANT' },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
      select: {
        id: true, name: true, category: true, cuisine: true, address: true,
        lat: true, lng: true, phone: true, website: true, priceLevel: true,
        avgRating: true, reviewCount: true, groupKey: true, hours: true,
        source: true, externalId: true,
        sources: { select: { type: true, handle: true } },
        _count: { select: { sources: true, events: true } },
      },
    });
    if (!batch.length) break;
    // chain branch counts (by groupKey) for this batch
    for (const v of batch) {
      rows.push({
        id: v.id,
        name: v.name,
        category: v.category ?? '',
        cuisine: v.cuisine ?? '',
        city: inMoscow(v.lat, v.lng) ? 'Москва' : '',
        address: v.address ?? '',
        lat: v.lat ?? '',
        lng: v.lng ?? '',
        phone: v.phone ?? '',
        website: v.website ?? '',
        telegram: v.sources.find((s) => s.type === 'telegram')?.handle ?? '',
        vk: v.sources.find((s) => s.type === 'vk')?.handle ?? '',
        priceLevel: v.priceLevel ?? '',
        avgRating: v.reviewCount ? Number(v.avgRating.toFixed(2)) : '',
        reviewCount: v.reviewCount,
        branchCount: '',
        hours: v.hours ?? '',
        source: v.source ?? '',
        externalId: v.externalId ?? '',
        sourcesCount: v._count.sources,
        eventsCount: v._count.events,
      });
    }
    console.log(`fetched ${rows.length}…`);
  }

  fs.writeFileSync(path.join(outDir, 'venues.json'), JSON.stringify(rows));
  const csv = '﻿' + [COLS.join(','), ...rows.map((r) => COLS.map((c) => csvCell(r[c])).join(','))].join('\r\n');
  fs.writeFileSync(path.join(outDir, 'venues.csv'), csv, 'utf8');
  console.log(`DONE: ${rows.length} venues → exports/venues.json + venues.csv`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
