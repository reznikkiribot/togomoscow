// Audits same-origin /api/files references and removes only confirmed 404s.
// Dry-run is the default. Examples:
//   node prisma/purge-dead-photo-urls.mjs --origin=https://app.togomoscow.ru
//   node prisma/purge-dead-photo-urls.mjs --railway --apply
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const railway = args.has('--railway');
const originArg = process.argv.slice(2).find((arg) => arg.startsWith('--origin='));
const root = path.resolve(import.meta.dirname, '..');

function envFileValue(name) {
  const raw = fs.readFileSync(path.join(root, '.env'), 'utf8');
  const line = raw.split(/\r?\n/).find((row) => row.startsWith(`${name}=`));
  return line?.slice(name.length + 1).replace(/^['"]|['"]$/g, '') ?? '';
}

const connectionString = railway
  ? fs.readFileSync(path.join(root, '.railway-db-url'), 'utf8').trim()
  : process.env.DATABASE_URL || envFileValue('DATABASE_URL');
const origin = (originArg?.slice('--origin='.length) || (railway
  ? 'https://togomoscow-production.up.railway.app'
  : 'https://app.togomoscow.ru')).replace(/\/$/, '');
const db = new pg.Client({ connectionString, ...(railway ? { ssl: { rejectUnauthorized: false } } : {}) });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function status(url) {
  const candidates = [url, `${url}?w=900`, `${url}?w=600`, `${url}?w=400`, `${url}?w=200`];
  let sawUnknown = false;
  for (const candidate of candidates) {
    let result = 0;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await fetch(`${origin}${candidate}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'accept-encoding': 'identity' },
        });
        result = response.status;
        break;
      } catch {
        if (attempt === 0) await sleep(250);
      } finally {
        clearTimeout(timeout);
      }
    }
    if (result === 200) return 'available';
    if (result !== 404) sawUnknown = true;
  }
  return sawUnknown ? 'unknown' : 'missing';
}

await db.connect();
try {
  const rows = await db.query(`
    SELECT source, url FROM (
      SELECT 'review' source, unnest(photo_urls) url FROM reviews
      UNION ALL SELECT 'listing', photo_url FROM listings WHERE photo_url IS NOT NULL
      UNION ALL SELECT 'listing_gallery', unnest(photos) FROM listings
      UNION ALL SELECT 'menu_link', photo_url FROM menu_links WHERE photo_url IS NOT NULL
    ) refs
    WHERE url LIKE '/api/files/%'
  `);
  const refs = new Map();
  for (const row of rows.rows) {
    const sources = refs.get(row.url) ?? new Set();
    sources.add(row.source);
    refs.set(row.url, sources);
  }
  const urls = [...refs.keys()];
  const missing = [];
  const unknown = [];
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const result = await status(url);
      if (result === 'missing') missing.push(url);
      if (result === 'unknown') unknown.push(url);
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));

  if (apply && missing.length) {
    await db.query('BEGIN');
    try {
      await db.query(`UPDATE reviews SET photo_urls = ARRAY(SELECT value FROM unnest(photo_urls) value WHERE NOT value = ANY($1::text[])) WHERE photo_urls && $1::text[]`, [missing]);
      await db.query(`UPDATE listings SET photo_url = NULL WHERE photo_url = ANY($1::text[])`, [missing]);
      await db.query(`UPDATE listings SET photos = ARRAY(SELECT value FROM unnest(photos) value WHERE NOT value = ANY($1::text[])) WHERE photos && $1::text[]`, [missing]);
      await db.query(`UPDATE menu_links SET photo_url = NULL WHERE photo_url = ANY($1::text[])`, [missing]);
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }

  const bySource = {};
  for (const url of missing) {
    for (const source of refs.get(url) ?? []) bySource[source] = (bySource[source] ?? 0) + 1;
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry', origin, checked: urls.length, missing: missing.length, unknown: unknown.length, bySource, urls: missing }, null, 2));
} finally {
  await db.end();
}
