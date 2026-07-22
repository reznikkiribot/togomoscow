// Idempotent production cleanup for discovery-banned catalog items.
// Build the backend first so this script uses the exact same filter functions:
//   npm run build
//   node prisma/retro-clean-content.mjs --dry
//   node prisma/retro-clean-content.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dry = process.argv.includes('--dry');
const apply = process.argv.includes('--apply');
if (dry === apply) {
  console.error('Specify exactly one mode: --dry or --apply');
  process.exit(1);
}

function productionUrl() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  const sslMode = process.env.DATABASE_SSLMODE
    ? `&sslmode=${encodeURIComponent(process.env.DATABASE_SSLMODE)}`
    : '';
  return `${raw}${separator}connect_timeout=30&connection_limit=1${sslMode}`;
}

process.env.DATABASE_URL = productionUrl();
const [{ PrismaClient }, branded, standalone] = await Promise.all([
  import('@prisma/client'),
  import('../dist/common/branded-beverages.js'),
  import('../dist/common/non-standalone.js'),
]);
const prisma = new PrismaClient();

async function pgRetry(label, fn) {
  for (let attempt = 1; attempt <= 7; attempt++) {
    const client = new pg.Client({
      connectionString: fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30_000,
    });
    // Railway can reset an idle/proxied socket between statements. The query
    // promise below still rejects and is retried; this listener prevents pg's
    // EventEmitter from terminating the whole idempotent cleanup process first.
    client.on('error', () => {});
    try {
      await client.connect();
      return await fn(client);
    } catch (error) {
      if (attempt === 7) throw error;
      const delayMs = attempt * 5000;
      console.log(`DB connection error: ${label}, retry ${attempt}/7 in ${delayMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } finally {
      await client.end().catch(() => {});
    }
  }
}

async function retryP1001(label, fn) {
  for (let attempt = 1; attempt <= 7; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const code = error?.code;
      const transient = ['P1001', 'P2024', 'P2028'].includes(code)
        || /P1001|P2024|P2028/.test(String(error?.message ?? error));
      if (!transient || attempt === 7) throw error;
      const delayMs = attempt * 5000;
      console.log(`${code ?? 'transient DB error'}: ${label}, retry ${attempt}/7 in ${delayMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function isClearCatalogJunk(name) {
  const value = String(name ?? '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
  return /(?:^|\s)(?:мастер-класс|творческая встреча|dance мастер-класс)(?:\s|$)/u.test(value)
    || /кофе\s+(?:жарен(?:ый|ого)\s+)?в\s+зернах|кофе\s+в\s+капсулах/u.test(value)
    || /(?:котлеты?\s+для\s+бургеров|замороженн(?:ый|ая|ые|ое))/u.test(value)
    || /(?:серьги|браслет|подвеска|ожерелье|бриллиант|жемчуг)/u.test(value)
    || /кольц[оа]?[^а-яё]*(?:серебр|золот|женщ|мужчин|карат|размер)/u.test(value)
    || /&#\d+;/u.test(value)
    || /^с\s+чихо\s+до\s+пенсии/u.test(value);
}

try {
  let usePgFallback = false;
  let items;
  try {
    items = await retryP1001('read discovery candidates', () => prisma.listing.findMany({
      where: { type: { in: ['DISH', 'DRINK'] } },
      select: {
        id: true,
        type: true,
        name: true,
        source: true,
        _count: { select: { reviews: true, servedAt: true } },
        servedAt: {
          where: { status: 'APPROVED', price: { not: null } },
          select: { price: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    }));
  } catch (error) {
    if (!/TLS connection|security package|пакете безопасности|connection pool|fetching a new connection/i.test(String(error?.message ?? error))) throw error;
    usePgFallback = true;
    console.log('Prisma TLS is unavailable on this Windows host; using the same idempotent cleanup through node-postgres.');
    items = await pgRetry('read discovery candidates', async (client) => {
      const result = await client.query(`
        SELECT l.id, l.type::text AS type, l.name, l.source,
          (SELECT COUNT(*)::int FROM reviews r WHERE r.listing_id = l.id) AS review_count,
          (SELECT COUNT(*)::int FROM menu_links ml WHERE ml.item_id = l.id) AS link_count,
          (SELECT MIN(ml.price)::float FROM menu_links ml
            WHERE ml.item_id = l.id AND ml.status = 'APPROVED' AND ml.price IS NOT NULL) AS min_price
        FROM listings l
        WHERE l.type::text IN ('DISH', 'DRINK')
        ORDER BY l.type::text, l.name
      `);
      return result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        source: row.source,
        _count: { reviews: row.review_count, servedAt: row.link_count },
        servedAt: row.min_price == null ? [] : [{ price: row.min_price }],
      }));
    });
  }

  const matches = items.flatMap((item) => {
    const prices = item.servedAt.map((link) => link.price).filter((price) => price != null);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const isBrand = branded.isBrandedBeverage(item.name, item.type);
    const isAddon = standalone.isNonStandalone(item.name, minPrice);
    const isCatalogJunk = isClearCatalogJunk(item.name);
    if (!isBrand && !isAddon && !isCatalogJunk) return [];
    return [{
      ...item,
      minPrice,
      reason: [isBrand ? 'branded-beverage' : null, isAddon ? 'non-standalone' : null, isCatalogJunk ? 'catalog-junk' : null].filter(Boolean).join('+'),
    }];
  });
  const deletable = matches.filter((item) => item._count.reviews === 0);
  const retained = matches.filter((item) => item._count.reviews > 0);

  for (const item of deletable) {
    console.log(`DELETE ${item.type} ${item.id}: «${item.name}» (${item.reason}, price=${item.minPrice ?? '—'}, links=${item._count.servedAt})`);
  }
  for (const item of retained) {
    console.log(`EXCLUDE ${item.type} ${item.id}: «${item.name}» (${item.reason}, reviews=${item._count.reviews})`);
  }

  let deleted = 0;
  let alreadyGone = 0;
  if (apply) {
    if (usePgFallback && deletable.length) {
      const deletedIds = await pgRetry('delete discovery-banned items', async (client) => {
        await client.query('BEGIN');
        const result = await client.query(`
          DELETE FROM listings l
          WHERE l.id = ANY($1::text[])
            AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.listing_id = l.id)
          RETURNING l.id
        `, [deletable.map((item) => item.id)]);
        await client.query('COMMIT');
        return result.rows.map((row) => row.id);
      });
      deleted = deletedIds.length;
      alreadyGone = deletable.length - deleted;
    } else for (const item of deletable) {
      const result = await retryP1001(`delete ${item.id}`, () => prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM listings WHERE id = ${item.id} FOR UPDATE`;
        const fresh = await tx.listing.findUnique({
          where: { id: item.id },
          select: { id: true, _count: { select: { reviews: true } } },
        });
        if (!fresh) return 'already-gone';
        if (fresh._count.reviews > 0) return 'new-review';
        await tx.listing.delete({ where: { id: item.id } });
        return 'deleted';
      }, { maxWait: 30_000, timeout: 120_000 }));
      if (result === 'deleted') deleted++;
      else {
        alreadyGone++;
        console.log(`KEEP ${item.id}: ${result}`);
      }
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry',
    checked: items.length,
    matched: matches.length,
    branded: matches.filter((item) => item.reason.includes('branded-beverage')).length,
    nonStandalone: matches.filter((item) => item.reason.includes('non-standalone')).length,
    catalogJunk: matches.filter((item) => item.reason.includes('catalog-junk')).length,
    deletable: deletable.length,
    retainedWithReviews: retained.length,
    deleted,
    skippedDuringApply: alreadyGone,
  }, null, 2));
} finally {
  await prisma.$disconnect().catch(() => {});
}
