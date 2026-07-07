// Extracts a venue's MENU from its own website by RENDERING it in a headless
// browser (Playwright/Chromium executes JS — plain fetch only gets an empty SPA
// shell) and then parsing the rendered text with the local LLM (Ollama). Creates
// menu items + links for the venue and all branches of its chain.
//
// One venue per chain (group_key) to avoid doing a 202-branch chain 202 times.
// Run: node prisma/ai-extract-menus.mjs [limit]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ollamaUp() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return r.ok && (await r.json()).models?.some((m) => m.name.startsWith(MODEL.split(':')[0]));
  } catch { return false; }
}

const MENU_PROMPT = (text) =>
  `Ниже текст страницы сайта заведения общепита. Извлеки позиции МЕНЮ — блюда и напитки с ценами.
Бери только реальные позиции с понятным названием. НЕ выдумывай. Если меню нет — пустой список.
Верни СТРОГО JSON:
{"items":[{"name":"Воппер","price":329,"type":"DISH"},{"name":"Латте","price":189,"type":"DRINK"}]}
Текст:
"""${text.slice(0, 5500)}"""`;

async function aiMenu(text) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt: MENU_PROMPT(text), stream: false, format: 'json', options: { temperature: 0 } }),
      signal: AbortSignal.timeout(120000),
    });
    if (!r.ok) return [];
    const obj = JSON.parse((await r.json()).response);
    return Array.isArray(obj.items) ? obj.items : [];
  } catch { return []; }
}

async function renderText(browser, url) {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
    locale: 'ru-RU',
  });
  const page = await ctx.newPage();
  let text = '';
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // try to open a "Меню" page if there's a link
    const link = await page.$('a:has-text("Меню"), a:has-text("меню"), a[href*="menu"], a[href*="menyu"]');
    if (link) {
      await link.click({ timeout: 5000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    }
    text = await page.evaluate(() => document.body?.innerText ?? '');
  } catch {
    /* unreachable / blocked */
  } finally {
    await ctx.close();
  }
  return text.replace(/\s+/g, ' ').trim();
}

async function linkChain(prisma, itemId, venue) {
  const where = venue.groupKey
    ? { groupKey: venue.groupKey, type: 'RESTAURANT' }
    : { name: { equals: venue.name, mode: 'insensitive' }, type: 'RESTAURANT' };
  const ids = (await prisma.listing.findMany({ where, select: { id: true } })).map((b) => b.id);
  if (!ids.includes(venue.id)) ids.push(venue.id);
  for (const vid of ids) {
    await prisma.menuLink.upsert({
      where: { venueId_itemId: { venueId: vid, itemId } },
      create: { venueId: vid, itemId, status: 'APPROVED' },
      update: {},
    }).catch(() => {});
  }
}

async function main() {
  if (!(await ollamaUp())) { console.log('Ollama недоступен — пропускаю.'); return; }
  const { chromium } = await import('playwright');
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const limit = Number(process.argv[2] ?? 40);

  // one representative per chain (most-reviewed), with a real http website, not yet done
  const rows = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (COALESCE(group_key, id)) id, name, website, group_key as "groupKey"
    FROM listings
    WHERE type='RESTAURANT' AND website ~* '^https?://' AND website !~* 'instagram|t\\.me|vk\\.com'
    ORDER BY COALESCE(group_key, id), review_count DESC
    LIMIT ${limit}
  `);

  const browser = await chromium.launch({ headless: true });
  let venuesWithMenu = 0, itemsCreated = 0;
  for (const v of rows) {
    const text = await renderText(browser, v.website);
    if (text.length < 200) { console.log(`— ${v.name}: пусто/блок`); continue; }
    const items = (await aiMenu(text))
      .filter((it) => it && typeof it.name === 'string' && it.name.length >= 2 && it.name.length <= 60)
      .slice(0, 40);
    if (!items.length) { console.log(`— ${v.name}: меню не распознано`); continue; }
    venuesWithMenu++;
    for (const it of items) {
      const type = /drink|напит/i.test(it.type) ? 'DRINK' : 'DISH';
      const price = Number(it.price) >= 30 && Number(it.price) <= 5000 ? Math.round(Number(it.price)) : null;
      const ext = `${v.groupKey || v.id}:${it.name.toLowerCase().trim()}`;
      const item = await prisma.listing.upsert({
        where: { source_externalId: { source: 'site', externalId: ext } },
        create: { type, name: it.name.trim(), category: type === 'DRINK' ? 'Напиток' : 'Блюдо', groupKey: it.name.toLowerCase().trim(), source: 'site', externalId: ext },
        update: {},
      }).catch(() => null);
      if (!item) continue;
      await linkChain(prisma, item.id, v);
      if (price) await prisma.menuLink.update({ where: { venueId_itemId: { venueId: v.id, itemId: item.id } }, data: { price } }).catch(() => {});
      itemsCreated++;
    }
    console.log(`✓ ${v.name}: ${items.length} позиций`);
    await sleep(500);
  }
  await browser.close();
  console.log(`DONE. заведений с меню: ${venuesWithMenu}/${rows.length}, позиций создано: ${itemsCreated}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
