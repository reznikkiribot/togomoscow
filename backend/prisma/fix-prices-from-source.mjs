// Reconciles APPROVED menu-link prices with the authoritative menu-out JSON for
// the same normalized item and the same website domain. Cross-network prices
// are isolated by the venue IDs matched to each domain.
//
//   node prisma/fix-prices-from-source.mjs --dry
//   node prisma/fix-prices-from-source.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { classify, isJunk, menuNameKey, normalizeMenuName } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');
const dry = process.argv.includes('--dry');
const apply = process.argv.includes('--apply');
if (dry === apply) {
  console.error('Specify exactly one mode: --dry or --apply');
  process.exit(1);
}

function configureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const raw = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  const sslMode = process.env.DATABASE_SSLMODE
    ? `&sslmode=${encodeURIComponent(process.env.DATABASE_SSLMODE)}`
    : '';
  process.env.DATABASE_URL = `${raw}${separator}connect_timeout=30&connection_limit=1${sslMode}`;
}

function normalizePrice(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 && value < 100000 ? Math.round(value) : null;
  }
  if (typeof value !== 'string') return null;
  const compact = value.normalize('NFKC').replace(/[\s\u00a0\u202f]+/g, '');
  const match = compact.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 && parsed < 100000 ? Math.round(parsed) : null;
}

function loadMenusByDomain() {
  const result = new Map();
  for (const file of fs.readdirSync(OUT).filter((name) => name.endsWith('.json') && !name.startsWith('_')).sort()) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8'));
      if (data.status !== 'ok' || !Array.isArray(data.items) || !data.items.length) continue;
      const domain = String(data.domain || file.replace(/\.json$/i, ''));
      const current = result.get(domain) ?? [];
      current.push(...data.items);
      result.set(domain, current);
    } catch (error) {
      console.error(`${file}: skip invalid JSON (${error.message})`);
    }
  }
  return result;
}

configureDatabaseUrl();
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

async function withReconnect(label, operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable = ['P1001', 'P1017', 'P2024'].includes(error?.code)
        || /server has closed|timed out fetching a new connection/i.test(error?.message ?? '');
      if (!retryable || attempt === attempts) throw error;
      console.warn(`${label}: Railway proxy ${error.code ?? 'connection timeout'}, retry ${attempt}/${attempts}`);
      await prisma.$disconnect().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

try {
  const restaurants = await withReconnect('restaurants', () => prisma.listing.findMany({
      where: { type: 'RESTAURANT', website: { not: null } },
      select: { id: true, name: true, website: true },
    }));
  const catalogItems = await withReconnect('catalog items', () => prisma.listing.findMany({
      where: { type: { in: ['DISH', 'DRINK'] } },
      select: { id: true, type: true, name: true },
    }));

  const itemsByKey = new Map();
  const itemKeyById = new Map();
  for (const item of catalogItems) {
    const key = `${item.type}\u0000${menuNameKey(item.name)}`;
    const items = itemsByKey.get(key) ?? [];
    items.push(item);
    itemsByKey.set(key, items);
    itemKeyById.set(item.id, key);
  }

  const proposed = new Map();
  let ambiguousSourceNames = 0;
  let missingDbPrices = 0;
  const domainStats = new Map();

  for (const [domain, rawItems] of loadMenusByDomain()) {
    const host = domain.replace(/^www\./, '').toLocaleLowerCase('ru-RU');
    const venues = restaurants.filter((venue) => String(venue.website).toLocaleLowerCase('ru-RU').includes(host));
    if (!venues.length) continue;
    const venueNames = venues.map((venue) => venue.name);
    const pricesByKey = new Map();
    const displayNameByKey = new Map();
    for (const raw of rawItems) {
      const name = normalizeMenuName(raw.name, venueNames);
      if (!name || isJunk(name)) continue;
      const price = normalizePrice(raw.price);
      if (price === null) continue;
      const { type } = classify(name);
      const key = `${type}\u0000${menuNameKey(name)}`;
      const prices = pricesByKey.get(key) ?? new Set();
      prices.add(price);
      pricesByKey.set(key, prices);
      displayNameByKey.set(key, name);
    }

    const expectedByItemId = new Map();
    for (const [key, prices] of pricesByKey) {
      if (prices.size !== 1) {
        ambiguousSourceNames++;
        continue;
      }
      const expected = [...prices][0];
      for (const item of itemsByKey.get(key) ?? []) {
        expectedByItemId.set(item.id, { expected, name: displayNameByKey.get(key) });
      }
    }
    if (!expectedByItemId.size) continue;

    const links = await withReconnect(`${domain} prices`, () => prisma.menuLink.findMany({
      where: {
        status: 'APPROVED',
        venueId: { in: venues.map((venue) => venue.id) },
        itemId: { in: [...expectedByItemId.keys()] },
      },
      select: { venueId: true, itemId: true, price: true },
    }));
    const venueById = new Map(venues.map((venue) => [venue.id, venue]));
    for (const link of links) {
      const source = expectedByItemId.get(link.itemId);
      if (!source) continue;
      if (link.price === null) {
        missingDbPrices++;
        continue;
      }
      if (link.price === source.expected) continue;
      const pairKey = `${link.venueId}\u0000${link.itemId}`;
      const change = {
        domain,
        venueId: link.venueId,
        venueName: venueById.get(link.venueId)?.name ?? link.venueId,
        itemId: link.itemId,
        itemName: source.name,
        from: link.price,
        to: source.expected,
      };
      const previous = proposed.get(pairKey);
      if (previous && previous.to !== change.to) {
        proposed.set(pairKey, { conflict: true, previous, change });
      } else if (!previous) {
        proposed.set(pairKey, change);
      }
    }
  }

  const conflicts = [...proposed.values()].filter((change) => change.conflict);
  const changes = [...proposed.values()].filter((change) => !change.conflict);
  for (const change of changes) {
    const stat = domainStats.get(change.domain) ?? { links: 0, items: new Set(), examples: [] };
    stat.links++;
    stat.items.add(change.itemName);
    if (stat.examples.length < 8) stat.examples.push(`${change.itemName}: ${change.from} → ${change.to} ₽ (${change.venueName})`);
    domainStats.set(change.domain, stat);
  }

  console.log(`${apply ? 'APPLY' : 'DRY'}: исправить ${changes.length} цен в menu_links (${new Set(changes.map((change) => change.itemId)).size} карточек, ${domainStats.size} сетей).`);
  console.log(`Пропущено: ${ambiguousSourceNames} неоднозначных имен в source JSON, ${missingDbPrices} пустых цен в БД, ${conflicts.length} межисточниковых конфликтов.`);
  for (const [domain, stat] of [...domainStats].sort((a, b) => b[1].links - a[1].links || a[0].localeCompare(b[0]))) {
    console.log(`${domain}: ${stat.links} цен, ${stat.items.size} позиций`);
    for (const example of stat.examples) console.log(`  ${example}`);
  }

  if (apply) {
    const byPrice = new Map();
    for (const change of changes) {
      const rows = byPrice.get(change.to) ?? [];
      rows.push(change);
      byPrice.set(change.to, rows);
    }
    let updated = 0;
    for (const [price, rows] of byPrice) {
      for (let index = 0; index < rows.length; index += 100) {
        const batch = rows.slice(index, index + 100);
        const result = await prisma.menuLink.updateMany({
          where: {
            status: 'APPROVED',
            OR: batch.map((row) => ({ venueId: row.venueId, itemId: row.itemId })),
          },
          data: { price },
        });
        updated += result.count;
      }
    }
    console.log(`Обновлено в БД: ${updated} строк.`);
  }
} finally {
  await prisma.$disconnect();
}
