// Seeds branded beer & wine names (legal — names only, no ratings) so the feed
// shows real brands instead of generic styles. Idempotent by name.
// Also clears the mismatched "Тибон" photo and removes review-less generic styles.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BEERS = [
  'Балтика', 'Жигулёвское', 'Сибирская корона', 'Старый мельник', 'Очаково', 'Хамовники',
  'Василеостровское', 'Velkopopovický Kozel', 'Pilsner Urquell', 'Budweiser Budvar',
  'Stella Artois', 'Hoegaarden', 'Leffe', 'Spaten', 'Paulaner', 'Erdinger', 'Franziskaner',
  'Guinness', 'Heineken', 'Carlsberg', 'Tuborg', 'Krombacher', 'Warsteiner', 'Corona',
  'Miller', 'Grimbergen', 'Löwenbräu', 'Holsten', 'Žatecký Gus', 'BrewDog Punk IPA',
  'Weihenstephaner', 'Edelweiss', 'Blanche de Bruxelles', 'Asahi', 'Tsingtao', 'Bud',
];
const WINES = [
  'Абрау-Дюрсо', 'Фанагория', 'Шато Тамань', 'Лефкадия', 'Золотая Балка', 'Массандра',
  'Инкерман', 'Усадьба Дивноморское', 'Cricova', 'Purcari', 'Мукузани', 'Киндзмараули',
  'Саперави', 'Цинандали', 'Хванчкара', 'Алазанская долина', 'Concha y Toro',
  'Casillero del Diablo', 'Gato Negro', 'Carlo Rossi', 'Barefoot', 'Frontera',
  'Veuve Clicquot', 'Moët & Chandon', 'Martini', 'Cinzano', 'Lambrusco', 'Chianti',
  'Rioja', 'Mateus', 'Undurraga', 'Trapiche', 'Santa Rita', 'Cono Sur',
];
// generic style names to retire (only if they carry no reviews)
const GENERIC = [
  'Лагер', 'IPA', 'Крафтовый IPA', 'Стаут', 'Портер', 'Эль', 'Пшеничное',
  'Белое сухое', 'Красное сухое', 'Розе', 'Игристое',
];

async function addBrands(names, category) {
  let added = 0;
  for (const name of names) {
    const exists = await prisma.listing.findFirst({ where: { name, type: 'DRINK' } });
    if (exists) continue;
    await prisma.listing.create({
      data: { name, type: 'DRINK', category, brand: name, source: 'catalog' },
    });
    added++;
  }
  return added;
}

async function main() {
  const b = await addBrands(BEERS, 'Пиво');
  const w = await addBrands(WINES, 'Вино');
  console.log(`Пиво добавлено: ${b}, Вино добавлено: ${w}`);

  // fix the obviously-wrong Тибон photo → fall back to the steak placeholder
  const fixed = await prisma.listing.updateMany({
    where: { name: 'Тибон', type: 'DISH' },
    data: { photoUrl: null },
  });
  console.log(`Тибон фото сброшено: ${fixed.count}`);

  // retire generic styles that nobody reviewed
  let removed = 0;
  for (const name of GENERIC) {
    const items = await prisma.listing.findMany({ where: { name, type: 'DRINK' } });
    for (const it of items) {
      const reviews = await prisma.review.count({ where: { listingId: it.id } });
      if (reviews > 0) continue;
      await prisma.menuLink.deleteMany({ where: { itemId: it.id } });
      await prisma.listing.delete({ where: { id: it.id } });
      removed++;
    }
  }
  console.log(`Обобщённые стили удалены: ${removed}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
