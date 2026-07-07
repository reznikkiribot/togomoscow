// Expert tasting templates per category: attribute sliders (1–5) + selectable
// expert fields (grape varieties, coffee types/additives, beer styles, cuts…).
// Stored into Review.attributes (Json) — no schema change.
import type { Listing } from './types';

export interface Attr {
  key: string;
  label: string;
}
export interface Choice {
  key: string;
  label: string;
  options: string[];
  multi?: boolean;
}
export interface Template {
  id: string;
  title: string;
  attrs: Attr[];
  choices: Choice[];
}

// Per-drink flavor profiles (carousel tags). Order matters — more specific names
// (айс-латте, эспрессо-тоник, айс-американо) must be tested before the base ones.
const COFFEE_FLAVORS: [RegExp, string[]][] = [
  [/ристретто|ristretto/, ['Очень крепкий', 'Концентрированный', 'Яркий']],
  [/айс.?латте|ice.?latte/, ['Освежающий', 'Сливочный', 'Лёгкий']],
  [/айс.?американо|ice.?americano/, ['Освежающий', 'Бодрящий', 'Чистый']],
  [/колд.?брю|cold.?brew/, ['Гладкий', 'Освежающий', 'Мягкий', 'Сладковатый']],
  [/эспрессо.?тоник|тоник|tonic/, ['Освежающий', 'Яркий', 'Игристый', 'Бодрящий']],
  [/глясе|глясс/, ['Десертный', 'Сливочный', 'Освежающий']],
  [/турецк|турка/, ['Очень крепкий', 'Плотный', 'Пряный']],
  [/восточ/, ['Насыщенный', 'Пряный', 'Согревающий']],
  [/аэропресс|aeropress/, ['Насыщенный', 'Гладкий', 'Сбалансированный']],
  [/френч.?пресс|french.?press/, ['Плотный', 'Насыщенный', 'Маслянистый']],
  [/пуровер|v60|кемекс|chemex|pour.?over/, ['Яркий', 'Ароматный', 'Чистый', 'Лёгкий']],
  [/фильтр|filter/, ['Лёгкий', 'Чистый', 'Освежающий', 'Яркий']],
  [/флэт.?уайт|flat.?white/, ['Крепкий', 'Бархатистый', 'Насыщенный', 'Сбалансированный']],
  [/капучин|cappuccino/, ['Мягкий', 'Бархатистый', 'Сбалансированный', 'Согревающий']],
  [/латте|latte/, ['Нежный', 'Сливочный', 'Мягкий', 'Комфортный']],
  [/кортадо|cortado/, ['Сбалансированный', 'Гладкий', 'Крепкий']],
  [/макиато|macchiato/, ['Крепкий', 'Выразительный', 'Насыщенный']],
  [/\bраф\b|\braf\b/, ['Сливочный', 'Десертный', 'Нежный', 'Согревающий']],
  [/мокк|мока|mocha|mocca/, ['Шоколадный', 'Десертный', 'Сладкий', 'Насыщенный']],
  [/американо|americano/, ['Лёгкий', 'Питкий', 'Бодрящий', 'Сбалансированный']],
  [/эспрессо|доппио|espresso|doppio/, ['Крепкий', 'Насыщенный', 'Бодрящий', 'Терпкий']],
];
// generic set for any coffee not in the table above
const COFFEE_FLAVORS_DEFAULT = ['Крепкий', 'Насыщенный', 'Сбалансированный', 'Сливочный', 'Ароматный', 'Освежающий', 'Сладкий', 'Горький'];

function coffeeFlavors(name: string): string[] {
  const n = name.toLowerCase();
  for (const [re, tags] of COFFEE_FLAVORS) if (re.test(n)) return tags;
  return COFFEE_FLAVORS_DEFAULT;
}

function coffeeTemplate(name: string): Template {
  return {
    id: 'coffee',
    title: 'Дегустация кофе',
    attrs: [],
    choices: [
      { key: 'flavor', label: 'Профиль вкуса', multi: true, options: coffeeFlavors(name) },
      {
        key: 'milk',
        label: 'Молоко',
        options: ['Обычное', 'Безлактозное', 'Овсяное', 'Миндальное', 'Кокосовое', 'Соевое', 'Без молока'],
      },
      {
        key: 'additives',
        label: 'Добавки',
        multi: true,
        options: [
          'Карамель', 'Солёная карамель', 'Ваниль', 'Шоколад', 'Корица', 'Кокос', 'Лесной орех',
          'Фисташка', 'Мёд', 'Лаванда', 'Маршмеллоу', 'Цитрус', 'Мята', 'Сироп',
        ],
      },
    ],
  };
}

const WINE: Template = {
  id: 'wine',
  title: 'Дегустация вина',
  attrs: [],
  choices: [
    { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Сухое', 'Фруктовое', 'Ягодное', 'Танинное', 'Минеральное', 'Свежее', 'Насыщенное', 'Гладкое', 'Терпкое', 'Цветочное', 'Дубовое', 'Лёгкое'] },
    { key: 'color', label: 'Цвет', options: ['Красное', 'Белое', 'Розовое', 'Игристое', 'Оранжевое'] },
    { key: 'sugar', label: 'Сахар', options: ['Брют', 'Сухое', 'Полусухое', 'Полусладкое', 'Сладкое'] },
    {
      key: 'grape',
      label: 'Сорт винограда',
      multi: true,
      options: [
        // красные
        'Каберне Совиньон', 'Мерло', 'Пино Нуар', 'Сира / Шираз', 'Мальбек', 'Темпранильо',
        'Санджовезе', 'Неббиоло', 'Зинфандель', 'Гренаш', 'Каберне Фран', 'Карменер', 'Барбера',
        'Монтепульчано', 'Примитиво', 'Пинотаж', 'Саперави',
        // белые
        'Шардоне', 'Совиньон Блан', 'Рислинг', 'Пино Гриджо', 'Пино Гри', 'Гевюрцтраминер',
        'Вионье', 'Мускат', 'Семильон', 'Шенен Блан', 'Альбариньо', 'Вердехо', 'Гарганега',
        'Глера', 'Треббьяно', 'Ркацители', 'Киси', 'Мцване',
      ],
    },
  ],
};

const BEER: Template = {
  id: 'beer',
  title: 'Дегустация пива',
  attrs: [], // beer keeps just the overall rating + serving/flavor tags (Untappd-style)
  choices: [
    {
      key: 'serving',
      label: 'Способ подачи',
      options: ['Разливное', 'Бутылка', 'Банка', 'Дегустационный'],
    },
    {
      key: 'flavor',
      label: 'Профиль вкуса',
      multi: true,
      // Untappd flavor profile, translated: light bodied, smooth, clean, sweet, warm
      options: ['Лёгкотелое', 'Мягкое', 'Чистое', 'Сладкое', 'Тёплое', 'С горчинкой'],
    },
  ],
};

const STEAK: Template = {
  id: 'steak',
  title: 'Дегустация стейка',
  attrs: [],
  choices: [
    { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Сочный', 'Мягкий', 'Нежный', 'Дымный', 'Насыщенный', 'Пряный', 'Жирный', 'С корочкой', 'Мраморный', 'Сбалансированный'] },
    {
      key: 'cut',
      label: 'Отруб',
      options: [
        'Рибай', 'Стриплойн (Нью-Йорк)', 'Филе-миньон', 'Тибон', 'Портерхаус', 'Фланк',
        'Скёрт (мачете)', 'Пиканья', 'Чак-ролл', 'Денвер', 'Топ-блейд', 'Вырезка', 'Рамп',
      ],
    },
    {
      key: 'doneness',
      label: 'Прожарка',
      options: ['Blue', 'Rare', 'Medium rare', 'Medium', 'Medium well', 'Well done'],
    },
  ],
};

// tag-only template builder (coffee/beer style: overall rating + selectable tags, no 1–5 sliders)
const tagTpl = (id: string, title: string, choices: Choice[]): Template => ({ id, title, attrs: [], choices });

const DISH: Template = tagTpl('dish', 'Дегустация блюда', [
  {
    key: 'flavor',
    label: 'Профиль вкуса',
    multi: true,
    options: [
      'Острое', 'Сладкое', 'Солёное', 'Кислое', 'Сытное', 'Пряное', 'Жирное', 'Лёгкое',
      'Ароматное', 'Свежее', 'Насыщенное', 'Сбалансированное', 'Дымное', 'Копчёное', 'Пикантное',
    ],
  },
  {
    key: 'texture',
    label: 'Текстура',
    multi: true,
    options: ['Нежное', 'Сочное', 'Хрустящее', 'Кремовое', 'Тает во рту', 'Плотное', 'Воздушное', 'Тягучее'],
  },
]);

const DRINK: Template = tagTpl('drink', 'Дегустация напитка', [
  {
    key: 'flavor',
    label: 'Профиль вкуса',
    multi: true,
    options: ['Освежающий', 'Сладкий', 'Кислый', 'Крепкий', 'Ароматный', 'Насыщенный', 'Лёгкий', 'Сбалансированный', 'Фруктовый', 'Терпкий'],
  },
]);

const PLACE: Template = {
  id: 'place',
  title: 'Оценка заведения',
  attrs: [
    { key: 'food', label: 'Кухня' },
    { key: 'service', label: 'Сервис' },
    { key: 'atmosphere', label: 'Атмосфера' },
    { key: 'value', label: 'Цена / качество' },
    { key: 'reorder', label: 'Вернулся бы' },
  ],
  choices: [
    {
      key: 'venueTags',
      label: 'Что понравилось',
      multi: true,
      options: [
        'Уютно', 'Атмосферно', 'Быстрый сервис', 'Вежливые', 'Чисто', 'Вкусно', 'Красиво',
        'Хорошая музыка', 'Тихо', 'Можно с ноутбуком', 'Есть розетки', 'Wi-Fi', 'Веранда',
        'Можно с детьми', 'Можно с собакой', 'Большие порции', 'Доступные цены',
      ],
    },
  ],
};

// flat key→label for rendering stored ratings in review cards
export const ATTR_LABEL: Record<string, string> = {
  aroma: 'Аромат', acidity: 'Кислотность', balance: 'Баланс', temperature: 'Температура',
  value: 'Цена / качество', taste: 'Вкус', finish: 'Послевкусие', bitterness: 'Горечь',
  juiciness: 'Сочность', tenderness: 'Мягкость', doneness_quality: 'Прожарка', side: 'Гарнир',
  presentation: 'Подача', portion: 'Порция', reorder: 'Повторил бы', food: 'Кухня',
  service: 'Сервис', atmosphere: 'Атмосфера',
};

// Derive a beer's style/type from its name (or a known brand). Returns null when
// it can't be determined. JS \b is ASCII-only, so short Cyrillic words use lookarounds.
const beerB = (w: string) => `(?<![а-яёa-z])(?:${w})(?![а-яёa-z])`;
const BEER_STYLES: [RegExp, string][] = [
  [/ipa|ипа|нейпа|neipa/i, 'IPA'],
  [/стаут|stout/i, 'Стаут'],
  [/портер|porter/i, 'Портер'],
  [/пшеничн|вайс|weiss|weizen|hefe|\bwit\b|бланш|blanche|витбир/i, 'Пшеничное'],
  [/пилзнер|пилснер|pilsner|pils/i, 'Пилснер'],
  [/сидр|cider/i, 'Сидр'],
  [new RegExp(beerB('бок') + '|bock', 'i'), 'Бок'],
  [/дункель|dunkel|тёмное|темное|тёмный|темный/i, 'Тёмное'],
  [/лагер|lager|светлое|светлый/i, 'Лагер'],
  [new RegExp(beerB('эль') + '|пейл|pale|' + beerB('ale'), 'i'), 'Эль'],
  [/нефильтр/i, 'Нефильтрованное'],
];
const BEER_BRANDS: [RegExp, string][] = [
  [/kozel|козел|козёл/i, 'Тёмный лагер'],
  [/guinness|гиннес/i, 'Стаут'],
  [/hoegaarden|хугарден/i, 'Пшеничное'],
  [/corona|peroni|перони|nastro|балтик|velkopopov|велкопопов|stella|стелла|heineken|хайнекен|bud\b|клинское|жигул/i, 'Лагер'],
];
export function beerStyle(name: string): string | null {
  const n = (name ?? '').toLowerCase();
  for (const [re, s] of BEER_BRANDS) if (re.test(n)) return s;
  for (const [re, s] of BEER_STYLES) if (re.test(n)) return s;
  return null;
}

// per-category tasting profiles — coffee-style (overall rating + selectable tags, no 1–5 sliders)
const PIZZA = tagTpl('pizza', 'Дегустация пиццы', [
  { key: 'dough', label: 'Тесто', multi: true, options: ['Тонкое', 'Пышное', 'Хрустящее', 'Неаполитанское', 'Римское', 'На дровах', 'Пышный бортик'] },
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Сырное', 'Острое', 'Пикантное', 'Сытное', 'Ароматное', 'Мясное', 'Овощное', 'Пряное', 'Жирное', 'Томатное', 'Сбалансированное'] },
]);
const BURGER = tagTpl('burger', 'Дегустация бургера', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Сочный', 'Сытный', 'Острый', 'Дымный', 'Сырный', 'Пикантный', 'Жирный', 'Мясной', 'Сбалансированный', 'Пряный'] },
  { key: 'bun', label: 'Булочка', options: ['Бриошь', 'Классическая', 'Чёрная', 'Кунжутная', 'Цельнозерновая'] },
  { key: 'doneness', label: 'Прожарка котлеты', options: ['Rare', 'Medium', 'Well done', 'Сочная', 'Прожаренная'] },
]);
const SUSHI = tagTpl('sushi', 'Дегустация суши / роллов', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Свежее', 'Нежное', 'Острое (васаби)', 'Сливочное', 'Пикантное', 'Рыбное', 'Сбалансированное', 'Копчёное', 'Пряное'] },
  { key: 'sauce', label: 'Соус', multi: true, options: ['Унаги', 'Спайси', 'Соевый', 'Ореховый', 'Терияки', 'Без соуса'] },
]);
const PASTA = tagTpl('pasta', 'Дегустация пасты', [
  { key: 'sauce', label: 'Соус', options: ['Сливочный', 'Томатный', 'Песто', 'Карбонара', 'Болоньезе', 'Масляный', 'Сырный', '4 сыра'] },
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Сливочный', 'Насыщенный', 'Лёгкий', 'Пряный', 'Сырный', 'Ароматный', 'Сбалансированный', 'Пикантный'] },
  { key: 'doneness', label: 'Готовность', options: ['Аль денте', 'Мягкая'] },
]);
const SOUP = tagTpl('soup', 'Дегустация супа', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Наваристый', 'Лёгкий', 'Острый', 'Пряный', 'Кислый', 'Согревающий', 'Сливочный', 'Сбалансированный', 'Ароматный', 'Сытный'] },
  { key: 'serving', label: 'Подача', options: ['Горячий', 'Холодный', 'С хлебом', 'Со сметаной'] },
]);
const SALAD = tagTpl('salad', 'Дегустация салата', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Свежий', 'Хрустящий', 'Лёгкий', 'Сытный', 'Пикантный', 'Кислый', 'Сливочный', 'Пряный', 'Сбалансированный'] },
  { key: 'dressing', label: 'Заправка', options: ['Оливковое масло', 'Цезарь', 'Йогуртовая', 'Бальзамик', 'Ореховая', 'Без заправки'] },
]);
const DESSERT = tagTpl('dessert', 'Дегустация десерта', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Сладкий', 'Нежный', 'Шоколадный', 'Кремовый', 'Воздушный', 'Ягодный', 'Тает во рту', 'Насыщенный', 'Ореховый', 'Цитрусовый', 'Карамельный'] },
  { key: 'sweetness', label: 'Сладость', options: ['В меру сладкий', 'Очень сладкий', 'Не приторный'] },
]);
const TEA = tagTpl('tea', 'Дегустация чая', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Свежий', 'Ароматный', 'Терпкий', 'Мягкий', 'Травяной', 'Цветочный', 'Пряный', 'Освежающий', 'Согревающий', 'Фруктовый'] },
  { key: 'strength', label: 'Крепость', options: ['Крепкий', 'Средний', 'Лёгкий'] },
  { key: 'additives', label: 'Добавки', multi: true, options: ['Лимон', 'Мёд', 'Мята', 'Имбирь', 'Молоко', 'Без добавок'] },
]);
const COCKTAIL = tagTpl('cocktail', 'Дегустация коктейля', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Освежающий', 'Крепкий', 'Сладкий', 'Кислый', 'Горький', 'Фруктовый', 'Пряный', 'Ягодный', 'Сбалансированный', 'Цитрусовый'] },
  { key: 'base', label: 'Основа', options: ['Джин', 'Ром', 'Водка', 'Текила', 'Виски', 'Ликёр', 'Без алкоголя'] },
]);
const SOFT = tagTpl('soft', 'Дегустация напитка', [
  { key: 'flavor', label: 'Профиль вкуса', multi: true, options: ['Освежающий', 'Сладкий', 'Кислый', 'Фруктовый', 'Ягодный', 'Цитрусовый', 'Мятный', 'Газированный', 'Сбалансированный', 'Насыщенный'] },
]);

export function templateFor(listing: Listing): Template {
  // a VENUE is always rated as a place (atmosphere/service/etc.), never by a dish/drink
  // template — "Кофейня" as a category contains "кофе", which used to mis-trigger the
  // coffee tasting form on the cafe itself.
  if (listing.type === 'RESTAURANT') return PLACE;
  const c = (listing.category ?? '').toLowerCase();
  const n = (listing.name ?? '').toLowerCase();
  const t = `${c} ${n}`;
  // drinks (checked before food so "чай"/"кофе" etc. win over generic)
  if (/кофе|эспрессо|espresso|латте|latte|капучин|cappuccino|американо|макиато|мокко|mocha|(?<![а-яё])раф|\braf\b/.test(t))
    return coffeeTemplate(listing.name ?? '');
  if (/(?<![а-яё])ча[йёеюя]|матч[аеую]|\btea\b|matcha|улун|пуэр/.test(t)) return TEA;
  if (/вино|wine|шампан|игрист|просекко|prosecco|мерло|каберне|шардоне|совиньон/.test(t)) return WINE;
  if (/пиво|beer|лагер|lager|\bэль\b|\bale\b|\bipa\b|ипа|стаут|stout|портер|porter|сидр/.test(t)) return BEER;
  if (/коктейл|cocktail|мохито|негрони|маргарит|апероль|spritz|виски|водк|\bджин\b|\bром\b|текил|коньяк|ликёр|ликер/.test(t)) return COCKTAIL;
  if (/лимонад|lemonade|смузи|smoothie|(?<![а-яё])сок(?![а-яё])|juice|фреш|морс|компот|тоник|milkshake|милкшейк|газиров/.test(t)) return SOFT;
  // food
  if (/пицц|pizza/.test(t)) return PIZZA;
  if (/бургер|гамбургер|чизбургер|burger|сэндвич|сендвич|бутерброд/.test(t)) return BURGER;
  if (/суши|сашими|нигир|sushi|sashimi|(?<![а-яё])ролл|\broll\b|маки/.test(t)) return SUSHI;
  if (/паст[аыуе]|спагетти|лапш|фетучин|pasta|spaghetti|noodl|рамен|удон/.test(t)) return PASTA;
  if (/(?<![а-яё])суп(?![а-яё])|бульон|soup|борщ|солянк|харчо|том.?ям|рамен/.test(t)) return SOUP;
  if (/салат|salad|(?<![а-яё])боул(?![а-яё])|\bbowl\b|поке|poke/.test(t)) return SALAD;
  if (/торт|пирожн|десерт|чизкейк|cheesecake|тирамису|tiramisu|маффин|круассан|мороже|ice ?cream|джелато|штрудель|эклер|панна|донат|пончик|вафл/.test(t)) return DESSERT;
  if (/стейк|steak|рибай|ribeye|миньон|антрекот|томагавк/.test(t)) return STEAK;
  if (listing.type === 'DRINK') return DRINK;
  return DISH;
}
