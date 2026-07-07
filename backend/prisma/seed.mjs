// Seeds Moscow listings (restaurants, dishes, drinks) so the feeds and Top-10
// have content from day one — solving the cold-start problem.
// Run: node prisma/seed.mjs  (DATABASE_URL must be set in env)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const img = (slug) =>
  `https://picsum.photos/seed/${encodeURIComponent(slug)}/600/400`;

// [name, description, address, priceLevel, lat, lng] — coords are approximate
// real locations in central Moscow so demo cards show a map point.
const restaurants = [
  ['White Rabbit', 'Современная русская кухня с видом на город', 'Смоленская пл., 3', 4, 55.7494, 37.5829],
  ['Кафе Пушкинъ', 'Классическая русская кухня в усадьбе XIX века', 'Тверской б-р, 26А', 4, 55.7649, 37.6043],
  ['Selfie', 'Авторская кухня от Анатолия Казакова', 'Новинский б-р, 31', 4, 55.7560, 37.5806],
  ['Sahalin', 'Морепродукты и паназиатская кухня', 'Смоленская пл., 8', 4, 55.7480, 37.5835],
  ['Северяне', 'Сезонная кухня на дровах', 'Б. Никитская, 12', 3, 55.7568, 37.6043],
  ['Уголёк', 'Мясо и овощи на открытом огне', 'Б. Никитская, 12', 3, 55.7571, 37.6048],
  ['Grace Bistro', 'Европейское бистро в центре', 'М. Бронная, 24', 3, 55.7625, 37.5950],
  ['Probka на Цветном', 'Итальянская кухня и винотека', 'Цветной б-р, 2', 3, 55.7686, 37.6207],
  ['Pinch', 'Гастробар с сезонным меню', 'Б. Дмитровка, 11', 3, 55.7615, 37.6135],
  ['Loro', 'Средиземноморская кухня', 'Лесная ул., 9', 3, 55.7790, 37.5890],
  ['Big Wine Freaks', 'Винный бар и кухня', 'Б. Дровяной пер., 20', 4, 55.7430, 37.6560],
  ['Техникум', 'Демократичная авторская кухня', 'Б. Дмитровка, 7/5', 2, 55.7605, 37.6128],
  ['Black Market', 'Бургеры и крафт', 'Аптекарский пер., 5', 2, 55.7680, 37.6790],
  ['Saviva', 'Растительная кухня', 'Усачёва ул., 2', 3, 55.7270, 37.5650],
  ['Bourgeois Bohemians', 'Французская пекарня и кафе', 'Б. Козихинский, 12', 2, 55.7620, 37.5950],
  ['Insider', 'Стейки и вино', 'Никольская ул., 10', 3, 55.7575, 37.6230],
  ['Mushrooms', 'Кофе и завтраки весь день', 'Сретенка, 1', 2, 55.7660, 37.6320],
  ['Wine & Crab', 'Краб и вино', 'Страстной б-р, 8А', 4, 55.7660, 37.6080],
  ['Ruski', 'Русская кухня на 354 метрах', 'Пресненская наб., 12', 4, 55.7490, 37.5390],
  ['Modus', 'Средиземноморский ресторан', 'Спиридоньевский пер., 12', 3, 55.7640, 37.5930],
  ['Кузина', 'Кофейня-кондитерская', 'Покровка, 17', 1, 55.7595, 37.6470],
  ['Поехали', 'Грузинская кухня', 'Б. Татарская, 7', 2, 55.7370, 37.6310],
  ['Хачапури', 'Грузинская кухня и вино', 'Б. Дмитровка, 10', 2, 55.7610, 37.6132],
  ['Дshare', 'Паназиатский гастробар', 'Трёхгорный вал, 14', 3, 55.7610, 37.5640],
  ['Niki', 'Греческая кухня', 'Кузнецкий мост, 9', 3, 55.7615, 37.6230],
  ['Avocado Queen', 'Калифорнийская кухня', 'Кутузовский пр-т, 2/1', 3, 55.7460, 37.5670],
  ['Salumeria', 'Итальянская траттория', 'Маросейка, 9/2', 2, 55.7575, 37.6360],
  ['Cutfish', 'Рыбный гастробар', 'Гоголевский б-р, 25', 3, 55.7480, 37.6010],
  ['Mu-Mu', 'Домашняя кухня, столовая', 'Арбат, 45/24', 1, 55.7490, 37.5870],
  ['Воронеж', 'Мясной ресторан и ферма', 'Пречистенка, 4', 4, 55.7445, 37.5985],
  ['Birds', 'Панорамный ресторан', 'ул. Мосфильмовская, 1', 4, 55.7180, 37.5230],
  ['Ателье', 'Французская кухня', 'Б. Грузинская, 69', 3, 55.7780, 37.5800],
];

const dishes = [
  ['Борщ с говядиной', 'Классический борщ со сметаной', 'Супы'],
  ['Пельмени домашние', 'С говядиной и свининой', 'Основные'],
  ['Хачапури по-аджарски', 'Лодочка с яйцом и сыром', 'Выпечка'],
  ['Том Ям', 'Острый тайский суп с креветками', 'Супы'],
  ['Паста Карбонара', 'С гуанчале и пекорино', 'Паста'],
  ['Стейк Рибай', 'Мраморная говядина на гриле', 'Мясо'],
  ['Тартар из говядины', 'С перепелиным желтком', 'Закуски'],
  ['Сырники со сметаной', 'Творожные сырники с ягодным соусом', 'Завтраки'],
  ['Блины с икрой', 'Тонкие блины с красной икрой', 'Завтраки'],
  ['Цезарь с курицей', 'Салат с соусом цезарь', 'Салаты'],
];

const drinks = [
  ['Крафтовый IPA', 'Хмельной американский IPA', 'IPA', 6.5],
  ['Espresso Tonic', 'Эспрессо с тоником и лаймом', 'Кофе', 0],
  ['Раф кофе', 'Сливочный раф с ванилью', 'Кофе', 0],
  ['Глинтвейн', 'Горячее вино со специями', 'Горячие', 9.0],
  ['Aperol Spritz', 'Апероль, просекко, содовая', 'Коктейли', 11.0],
  ['Negroni', 'Джин, кампари, вермут', 'Коктейли', 24.0],
  ['Матча латте', 'Японская матча на молоке', 'Чай', 0],
  ['Лимонад Тархун', 'Домашний лимонад с тархуном', 'Безалкогольные', 0],
];

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’'`"«».,()\-_/]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function rating() {
  // 3.5 .. 5.0 so Top-10 ordering is meaningful
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
}
function reviewCount() {
  return Math.floor(5 + Math.random() * 200);
}

async function main() {
  // Only clear demo data (source = null); leave imported OSM listings intact.
  await prisma.listing.deleteMany({ where: { source: null } });

  const restaurantIds = [];
  for (const [name, description, address, priceLevel, lat, lng] of restaurants) {
    const r = await prisma.listing.create({
      data: {
        type: 'RESTAURANT',
        name,
        description,
        address,
        priceLevel,
        lat,
        lng,
        category: 'Ресторан',
        photoUrl: img('r-' + name),
        hours: 'Mo-Su 10:00-23:00',
        groupKey: norm(name),
        deliveryYandex: 'https://eda.yandex.ru/',
        deliverySamokat: Math.random() < 0.5 ? 'https://samokat.ru/' : null,
        avgRating: rating(),
        reviewCount: reviewCount(),
      },
    });
    restaurantIds.push(r.id);
  }

  const dishIds = [];
  for (const [name, description, category] of dishes) {
    const d = await prisma.listing.create({
      data: {
        type: 'DISH',
        name,
        description,
        category,
        photoUrl: img('d-' + name),
        groupKey: norm(name),
        avgRating: rating(),
        reviewCount: reviewCount(),
      },
    });
    dishIds.push(d.id);
  }

  const drinkIds = [];
  for (const [name, description, category, abv] of drinks) {
    const b = await prisma.listing.create({
      data: {
        type: 'DRINK',
        name,
        description,
        category,
        photoUrl: img('b-' + name),
        groupKey: norm(name),
        avgRating: rating(),
        reviewCount: reviewCount(),
      },
    });
    drinkIds.push(b.id);
  }

  // Give every restaurant a fuller menu: 3–5 dishes + 2–3 drinks (many-to-many).
  const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  for (const venueId of restaurantIds) {
    const items = [
      ...pick(dishIds, 3 + Math.floor(Math.random() * 3)),
      ...pick(drinkIds, 2 + Math.floor(Math.random() * 2)),
    ];
    for (const itemId of items) {
      await prisma.menuLink.create({ data: { venueId, itemId } }).catch(() => {});
    }
  }

  const total = await prisma.listing.count();
  const links = await prisma.menuLink.count();
  console.log(`Seeded ${total} listings and ${links} menu links.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
