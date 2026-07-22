// Read-only Moscow venue coverage audit.
//
// Sources:
//   - production PostgreSQL (DATABASE_URL or ../.railway-db-url)
//   - current OpenStreetMap data through public Overpass mirrors (ODbL)
//   - WHERETOEAT Moscow 2025 official shortlist (names/domains only)
//
// Usage:
//   node prisma/coverage-gaps.mjs [--refresh-osm]
//
// Outputs:
//   prisma/coverage-report.json
//   prisma/coverage-report.md
//   prisma/menu-priority.json
//
// This script never writes to the database.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(__dirname, '..');
const MENU_OUT = path.join(__dirname, 'menu-out');
const CACHE = path.join(BACKEND, '.coverage-cache');
const REPORT_JSON = path.join(__dirname, 'coverage-report.json');
const REPORT_MD = path.join(__dirname, 'coverage-report.md');
const MENU_PRIORITY_JSON = path.join(__dirname, 'menu-priority.json');
const MOSCOW_AREA_ID = 3_600_102_269; // OSM relation 102269 + 3.6e9.
const REFRESH_OSM = process.argv.includes('--refresh-osm');
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const OSM_VENUE_QUERY = `
[out:json][timeout:300];
area(${MOSCOW_AREA_ID})->.moscow;
(
  nwr["amenity"~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|food_court|biergarten)$"]["name"](area.moscow);
  nwr["shop"~"^(coffee|bakery)$"]["name"](area.moscow);
);
out center tags;
`;

const OSM_BOUNDARY_QUERY = `
[out:json][timeout:300];
area(${MOSCOW_AREA_ID})->.moscow;
rel(area.moscow)["boundary"="administrative"]["admin_level"~"^(5|8)$"];
out geom;
`;

const WTE_SOURCE = 'https://results2020.wheretoeat.ru/publications/news/moskva-short-list-2025/';
const WTE_SHORTLIST = [
  ['Anchovy’s Club', 'anchovys.club'], ['Onest', 'onestrest.ru'], ['AVA', 'ava.rest'],
  ['Padron', 'padron-rest.ru'], ['Avrora', 'avrora.rest'], ['Probka на Цветном', 'probka.org'],
  ['Big Wine Freaks', null], ['Rico', null], ['Bjorn', 'bjorn.rest'], ['Sage', 'sagemoscow.ru'],
  ['Bruno', 'bruno.lucky-group.rest'], ['Salone Pasta & Bar', 'italyco.rest', ['Salone']],
  ['Carniceria Vino', null], ['Saray', 'saray.lucky-group.rest'],
  ['Eva', 'eva-gruzinskaya.lucky-group.rest'], ['Savva', 'savvarest.ru'], ['Folk', 'folk-rest.ru'],
  ['Selfie', 'selfiemoscow.ru'], ['Grand Cru', 'grandcru.ru'],
  ['Semifreddo', 'semifreddo-restaurant.com', ['Семифреддо']], ['Ikra', 'ikra.wrf.su'],
  ['TOUCH Chef’s Place & Bar', null], ['Ikura Izakaya Nikkei', 'ikura.rest'],
  ['Twins Garden', 'twinsgarden.ru'], ['Jun', 'jun.lucky-group.rest'], ['Vadvare', 'tsa.moscow'],
  ['Kiyomi', 'kiyomi.lucky-group.rest'], ['White Rabbit', 'whiterabbitmoscow.ru'],
  ['Krasota', 'krasota.wrf.su'], ['Аист', 'novikovgroup.ru'], ['Lea', 'lea.rest'],
  ['Белуга', 'belugamoscow.ru'], ['LEO', 'leomoscow.ru'], ['Гвидон', 'gvidon.wrf.su'],
  ['Loona', 'loona.rest'], ['Горыныч', 'gorynich.com'], ['Loro', 'loro.lucky-group.rest'],
  ['Жажда крови', 'zhazhdakrovy.ru'], ['Manul', 'manulmoscow.ru'], ['За крышей', null],
  ['Max’s Beef for Money', null], ['Кафе Пушкинъ', 'cafe-pushkin.ru'],
  ['Maya', 'maya.lucky-group.rest'], ['Матрёшка', 'matryoshka-rest.ru'], ['Mina', 'probka.org'],
  ['На даче шефа', null], ['Modus', 'modus.moscow'], ['Поле', 'pole.restaurant'], ['Mosto', null],
  ['Сахалин', 'sakhalin-moscow.ru'], ['Olluco', 'olluco.ru'], ['Северяне', 'severyane.moscow'],
  ['Oltremare', 'oltremare.lucky-group.rest'],
].map(([name, domain, aliases = []]) => ({ name, domain, aliases }));

const TOP10_2025 = new Set([
  'Olluco', 'За крышей', 'Sage', 'Savva', 'Maya', 'Carniceria Vino', 'Grand Cru',
  'Bruno', 'Onest', 'Padron',
].map(normalizeName));

const SOCIAL_OR_AGGREGATOR = /(^|\.)(vk\.com|vk\.ru|instagram\.com|facebook\.com|t\.me|telegram\.me|yandex\.(ru|com)|ya\.cc|2gis\.ru|google\.com|taplink\.cc|linktr\.ee|wa\.me|whatsapp\.com|delivery-club\.ru|chibbis\.ru|restoclub\.ru|zoon\.ru)$/i;
// Keep automated extraction aligned with menu-import.mjs owner rules.
const OWNER_MENU_BLOCK = /burgerking|burger.?king|vkusnoitochka|rostics|rostic|kfc|mcdonald|subway|carls|hesburger|teremok|kartoshka|stardog/i;
const RETAIL_DOMAIN_BLOCK = /(^|\.)(mealty\.ru|miratorg\.ru|delikateska\.ru|globus\.ru)$/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/(?:^|\s)(?:ресторан|restaurant|кафе|cafe|бар|bar)(?:\s|$)/g, ' ')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hostOf(value) {
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      .hostname.toLocaleLowerCase('en-US')
      .replace(/^www\./, '');
  } catch {
    return null;
  }
}

function configureDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = path.join(BACKEND, '.railway-db-url');
  if (!fs.existsSync(file)) throw new Error('DATABASE_URL is not set and backend/.railway-db-url is missing');
  const raw = fs.readFileSync(file, 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  return `${raw}${separator}connect_timeout=30&connection_limit=1`;
}

async function withDbRetry(label, action, attempts = 4) {
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
    // Railway's public proxy currently presents a self-signed certificate chain.
    // Traffic remains encrypted; set PGSSL_REJECT_UNAUTHORIZED=1 when a trusted CA is configured.
    ssl: { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === '1' },
  });
  client.on('error', (error) => console.error(`idle DB connection dropped: ${error.code ?? error.message}`));
  await withDbRetry('connect', () => client.query('SELECT 1'));
  return client;
}

async function fetchDatabaseRows(client) {
  const sql = `
    SELECT l.id, l.name, l.category, l.address, l.photo_url, l.photos,
           l.lat, l.lng, l.website, l.source, l.external_id, l.brand,
           l.cuisine, l.group_key, l.review_count, l.views,
           COALESCE(m.menu_count, 0)::int AS menu_count
      FROM listings l
      LEFT JOIN (
        SELECT venue_id, count(*)::int AS menu_count
          FROM menu_links
         GROUP BY venue_id
      ) m ON m.venue_id = l.id
     WHERE l.type = 'RESTAURANT'::"ListingType"
  `;
  return withDbRetry('load venues', async () => (await client.query(sql)).rows);
}

async function fetchOverpass(query, label) {
  let lastError;
  for (let round = 1; round <= 3; round += 1) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
            'user-agent': 'togomoscow-coverage/1.0 (public OSM audit)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(330_000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log(`${label}: ${data.elements?.length ?? 0} objects from ${new URL(endpoint).host}`);
        return data;
      } catch (error) {
        lastError = error;
        console.error(`${label}: ${new URL(endpoint).host}: ${error.message}`);
      }
    }
    await sleep(round * 3_000);
  }
  throw new Error(`${label}: all Overpass mirrors failed: ${lastError?.message ?? 'unknown error'}`);
}

async function cachedOverpass(filename, query, label) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, filename);
  if (!REFRESH_OSM && fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < CACHE_MAX_AGE_MS) {
    console.log(`${label}: using ${path.relative(BACKEND, file)}`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const data = await fetchOverpass(query, label);
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

function samePoint(a, b) {
  return a && b && Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
}

function stitchRings(segments) {
  const pending = segments
    .filter((segment) => segment.length >= 2)
    .map((segment) => segment.slice());
  const rings = [];
  while (pending.length) {
    const ring = pending.shift();
    let changed = true;
    while (!samePoint(ring[0], ring.at(-1)) && changed) {
      changed = false;
      for (let index = 0; index < pending.length; index += 1) {
        const segment = pending[index];
        if (samePoint(ring.at(-1), segment[0])) ring.push(...segment.slice(1));
        else if (samePoint(ring.at(-1), segment.at(-1))) ring.push(...segment.slice(0, -1).reverse());
        else if (samePoint(ring[0], segment.at(-1))) ring.unshift(...segment.slice(0, -1));
        else if (samePoint(ring[0], segment[0])) ring.unshift(...segment.slice(1).reverse());
        else continue;
        pending.splice(index, 1);
        changed = true;
        break;
      }
    }
    if (ring.length >= 4 && samePoint(ring[0], ring.at(-1))) rings.push(ring);
  }
  return rings;
}

function relationBoundary(element) {
  const members = element.members ?? [];
  const segments = (role) => members
    .filter((member) => member.type === 'way' && member.role === role && member.geometry?.length)
    .map((member) => member.geometry.map((point) => [point.lon, point.lat]));
  const outers = stitchRings(segments('outer'));
  const inners = stitchRings(segments('inner'));
  return {
    id: `relation/${element.id}`,
    name: element.tags?.name ?? `relation/${element.id}`,
    level: Number(element.tags?.admin_level),
    outers,
    inners,
    areaKm2: Math.max(0, ringsAreaKm2(outers) - ringsAreaKm2(inners)),
  };
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > lat) !== (yj > lat)
      && lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInBoundary(lng, lat, boundary) {
  return boundary.outers.some((ring) => pointInRing(lng, lat, ring))
    && !boundary.inners.some((ring) => pointInRing(lng, lat, ring));
}

function ringsAreaKm2(rings) {
  return rings.reduce((sum, ring) => {
    const meanLat = ring.reduce((acc, point) => acc + point[1], 0) / ring.length;
    const xScale = 111.32 * Math.cos((meanLat * Math.PI) / 180);
    const yScale = 110.574;
    let twiceArea = 0;
    for (let index = 0; index < ring.length - 1; index += 1) {
      const [lng1, lat1] = ring[index];
      const [lng2, lat2] = ring[index + 1];
      twiceArea += lng1 * xScale * lat2 * yScale - lng2 * xScale * lat1 * yScale;
    }
    return sum + Math.abs(twiceArea) / 2;
  }, 0);
}

function osmVenue(element) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat ?? null;
  const lng = element.lon ?? element.center?.lon ?? null;
  return {
    externalId: `${element.type}/${element.id}`,
    name: tags.name,
    lat,
    lng,
    amenity: tags.amenity ?? null,
    shop: tags.shop ?? null,
    cuisine: tags.cuisine ?? null,
    website: tags.website ?? tags['contact:website'] ?? null,
  };
}

function cuisineTokens(value) {
  return String(value ?? '')
    .toLocaleLowerCase('en-US')
    .split(/[;,/]+/)
    .map((token) => token.trim().replace(/\s+/g, '_'))
    .filter(Boolean);
}

function countCuisine(rows) {
  const counts = new Map();
  for (const row of rows) {
    for (const token of new Set(cuisineTokens(row.cuisine))) counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function indexByBoundary(points, boundaries) {
  const rows = new Map(boundaries.map((boundary) => [boundary.id, []]));
  const unassigned = [];
  for (const point of points) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      unassigned.push(point);
      continue;
    }
    const match = boundaries.find((boundary) => pointInBoundary(point.lng, point.lat, boundary));
    if (match) rows.get(match.id).push(point);
    else unassigned.push(point);
  }
  return { rows, unassigned };
}

function summarizeBoundaries(boundaries, dbIndex, osmIndex, dbOsmIds) {
  return boundaries.map((boundary) => {
    const dbRows = dbIndex.rows.get(boundary.id) ?? [];
    const osmRows = osmIndex.rows.get(boundary.id) ?? [];
    const osmPresent = osmRows.filter((row) => dbOsmIds.has(row.externalId)).length;
    const osmMissing = osmRows.length - osmPresent;
    return {
      name: boundary.name,
      osmId: boundary.id,
      areaKm2: Number(boundary.areaKm2.toFixed(1)),
      dbAll: dbRows.length,
      dbDensityPerKm2: boundary.areaKm2 ? Number((dbRows.length / boundary.areaKm2).toFixed(2)) : null,
      osmCurrent: osmRows.length,
      osmPresent,
      osmMissing,
      osmCoveragePct: osmRows.length ? Number((100 * osmPresent / osmRows.length).toFixed(1)) : null,
    };
  });
}

function menuFiles() {
  const byDomain = new Map();
  if (!fs.existsSync(MENU_OUT)) return byDomain;
  for (const file of fs.readdirSync(MENU_OUT)) {
    if (!file.endsWith('.json') || file.startsWith('_')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(MENU_OUT, file), 'utf8'));
      const domain = hostOf(data.domain) ?? String(data.domain ?? file.replace(/\.json$/, '')).replace(/^www\./, '');
      byDomain.set(domain, {
        file,
        status: data.status ?? null,
        method: data.method ?? null,
        count: Number(data.count ?? data.items?.length ?? 0),
        source: data.source ?? null,
      });
    } catch (error) {
      byDomain.set(file.replace(/\.json$/, ''), { file, status: `invalid JSON: ${error.message}`, count: 0 });
    }
  }
  return byDomain;
}

function buildMenuPriority(dbRows, wteMatches) {
  const files = menuFiles();
  const domains = new Map();
  const importantDomains = new Set(wteMatches.map((item) => item.domain).filter(Boolean));
  for (const row of dbRows) {
    const domain = hostOf(row.website);
    if (!domain || SOCIAL_OR_AGGREGATOR.test(domain)) continue;
    const current = domains.get(domain) ?? {
      domain, venues: 0, venuesWithoutMenu: 0, reviews: 0, views: 0, groups: new Set(), examples: [],
    };
    current.venues += 1;
    current.venuesWithoutMenu += Number(row.menu_count) === 0 ? 1 : 0;
    current.reviews += Number(row.review_count ?? 0);
    current.views += Number(row.views ?? 0);
    current.groups.add(row.group_key || normalizeName(row.brand || row.name));
    if (current.examples.length < 4 && !current.examples.includes(row.name)) current.examples.push(row.name);
    domains.set(domain, current);
  }

  const rows = [...domains.values()].map((row) => {
    const parsed = files.get(row.domain) ?? null;
    const popular = importantDomains.has(row.domain)
      || wteMatches.some((match) => match.matched && row.examples.some((name) => normalizeName(name) === normalizeName(match.name)));
    const score = row.venues * 100
      + row.groups.size * 25
      + row.reviews * 10
      + Math.min(row.views, 20_000) / 100
      + (popular ? 1_000 : 0);
    let action = 'automatic';
    if (OWNER_MENU_BLOCK.test(row.domain) || row.examples.some((name) => OWNER_MENU_BLOCK.test(name))) action = 'owner-rule skip';
    else if (RETAIL_DOMAIN_BLOCK.test(row.domain)) action = 'retail skip';
    else if (/WAF|403|429|cloudflare|ddos|qrator/i.test(parsed?.status ?? '')) action = 'browser/WAF review';
    else if (/pdf/i.test(parsed?.method ?? '') || /\.pdf(?:$|\?)/i.test(parsed?.source ?? '')) action = 'pdf-menu.mjs';
    else if (parsed && parsed.count < 5) action = 'manual source review';
    return {
      domain: row.domain,
      score: Number(score.toFixed(1)),
      venueCount: row.venues,
      chainGroupCount: row.groups.size,
      venuesWithoutMenu: row.venuesWithoutMenu,
      reviews: row.reviews,
      views: row.views,
      importantPlace: popular,
      examples: row.examples,
      menuOut: parsed,
      action,
    };
  }).sort((a, b) => b.score - a.score || b.venueCount - a.venueCount || a.domain.localeCompare(b.domain));

  return {
    generatedAt: new Date().toISOString(),
    unparsed: rows.filter((row) => !row.menuOut),
    failedOrManual: rows.filter((row) => row.menuOut && row.menuOut.count < 5),
    parsed: rows.filter((row) => row.menuOut?.count >= 5),
  };
}

function chainMenuPropagation(dbRows) {
  const groups = new Map();
  for (const row of dbRows) {
    const key = String(row.group_key ?? '').trim();
    if (!key) continue;
    const current = groups.get(key) ?? { groupKey: key, venues: 0, withMenu: 0, withoutMenu: 0, names: new Set() };
    current.venues += 1;
    if (Number(row.menu_count) > 0) current.withMenu += 1;
    else current.withoutMenu += 1;
    if (current.names.size < 5) current.names.add(row.name);
    groups.set(key, current);
  }
  const rows = [...groups.values()]
    .filter((group) => group.venues >= 2 && group.withMenu > 0 && group.withoutMenu > 0)
    .map((group) => ({ ...group, names: [...group.names] }))
    .sort((a, b) => b.withoutMenu - a.withoutMenu || b.venues - a.venues || a.groupKey.localeCompare(b.groupKey));
  return {
    groups: rows.length,
    branchesWithoutMenu: rows.reduce((sum, row) => sum + row.withoutMenu, 0),
    rows,
  };
}

function matchWte(dbRows) {
  const named = dbRows.map((row) => ({ row, normalized: normalizeName(row.name), domain: hostOf(row.website) }));
  return WTE_SHORTLIST.map((place) => {
    const wanted = normalizeName(place.name);
    const wantedNames = new Set([wanted, ...(place.aliases ?? []).map(normalizeName)]);
    const matches = named.filter(({ normalized, domain }) => {
      const domainMatch = place.domain && (domain === place.domain || domain?.endsWith(`.${place.domain}`));
      const nameMatch = [...wantedNames].some((candidate) => normalized === candidate
        || (candidate.length >= 5 && (normalized.startsWith(`${candidate} `) || normalized.endsWith(` ${candidate}`))));
      return domainMatch || nameMatch;
    }).map(({ row }) => ({ id: row.id, name: row.name, website: row.website, address: row.address }));
    return {
      ...place,
      top10: TOP10_2025.has(wanted),
      matched: matches.length > 0,
      matches,
    };
  });
}

function pct(numerator, denominator) {
  return denominator ? Number((100 * numerator / denominator).toFixed(1)) : null;
}

function markdownTable(rows, columns) {
  if (!rows.length) return '_Нет данных._';
  const cell = (value) => String(value ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const head = `| ${columns.map((column) => cell(column.label)).join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(' | ')} |`).join('\n');
  return `${head}\n${separator}\n${body}`;
}

function buildMarkdown(report, menuPriority) {
  const f = report.fields;
  const districtHoles = report.geography.districts
    .filter((row) => row.osmMissing > 0)
    .sort((a, b) => b.osmMissing - a.osmMissing || a.osmCoveragePct - b.osmCoveragePct)
    .slice(0, 30);
  const lowDensity = report.geography.districts
    .filter((row) => row.areaKm2 >= 1)
    .sort((a, b) => a.dbDensityPerKm2 - b.dbDensityPerKm2 || a.dbAll - b.dbAll)
    .slice(0, 20);
  const cuisine = report.cuisine.comparison.slice(0, 30);
  const missingTop = report.popularPlaces.rows.filter((row) => !row.matched);
  const unparsed = menuPriority.unparsed.slice(0, 50);
  const manual = menuPriority.failedOrManual.slice(0, 30);
  const propagation = report.menuDomains.chainPropagation.rows.slice(0, 30);
  return `# Пробелы покрытия togomoscow\n\n` +
    `Сформировано: ${report.generatedAt}. БД: production PostgreSQL (read-only). OSM snapshot: ${report.osm.timestamp}.\n\n` +
    `## Общие числа\n\n` +
    `- Заведения: **${f.total}**; OSM-источник: **${f.osmSource}**.\n` +
    `- С меню: **${f.withMenu} (${f.withMenuPct}%)**; без меню: **${f.withoutMenu}**.\n` +
    `- Без website: **${f.withoutWebsite}**; без координат: **${f.withoutCoordinates}**; без фото: **${f.withoutPhoto}**.\n` +
    `- Текущий полный OSM-срез: **${report.osm.currentTotal}** объектов; уже в БД по external_id: **${report.osm.presentByExternalId}**; отсутствуют: **${report.osm.missingByExternalId}**.\n\n` +
    `## Округа\n\n` +
    `${markdownTable(report.geography.okrugs, [
      { label: 'Округ', value: (r) => r.name }, { label: 'БД', value: (r) => r.dbAll },
      { label: 'OSM сейчас', value: (r) => r.osmCurrent }, { label: 'OSM нет в БД', value: (r) => r.osmMissing },
      { label: 'Покрытие OSM', value: (r) => `${r.osmCoveragePct ?? '—'}%` },
    ])}\n\n` +
    `Не попали в текущие OSM-полигоны округов: БД — ${report.geography.dbCoordinatesOutsideOkrugs}, OSM — ${report.geography.osmCoordinatesOutsideOkrugs}. В районные полигоны попали все точки; расхождение связано с текущей топологией округов Новой Москвы.\n\n` +
    `## Главные районные дыры относительно текущего OSM\n\n` +
    `${markdownTable(districtHoles, [
      { label: 'Район', value: (r) => r.name }, { label: 'БД', value: (r) => r.dbAll },
      { label: 'OSM сейчас', value: (r) => r.osmCurrent }, { label: 'Не хватает OSM', value: (r) => r.osmMissing },
      { label: 'Покрытие', value: (r) => `${r.osmCoveragePct ?? '—'}%` },
    ])}\n\n` +
    `После additive-импорта эта таблица должна опустеть. Это доказывает полноту относительно выбранных OSM-тегов, но не полноту самого OSM.\n\n` +
    `## Районы с самой низкой плотностью каталога\n\n` +
    `Это кандидаты на ручную проверку/другие источники, а не доказанные пропуски: крупные и малонаселённые районы закономерно имеют низкую плотность.\n\n` +
    `${markdownTable(lowDensity, [
      { label: 'Район', value: (r) => r.name }, { label: 'Площадь, км²', value: (r) => r.areaKm2 },
      { label: 'Заведений', value: (r) => r.dbAll }, { label: 'На км²', value: (r) => r.dbDensityPerKm2 },
    ])}\n\n` +
    `## Кухни: БД против текущего OSM baseline\n\n` +
    `OSM cuisine — неполный пользовательский тег, а не официальная статистика рынка. Сравнение показывает измеримые перекосы покрытия, но не долю продаж или посещений.\n\n` +
    `${markdownTable(cuisine, [
      { label: 'Кухня (OSM tag)', value: (r) => r.cuisine }, { label: 'БД', value: (r) => r.dbCount },
      { label: 'OSM сейчас', value: (r) => r.osmCount }, { label: 'Дефицит', value: (r) => r.missing },
      { label: 'Покрытие', value: (r) => `${r.coveragePct}%` },
    ])}\n\n` +
    `## Популярные места, отсутствующие целиком\n\n` +
    `Эталон: [WHERETOEAT Moscow 2025 shortlist](${WTE_SOURCE}), 53 места; итоговый топ-10 помечен ⭐. Сопоставление сделано только по названию и официальному домену, без догадок.\n\n` +
    `${markdownTable(missingTop, [
      { label: 'Место', value: (r) => `${r.top10 ? '⭐ ' : ''}${r.name}` },
      { label: 'Официальный домен', value: (r) => r.domain },
    ])}\n\n` +
    `Найдено ${report.popularPlaces.found}/${report.popularPlaces.total}; не найдено ${report.popularPlaces.missing}.\n\n` +
    `## Приоритет доменов без menu-out\n\n` +
    `${markdownTable(unparsed, [
      { label: 'Домен', value: (r) => r.domain }, { label: 'Точек', value: (r) => r.venueCount },
      { label: 'Без меню', value: (r) => r.venuesWithoutMenu }, { label: 'Отзывы', value: (r) => r.reviews },
      { label: 'Важное место', value: (r) => r.importantPlace ? 'да' : '' }, { label: 'Действие', value: (r) => r.action },
      { label: 'Score', value: (r) => r.score },
    ])}\n\n` +
    `## Потенциал распространения уже существующего меню по groupKey\n\n` +
    `Это кандидаты на проверку, не готовый список для слепого связывания: ошибочный groupKey может смешать одноимённые независимые места.\n\n` +
    `${markdownTable(propagation, [
      { label: 'groupKey', value: (r) => r.groupKey }, { label: 'Всего точек', value: (r) => r.venues },
      { label: 'С меню', value: (r) => r.withMenu }, { label: 'Без меню', value: (r) => r.withoutMenu },
      { label: 'Названия', value: (r) => r.names.join(', ') },
    ])}\n\n` +
    `## Уже проверенные, но не извлечённые автоматически\n\n` +
    `${markdownTable(manual, [
      { label: 'Домен', value: (r) => r.domain }, { label: 'Точек', value: (r) => r.venueCount },
      { label: 'Статус', value: (r) => r.menuOut?.status }, { label: 'Следующий путь', value: (r) => r.action },
    ])}\n\n` +
    `Полная очередь: \`prisma/menu-priority.json\`. Машиночитаемый отчёт: \`prisma/coverage-report.json\`.\n`;
}

async function main() {
  const client = await openDatabase();
  let dbRows;
  try {
    dbRows = await fetchDatabaseRows(client);
  } finally {
    await client.end().catch(() => {});
  }
  console.log(`Database: ${dbRows.length} restaurants`);

  const [osmRaw, boundaryRaw] = await Promise.all([
    cachedOverpass('osm-food-venues.json', OSM_VENUE_QUERY, 'OSM venues'),
    cachedOverpass('osm-moscow-boundaries.json', OSM_BOUNDARY_QUERY, 'OSM boundaries'),
  ]);
  const osmRowsRaw = (osmRaw.elements ?? []).map(osmVenue).filter((row) => row.name);
  // Standalone shop=coffee is usually beans/capsules/equipment retail (for example
  // Nespresso or coffee-bean shops), not a food-service venue. Objects that also
  // have an allowed amenity remain eligible through that amenity selector.
  const excludedStandaloneCoffeeRetail = osmRowsRaw.filter((row) => row.shop === 'coffee' && !row.amenity);
  const osmRows = osmRowsRaw.filter((row) => !(row.shop === 'coffee' && !row.amenity));
  const boundaries = (boundaryRaw.elements ?? [])
    .map(relationBoundary)
    .filter((boundary) => boundary.outers.length && [5, 8].includes(boundary.level));
  const okrugs = boundaries.filter((boundary) => boundary.level === 5);
  const districts = boundaries.filter((boundary) => boundary.level === 8);
  console.log(`Boundaries: ${okrugs.length} okrugs, ${districts.length} districts`);

  const dbWithCoordinates = dbRows.filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng));
  const osmWithCoordinates = osmRows.filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng));
  const dbOsmIds = new Set(dbRows.filter((row) => row.source === 'osm' && row.external_id).map((row) => row.external_id));
  const dbOkrugIndex = indexByBoundary(dbWithCoordinates, okrugs);
  const osmOkrugIndex = indexByBoundary(osmWithCoordinates, okrugs);
  const dbDistrictIndex = indexByBoundary(dbWithCoordinates, districts);
  const osmDistrictIndex = indexByBoundary(osmWithCoordinates, districts);
  const wte = matchWte(dbRows);
  const menuPriority = buildMenuPriority(dbRows, wte);
  const propagation = chainMenuPropagation(dbRows);

  const dbCuisine = countCuisine(dbRows);
  const osmCuisine = countCuisine(osmRows);
  const cuisineComparison = [...osmCuisine.entries()]
    .filter(([, count]) => count >= 5)
    .map(([cuisine, osmCount]) => {
      const dbCount = dbCuisine.get(cuisine) ?? 0;
      return { cuisine, dbCount, osmCount, missing: Math.max(0, osmCount - dbCount), coveragePct: pct(Math.min(dbCount, osmCount), osmCount) };
    })
    .sort((a, b) => b.missing - a.missing || b.osmCount - a.osmCount || a.cuisine.localeCompare(b.cuisine));

  const withMenu = dbRows.filter((row) => Number(row.menu_count) > 0).length;
  const withWebsite = dbRows.filter((row) => hostOf(row.website)).length;
  const report = {
    generatedAt: new Date().toISOString(),
    methodology: {
      database: 'Production PostgreSQL, read-only query; P1001/transient connection retries',
      geography: 'Point-in-polygon using current OSM admin_level=5/8 relation geometry',
      cuisine: 'Current OSM cuisine tags are a coverage proxy, not an official market distribution',
      popularPlaces: `WHERETOEAT Moscow 2025 official shortlist: ${WTE_SOURCE}`,
      menuPriority: 'Official website domains grouped by venue count, chain groups, reviews, views and shortlist presence',
    },
    fields: {
      total: dbRows.length,
      osmSource: dbRows.filter((row) => row.source === 'osm').length,
      withMenu,
      withMenuPct: pct(withMenu, dbRows.length),
      withoutMenu: dbRows.length - withMenu,
      withWebsite,
      withoutWebsite: dbRows.filter((row) => !hostOf(row.website)).length,
      withWebsiteWithoutMenu: dbRows.filter((row) => hostOf(row.website) && Number(row.menu_count) === 0).length,
      withoutWebsiteWithMenu: dbRows.filter((row) => !hostOf(row.website) && Number(row.menu_count) > 0).length,
      withoutCoordinates: dbRows.filter((row) => !Number.isFinite(row.lat) || !Number.isFinite(row.lng)).length,
      withoutPhoto: dbRows.filter((row) => !row.photo_url && !(row.photos?.length)).length,
      withoutCuisineTag: dbRows.filter((row) => cuisineTokens(row.cuisine).length === 0).length,
    },
    osm: {
      timestamp: osmRaw.osm3s?.timestamp_osm_base ?? null,
      currentTotal: osmRows.length,
      rawSelectorTotal: osmRowsRaw.length,
      excludedStandaloneCoffeeRetail: excludedStandaloneCoffeeRetail.map((row) => ({
        externalId: row.externalId, name: row.name, lat: row.lat, lng: row.lng,
      })),
      bySelector: Object.entries(osmRows.reduce((acc, row) => {
        const key = row.amenity ? `amenity=${row.amenity}` : `shop=${row.shop}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1]).map(([selector, count]) => ({ selector, count })),
      presentByExternalId: osmRows.filter((row) => dbOsmIds.has(row.externalId)).length,
      missingByExternalId: osmRows.filter((row) => !dbOsmIds.has(row.externalId)).length,
      missingExternalIds: osmRows.filter((row) => !dbOsmIds.has(row.externalId)).map((row) => ({
        externalId: row.externalId, name: row.name, amenity: row.amenity, shop: row.shop, lat: row.lat, lng: row.lng,
      })),
    },
    geography: {
      okrugs: summarizeBoundaries(okrugs, dbOkrugIndex, osmOkrugIndex, dbOsmIds).sort((a, b) => b.dbAll - a.dbAll),
      districts: summarizeBoundaries(districts, dbDistrictIndex, osmDistrictIndex, dbOsmIds).sort((a, b) => b.dbAll - a.dbAll),
      dbCoordinatesOutsideOkrugs: dbOkrugIndex.unassigned.length,
      osmCoordinatesOutsideOkrugs: osmOkrugIndex.unassigned.length,
      dbCoordinatesOutsideKnownBoundaries: dbDistrictIndex.unassigned.length,
      osmCoordinatesOutsideKnownBoundaries: osmDistrictIndex.unassigned.length,
    },
    cuisine: {
      dbTaggedVenues: dbRows.filter((row) => cuisineTokens(row.cuisine).length > 0).length,
      osmTaggedVenues: osmRows.filter((row) => cuisineTokens(row.cuisine).length > 0).length,
      comparison: cuisineComparison,
    },
    popularPlaces: {
      source: WTE_SOURCE,
      total: wte.length,
      found: wte.filter((row) => row.matched).length,
      missing: wte.filter((row) => !row.matched).length,
      rows: wte,
    },
    menuDomains: {
      unparsed: menuPriority.unparsed.length,
      failedOrManual: menuPriority.failedOrManual.length,
      parsed: menuPriority.parsed.length,
      chainPropagation: propagation,
      topUnparsed: menuPriority.unparsed.slice(0, 100),
      topFailedOrManual: menuPriority.failedOrManual.slice(0, 100),
    },
  };

  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(MENU_PRIORITY_JSON, `${JSON.stringify(menuPriority, null, 2)}\n`);
  fs.writeFileSync(REPORT_MD, buildMarkdown(report, menuPriority));
  console.log(`Reports: ${path.relative(BACKEND, REPORT_MD)}, ${path.relative(BACKEND, REPORT_JSON)}, ${path.relative(BACKEND, MENU_PRIORITY_JSON)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
