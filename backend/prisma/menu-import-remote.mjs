// Remote-DB-friendly chain-menu import: same semantics as menu-import.mjs but BATCHED
// (createMany + a handful of queries per domain) so it survives the Railway proxy —
// the per-link upsert loop of the original dies with P1017 over high-latency links.
// Venue matching: website host OR brand-name patterns (some venues have no website).
//
//   DATABASE_URL=<railway> node prisma/menu-import-remote.mjs --all | <domain...>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, isJunk, menuNameKey, normalizeMenuName } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');
if (!process.env.DATABASE_URL) {
  const f = path.join(__dirname, '..', '.railway-db-url');
  if (fs.existsSync(f)) process.env.DATABASE_URL = fs.readFileSync(f, 'utf8').trim();
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

async function retry(label, operation) {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = String(error?.message ?? '');
      const transient = ['P1001', 'P1017', 'P2024', 'P2028'].includes(error?.code)
        || /P1001|connection.*(?:closed|reset|timeout|terminated)|server.*closed|connection pool/iu.test(message);
      if (!transient || attempt === 6) throw error;
      const delay = attempt * 2000;
      console.log(`${label}: transient ${error?.code ?? 'connection error'}, retry ${attempt}/6 in ${delay / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// brand-name fallbacks for venues that lost/never had a website
const BRANDS = {
  'dodopizza.ru': ['додо', 'dodo'],
  'coffeemania.ru': ['кофемания', 'coffeemania'],
  'cofix.global': ['cofix', 'кофикс'],
  'burgerkingrus.ru': ['бургер кинг', 'burger king'],
  'rostics.ru': ["rostic", 'ростик'],
  'papajohns.ru': ["papa john", 'папа джонс'],
  'dominopizza.ru': ['domino', 'домино пицц'],
  'onepricecoffee.com': ['one price'],
  'shoko.ru': ['шоколадница'],
};

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const domains = process.argv.includes('--all')
  ? fs.readdirSync(OUT).filter((f) => f.endsWith('.json') && f !== '_import-log.json')
      .map((f) => { try { const j = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); return (j.count ?? 0) >= 5 ? j.domain : null; } catch { return null; } })
      .filter(Boolean)
  : args;

for (const domain of domains) {
  const file = path.join(OUT, domain.replace(/[^\w.-]/g, '_') + '.json');
  if (!fs.existsSync(file)) { console.log(`${domain}: no extract, skip`); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.items?.length) { console.log(`${domain}: empty, skip`); continue; }

  // venues: by website host OR brand name
  const host = domain.replace(/^www\./, '');
  const brand = BRANDS[domain] ?? [];
  const venues = await retry(`${domain}: read venues`, () => p.listing.findMany({
    where: {
      type: 'RESTAURANT',
      OR: [
        { website: { contains: host } },
        ...brand.map((b) => ({ name: { contains: b, mode: 'insensitive' } })),
      ],
    },
    select: { id: true },
  }));
  if (!venues.length) { console.log(`${domain}: no venues, skip`); continue; }

  // prepare items in memory (dedup by type+lower(name))
  const wanted = new Map(); // key type|normalized → {type,name,category,photoUrl,price}
  for (const raw of data.items) {
    const name = normalizeMenuName(raw.name);
    if (!name || isJunk(name)) continue;
    const { type, category } = classify(name);
    const key = `${type}|${menuNameKey(name)}`;
    const photoUrl = typeof raw.image === 'string' && /^https?:\/\//.test(raw.image) ? raw.image : null;
    const price = raw.price > 0 && raw.price < 100000 ? Math.round(raw.price) : null;
    if (!wanted.has(key)) wanted.set(key, { type, name, category, photoUrl, price });
  }
  // Exact normalized identity only; loading the small catalog also catches
  // harmless punctuation and ё/е differences without any substring fallback.
  const existing = await retry(`${domain}: read catalog`, () => p.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] } },
    select: { id: true, type: true, name: true, photoUrl: true },
  }));
  const byKey = new Map(existing.map((e) => [`${e.type}|${menuNameKey(e.name)}`, e]));

  // batch-create the missing items
  const toCreate = [...wanted.entries()]
    .filter(([k]) => !byKey.has(k))
    .map(([, w]) => ({ type: w.type, name: w.name, category: w.category, groupKey: w.name.toLowerCase(), source: 'menu-import', photoUrl: w.photoUrl }));
  if (toCreate.length) await retry(`${domain}: create items`, () => p.listing.createMany({ data: toCreate, skipDuplicates: true }));
  // re-fetch to get ids for everything
  const all = await retry(`${domain}: fetch created items`, () => p.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] }, name: { in: toCreate.map((item) => item.name), mode: 'insensitive' } },
    select: { id: true, type: true, name: true, photoUrl: true },
  }));
  const idByKey = new Map(byKey);
  for (const e of all) idByKey.set(`${e.type}|${menuNameKey(e.name)}`, e);

  // photo backfill for pre-existing items without one (small; per-item update)
  for (const [k, w] of wanted) {
    const e = idByKey.get(k);
    if (e && !e.photoUrl && w.photoUrl) await retry(`${domain}: photo ${w.name}`, () => p.listing.update({ where: { id: e.id }, data: { photoUrl: w.photoUrl } })).catch(() => {});
  }

  // batch-create menu links: every item × every venue of the chain
  const linkRows = [];
  for (const [k, w] of wanted) {
    const e = idByKey.get(k);
    if (!e) continue;
    for (const v of venues) linkRows.push({ venueId: v.id, itemId: e.id, status: 'APPROVED', price: w.price });
  }
  let links = 0;
  for (let i = 0; i < linkRows.length; i += 500) {
    const r = await retry(`${domain}: create links ${i}`, () => p.menuLink.createMany({ data: linkRows.slice(i, i + 500), skipDuplicates: true }));
    links += r.count;
  }
  // createMany is intentionally idempotent but does not refresh existing prices.
  // One update per item (across every branch) keeps remote traffic bounded while
  // making a reparse authoritative, including explicit null prices.
  let updatedLinks = 0;
  for (const [k, w] of wanted) {
    const e = idByKey.get(k);
    if (!e) continue;
    const result = await retry(`${domain}: update links ${w.name}`, () => p.menuLink.updateMany({
      where: { venueId: { in: venues.map((venue) => venue.id) }, itemId: e.id },
      data: { status: 'APPROVED', price: w.price },
    }));
    updatedLinks += result.count;
  }
  console.log(`${domain}: ${venues.length} venues, ${wanted.size} items (+${toCreate.length} new), +${links} links, ${updatedLinks} refreshed links`);
}
await p.$disconnect();
