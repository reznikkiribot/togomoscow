// Fetches a MATCHING real photo for every dish/drink via the Pexels API
// (free, commercial use, no attribution required). Searches by the item name,
// falls back to an English category query, else keeps the current stock photo.
// Needs PEXELS_API_KEY in backend/.env. Run: node prisma/fetch-photos-pexels.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
process.env.DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
const KEY = env.PEXELS_API_KEY;

// English fallback query per category (Pexels has more English-tagged food)
const CAT_EN = {
  Русская: 'russian food', Грузинская: 'georgian food', Кавказская: 'kebab',
  Итальянская: 'italian food', Пицца: 'pizza', Японская: 'sushi', Тайская: 'thai food',
  Азиатская: 'asian food', Китайская: 'chinese food', Бургеры: 'burger', Фастфуд: 'fast food',
  Сэндвичи: 'sandwich', Стейки: 'steak', Гриль: 'grilled meat', Закуски: 'appetizer',
  Салаты: 'salad', Супы: 'soup', Морепродукты: 'seafood', Завтраки: 'breakfast',
  Десерты: 'dessert', Выпечка: 'pastry', Кофе: 'coffee', Чай: 'tea', Коктейль: 'cocktail',
  Пиво: 'beer', Вино: 'wine', Безалкогольное: 'lemonade', 'Горячие напитки': 'hot drink',
};

async function search(q, locale) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape${locale ? `&locale=${locale}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) return null;
  const data = await res.json();
  const p = data.photos?.[0];
  return p?.src?.large ?? p?.src?.medium ?? null;
}

async function main() {
  if (!KEY) {
    console.log('Нет PEXELS_API_KEY в backend/.env — получите бесплатный ключ на pexels.com/api');
    return;
  }
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const items = await prisma.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] } },
    select: { id: true, name: true, type: true, category: true },
  });
  let ok = 0;
  let fallback = 0;
  for (const it of items) {
    let url = await search(it.name, 'ru-RU'); // try the exact name in Russian
    if (!url) {
      const en = CAT_EN[it.category] ?? (it.type === 'DRINK' ? 'drink' : 'food');
      url = await search(en); // category fallback
      if (url) fallback++;
    } else {
      ok++;
    }
    if (url) {
      await prisma.listing.update({ where: { id: it.id }, data: { photoUrl: url } });
    }
    await new Promise((r) => setTimeout(r, 250)); // be gentle with rate limits
  }
  console.log(`Готово. Точных по названию: ${ok}, по категории: ${fallback}, всего: ${items.length}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
