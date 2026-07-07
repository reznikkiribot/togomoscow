// Universal menu-extraction cascade (per Кирилл's design). For each restaurant
// domain it runs, in order, the cheapest method that works:
//   1) HTTP GET → __NEXT_DATA__ (Next.js inline JSON)
//   2) HTTP → <script type=application/json> blobs
//   3) HTTP → JSON-LD (schema.org Menu/MenuItem)
//   4) HTTP → hydration app-state (__APOLLO_STATE__/__PRELOADED_STATE__/__INITIAL_STATE__/__NUXT__)
//   5) Playwright → capture XHR/GraphQL JSON responses (hidden API) + window app-state
//   6) WAF detected (ddos-guard / Cloudflare / 403) → status "manual_required"
// Never reproduces mobile-app auth / bot-evasion — WAF sites are flagged, not bypassed.
//
// Usage:
//   node prisma/menu-engine.mjs <domain|url> [more...]      # specific sites
//   node prisma/menu-engine.mjs --from-db [N]               # top N chain domains from the catalog
// Output: prisma/menu-out/<domain>.json  + a printed summary.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');
fs.mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
// some chains key the menu by city (Dodo: /moscow); try those paths too
const PATHS = ['', '/moscow', '/menu', '/menu/', '/catalog', '/menyu', '/eda', '/moscow/menu'];
const CITY_NAV = ['', '/moscow', '/moscow/menu', '/menu']; // Playwright navigation targets
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NAME_KEYS = ['name', 'title', 'productName', 'dishName', 'product_name'];
const PRICE_KEYS = ['price', 'cost', 'amount', 'value', 'priceValue', 'min_price'];
const IMAGE_KEYS = ['image', 'imageUrl', 'image_url', 'img', 'photo', 'picture', 'pictureUrl', 'previewImage', 'thumbnail', 'imageLink', 'cover', 'images'];
const looksImg = (s) => typeof s === 'string' && (/\.(jpg|jpeg|png|webp|avif)/i.test(s) || /^https?:\/\//.test(s) || s.startsWith('/'));
function imgFromVal(v) {
  if (looksImg(v)) return v;
  if (Array.isArray(v) && v.length) return imgFromVal(v[0]);
  if (v && typeof v === 'object') {
    for (const k of ['url', 'src', 'original', 'large', 'medium', 'path', 'link', 'image', 'file']) {
      if (looksImg(v[k])) return v[k];
    }
    for (const val of Object.values(v)) if (typeof val === 'string' && /\.(jpg|jpeg|png|webp|avif)/i.test(val)) return val;
  }
  return null;
}
function pickImage(o) {
  for (const k of IMAGE_KEYS) {
    const r = imgFromVal(o[k]);
    if (r) return r;
  }
  return null;
}

// ---- shared: pull every {name, price, image} out of an arbitrary JSON tree ----
function pairsFromJson(data) {
  const items = [];
  const seen = new Set();
  (function walk(o) {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    const nk = NAME_KEYS.find((k) => typeof o[k] === 'string' && o[k].trim().length > 1 && o[k].trim().length < 80);
    let price = null;
    for (const k of PRICE_KEYS) {
      const v = o[k];
      if (typeof v === 'number' && v > 5 && v < 1000000) { price = v; break; }
      if (typeof v === 'string' && /^\d{2,6}([.,]\d{1,2})?$/.test(v.trim())) { price = Number(v.replace(',', '.')); break; }
    }
    if (nk && price != null) items.push({ name: String(o[nk]).trim().slice(0, 70), price, image: pickImage(o) });
    for (const v of Object.values(o)) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    }
  })(data);
  // dedup by name (keep first price; backfill an image if a later dup has one)
  const map = new Map();
  for (const it of items) {
    const ex = map.get(it.name);
    if (!ex) map.set(it.name, { price: it.price, image: it.image });
    else if (!ex.image && it.image) ex.image = it.image;
  }
  return [...map.entries()].map(([name, v]) => ({ name, price: v.price, image: v.image }));
}

// kopecks heuristic: premium menus store price*100; if the median is huge, divide.
function normalizePrices(items) {
  if (!items.length) return items;
  const prices = items.map((i) => i.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const div = median > 8000 ? 100 : 1;
  return items.map((i) => ({ name: i.name, price: Math.round(i.price / div), image: i.image }));
}
// turn a relative/protocol-less image path into an absolute URL on the chain host
function absImage(img, host) {
  if (!img || typeof img !== 'string') return null;
  if (/^https?:\/\//.test(img)) return img;
  if (img.startsWith('//')) return 'https:' + img;
  if (img.startsWith('/')) return `https://${host}${img}`;
  return null;
}

async function httpGet(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/json', 'Accept-Language': 'ru-RU,ru' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    return { status: r.status, text: await r.text(), server: (r.headers.get('server') || '').toLowerCase() };
  } catch (e) {
    return { status: 0, text: '', server: '', err: String(e).slice(0, 50) };
  }
}

function detectWaf(res) {
  if (res.status === 403 || res.status === 429 || res.status === 503) return true;
  if (/ddos-guard|cloudflare|akamai|kasada|qrator/.test(res.server)) return true;
  if (/Just a moment|cf-browser-verification|Checking your browser|ddos-guard|Attention Required/i.test(res.text)) return true;
  return false;
}

// ---- HTTP detectors (return items[] or []) ----
function detNextData(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  try { return pairsFromJson(JSON.parse(m[1])); } catch { return []; }
}
function detJsonScripts(html) {
  let best = [];
  const re = /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { const items = pairsFromJson(JSON.parse(m[1])); if (items.length > best.length) best = items; } catch { /* skip */ }
  }
  return best;
}
function detJsonLd(html) {
  let best = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { const items = pairsFromJson(JSON.parse(m[1])); if (items.length > best.length) best = items; } catch { /* skip */ }
  }
  return best;
}
function detAppState(html) {
  let best = [];
  const markers = ['__APOLLO_STATE__', '__PRELOADED_STATE__', '__INITIAL_STATE__', '__NUXT__', '__INITIAL_DATA__'];
  for (const mk of markers) {
    const re = new RegExp(mk + '\\s*=\\s*(\\{[\\s\\S]*?\\})\\s*;?\\s*<\\/script>');
    const m = html.match(re);
    if (m) { try { const items = pairsFromJson(JSON.parse(m[1])); if (items.length > best.length) best = items; } catch { /* not pure JSON */ } }
  }
  return best;
}

const HTTP_DETECTORS = [
  ['__NEXT_DATA__', detNextData],
  ['json-script', detJsonScripts],
  ['JSON-LD', detJsonLd],
  ['app-state', detAppState],
];

// ---- Playwright fallback: capture network JSON + window app-state ----
async function playwrightCapture(url) {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch { return { items: [], source: null, note: 'playwright missing' }; }
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: UA, locale: 'ru-RU' });
  const page = await ctx.newPage();
  const captured = []; // {url, items}
  page.on('response', async (res) => {
    try {
      const ct = res.headers()['content-type'] || '';
      if (!/json/.test(ct)) return;
      const data = await res.json().catch(() => null);
      if (!data) return;
      const items = pairsFromJson(data);
      if (items.length >= 5) captured.push({ url: res.url().split('?')[0], items, graphql: /graphql/i.test(res.url()) });
    } catch { /* ignore */ }
  });
  const root = url.replace(/\/$/, '');
  for (const nav of CITY_NAV) {
    if (captured.length) break; // already got a menu from an earlier nav target
    try {
      await page.goto(root + nav, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      for (const sel of ['a[href*="menu"]', 'a[href*="catalog"]', 'text=Меню']) {
        const el = await page.$(sel).catch(() => null);
        if (el) { await el.click().catch(() => {}); await page.waitForTimeout(3000); break; }
      }
      // window hydration state (Apollo/Redux/Nuxt)
      const state = await page.evaluate(() => {
        const w = window;
        return { a: w.__APOLLO_STATE__, p: w.__PRELOADED_STATE__, i: w.__INITIAL_STATE__, n: w.__NUXT__, r: w.__REDUX_STATE__ };
      }).catch(() => ({}));
      for (const v of Object.values(state || {})) {
        if (v) { const items = pairsFromJson(v); if (items.length >= 5) captured.push({ url: 'window.appState', items, graphql: false }); }
      }
    } catch { /* nav issue → try next target */ }
  }
  await browser.close().catch(() => {});
  if (!captured.length) return { items: [], source: null };
  captured.sort((a, b) => b.items.length - a.items.length);
  return { items: captured[0].items, source: captured[0].url, graphql: captured[0].graphql };
}

// ---- cascade for one domain ----
async function processDomain(domain) {
  const base = domain.startsWith('http') ? domain : `https://${domain}`;
  const host = (() => { try { return new URL(base).host.replace(/^www\./, ''); } catch { return domain; } })();
  let wafSeen = false;

  // HTTP cascade over candidate paths
  for (const p of PATHS) {
    const res = await httpGet(base.replace(/\/$/, '') + p);
    if (res.status === 0) continue;
    if (detectWaf(res)) { wafSeen = true; continue; }
    for (const [method, det] of HTTP_DETECTORS) {
      const items = det(res.text);
      if (items.length >= 5) return finish(host, method, normalizePrices(items), (p || '/'));
    }
    await sleep(250);
  }

  // Playwright fallback (hidden API / GraphQL / window state)
  const pw = await playwrightCapture(base);
  if (pw.items.length >= 5) return finish(host, pw.graphql ? 'graphql' : 'playwright-xhr', normalizePrices(pw.items), pw.source);

  // nothing worked
  const status = wafSeen ? 'manual_required (WAF)' : 'manual_required (no menu found)';
  return finish(host, null, [], null, status);
}

function finish(host, method, items, source, status) {
  items = items.map((i) => ({ ...i, image: absImage(i.image, host) }));
  const withPhoto = items.filter((i) => i.image).length;
  const result = { domain: host, method, status: status || 'ok', source, count: items.length, withPhoto, items };
  fs.writeFileSync(path.join(OUT, host.replace(/[^\w.-]/g, '_') + '.json'), JSON.stringify(result, null, 2));
  return result;
}

// ---- runner ----
async function domainsFromDb(n) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const rows = await prisma.listing.findMany({ where: { type: 'RESTAURANT', website: { not: null } }, select: { website: true } });
  await prisma.$disconnect();
  const counts = new Map();
  for (const r of rows) {
    let host = '';
    try { host = new URL(r.website.startsWith('http') ? r.website : 'https://' + r.website).host.replace(/^www\./, ''); } catch { continue; }
    if (/vk\.com|facebook|instagram|t\.me/.test(host)) continue; // not menu sites
    counts.set(host, (counts.get(host) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([h]) => h);
}

async function main() {
  const args = process.argv.slice(2);
  let domains;
  if (args[0] === '--from-db') domains = await domainsFromDb(Number(args[1] || 25));
  else domains = args;
  if (!domains.length) { console.log('usage: node prisma/menu-engine.mjs <domain...> | --from-db [N]'); return; }

  console.log(`Processing ${domains.length} domains…\n`);
  const summary = [];
  for (const d of domains) {
    let r;
    try { r = await processDomain(d); } catch (e) { r = { domain: d, method: null, status: 'error: ' + String(e).slice(0, 40), count: 0 }; }
    summary.push(r);
    const tag = r.count >= 5 ? `OK ${r.count} via ${r.method}` : r.status;
    console.log(`${(r.domain || d).padEnd(24)} ${tag}`);
  }
  const ok = summary.filter((s) => s.count >= 5);
  const totalItems = ok.reduce((s, x) => s + x.count, 0);
  console.log(`\n— ${ok.length}/${summary.length} domains extracted, ${totalItems} menu items total. JSON in prisma/menu-out/`);
}
main().catch((e) => { console.error(e); process.exit(1); });
