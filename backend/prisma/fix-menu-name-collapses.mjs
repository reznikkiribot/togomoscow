// Repairs menu rows that the historical prefix-stripping/endsWith matcher
// attached to a different catalog item. The source menu is authoritative only
// inside its own website domain; other networks are never touched.
//
//   node prisma/fix-menu-name-collapses.mjs --dry
//   node prisma/fix-menu-name-collapses.mjs --apply
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
  const parsed = typeof value === 'number'
    ? value
    : Number(String(value ?? '').normalize('NFKC').replace(/[\s\u00a0\u202f₽]/g, '').replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 100000 ? Math.round(parsed) : null;
}

function strippedName(value) {
  return menuNameKey(value).replace(/^(паста|пицца|салат|суп|ролл|роллы|напиток|коктейль)\s+/, '');
}

// This deliberately reproduces the removed matcher, but only to recognize and
// undo its historical mistakes. It is never used to choose a catalog identity.
function legacyFallbacks(items, normalizedName, type, category) {
  const exactKey = menuNameKey(normalizedName);
  const stripped = strippedName(normalizedName);
  const near = items.filter((item) => {
    if (item.type !== type || menuNameKey(item.name) === exactKey) return false;
    const candidate = menuNameKey(item.name);
    return candidate === stripped || candidate.endsWith(` ${stripped}`);
  });
  const kindOf = (name, itemCategory) => {
    const value = `${name ?? ''} ${itemCategory ?? ''}`.toLocaleLowerCase('ru-RU');
    if (/^пицца |пицц/.test(value)) return 'pizza';
    if (/^паста |паст/.test(value)) return 'pasta';
    if (/^суп |суп/.test(value)) return 'soup';
    return 'any';
  };
  const wantedKind = kindOf(normalizedName, category);
  return near.filter((item) => {
    const candidateKind = kindOf(item.name, item.category);
    return candidateKind === 'any' || wantedKind === 'any' || candidateKind === wantedKind;
  });
}

function loadMenus() {
  return fs.readdirSync(OUT)
    .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8'));
        return data.status === 'ok' && Array.isArray(data.items) && data.items.length
          ? { file, data }
          : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
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
      orderBy: { createdAt: 'asc' },
      select: { id: true, type: true, name: true, category: true, photoUrl: true },
    }));

  const exactItems = new Map();
  for (const item of catalogItems) {
    const key = `${item.type}\u0000${menuNameKey(item.name)}`;
    if (!exactItems.has(key)) exactItems.set(key, item);
  }

  const candidates = [];
  for (const { file, data } of loadMenus()) {
    const domain = String(data.domain || file.replace(/\.json$/i, ''));
    const host = domain.replace(/^www\./, '');
    const venues = restaurants.filter((venue) => String(venue.website).includes(host));
    if (!venues.length) continue;
    const venueNames = venues.map((venue) => venue.name);
    const sourceRows = new Map();
    for (const raw of data.items) {
      const name = normalizeMenuName(raw.name, venueNames);
      if (!name || isJunk(name)) continue;
      const { type, category } = classify(name);
      const key = `${type}\u0000${menuNameKey(name)}`;
      if (!sourceRows.has(key)) {
        sourceRows.set(key, {
          key, type, category, name,
          price: normalizePrice(raw.price),
          refImage: typeof raw.image === 'string' && /^https?:\/\//.test(raw.image) ? raw.image : null,
        });
      }
    }
    const sourceKeys = new Set(sourceRows.keys());
    for (const row of sourceRows.values()) {
      for (const fallback of legacyFallbacks(catalogItems, row.name, row.type, row.category)) {
        candidates.push({
          domain, venues, sourceKeys, row, fallback,
          exact: exactItems.get(row.key) ?? null,
          removeFallback: !sourceKeys.has(`${fallback.type}\u0000${menuNameKey(fallback.name)}`),
        });
      }
    }
  }

  // Query each domain independently. A global venueIds × itemIds filter pulls
  // many unrelated chain links and is too heavy for the Railway proxy.
  const candidatesByDomain = new Map();
  for (const entry of candidates) {
    const rows = candidatesByDomain.get(entry.domain) ?? [];
    rows.push(entry);
    candidatesByDomain.set(entry.domain, rows);
  }
  const links = [];
  for (const [domain, entries] of candidatesByDomain) {
    const venueIds = [...new Set(entries.flatMap((entry) => entry.venues.map((venue) => venue.id)))];
    const itemIds = [...new Set(entries.flatMap((entry) => [entry.fallback.id, entry.exact?.id].filter(Boolean)))];
    if (!venueIds.length || !itemIds.length) continue;
    const rows = await withReconnect(`${domain} links`, () => prisma.menuLink.findMany({
      where: { venueId: { in: venueIds }, itemId: { in: itemIds }, status: 'APPROVED' },
      select: { venueId: true, itemId: true },
    }));
    links.push(...rows);
  }
  const linkKeys = new Set(links.map((link) => `${link.venueId}\u0000${link.itemId}`));

  const affected = candidates.filter((entry) => entry.venues.some((venue) => {
    const fallbackLinked = linkKeys.has(`${venue.id}\u0000${entry.fallback.id}`);
    const exactLinked = entry.exact && linkKeys.has(`${venue.id}\u0000${entry.exact.id}`);
    return fallbackLinked && !exactLinked;
  }));

  const summary = new Map();
  let createdItems = 0;
  let restoredItems = 0;
  let createdLinks = 0;
  let removedLinks = 0;
  const wouldCreate = new Set();
  const restoredKeys = new Set();
  const wouldCreateLinks = new Set();
  const wouldRemoveLinks = new Set();

  for (const entry of affected) {
    let item = exactItems.get(entry.row.key) ?? entry.exact;
    if (apply && !item) {
      item = await prisma.listing.create({
        data: {
          type: entry.row.type,
          name: entry.row.name,
          category: entry.row.category,
          groupKey: menuNameKey(entry.row.name),
          source: 'menu-import',
          photoUrl: null,
        },
        select: { id: true, type: true, name: true, category: true, photoUrl: true },
      });
      exactItems.set(entry.row.key, item);
      createdItems++;
    }

    let domainCreatedLinks = 0;
    let domainRemovedLinks = 0;
    if (apply) {
      const inserted = await withReconnect(`${entry.domain} ${entry.row.name} create links`, () => prisma.menuLink.createMany({
        data: entry.venues.map((venue) => ({
            venueId: venue.id,
            itemId: item.id,
            status: 'APPROVED',
            price: entry.row.price,
            refImage: entry.row.refImage,
          })),
        skipDuplicates: true,
      }));
      domainCreatedLinks += inserted.count;
      await withReconnect(`${entry.domain} ${entry.row.name} refresh links`, () => prisma.menuLink.updateMany({
        where: { venueId: { in: entry.venues.map((venue) => venue.id) }, itemId: item.id },
        data: {
          status: 'APPROVED',
          price: entry.row.price,
          ...(entry.row.refImage ? { refImage: entry.row.refImage } : {}),
        },
      }));
      if (entry.removeFallback) {
        const removed = await withReconnect(`${entry.domain} ${entry.row.name} remove legacy links`, () => prisma.menuLink.deleteMany({
          where: {
            venueId: { in: entry.venues.map((venue) => venue.id) },
            itemId: entry.fallback.id,
            status: 'APPROVED',
          },
        }));
        domainRemovedLinks += removed.count;
      }
    } else {
      for (const venue of entry.venues) {
        if (!entry.exact || !linkKeys.has(`${venue.id}\u0000${entry.exact.id}`)) {
          wouldCreateLinks.add(`${entry.domain}\u0000${entry.row.key}\u0000${venue.id}`);
        }
      }
      if (entry.removeFallback) {
        for (const venue of entry.venues) {
          if (linkKeys.has(`${venue.id}\u0000${entry.fallback.id}`)) {
            wouldRemoveLinks.add(`${venue.id}\u0000${entry.fallback.id}`);
          }
        }
      }
      if (!item) wouldCreate.add(entry.row.key);
    }

    restoredKeys.add(`${entry.domain}\u0000${entry.row.key}`);
    createdLinks += domainCreatedLinks;
    removedLinks += domainRemovedLinks;
    const domain = summary.get(entry.domain) ?? { rows: [], createdLinks: 0, removedLinks: 0 };
    domain.rows.push(`${entry.row.name} ← ${entry.fallback.name}`);
    domain.createdLinks += domainCreatedLinks;
    domain.removedLinks += domainRemovedLinks;
    summary.set(entry.domain, domain);
  }
  restoredItems = restoredKeys.size;
  if (dry) {
    createdItems = wouldCreate.size;
    createdLinks = wouldCreateLinks.size;
    removedLinks = wouldRemoveLinks.size;
  }

  console.log(`${apply ? 'APPLY' : 'DRY'}: восстановить ${restoredItems} позиций, создать ${createdItems} карточек, добавить ${createdLinks} связей, удалить ${removedLinks} ошибочных связей.`);
  for (const [domain, result] of summary) {
    console.log(`${domain}: ${result.rows.length} позиций; +${result.createdLinks} связей, -${result.removedLinks} ошибочных связей`);
    for (const row of result.rows) console.log(`  ${row}`);
  }
} finally {
  await prisma.$disconnect();
}
