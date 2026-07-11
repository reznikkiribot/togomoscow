// Removes RETAIL / grocery products that don't belong in a tasting catalog — raw
// ingredients and packaged goods you buy to cook/brew at home, not order at a venue:
//   • coffee "в зёрнах / молотый / в капсулах / дрип-пакет / чалда"
//   • raw patties / semi-finished meat ("котлеты для бургеров", "полуфабрикат")
//   • "для запекания / для жарки / заготовка / набор для"
// Cleans up menu links / reviews / favorites / dislikes / interactions, then deletes.
// Re-run after every parse — this is the standing rule for catalog hygiene.
// Run: node prisma/purge-retail-items.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// precise retail markers (kept tight so real dishes like "Блин с фаршем" survive)
const RETAIL = /в зёрнах|в зернах|котлеты для бургеров|для бургеров|полуфабрикат|дрип[- ]?пакет|в капсул|капсул[аы]|чалд|молотый кофе|кофе молотый|для запекания|для жарки|для гриля|заготовк|набор для|мясо для|(^|[^а-яёa-z0-9])кг([^а-яёa-z0-9]|$)|\d+[.,]?\d*\s*кг|замороженн|охлаждённ|охлажденн|весов(ой|ая|ое)|фасован|настольная игра|сметана d+%|каберне фран|игра/i;

// menu MODIFIERS / add-ons ("Яйцо дополнительно", "Соус на выбор", "Приборы",
// "Упаковка") — parsed from delivery menus but not tasteable dishes. Standing
// parsing rule: run this purge after every import.
const MODIFIER = /дополнительн|доп\.|добавка|топпинг|на выбор|прибор(ы|\b)|упаковк|пакет\b|доставк|сервисный сбор|контейнер|стаканчик пуст/i;

const dry = process.argv.includes('--dry');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, name: true, category: true },
});
const junk = items.filter((it) => RETAIL.test(it.name) || MODIFIER.test(it.name));
console.log(`${dry ? '[DRY] ' : ''}Найдено розничного мусора: ${junk.length}`);
for (const j of junk) console.log(`  ✗ ${j.name}  [${j.category ?? '—'}]`);
if (dry) { await p.$disconnect(); process.exit(0); }

let removed = 0;
for (const j of junk) {
  await p.menuLink.deleteMany({ where: { itemId: j.id } }).catch(() => {});
  await p.review.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.favorite.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.dislike.deleteMany({ where: { itemId: j.id } }).catch(() => {});
  await p.interaction.deleteMany({ where: { listingId: j.id } }).catch(() => {});
  await p.listing.delete({ where: { id: j.id } }).catch(() => {});
  removed++;
}
console.log(`\nУдалено: ${removed}`);
await p.$disconnect();
