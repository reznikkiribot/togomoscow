// Read-only coverage and price audit for successfully scraped chain menus.
//
// Usage (DATABASE_URL must point at the database being audited):
//   node prisma/audit-menu-coverage.mjs [--summary-only]
//
// The audit deliberately uses the same venue lookup and name cleanup as
// menu-import.mjs. It never creates or updates database rows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { classify, isJunk, normalizeMenuName } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');
const ITEM_TYPES = ['DISH', 'DRINK'];

export function normalizePrice(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 && value < 100000 ? Math.round(value) : null;
  }
  if (typeof value !== 'string') return null;

  // Handles "590 ₽", "1 290 руб.", non-breaking spaces and "от 590".
  const compact = value.normalize('NFKC').replace(/[\s\u00a0\u202f]+/g, '');
  const match = compact.match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 && parsed < 100000 ? Math.round(parsed) : null;
}

function nameKey(value) {
  return String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('ru-RU');
}

function strippedName(value) {
  return nameKey(value)
    .replace(/ё/g, 'е')
    .replace(/^(паста|пицца|салат|суп|ролл|роллы|напиток|коктейль)\s+/, '');
}

function kindOf(name, category) {
  const value = `${name ?? ''} ${category ?? ''}`.toLocaleLowerCase('ru-RU');
  if (/^пицца |пицц/.test(value)) return 'pizza';
  if (/^паста |паст/.test(value)) return 'pasta';
  if (/^суп |суп/.test(value)) return 'soup';
  return 'any';
}

function findImportFallback(items, normalizedName, type, category) {
  const stripped = strippedName(normalizedName);
  const near = items.filter((item) => {
    if (item.type !== type) return false;
    const candidate = nameKey(item.name);
    return candidate === stripped || candidate.endsWith(` ${stripped}`);
  });
  const wantedKind = kindOf(normalizedName, category);
  return near.find((item) => {
    const candidateKind = kindOf(item.name, item.category);
    return candidateKind === 'any' || wantedKind === 'any' || candidateKind === wantedKind;
  }) ?? null;
}

function unique(values) {
  return [...new Set(values)];
}

function formatValues(values) {
  return unique(values).map((value) => value === null ? 'нет' : `${value} ₽`).join(', ');
}

function loadMenus() {
  return fs.readdirSync(OUT)
    .filter((file) => file.endsWith('.json') && file !== '_import-log.json')
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      try {
        return { file, data: JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8')) };
      } catch (error) {
        console.error(`${file}: невозможно прочитать JSON (${error.message})`);
        return null;
      }
    })
    .filter((entry) => entry?.data?.status === 'ok');
}

function configureDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  const urlFile = path.join(__dirname, '..', '.railway-db-url');
  if (!fs.existsSync(urlFile)) throw new Error('DATABASE_URL is required');
  const raw = fs.readFileSync(urlFile, 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  const sslMode = process.env.DATABASE_SSLMODE
    ? `&sslmode=${encodeURIComponent(process.env.DATABASE_SSLMODE)}`
    : '';
  process.env.DATABASE_URL = `${raw}${separator}connect_timeout=30&connection_limit=1${sslMode}`;
}

function auditMenu(allRestaurants, allItems, allLinks, entry) {
  const { file, data } = entry;
  const domain = String(data.domain || file.replace(/\.json$/i, ''));
  const hostNeedle = domain.replace(/^www\./, '');
  // Keep this match in sync with menu-import.mjs. Substring matching is
  // intentional: historical website values are full URLs, not host columns.
  const venues = allRestaurants.filter((venue) => String(venue.website ?? '').includes(hostNeedle));
  const venueIds = venues.map((venue) => venue.id);
  const venueNames = venues.map((venue) => venue.name);
  const venueIdSet = new Set(venueIds);
  const links = venueIds.length ? allLinks.filter((link) => venueIdSet.has(link.venueId)) : [];
  const linksByItem = new Map();
  for (const link of links) {
    const itemLinks = linksByItem.get(link.itemId) ?? [];
    itemLinks.push(link);
    linksByItem.set(link.itemId, itemLinks);
  }

  const exactIndex = new Map();
  for (const item of allItems) {
    const key = `${item.type}\u0000${nameKey(item.name)}`;
    const matches = exactIndex.get(key) ?? [];
    matches.push(item);
    exactIndex.set(key, matches);
  }

  const result = {
    domain,
    venueCount: venues.length,
    venueNames: unique(venueNames),
    menu: Array.isArray(data.items) ? data.items.length : 0,
    inDb: 0,
    missing: [],
    filtered: [],
    withoutPrice: [],
    priceDiff: [],
    invalidSourcePrice: [],
    collapsedFallbacks: [],
    normalizationCollisions: [],
  };

  const normalizedGroups = new Map();
  for (const raw of data.items ?? []) {
    const normalized = normalizeMenuName(raw.name, venueNames);
    if (isJunk(normalized)) {
      result.filtered.push({ rawName: String(raw.name ?? ''), normalized });
      continue;
    }

    const expectedPrice = normalizePrice(raw.price);
    if (raw.price !== null && raw.price !== undefined && raw.price !== '' && expectedPrice === null) {
      result.invalidSourcePrice.push({ name: normalized, rawPrice: raw.price });
    }
    const priceKey = expectedPrice === null ? 'нет' : String(expectedPrice);
    const group = normalizedGroups.get(nameKey(normalized)) ?? { name: normalized, rows: 0, prices: new Set() };
    group.rows++;
    group.prices.add(priceKey);
    normalizedGroups.set(nameKey(normalized), group);

    const { type, category } = classify(normalized);
    const exactItems = exactIndex.get(`${type}\u0000${nameKey(normalized)}`) ?? [];
    const exactItemIds = new Set(exactItems.map((item) => item.id));
    const exactLinks = exactItems.flatMap((item) => linksByItem.get(item.id) ?? []);
    const approvedLinks = exactLinks.filter((link) => link.status === 'APPROVED');
    const approvedVenueIds = new Set(approvedLinks.map((link) => link.venueId));
    const isCovered = venueIds.length > 0
      && exactItems.length > 0
      && venueIds.every((venueId) => approvedVenueIds.has(venueId));

    if (isCovered) {
      result.inDb++;
    } else {
      let reason;
      if (!venueIds.length) {
        reason = 'в БД не найдено ни одного заведения по website host';
      } else if (!exactItems.length) {
        reason = 'нет карточки с точным нормализованным названием';
      } else {
        reason = `APPROVED-связи есть у ${approvedVenueIds.size} из ${venueIds.length} заведений`;
      }

      const fallback = exactItems.length ? null : findImportFallback(allItems, normalized, type, category);
      if (fallback) {
        const fallbackApproved = (linksByItem.get(fallback.id) ?? [])
          .filter((link) => link.status === 'APPROVED');
        const fallbackVenueIds = new Set(fallbackApproved.map((link) => link.venueId));
        if (venueIds.length && venueIds.every((venueId) => fallbackVenueIds.has(venueId))) {
          reason += `; импорт схлопнул в «${fallback.name}»`;
          result.collapsedFallbacks.push({ expected: normalized, actual: fallback.name });
        }
      }
      const nonApproved = exactLinks.filter((link) => link.status !== 'APPROVED');
      if (nonApproved.length) reason += `; не-APPROVED: ${unique(nonApproved.map((link) => link.status)).join(', ')}`;
      result.missing.push({ rawName: String(raw.name ?? ''), normalized, reason });
    }

    if (expectedPrice === null || !approvedLinks.length) continue;
    const linksPerVenue = new Map();
    for (const link of approvedLinks) {
      if (!exactItemIds.has(link.itemId)) continue;
      const venueLinks = linksPerVenue.get(link.venueId) ?? [];
      venueLinks.push(link);
      linksPerVenue.set(link.venueId, venueLinks);
    }
    const missingPriceVenues = [];
    const differing = [];
    for (const venue of venues) {
      const venueLinks = linksPerVenue.get(venue.id) ?? [];
      if (!venueLinks.length) continue;
      const prices = venueLinks.map((link) => link.price);
      if (prices.every((price) => price === null)) missingPriceVenues.push(venue.name);
      const wrong = unique(prices.filter((price) => price !== null && price !== expectedPrice));
      if (wrong.length) differing.push({ venue: venue.name, prices: wrong });
    }
    if (missingPriceVenues.length) {
      result.withoutPrice.push({ name: normalized, expectedPrice, venues: unique(missingPriceVenues) });
    }
    if (differing.length) {
      result.priceDiff.push({ name: normalized, expectedPrice, differing });
    }
  }

  result.normalizationCollisions = [...normalizedGroups.values()]
    .filter((group) => group.rows > 1 && group.prices.size > 1)
    .map((group) => ({ ...group, prices: [...group.prices] }));
  return result;
}

function printDetails(result) {
  const title = `${result.domain} — заведений: ${result.venueCount}`
    + (result.venueNames.length ? ` (${result.venueNames.slice(0, 4).join(', ')}${result.venueNames.length > 4 ? ', …' : ''})` : '');
  console.log(`\n## ${title}`);

  if (result.missing.length) {
    console.log(`Пропущено (${result.missing.length}):`);
    for (const item of result.missing) {
      const renamed = item.rawName !== item.normalized ? ` → «${item.normalized}»` : '';
      console.log(`  - ${item.rawName}${renamed}: ${item.reason}`);
    }
  }
  if (result.filtered.length) {
    console.log(`Отфильтровано как мусор (${result.filtered.length}):`);
    for (const item of result.filtered) {
      const renamed = item.rawName !== item.normalized ? ` → «${item.normalized}»` : '';
      console.log(`  - ${item.rawName}${renamed}`);
    }
  }
  if (result.withoutPrice.length) {
    console.log(`Нет цены в БД (${result.withoutPrice.length}):`);
    for (const item of result.withoutPrice) {
      console.log(`  - ${item.name}: источник ${item.expectedPrice} ₽; без цены: ${item.venues.join(', ')}`);
    }
  }
  if (result.priceDiff.length) {
    console.log(`Цена отличается (${result.priceDiff.length}):`);
    for (const item of result.priceDiff) {
      const values = item.differing.flatMap((entry) => entry.prices);
      console.log(`  - ${item.name}: источник ${item.expectedPrice} ₽; БД ${formatValues(values)}`);
    }
  }
  if (result.normalizationCollisions.length) {
    console.log(`Коллизии нормализации с разными ценами (${result.normalizationCollisions.length}):`);
    for (const item of result.normalizationCollisions) {
      console.log(`  - ${item.name}: ${item.rows} строк, цены ${item.prices.map((price) => price === 'нет' ? price : `${price} ₽`).join(', ')}`);
    }
  }
  if (result.invalidSourcePrice.length) {
    console.log(`Не удалось разобрать цену источника (${result.invalidSourcePrice.length}):`);
    for (const item of result.invalidSourcePrice) console.log(`  - ${item.name}: ${JSON.stringify(item.rawPrice)}`);
  }
}

function printSummary(results) {
  const rows = results.map((result) => ({
    'сеть': result.domain,
    'в меню': result.menu,
    'в БД': result.inDb,
    'пропущено': result.missing.length,
    'без цены': result.withoutPrice.length,
    'цена расходится': result.priceDiff.length,
  }));
  console.log('\n# Сводная таблица');
  console.table(rows);

  const totals = results.reduce((sum, result) => {
    sum.menu += result.menu;
    sum.inDb += result.inDb;
    sum.missing += result.missing.length;
    sum.filtered += result.filtered.length;
    sum.withoutPrice += result.withoutPrice.length;
    sum.priceDiff += result.priceDiff.length;
    sum.collapsed += result.collapsedFallbacks.length;
    sum.collisions += result.normalizationCollisions.length;
    sum.noVenues += result.venueCount === 0 ? 1 : 0;
    return sum;
  }, { menu: 0, inDb: 0, missing: 0, filtered: 0, withoutPrice: 0, priceDiff: 0, collapsed: 0, collisions: 0, noVenues: 0 });

  console.log('\n# Общий итог');
  console.log(`Меню: ${totals.menu}; в БД с APPROVED-связями на все точки сети: ${totals.inDb}; пропущено: ${totals.missing}; отфильтровано как мусор: ${totals.filtered}.`);
  console.log(`Без цены в БД: ${totals.withoutPrice}; цена отличается: ${totals.priceDiff}; коллизий нормализации с разными ценами: ${totals.collisions}.`);
  console.log(`Сетей без найденных заведений: ${totals.noVenues}; пропусков, схлопнутых импортом в карточку с другим названием: ${totals.collapsed}.`);
  console.log('Проверка арифметики: в меню = в БД + пропущено + отфильтровано как мусор.');

  const noVenueMissing = results.flatMap((result) => result.venueCount === 0
    ? result.missing.map((item) => ({ ...item, domain: result.domain }))
    : []);
  const collapsedMissing = results.flatMap((result) => result.missing
    .filter((item) => item.reason.includes('импорт схлопнул'))
    .map((item) => ({ ...item, domain: result.domain })));
  const unresolvedMissing = results.flatMap((result) => result.missing
    .filter((item) => result.venueCount > 0 && !item.reason.includes('импорт схлопнул'))
    .map((item) => ({ ...item, domain: result.domain })));
  const nonCollisionPriceDiff = results.flatMap((result) => {
    const collisionKeys = new Set(result.normalizationCollisions.map((item) => nameKey(item.name)));
    return result.priceDiff
      .filter((item) => !collisionKeys.has(nameKey(item.name)))
      .map((item) => ({ ...item, domain: result.domain }));
  });
  console.log('\n# Диагностика причин');
  console.log(`Пропуски: сеть не найдена по website host — ${noVenueMissing.length}; схлопнуто импортом в другое имя — ${collapsedMissing.length}; прочие — ${unresolvedMissing.length}.`);
  if (unresolvedMissing.length) {
    console.log('Прочие пропуски:');
    for (const item of unresolvedMissing) console.log(`  - ${item.domain}: ${item.normalized} — ${item.reason}`);
  }
  console.log(`Ценовых расхождений вне коллизий нормализации: ${nonCollisionPriceDiff.length} из ${totals.priceDiff}.`);
  if (nonCollisionPriceDiff.length) {
    for (const item of nonCollisionPriceDiff) {
      const values = item.differing.flatMap((entry) => entry.prices);
      console.log(`  - ${item.domain}: ${item.name} — источник ${item.expectedPrice} ₽, БД ${formatValues(values)}`);
    }
  }

  const top = new Map();
  for (const result of results) {
    for (const item of result.missing) {
      const key = nameKey(item.normalized);
      const current = top.get(key) ?? { name: item.normalized, count: 0, networks: new Set() };
      current.count++;
      current.networks.add(result.domain);
      top.set(key, current);
    }
  }
  const topRows = [...top.values()]
    .sort((a, b) => b.count - a.count || b.networks.size - a.networks.size || a.name.localeCompare(b.name, 'ru'))
    .slice(0, 30);
  console.log('\n# ТОП пропущенных позиций');
  if (!topRows.length) console.log('Пропусков нет.');
  for (const [index, item] of topRows.entries()) {
    console.log(`${index + 1}. ${item.name} — ${item.count} строк, сетей: ${[...item.networks].join(', ')}`);
  }
}

async function main() {
  configureDatabaseUrl();
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const menus = loadMenus();
    // Fetch once: connection_limit=1 is intentional for production, and doing
    // two queries per chain is unnecessarily fragile over a remote proxy.
    const allRestaurants = await prisma.listing.findMany({
      where: { type: 'RESTAURANT', website: { not: null } },
      select: { id: true, name: true, website: true },
    });
    const allItems = await prisma.listing.findMany({
      where: { type: { in: ITEM_TYPES } },
      select: { id: true, type: true, name: true, category: true },
    });
    const allLinks = await prisma.menuLink.findMany({
      select: { venueId: true, itemId: true, status: true, price: true },
    });
    const results = [];
    const summaryOnly = process.argv.includes('--summary-only');
    for (const entry of menus) {
      const result = auditMenu(allRestaurants, allItems, allLinks, entry);
      results.push(result);
      if (!summaryOnly) printDetails(result);
    }
    printSummary(results);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
