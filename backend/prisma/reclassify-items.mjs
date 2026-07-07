// Re-classify existing catalog items with the (fixed) menu-import classifier so
// English-named drinks like "Rich Tea …" / "Stars Coffee …" that landed in DISH/Блюдо
// move to the right DRINK category — and generic categories get refined.
// Conservative: promotes DISH→DRINK and refines categories, never demotes DRINK→DISH.
//   node prisma/reclassify-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) { if (!l || l.startsWith('#') || !l.includes('=')) continue; const i = l.indexOf('='); const k = l.slice(0, i).trim(); if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ''); }
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://yelp:yelp_dev_password@localhost:5432/yelp?schema=public';

const { classify } = await import('./menu-import.mjs');
const GENERIC = new Set(['Блюдо', 'Напитки', null, undefined, '']);
const dry = process.argv.includes('--dry');

const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, name: true, type: true, category: true },
});
let promoted = 0, refined = 0, unchanged = 0;
const sample = [];
for (const it of items) {
  const c = classify(it.name);
  let newType = it.type, newCat = it.category, why = null;
  // 1) DISH wrongly holding a drink (tea/coffee/etc.) → promote to DRINK + its category
  if (it.type === 'DISH' && c.type === 'DRINK') { newType = 'DRINK'; newCat = c.category; why = 'promote→DRINK'; }
  // 2) same type, but current category is generic and classify has a specific one → refine
  else if (c.type === it.type && GENERIC.has(it.category) && !GENERIC.has(c.category)) { newCat = c.category; why = 'refine cat'; }

  if (why && (newType !== it.type || newCat !== it.category)) {
    if (why === 'promote→DRINK') promoted++; else refined++;
    if (sample.length < 25) sample.push(`  ${why}: «${it.name}» [${it.type}/${it.category ?? '—'}] → [${newType}/${newCat}]`);
    if (!dry) await p.listing.update({ where: { id: it.id }, data: { type: newType, category: newCat } }).catch(() => {});
  } else unchanged++;
}
console.log(sample.join('\n'));
console.log(`\n${dry ? '[DRY] ' : ''}total ${items.length}: promoted DISH→DRINK ${promoted}, refined category ${refined}, unchanged ${unchanged}`);
await p.$disconnect();
