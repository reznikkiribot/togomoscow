import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const usePg = process.argv.includes('--pg');
const prisma = usePg ? null : new PrismaClient();
const pgClient = usePg
  ? new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;
if (pgClient) pgClient.on('error', () => {});
const apply = process.argv.includes('--apply');
const batchSizeArg = process.argv.find((arg) => arg.startsWith('--batch='));
const batchSize = Math.max(10, Number(batchSizeArg?.split('=')[1] || 100));
const stationFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'metro-stations.json');
const stations = JSON.parse(await readFile(stationFile, 'utf8'));

function distanceMetres(a, b) {
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function nearestStation(lat, lng) {
  let nearest = null;
  let distance = Infinity;
  for (const station of stations) {
    const candidate = distanceMetres({ lat, lng }, station);
    if (candidate < distance) {
      nearest = station;
      distance = candidate;
    }
  }
  return nearest ? { metro: nearest.name, metroDistance: Math.round(distance) } : null;
}

async function withP1001Retry(operation, label) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error?.code !== 'P1001' || attempt === 6) throw error;
      const delay = Math.min(30_000, attempt * attempt * 1_000);
      console.warn(`${label}: P1001, retry ${attempt}/6 in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function withPgRetry(operation, label) {
  let lastError;
  const retryable = new Set(['08000', '08001', '08003', '08006', '08007', 'ECONNRESET', 'ETIMEDOUT']);
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const disconnected = /connection terminated|connection reset|socket hang up/i.test(error?.message ?? '');
      if ((!retryable.has(error?.code) && !disconnected) || attempt === 6) throw error;
      const delay = Math.min(30_000, attempt * attempt * 1_000);
      console.warn(`${label}: ${error.code}, retry ${attempt}/6 in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

try {
  if (!Array.isArray(stations) || stations.length < 200) {
    throw new Error(`Invalid metro station catalog: ${stations.length ?? 0} records`);
  }
  if (pgClient) await withPgRetry(() => pgClient.connect(), 'connect');
  const venues = pgClient
    ? (await withPgRetry(
      () => pgClient.query(`SELECT id, name, lat, lng, metro, metro_distance AS "metroDistance"
        FROM listings WHERE type = 'RESTAURANT' AND lat IS NOT NULL AND lng IS NOT NULL ORDER BY id`),
      'load venues',
    )).rows
    : await withP1001Retry(
      () => prisma.$queryRawUnsafe(`SELECT id, name, lat, lng, metro,
        metro_distance AS "metroDistance" FROM listings
        WHERE type = 'RESTAURANT' AND lat IS NOT NULL AND lng IS NOT NULL ORDER BY id`),
      'load venues',
    );
  const changes = venues.flatMap((venue) => {
    const nearest = nearestStation(venue.lat, venue.lng);
    if (!nearest || (nearest.metro === venue.metro && nearest.metroDistance === venue.metroDistance)) return [];
    return [{ ...venue, ...nearest }];
  });
  if (pgClient) await pgClient.end().catch(() => {});

  const within3km = changes.filter((venue) => venue.metroDistance <= 3_000).length;
  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    stations: stations.length,
    venuesWithCoordinates: venues.length,
    changes: changes.length,
    resultingWithin3km: venues.filter((venue) => {
      const nearest = nearestStation(venue.lat, venue.lng);
      return nearest?.metroDistance <= 3_000;
    }).length,
    changedWithin3km: within3km,
    sample: changes.slice(0, 10).map(({ id, name, metro, metroDistance }) => ({ id, name, metro, metroDistance })),
  }, null, 2));

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to persist changes.');
    process.exitCode = 0;
  } else {
    for (let offset = 0; offset < changes.length; offset += batchSize) {
      const batch = changes.slice(offset, offset + batchSize);
      if (pgClient) {
        await withPgRetry(async () => {
          const batchClient = new pg.Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
          });
          batchClient.on('error', () => {});
          await batchClient.connect();
          try {
            const values = [];
            const rows = batch.map((venue, index) => {
              const base = index * 3;
              values.push(venue.id, venue.metro, venue.metroDistance);
              return `($${base + 1}::text, $${base + 2}::text, $${base + 3}::int)`;
            });
            await batchClient.query(
              `UPDATE listings AS listing
               SET metro = patch.metro, metro_distance = patch.distance
               FROM (VALUES ${rows.join(',')}) AS patch(id, metro, distance)
               WHERE listing.id = patch.id`,
              values,
            );
          } finally {
            await batchClient.end().catch(() => {});
          }
        }, `batch ${Math.floor(offset / batchSize) + 1}`);
      } else {
        await withP1001Retry(
          () => prisma.$transaction(batch.map((venue) => prisma.$executeRawUnsafe(
            'UPDATE listings SET metro = $1, metro_distance = $2 WHERE id = $3',
            venue.metro,
            venue.metroDistance,
            venue.id,
          ))),
          `batch ${Math.floor(offset / batchSize) + 1}`,
        );
      }
      console.log(`Updated ${Math.min(offset + batch.length, changes.length)}/${changes.length}`);
    }
  }
} finally {
  if (pgClient) await pgClient.end().catch(() => {});
  if (prisma) await prisma.$disconnect();
}
