// Remote-DB-friendly chain-menu import: same semantics as menu-import.mjs but BATCHED
// (createMany + a handful of queries per domain) so it survives the Railway proxy —
// the per-link upsert loop of the original dies with P1017 over high-latency links.
// Venue matching: website host OR brand-name patterns (some venues have no website).
//
//   DATABASE_URL=<railway> node prisma/menu-import-remote.mjs --all | <domain...>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');
if (!process.env.DATABASE_URL) {
  const f = path.join(__dirname, '..', '.railway-db-url');
  if (fs.existsSync(f)) process.env.DATABASE_URL = fs.readFileSync(f, 'utf8').trim();
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

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

// copied from menu-import.mjs (not exported there)
function sanitizeName(name) {
  let n = name
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:м3|m3|зона ?\d|ночн[а-я]*)\)/gi, '');
  n = n.replace(/\s*\d+([.,]\d+)?\s?(мл|ml|литр|л|l|гр|г|g)(?![а-яёa-z])\.?/gi, ' ');
  n = n.replace(/\s*\d+\s?шт(?![а-яё])\.?/gi, ' ').replace(/\s*[xх]\s?\d+(?![\dа-яёa-z])/gi, ' ');
  n = n.replace(/\s+(гранде|венти|grande|venti|tall|большой|больш(?:ая|ое)|средн(?:ий|яя|ее)|маленьк\w+|мал(?:ый|ая))(?![а-яё])/gi, ' ');
  n = n.replace(/\s+(xl|xxl|[sml])\s*$/i, '');
  return n.replace(/\s+/g, ' ').trim();
}
function isJunk(name) {
  const n = name.toLowerCase();
  if (n.length < 2 || n.length > 55) return true;
  if (n.split(/\s+/).length > 7) return true;
  if (/^\d+\s*(любые|пицц|штук|шт\b)/.test(n)) return true;
  if (/любые пицц|комбо|\bсет\b|\bнабор\b|меню дня|за \d+\s*₽|выгодн|подарок|конструктор|собери|акци|скидк|сертификат|доставк|для офиса|идеальных|\+ ?\d|\d ?\+ ?\d/.test(n)) return true;
  const letters = (n.match(/[а-яёa-z]/gi) || []).length;
  if (letters < n.length * 0.5) return true;
  return false;
}

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
  const venues = await p.listing.findMany({
    where: {
      type: 'RESTAURANT',
      OR: [
        { website: { contains: host } },
        ...brand.map((b) => ({ name: { contains: b, mode: 'insensitive' } })),
      ],
    },
    select: { id: true },
  });
  if (!venues.length) { console.log(`${domain}: no venues, skip`); continue; }

  // prepare items in memory (dedup by type+lower(name))
  const wanted = new Map(); // key type|lower → {type,name,category,photoUrl,price}
  for (const raw of data.items) {
    const name = sanitizeName(String(raw.name ?? '').trim().replace(/\s+/g, ' '));
    if (!name || isJunk(name)) continue;
    const { type, category } = classify(name);
    const key = `${type}|${name.toLowerCase()}`;
    const photoUrl = typeof raw.image === 'string' && /^https?:\/\//.test(raw.image) ? raw.image : null;
    const price = raw.price > 0 && raw.price < 100000 ? Math.round(raw.price) : null;
    if (!wanted.has(key)) wanted.set(key, { type, name, category, photoUrl, price });
  }
  const names = [...wanted.values()].map((w) => w.name);

  // one query: which of these items already exist (any type — we match per type below)
  const existing = await p.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] }, name: { in: names, mode: 'insensitive' } },
    select: { id: true, type: true, name: true, photoUrl: true },
  });
  const byKey = new Map(existing.map((e) => [`${e.type}|${e.name.toLowerCase()}`, e]));

  // batch-create the missing items
  const toCreate = [...wanted.entries()]
    .filter(([k]) => !byKey.has(k))
    .map(([, w]) => ({ type: w.type, name: w.name, category: w.category, groupKey: w.name.toLowerCase(), source: 'menu-import', photoUrl: w.photoUrl }));
  if (toCreate.length) await p.listing.createMany({ data: toCreate, skipDuplicates: true });
  // re-fetch to get ids for everything
  const all = await p.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] }, name: { in: names, mode: 'insensitive' } },
    select: { id: true, type: true, name: true, photoUrl: true },
  });
  const idByKey = new Map(all.map((e) => [`${e.type}|${e.name.toLowerCase()}`, e]));

  // photo backfill for pre-existing items without one (small; per-item update)
  for (const [k, w] of wanted) {
    const e = idByKey.get(k);
    if (e && !e.photoUrl && w.photoUrl) await p.listing.update({ where: { id: e.id }, data: { photoUrl: w.photoUrl } }).catch(() => {});
  }

  // batch-create menu links: every item × every venue of the chain
  const linkRows = [];
  for (const [k, w] of wanted) {
    const e = idByKey.get(k);
    if (!e) continue;
    for (const v of venues) linkRows.push({ venueId: v.id, itemId: e.id, status: 'APPROVED', price: w.price });
  }
  let links = 0;
  for (let i = 0; i < linkRows.length; i += 1000) {
    const r = await p.menuLink.createMany({ data: linkRows.slice(i, i + 1000), skipDuplicates: true });
    links += r.count;
  }
  console.log(`${domain}: ${venues.length} venues, ${wanted.size} items (+${toCreate.length} new), +${links} links`);
}
await p.$disconnect();
