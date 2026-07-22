// Additive, idempotent import of the full public OSM food-venue selector set.
// Existing rows are never updated or deleted. Dry-run is the default.
//
// Usage:
//   node prisma/import-osm-add.mjs                # dry-run, fetch/cache current OSM
//   node prisma/import-osm-add.mjs --use-cache    # dry-run from coverage cache
//   node prisma/import-osm-add.mjs --apply        # insert only missing external_id rows
//
// OpenStreetMap data is ODbL. Keep OSM attribution in product/data exports.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { extractAmenities } from './osm-amenities.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(__dirname, '..');
const CACHE_FILE = path.join(BACKEND, '.coverage-cache', 'osm-food-venues.json');
const APPLY = process.argv.includes('--apply');
const USE_CACHE = process.argv.includes('--use-cache');
const MOSCOW_AREA_ID = 3_600_102_269;

const ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const QUERY = `
[out:json][timeout:300];
area(${MOSCOW_AREA_ID})->.moscow;
(
  nwr["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"]["name"](area.moscow);
  nwr["shop"~"^(coffee|bakery)$"]["name"](area.moscow);
);
out center tags;
`;

const AMENITY_LABEL = {
  restaurant: 'Ресторан', cafe: 'Кафе', bar: 'Бар', pub: 'Паб', fast_food: 'Фастфуд',
  ice_cream: 'Мороженое', food_court: 'Фуд-корт', biergarten: 'Пивной сад',
};

const SHOP_LABEL = { coffee: 'Кофейня', bakery: 'Пекарня' };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function configureDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.join(BACKEND, '.railway-db-url');
  if (!fs.existsSync(file)) throw new Error('DATABASE_URL is not set and backend/.railway-db-url is missing');
  const raw = fs.readFileSync(file, 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  return `${raw}${separator}connect_timeout=30&connection_limit=1`;
}

async function withRetry(label, action, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      const transient = error?.code === 'P1001'
        || ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', '57P01', '57P02', '57P03'].includes(error?.code)
        || /P1001|connection.*(?:closed|reset|timeout|terminated)|server closed/i.test(error?.message ?? '');
      if (!transient || attempt === attempts) throw error;
      console.error(`${label}: transient DB error ${error.code ?? 'unknown'}, retry ${attempt}/${attempts}`);
      await sleep(attempt * 2_000);
    }
  }
  throw lastError;
}

async function openDatabase() {
  const client = new Pool({
    connectionString: configureDatabaseUrl(),
    connectionTimeoutMillis: 30_000,
    max: 1,
    idleTimeoutMillis: 10_000,
    // Railway proxy chain is self-signed on this endpoint. TLS stays encrypted.
    ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === '1' },
  });
  client.on('error', (error) => console.error(`idle DB connection dropped: ${error.code ?? error.message}`));
  await withRetry('connect', () => client.query('SELECT 1'));
  return client;
}

async function fetchOsm() {
  if (USE_CACHE) {
    if (!fs.existsSync(CACHE_FILE)) throw new Error(`OSM cache not found: ${CACHE_FILE}`);
    console.log(`OSM: using ${path.relative(BACKEND, CACHE_FILE)}`);
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }
  let lastError;
  for (let round = 1; round <= 3; round += 1) {
    for (const endpoint of ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
            'user-agent': 'togomoscow-importer/2.0 (public OSM, additive)',
          },
          body: `data=${encodeURIComponent(QUERY)}`,
          signal: AbortSignal.timeout(330_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
        console.log(`OSM: ${data.elements?.length ?? 0} objects from ${new URL(endpoint).host}`);
        return data;
      } catch (error) {
        lastError = error;
        console.error(`OSM: ${new URL(endpoint).host}: ${error.message}`);
      }
    }
    await sleep(round * 3_000);
  }
  throw new Error(`All Overpass mirrors failed: ${lastError?.message ?? 'unknown error'}`);
}

function normalizeGroup(value) {
  return String(value ?? '')
    .toLocaleLowerCase('ru-RU')
    .replace(/[’'`"«».,()\-_/]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toRow(element) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat ?? null;
  const lng = element.lon ?? element.center?.lon ?? null;
  const cuisine = tags.cuisine ? tags.cuisine.replace(/;/g, ', ') : null;
  const brand = tags.brand ?? tags['brand:en'] ?? null;
  const selector = tags.amenity ? `amenity=${tags.amenity}` : `shop=${tags.shop}`;
  return {
    id: crypto.randomUUID(),
    name: String(tags.name).slice(0, 200),
    description: cuisine ? `Кухня: ${cuisine}` : null,
    category: AMENITY_LABEL[tags.amenity] ?? SHOP_LABEL[tags.shop] ?? 'Заведение',
    address: [tags['addr:street'] ?? tags['addr:place'], tags['addr:housenumber']].filter(Boolean).join(', ') || null,
    lat,
    lng,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    website: tags.website ?? tags['contact:website'] ?? null,
    external_id: `${element.type}/${element.id}`,
    brand,
    hours: tags.opening_hours ?? null,
    cuisine,
    group_key: normalizeGroup(brand ?? tags.name),
    amenities: extractAmenities(tags),
    selector,
  };
}

async function insertChunk(client, rows) {
  const payload = rows.map(({ selector: _selector, ...row }) => row);
  const sql = `
    INSERT INTO listings (
      id, type, name, description, category, address, lat, lng, phone, website,
      source, external_id, brand, hours, cuisine, group_key, amenities
    )
    SELECT x.id, 'RESTAURANT'::"ListingType", x.name, x.description, x.category,
           x.address, x.lat, x.lng, x.phone, x.website, 'osm', x.external_id,
           x.brand, x.hours, x.cuisine, x.group_key, x.amenities
      FROM jsonb_to_recordset($1::jsonb) AS x(
        id text, name text, description text, category text, address text,
        lat double precision, lng double precision, phone text, website text,
        external_id text, brand text, hours text, cuisine text, group_key text,
        amenities jsonb
      )
    ON CONFLICT (source, external_id) DO NOTHING
    RETURNING external_id
  `;
  return withRetry('insert OSM chunk', async () => (await client.query(sql, [JSON.stringify(payload)])).rowCount, 8);
}

async function main() {
  const osm = await fetchOsm();
  const allRows = (osm.elements ?? []).filter((element) => element.tags?.name).map(toRow);
  const excludedRetail = allRows.filter((row) => row.selector === 'shop=coffee');
  const rows = allRows.filter((row) => row.selector !== 'shop=coffee');
  console.log(`Catalog eligibility: ${rows.length}; excluded standalone shop=coffee retail: ${excludedRetail.length}.`);
  const client = await openDatabase();
  try {
    const existingResult = await withRetry('load OSM ids', () => client.query(
      `SELECT external_id FROM listings WHERE source = 'osm' AND external_id IS NOT NULL`,
    ));
    const existing = new Set(existingResult.rows.map((row) => row.external_id));
    const missing = rows.filter((row) => !existing.has(row.external_id));
    const bySelector = missing.reduce((counts, row) => {
      counts[row.selector] = (counts[row.selector] ?? 0) + 1;
      return counts;
    }, {});
    console.log(`Snapshot: ${rows.length}; existing OSM ids: ${existing.size}; missing: ${missing.length}.`);
    for (const [selector, count] of Object.entries(bySelector).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${selector}: ${count}`);
    }
    console.log('Examples:');
    for (const row of missing.slice(0, 30)) console.log(`  ${row.external_id} | ${row.selector} | ${row.name}`);

    if (!APPLY) {
      console.log('\nDRY RUN ONLY. Re-run with --apply to insert these rows additively.');
      return;
    }

    let inserted = 0;
    // Railway's public proxy is deliberately handled with small, replay-safe chunks.
    const chunkSize = 25;
    for (let index = 0; index < missing.length; index += chunkSize) {
      inserted += await insertChunk(client, missing.slice(index, index + chunkSize));
      console.log(`  inserted ${inserted}/${missing.length}`);
    }
    const after = await withRetry('verify OSM count', async () => Number((await client.query(
      `SELECT count(*)::int AS count FROM listings WHERE source = 'osm'`,
    )).rows[0].count));
    console.log(`APPLIED: inserted ${inserted}; OSM rows in database now ${after}.`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
