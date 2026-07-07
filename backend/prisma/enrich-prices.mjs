// Gives OSM venues a price level (₽..₽₽₽) by category, so cards show a price and
// the price filter works. This is a CATEGORY-BASED ESTIMATE — real price levels
// come from venue owners. Non-destructive: only fills rows where it's missing.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BY_CATEGORY = {
  Фастфуд: 1,
  Кофейня: 2,
  Кафе: 2,
  Ресторан: 2,
  Паб: 3,
  Бар: 3,
};

async function main() {
  let total = 0;
  for (const [category, level] of Object.entries(BY_CATEGORY)) {
    const r = await prisma.listing.updateMany({
      where: { type: 'RESTAURANT', priceLevel: null, category },
      data: { priceLevel: level },
    });
    total += r.count;
  }
  // anything still missing → ₽₽
  const rest = await prisma.listing.updateMany({
    where: { type: 'RESTAURANT', priceLevel: null },
    data: { priceLevel: 2 },
  });
  total += rest.count;
  console.log(`Готово. Проставлен уровень цены: ${total} заведений.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
