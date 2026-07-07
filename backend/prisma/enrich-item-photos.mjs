// Assigns a real (commercial-licensed) photo to every dish/drink that has none,
// matched by name keywords first, then category. Photos served via /api/stock/<key>.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const has = (s, ...keys) => keys.some((k) => s.includes(k));

function dishKey(name, category) {
  const n = name.toLowerCase();
  if (has(n, 'суши', 'ролл', 'сашими')) return 'food_sushi';
  if (has(n, 'пицц')) return 'food_pizza';
  if (has(n, 'паста', 'карбонара', 'болоньезе', 'лазан', 'равиоли', 'ньокки', 'спагетти')) return 'food_pasta';
  if (has(n, 'бургер')) return 'food_burger';
  if (has(n, 'стейк', 'рибай', 'миньон', 'тибон', 'тартар', 'рёбра')) return 'food_steak';
  if (has(n, 'хачапури', 'хинкали', 'чахохбили', 'лобио', 'сациви', 'пхали', 'чакапули')) return 'food_khachapuri';
  if (has(n, 'шашлык', 'кебаб', 'люля', 'манты', 'плов', 'долма', 'кутаб')) return 'food_kebab';
  if (has(n, 'пельмени', 'вареники')) return 'food_pelmeni';
  if (has(n, 'борщ', 'щи', 'солянк', 'окрошк', 'уха', 'суп', 'минестроне', 'гаспачо', 'том ям', 'рамен', 'удон')) return 'food_soup';
  if (has(n, 'салат', 'цезарь', 'оливье', 'винегрет', 'греческий', 'нисуаз', 'капрезе', 'шубой')) return 'food_salad';
  if (has(n, 'мороженое')) return 'food_icecream';
  if (has(n, 'чизкейк', 'тирамису', 'наполеон', 'медовик', 'панна', 'брауни', 'профитроли', 'эклер', 'штрудель', 'торт', 'десерт')) return 'food_cake';
  if (has(n, 'круассан', 'расстегай', 'кулебяка', 'самса', 'чебурек', 'пирог', 'выпеч', 'драник')) return 'food_bread';
  if (has(n, 'устриц', 'мидии', 'краб', 'креветк', 'лосось', 'дорадо', 'рыба')) return 'food_seafood';
  if (has(n, 'фри', 'наггетс', 'хот-дог', 'шаурма', 'сэндвич', 'клаб')) return 'food_fries';
  if (has(n, 'омлет', 'яичниц', 'каша', 'сырник', 'блин', 'гранола', 'тост', 'панкейк', 'бенедикт', 'панкейки')) return 'food_breakfast';
  if (has(n, 'вок', 'пад тай', 'спринг', 'димсам', 'гёдза', 'темпура', 'утка')) return 'food_sushi';
  // category fallback
  const c = (category || '').toLowerCase();
  if (c.includes('супы')) return 'food_soup';
  if (c.includes('салат')) return 'food_salad';
  if (c.includes('десерт')) return 'food_cake';
  if (c.includes('выпеч')) return 'food_bread';
  if (c.includes('завтрак')) return 'food_breakfast';
  if (c.includes('морепрод')) return 'food_seafood';
  if (c.includes('стейк')) return 'food_steak';
  if (c.includes('гриль')) return 'food_kebab';
  if (c.includes('пицц')) return 'food_pizza';
  if (c.includes('бургер')) return 'food_burger';
  if (c.includes('фастфуд') || c.includes('сэндвич')) return 'food_fries';
  if (c.includes('грузин')) return 'food_khachapuri';
  if (c.includes('кавказ')) return 'food_kebab';
  if (c.includes('итальян')) return 'food_pasta';
  if (c.includes('японск') || c.includes('азиат') || c.includes('тайск') || c.includes('китайск')) return 'food_sushi';
  if (c.includes('русск')) return 'food_soup';
  return 'food_pasta';
}

function drinkKey(name, category) {
  const n = name.toLowerCase();
  if (has(n, 'кофе', 'эспрессо', 'капучино', 'латте', 'раф', 'американо', 'мокко', 'макиато', 'кортадо', 'флэт', 'брю')) return 'drink_coffee';
  if (has(n, 'чай', 'матча', 'улун')) return 'drink_tea';
  if (has(n, 'пиво', 'лагер', 'ipa', 'стаут', 'портер', 'эль', 'пшеничн')) return 'drink_beer';
  if (has(n, 'вино', 'просекко', 'шампанск', 'игрист', 'розе', 'сухое')) return 'drink_wine';
  if (has(n, 'глинтвейн', 'грог', 'шоколад')) return 'drink_hotchoc';
  if (has(n, 'лимонад', 'смузи', 'сок', 'морс', 'компот', 'тоник', 'кола', 'молочный')) return 'drink_lemonade';
  if (has(n, 'мохито', 'маргарита', 'негрони', 'апероль', 'космо', 'олд', 'дайкири', 'мартини', 'пина', 'джин', 'виски', 'лонг', 'беллини', 'сангрия', 'мэри')) return 'drink_cocktail';
  const c = (category || '').toLowerCase();
  if (c.includes('кофе')) return 'drink_coffee';
  if (c.includes('чай')) return 'drink_tea';
  if (c.includes('пиво')) return 'drink_beer';
  if (c.includes('вино')) return 'drink_wine';
  if (c.includes('горяч')) return 'drink_hotchoc';
  if (c.includes('безалког')) return 'drink_lemonade';
  return 'drink_cocktail';
}

async function main() {
  const items = await prisma.listing.findMany({
    where: {
      type: { in: ['DISH', 'DRINK'] },
      OR: [{ photoUrl: null }, { photoUrl: { contains: 'picsum' } }],
    },
    select: { id: true, name: true, type: true, category: true },
  });
  let n = 0;
  for (const it of items) {
    const key = it.type === 'DRINK' ? drinkKey(it.name, it.category) : dishKey(it.name, it.category);
    await prisma.listing.update({ where: { id: it.id }, data: { photoUrl: `/api/stock/${key}` } });
    n++;
  }
  console.log(`Привязано фото к ${n} блюдам/напиткам.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
