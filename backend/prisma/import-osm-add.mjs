// Additive OSM import: pulls a BROADER set of Moscow food venues and inserts only
// the ones we don't already have (by externalId) — existing rows (with amenities,
// prices) are untouched. Legal open data (ODbL). No ratings/reviews are imported.
import { PrismaClient } from '@prisma/client';
import { extractAmenities } from './osm-amenities.mjs';

const prisma = new PrismaClient();

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// broadened: + ice_cream, food_court, biergarten (and bbq via cuisine stays)
const QUERY = `
[out:json][timeout:240];
area["name"="Москва"]["admin_level"="4"]->.a;
(
  node["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"]["name"](area.a);
  way["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"]["name"](area.a);
);
out center tags;
`;

const AMENITY_LABEL = {
  restaurant: 'Ресторан', cafe: 'Кафе', bar: 'Бар', pub: 'Паб', fast_food: 'Фастфуд',
  ice_cream: 'Мороженое', food_court: 'Фуд-корт', biergarten: 'Пивной сад',
};

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
        continue;
      }
      data = await res.json();
      console.log(`  OK: ${endpoint}`);
      break;
    } catch (e) {
      lastErr = `${endpoint} -> ${e.message}`;
    }
  }
  if (!data) throw new Error(`Overpass недоступен: ${lastErr}`);
  const elements = data.elements ?? [];
  console.log(`Overpass вернул ${elements.length} объектов.`);

  const norm = (s) =>
    s.toLowerCase().replace(/[’'`"«».,()\-_/]+/g, '').replace(/\s+/g, ' ').trim();

  const seen = new Set();
  const rows = [];
  for (const el of elements) {
    const t = el.tags ?? {};
    if (!t.name) continue;
    const externalId = `${el.type}/${el.id}`;
    if (seen.has(externalId)) continue;
    seen.add(externalId);
    const cuisine = t.cuisine ? t.cuisine.replace(/;/g, ', ') : null;
    rows.push({
      type: 'RESTAURANT',
      name: t.name.slice(0, 200),
      description: cuisine ? `Кухня: ${cuisine}` : null,
      category: AMENITY_LABEL[t.amenity] ?? 'Заведение',
      address: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ') || null,
      lat: el.lat ?? el.center?.lat ?? null,
      lng: el.lon ?? el.center?.lon ?? null,
      phone: t.phone ?? t['contact:phone'] ?? null,
      website: t.website ?? t['contact:website'] ?? null,
      source: 'osm',
      externalId,
      brand: t.brand ?? t['brand:en'] ?? null,
      hours: t.opening_hours ?? null,
      cuisine,
      groupKey: norm(t.brand ?? t.name),
      amenities: extractAmenities(t) ?? undefined,
      avgRating: 0,
      reviewCount: 0,
    });
  }

  const before = await prisma.listing.count({ where: { source: 'osm' } });
  let inserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const r = await prisma.listing.createMany({
      data: rows.slice(i, i + CHUNK),
      skipDuplicates: true, // unique(source, externalId) → only new ones land
    });
    inserted += r.count;
  }
  const after = await prisma.listing.count({ where: { source: 'osm' } });
  console.log(`Было OSM: ${before}, добавлено новых: ${inserted}, стало: ${after}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
