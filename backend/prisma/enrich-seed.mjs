// Sets a readable cuisine on the hand-seeded demo venues (source = null) so their
// cards show cuisine tags. Non-destructive: updates the `cuisine` field only,
// matched by name. Run: node prisma/enrich-seed.mjs (DATABASE_URL in env).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CUISINE = {
  'White Rabbit': 'Русская',
  'Кафе Пушкинъ': 'Русская',
  Selfie: 'Авторская',
  Sahalin: 'Морепродукты, Паназиатская',
  Северяне: 'Русская',
  Уголёк: 'Гриль, Мясная',
  'Grace Bistro': 'Европейская',
  'Probka на Цветном': 'Итальянская',
  Pinch: 'Гастробар',
  Loro: 'Средиземноморская',
  'Big Wine Freaks': 'Винный бар',
  Техникум: 'Авторская',
  'Black Market': 'Бургеры',
  Saviva: 'Растительная',
  'Bourgeois Bohemians': 'Французская, Пекарня',
  Insider: 'Стейки',
  Mushrooms: 'Кофейня, Завтраки',
  'Wine & Crab': 'Морепродукты',
  Ruski: 'Русская',
  Modus: 'Средиземноморская',
  Кузина: 'Кондитерская',
  Поехали: 'Грузинская',
  Хачапури: 'Грузинская',
  Дshare: 'Паназиатская',
  Niki: 'Греческая',
  'Avocado Queen': 'Калифорнийская',
  Salumeria: 'Итальянская',
  Cutfish: 'Рыбная',
  'Mu-Mu': 'Домашняя',
  Воронеж: 'Мясная',
  Birds: 'Европейская',
  Ателье: 'Французская',
};

async function main() {
  let n = 0;
  for (const [name, cuisine] of Object.entries(CUISINE)) {
    const r = await prisma.listing.updateMany({
      where: { name, source: null, type: 'RESTAURANT' },
      data: { cuisine },
    });
    n += r.count;
  }
  console.log(`Готово. Обновлено демо-заведений кухней: ${n}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
