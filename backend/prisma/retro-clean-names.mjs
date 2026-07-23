// Retro-clean of dish/drink names on prod:
//  1) fix truncated names (trailing dot, dangling preposition) via trimDanglingTail;
//  2) delete non-food items that slipped into the catalog.
// Idempotent; safe to re-run. Requires DATABASE_URL (public host).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim() +
    '?connect_timeout=30&connection_limit=1';
}

const { trimDanglingTail } = await import('./menu-import.mjs');
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

// non-food that is clearly not a dish or drink (retail merch spotted in catalog)
const NON_FOOD_RE =
  /ремеш|для часов|футболк|игрушк|раскраск|блокнот|значок|брелок|магнит|открытк|носк[иов]|шапк[аи]|термокружк|бутыл(?:ка|ки) для|шоппер|сумк[аи]|стакан(?:чик)? для|подароч.{0,10}сертификат|наклейк|пазл/i;

async function withRetry(fn, label) {
  for (let a = 1; a <= 5; a += 1) {
    try {
      return await fn();
    } catch (e) {
      console.warn(`${label}: retry ${a} (${String(e.message || e).slice(0, 50)})`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  throw new Error(`${label}: giving up`);
}

// ---- 1) fix truncated names ----
const suspects = await withRetry(
  () =>
    prisma.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        OR: [
          { name: { endsWith: '.' } },
          { name: { endsWith: ' на' } },
          { name: { endsWith: ' с' } },
          { name: { endsWith: ' со' } },
          { name: { endsWith: ' из' } },
          { name: { endsWith: ' в' } },
          { name: { endsWith: ' для' } },
          { name: { endsWith: ' без' } },
          { name: { endsWith: ' по' } },
          { name: { endsWith: ' от' } },
          { name: { endsWith: ' до' } },
        ],
      },
      select: { id: true, name: true },
    }),
  'load suspects',
);

let fixed = 0;
const changes = [];
for (const item of suspects) {
  const cleaned = trimDanglingTail(item.name);
  if (cleaned && cleaned !== item.name && cleaned.length >= 2) {
    changes.push({ id: item.id, from: item.name, to: cleaned });
  }
}
console.log(`Обрезанных названий найдено: ${suspects.length}, к исправлению: ${changes.length}`);
for (const c of changes) {
  await withRetry(() => prisma.listing.update({ where: { id: c.id }, data: { name: c.to } }), 'update name');
  console.log(`  «${c.from}» → «${c.to}»`);
  fixed += 1;
}

// ---- 2) delete non-food ----
const allItems = await withRetry(
  () => prisma.listing.findMany({ where: { type: { in: ['DISH', 'DRINK'] } }, select: { id: true, name: true } }),
  'load items',
);
const nonFood = allItems.filter((i) => NON_FOOD_RE.test(i.name));
console.log(`\nNon-food к удалению: ${nonFood.length}`);
let deleted = 0;
for (const item of nonFood) {
  // remove its menu links first, then the listing
  await withRetry(() => prisma.menuLink.deleteMany({ where: { itemId: item.id } }), 'del links');
  await withRetry(() => prisma.listing.delete({ where: { id: item.id } }).catch(() => {}), 'del item');
  console.log(`  ✗ удалено: ${item.name}`);
  deleted += 1;
}

console.log(`\nИтог: исправлено названий ${fixed}, удалено non-food ${deleted}`);
fs.writeFileSync(
  path.join(__dirname, 'retro-clean-names-log.json'),
  JSON.stringify({ at: new Date().toISOString(), fixed: changes, deleted: nonFood.map((n) => n.name) }, null, 2),
);
await prisma.$disconnect();
