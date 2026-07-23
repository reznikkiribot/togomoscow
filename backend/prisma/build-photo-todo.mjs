// Builds gen-todo.json — the work list for generate-missing-photos.mjs — from
// every DISH/DRINK that has an approved menu link but no photo yet. Each entry is
// {id, name, en}: a coarse Russian→English food prompt so Stable Diffusion has
// something concrete to render. generate-missing-photos.mjs refines `en` further
// via its EN_FIX table and CLIP-verifies the result before shipping.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL =
  fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim() +
  '?connect_timeout=30&connection_limit=1';
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// coarse category → English scene. The generator's EN_FIX handles specifics.
const CAT_EN = {
  Пицца: 'whole round pizza with toppings, top view',
  Бургеры: 'gourmet burger on a bun with fries',
  Паста: 'italian pasta dish in a plate',
  Салаты: 'fresh salad in a bowl',
  Супы: 'bowl of hot soup',
  Десерты: 'plated dessert',
  Стейки: 'grilled steak on a wooden board',
  Японская: 'sushi and rolls on a platter',
  Фастфуд: 'fast food snack on a plate',
  Кофе: 'cup of coffee with latte art',
  Чай: 'cup of tea',
  Смузи: 'glass of fruit smoothie',
  Безалкогольные: 'glass of soft drink with ice',
  Напитки: 'glass of a refreshing drink',
  Завтраки: 'breakfast plate with eggs',
};
// keyword → English, checked before the category fallback
const KW_EN = [
  [/пицц/i, 'whole round pizza with toppings, top view'],
  [/бургер|чизбургер/i, 'gourmet burger on a bun with fries'],
  [/паст|спагетти|карбонар|болонье/i, 'italian pasta dish in a plate'],
  [/салат|цезарь/i, 'fresh salad in a bowl'],
  [/суп|борщ|солянк|харчо/i, 'bowl of hot soup'],
  [/торт|чизкейк|тирамису|десерт|мороже|панна|штрудель|маффин/i, 'plated dessert'],
  [/стейк|рибай|миньон/i, 'grilled steak on a wooden board'],
  [/ролл|суши|сашими|поке|темпура/i, 'sushi and rolls on a platter'],
  [/латте|капучино|эспрессо|американо|раф|кофе|мокко|флэт/i, 'cup of coffee with latte art'],
  [/матча|чай|улун|пуэр/i, 'cup of green tea'],
  [/смузи|шейк|милкшейк/i, 'glass of fruit smoothie'],
  [/лимонад|сок|морс|тоник|кола|компот/i, 'glass of soft drink with ice'],
  [/картоф|фри|наггетс|стрипс|твистер/i, 'crispy potato fries and nuggets on a plate'],
  [/пельмен|варен|хинкал/i, 'dumplings on a plate with sour cream'],
  [/шаурм|шаверм|донер|кебаб/i, 'doner kebab wrap on a plate'],
  [/блин|сырник|оладь/i, 'russian pancakes with sour cream and berries'],
  [/омлет|скрембл|яйц|завтрак/i, 'breakfast plate with eggs and toast'],
  [/курин|цыпл|крыл/i, 'roasted chicken dish on a plate'],
  [/лосос|форел|рыб|креветк|морепродукт/i, 'seafood dish with fish and shrimp'],
];

function toEn(name, category) {
  for (const [re, en] of KW_EN) if (re.test(name)) return en;
  if (category && CAT_EN[category]) return CAT_EN[category];
  return 'appetizing plated food dish, restaurant plating';
}

async function withRetry(fn) {
  for (let a = 1; a <= 5; a += 1) {
    try { return await fn(); } catch (e) {
      console.warn('retry', String(e.message || e).slice(0, 40));
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  throw new Error('db unavailable');
}

const rows = await withRetry(() => p.$queryRaw`
  SELECT DISTINCT l.id, l.name, l.category
  FROM listings l
  JOIN menu_links m ON m.item_id = l.id AND m.status = 'APPROVED'
  WHERE l.type::text IN ('DISH','DRINK') AND l.photo_url IS NULL
`);

const mismatches = rows.map((r) => ({ id: r.id, name: r.name, en: toEn(r.name, r.category) }));
fs.writeFileSync(path.join(__dirname, 'gen-todo.json'), JSON.stringify({ mismatches }, null, 0));
console.log(`gen-todo.json: ${mismatches.length} блюд без фото`);
await p.$disconnect();
