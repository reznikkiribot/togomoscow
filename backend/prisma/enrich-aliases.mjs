// Fills English aliases so latin queries ("pinot noir", "latte") find the items.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ALIASES = {
  // wine grapes
  'Пино нуар': 'pinot noir', 'Каберне совиньон': 'cabernet sauvignon', 'Каберне фран': 'cabernet franc',
  'Мерло': 'merlot', 'Сира': 'syrah', 'Шираз': 'shiraz', 'Гренаш': 'grenache', 'Мальбек': 'malbec',
  'Темпранильо': 'tempranillo', 'Санджовезе': 'sangiovese', 'Неббиоло': 'nebbiolo', 'Барбера': 'barbera',
  'Зинфандель': 'zinfandel', 'Пинотаж': 'pinotage', 'Карменер': 'carmenere', 'Саперави': 'saperavi',
  'Мурведр': 'mourvedre', 'Гамэ': 'gamay', 'Шардоне': 'chardonnay', 'Совиньон блан': 'sauvignon blanc',
  'Рислинг': 'riesling', 'Пино гриджио': 'pinot grigio', 'Пино гри': 'pinot gris',
  'Гевюрцтраминер': 'gewurztraminer', 'Вионье': 'viognier', 'Семильон': 'semillon', 'Мускат': 'muscat',
  'Алиготе': 'aligote', 'Шенен блан': 'chenin blanc', 'Вердехо': 'verdejo', 'Альбариньо': 'albarino',
  'Грюнер вельтлинер': 'gruner veltliner', 'Ркацители': 'rkatsiteli', 'Треббьяно': 'trebbiano',
  'Гарганега': 'garganega', 'Просекко': 'prosecco', 'Ламбруско': 'lambrusco',
  // cocktails
  'Негрони': 'negroni', 'Мохито': 'mojito', 'Маргарита': 'margarita', 'Дайкири': 'daiquiri',
  'Космополитан': 'cosmopolitan', 'Манхэттен': 'manhattan', 'Олд фэшнд': 'old fashioned',
  'Виски сауэр': 'whiskey sour', 'Апероль шприц': 'aperol spritz', 'Беллини': 'bellini',
  'Мимоза': 'mimosa', 'Мартини': 'martini', 'Драй мартини': 'dry martini', 'Пина колада': 'pina colada',
  'Май тай': 'mai tai', 'Кайпиринья': 'caipirinha', 'Кровавая Мэри': 'bloody mary',
  'Текила санрайз': 'tequila sunrise', 'Лонг айленд': 'long island iced tea', 'Джин тоник': 'gin tonic',
  'Секс на пляже': 'sex on the beach', 'Голубая лагуна': 'blue lagoon', 'Сазерак': 'sazerac',
  'Уайт рашн': 'white russian', 'Эспрессо мартини': 'espresso martini', 'Гимлет': 'gimlet',
  'Москоу мюл': 'moscow mule', 'Айриш кофе': 'irish coffee', 'Кир рояль': 'kir royale',
  // spirits
  'Виски': 'whiskey whisky', 'Бурбон': 'bourbon', 'Скотч': 'scotch', 'Джин': 'gin', 'Ром': 'rum',
  'Текила': 'tequila', 'Мескаль': 'mezcal', 'Водка': 'vodka', 'Коньяк': 'cognac', 'Бренди': 'brandy',
  'Арманьяк': 'armagnac', 'Кальвадос': 'calvados', 'Граппа': 'grappa', 'Абсент': 'absinthe',
  'Вермут': 'vermouth', 'Самбука': 'sambuca', 'Ликёр': 'liqueur', 'Чача': 'chacha', 'Писко': 'pisco',
  // tea
  'Матча': 'matcha', 'Улун': 'oolong', 'Пуэр': 'puer puerh', 'Эрл грей': 'earl grey',
  'Ройбуш': 'rooibos', 'Сенча': 'sencha',
  // coffee kinds (items)
  'Эспрессо': 'espresso', 'Доппио': 'doppio', 'Ристретто': 'ristretto', 'Американо': 'americano',
  'Капучино': 'cappuccino', 'Латте': 'latte', 'Флэт-уайт': 'flat white', 'Раф': 'raf', 'Раф кофе': 'raf',
  'Мокко': 'mocha', 'Макиато': 'macchiato', 'Кортадо': 'cortado', 'Пикколо': 'piccolo',
  'Колд-брю': 'cold brew', 'Айс-латте': 'ice latte iced latte', 'Фильтр': 'filter', 'Аэропресс': 'aeropress',
  'Кемекс': 'chemex', 'Турка': 'turka', 'Френч-пресс': 'french press',
};

async function main() {
  let n = 0;
  for (const [name, alias] of Object.entries(ALIASES)) {
    const res = await prisma.listing.updateMany({
      where: { name, type: { in: ['DISH', 'DRINK'] } },
      data: { aliases: alias },
    });
    n += res.count;
  }
  console.log(`Псевдонимы заполнены: ${n}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
