// Imports Moscow food venues from OpenStreetMap via the Overpass API.
// Open data (ODbL) — legal to use with attribution. No API key needed.
// Run: node prisma/import-osm.mjs   (DATABASE_URL must be set in env)
import { PrismaClient } from '@prisma/client';
import { extractAmenities } from './osm-amenities.mjs';

const prisma = new PrismaClient();

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Moscow (federal city) admin area; pull eateries with names.
const QUERY = `
[out:json][timeout:240];
area["name"="Москва"]["admin_level"="4"]->.a;
(
  node["amenity"~"^(restaurant|cafe|bar|pub|fast_food)$"]["name"](area.a);
  way["amenity"~"^(restaurant|cafe|bar|pub|fast_food)$"]["name"](area.a);
);
out center tags;
`;

const AMENITY_LABEL = {
  restaurant: 'Ресторан',
  cafe: 'Кафе',
  bar: 'Бар',
  pub: 'Паб',
  fast_food: 'Фастфуд',
};

async function main() {
  console.log('Querying Overpass… (может занять до 1–2 минут)');
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
        console.log(`  ${lastErr}, пробую следующее зеркало…`);
        continue;
      }
      data = await res.json();
      console.log(`  OK: ${endpoint}`);
      break;
    } catch (e) {
      lastErr = `${endpoint} -> ${e.message}`;
      console.log(`  ${lastErr}, пробую следующее зеркало…`);
    }
  }
  if (!data) throw new Error(`Все зеркала Overpass недоступны. Последняя ошибка: ${lastErr}`);
  const elements = data.elements ?? [];
  console.log(`Overpass вернул ${elements.length} объектов.`);

  const seen = new Set();
  const rows = [];
  for (const el of elements) {
    const t = el.tags ?? {};
    if (!t.name) continue;
    const externalId = `${el.type}/${el.id}`;
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const lat = el.lat ?? el.center?.lat ?? null;
    const lng = el.lon ?? el.center?.lon ?? null;
    const address =
      [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ') || null;
    const brand = t.brand ?? t['brand:en'] ?? null;
    const cuisine = t.cuisine ? t.cuisine.replace(/;/g, ', ') : null;
    // normalize so chain spelling variants merge: "Rostic's" == "Rostics"
    const norm = (s) =>
      s
        .toLowerCase()
        .replace(/[’'`"«».,()\-_/]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const groupKey = norm(brand ?? t.name);

    rows.push({
      type: 'RESTAURANT',
      name: t.name.slice(0, 200),
      description: cuisine ? `Кухня: ${cuisine}` : null,
      category: AMENITY_LABEL[t.amenity] ?? 'Заведение',
      address,
      photoUrl: null,
      lat,
      lng,
      phone: t.phone ?? t['contact:phone'] ?? null,
      website: t.website ?? t['contact:website'] ?? null,
      source: 'osm',
      externalId,
      brand,
      hours: t.opening_hours ?? null,
      cuisine,
      groupKey,
      amenities: extractAmenities(t) ?? undefined,
      avgRating: 0,
      reviewCount: 0,
    });
  }
  console.log(`С названием и готовых к загрузке: ${rows.length}`);

  // Idempotent: re-running replaces the OSM set, leaves demo seed untouched.
  await prisma.listing.deleteMany({ where: { source: 'osm' } });

  let inserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const r = await prisma.listing.createMany({ data: batch, skipDuplicates: true });
    inserted += r.count;
    console.log(`  …залито ${inserted}/${rows.length}`);
  }

  const total = await prisma.listing.count();
  console.log(`Готово. Импортировано из OSM: ${inserted}. Всего заведений в БД: ${total}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
