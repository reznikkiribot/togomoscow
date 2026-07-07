// Enriches EXISTING OSM listings with categorized amenities, without deleting
// anything (preserves reviews / check-ins / claims). Re-queries Overpass for the
// same Moscow set and UPDATEs amenities on rows matched by externalId.
// Run: node prisma/enrich-osm.mjs   (DATABASE_URL must be set in env)
import { PrismaClient } from '@prisma/client';
import { extractAmenities } from './osm-amenities.mjs';

const prisma = new PrismaClient();

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const QUERY = `
[out:json][timeout:240];
area["name"="Москва"]["admin_level"="4"]->.a;
(
  node["amenity"~"^(restaurant|cafe|bar|pub|fast_food)$"]["name"](area.a);
  way["amenity"~"^(restaurant|cafe|bar|pub|fast_food)$"]["name"](area.a);
);
out center tags;
`;

async function main() {
  console.log('Querying Overpass…');
  let data = null;
  let lastErr = '';
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'togomoscow-importer/1.0 (reznik.kiri@gmail.com)',
          Accept: 'application/json',
        },
        body: 'data=' + encodeURIComponent(QUERY),
      });
      if (!res.ok) {
        lastErr = `${endpoint} -> HTTP ${res.status}`;
        console.log(`  ${lastErr}, следующее зеркало…`);
        continue;
      }
      data = await res.json();
      console.log(`  OK: ${endpoint}`);
      break;
    } catch (e) {
      lastErr = `${endpoint} -> ${e.message}`;
      console.log(`  ${lastErr}, следующее зеркало…`);
    }
  }
  if (!data) throw new Error(`Overpass недоступен. Последняя ошибка: ${lastErr}`);

  const elements = data.elements ?? [];
  console.log(`Overpass вернул ${elements.length} объектов.`);

  // map externalId -> amenities
  const amenityByExt = new Map();
  for (const el of elements) {
    const a = extractAmenities(el.tags ?? {});
    if (a) amenityByExt.set(`${el.type}/${el.id}`, a);
  }
  console.log(`С удобствами: ${amenityByExt.size}.`);

  // update only existing OSM rows
  const existing = await prisma.listing.findMany({
    where: { source: 'osm', externalId: { in: [...amenityByExt.keys()] } },
    select: { id: true, externalId: true },
  });
  console.log(`Совпало с БД: ${existing.length}. Обновляю…`);

  let updated = 0;
  for (const row of existing) {
    await prisma.listing.update({
      where: { id: row.id },
      data: { amenities: amenityByExt.get(row.externalId) },
    });
    updated++;
    if (updated % 200 === 0) console.log(`  …${updated}/${existing.length}`);
  }
  console.log(`Готово. Обновлено заведений с удобствами: ${updated}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
