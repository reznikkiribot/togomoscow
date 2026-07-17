import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'menu-out');

const sources = {
  'double-b.ru': [],
  'drinkit.ru': [],
  'stars-coffee.ru': [],
  'surfcoffee.ru': [],
  'skuratovcoffee.ru': [{ url: 'https://skuratovcoffee.ru/msk/menu', parser: 'skuratov' }],
  'eazzypizza.ru': [],
  'moremania.info': [],
  'hatimaki.ru': [],
  'coffeehouse.ru': [],
  'varenichnaya.ru': [],
  'syrovarnya.com': [{ url: 'https://www.syrovarnya.com/ru/catalog/atrium', parser: 'microdata' }],
  'osteriamario.ru': [],
};

const refusal = {
  'double-b.ru': 'site and sitemap are public, but contain no priced menu or public menu API',
  'drinkit.ru': 'menu and ordering are offered only in the app; public guest site has no prices',
  'stars-coffee.ru': 'site and sitemap are public, but contain no priced menu or public menu API',
  'surfcoffee.ru': 'Moscow pages link to surfmenu.ru Tilda catalogs, but products are not embedded and no public JSON endpoint was found; menu_raley is for Voronezh',
  'eazzypizza.ru': 'HTTP 403 from WAF for site, sitemap, and common public endpoints',
  'moremania.info': 'public /menu is a client-loaded Tilda catalog; no embedded products or public first-party JSON endpoint found',
  'hatimaki.ru': 'public catalog is visible, but Node fetch receives Qrator 404; no WAF bypass attempted',
  'coffeehouse.ru': 'HTTP 403 from WAF for site, sitemap, and common public endpoints',
  'varenichnaya.ru': 'no public machine-readable menu with item photos found',
  'osteriamario.ru': 'only old PDF menus were found; no current public source with item photos',
};

function decodeHtml(value = '') {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parseMicrodata(html, baseUrl) {
  const starts = [...html.matchAll(/itemType="http:\/\/schema\.org\/MenuItem"/g)].map((m) => m.index);
  return starts.map((start, index) => {
    const chunk = html.slice(start, starts[index + 1] ?? start + 12_000);
    const name = decodeHtml(chunk.match(/itemProp="name"[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
    const priceText = chunk.match(/itemProp="price"[^>]*>([\d\s.,]+)/i)?.[1];
    const imageRaw = chunk.match(/<img[^>]+src="([^"]+)"/i)?.[1];
    return {
      name,
      price: priceText ? Number(priceText.replace(/\s/g, '').replace(',', '.')) : null,
      image: imageRaw ? new URL(imageRaw.replace(/&amp;/g, '&'), baseUrl).href : null,
    };
  }).filter((item) => item.name && Number.isFinite(item.price));
}

function parseTilda(html, baseUrl) {
  const atoms = [...html.matchAll(/<div class=['"]tn-atom[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((match) => ({ index: match.index, text: decodeHtml(match[1]) }));
  const images = [...html.matchAll(/data-original="([^"]+)"/gi)]
    .map((match) => ({ index: match.index, url: new URL(match[1], baseUrl).href }));
  const items = [];
  for (let i = 0; i < atoms.length - 1; i += 1) {
    const name = atoms[i].text;
    const priceMatch = atoms[i + 1].text.match(/^(\d{2,5})(?:\s*₽)?$/);
    if (!priceMatch || !/[А-Яа-яЁёA-Za-z]/.test(name) || name.length < 3 || name.length > 140) continue;
    const nextImage = images.find((image) => image.index > atoms[i + 1].index);
    items.push({ name, price: Number(priceMatch[1]), image: nextImage?.url ?? null });
  }
  return items;
}

function parseSkuratov(html) {
  const items = [];
  const pattern = /&lt;strong&gt;\s*([\s\S]{3,140}?)\s*&lt;\/strong&gt;[\s\S]{0,1000}?&lt;strong&gt;\s*(\d{2,5})\s*Р\.?\s*&lt;\/strong&gt;/gi;
  for (const match of html.matchAll(pattern)) {
    const name = decodeHtml(match[1].replace(/&lt;[^&]*?&gt;/g, ' '));
    if (name && !/^(итого|цена)$/i.test(name)) items.push({ name, price: Number(match[2]), image: null });
  }
  return items;
}

function parseHatimakiPage(html, baseUrl) {
  const items = [];
  const cards = html.split(/<div\s+id="bx_[^"]+"\s+data-entity="item">/i).slice(1);
  for (const card of cards) {
    const name = decodeHtml(card.match(/<span class="good__title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]);
    const priceText = card.match(/class="good__price"[^>]*>[\s\S]*?(\d[\d\s]*)\s*&nbsp;₽/i)?.[1];
    const imageRaw = card.match(/data-background-image="([^"]+)"/i)?.[1];
    if (!name || !priceText) continue;
    items.push({
      name,
      price: Number(priceText.replace(/\s/g, '')),
      image: imageRaw ? new URL(imageRaw, baseUrl).href : null,
    });
  }
  return items;
}

async function parseHatimakiCatalog() {
  const sections = ['lanch', 'rolly', 'sety', 'pizza', 'supy', 'goryachie-blyuda', 'salaty', 'sushi', 'wok', 'zakuski', 'poke', 'sashimi', 'detskoe-menyu', 'vegetarianskoe-menyu', 'smuzi', 'deserty', 'napitki'];
  const urls = sections.map((section) => `https://www.hatimaki.ru/catalog/${section}/`);
  const pages = await Promise.all(urls.map(async (url) => ({ url, html: await getText(url) })));
  return pages.flatMap(({ url, html }) => parseHatimakiPage(html, url));
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.name.toLocaleLowerCase('ru')}|${item.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function runDomain(domain, candidates) {
  for (const source of candidates) {
    try {
      const html = await getText(source.url);
      const parsed = source.parser === 'microdata'
        ? parseMicrodata(html, source.url)
        : source.parser === 'skuratov'
          ? parseSkuratov(html)
          : source.parser === 'hatimaki'
            ? await parseHatimakiCatalog()
            : parseTilda(html, source.url);
      const items = uniqueItems(parsed);
      if (!items.length) continue;
      return {
        domain,
        method: `public ${source.parser === 'microdata' ? 'SSR HTML microdata' : source.parser === 'hatimaki' ? 'catalog HTML' : 'Tilda HTML'}`,
        status: 'ok',
        source: source.url,
        count: items.length,
        withPhoto: items.filter((item) => item.image).length,
        items,
      };
    } catch (error) {
      console.error(`${domain}: ${source.url}: ${error.message}`);
    }
  }
  return { domain, method: null, status: refusal[domain] ?? 'no public menu found', count: 0, withPhoto: 0, items: [] };
}

await mkdir(OUT_DIR, { recursive: true });
for (const [domain, candidates] of Object.entries(sources)) {
  const result = await runDomain(domain, candidates);
  await writeFile(path.join(OUT_DIR, `${domain}.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`${domain}: ${result.status} (${result.count}, photos ${result.withPhoto})`);
}
