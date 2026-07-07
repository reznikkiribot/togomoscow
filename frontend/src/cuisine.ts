// Maps OSM cuisine tokens to readable Russian labels for card tags.
const CUISINE_RU: Record<string, string> = {
  italian: 'Итальянская',
  pizza: 'Пицца',
  georgian: 'Грузинская',
  japanese: 'Японская',
  sushi: 'Суши',
  chinese: 'Китайская',
  asian: 'Азиатская',
  american: 'Американская',
  burger: 'Бургеры',
  coffee_shop: 'Кофейня',
  coffee: 'Кофе',
  cafe: 'Кафе',
  russian: 'Русская',
  seafood: 'Морепродукты',
  vegetarian: 'Вегетарианская',
  vegan: 'Веганская',
  french: 'Французская',
  mexican: 'Мексиканская',
  indian: 'Индийская',
  thai: 'Тайская',
  korean: 'Корейская',
  kebab: 'Кебаб',
  bbq: 'Гриль',
  barbecue: 'Гриль',
  steak_house: 'Стейк-хаус',
  bar: 'Бар',
  pub: 'Паб',
  wine: 'Винный бар',
  beer: 'Пивной бар',
  breakfast: 'Завтраки',
  dessert: 'Десерты',
  bakery: 'Пекарня',
  ice_cream: 'Мороженое',
  fast_food: 'Фастфуд',
  regional: 'Региональная',
  international: 'Интернациональная',
  european: 'Европейская',
  mediterranean: 'Средиземноморская',
  uzbek: 'Узбекская',
  armenian: 'Армянская',
  turkish: 'Турецкая',
  ramen: 'Рамен',
  noodle: 'Лапша',
  fish: 'Рыба',
  chicken: 'Курица',
  sandwich: 'Сэндвичи',
  cake: 'Торты',
  dumplings: 'Пельмени',
  pancake: 'Блины',
  donut: 'Пончики',
  tea: 'Чай',
  juice: 'Соки',
  salad: 'Салаты',
  soup: 'Супы',
  grill: 'Гриль',
  pasta: 'Паста',
  crepe: 'Блины',
  pie: 'Пироги',
  spanish: 'Испанская',
  greek: 'Греческая',
  vietnamese: 'Вьетнамская',
  german: 'Немецкая',
  caucasian: 'Кавказская',
  azerbaijani: 'Азербайджанская',
};

function labelFor(token: string): string {
  const t = token.trim().toLowerCase().replace(/\s+/g, '_');
  if (CUISINE_RU[t]) return CUISINE_RU[t];
  // fall back to a capitalized version of the raw token
  const raw = token.trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Readable RU label → OSM cuisine token (reverse of CUISINE_RU), for tag filters. */
const LABEL_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(CUISINE_RU).map(([token, label]) => [label.toLowerCase(), token]),
);
export function cuisineToken(label: string): string | null {
  return LABEL_TO_TOKEN[label.trim().toLowerCase()] ?? null;
}

/** Up to `max` readable cuisine tags from a venue's cuisine string. */
export function cuisineTags(cuisine?: string | null, max = 3): string[] {
  if (!cuisine) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of cuisine.split(/[;,]/)) {
    if (!part.trim()) continue;
    const label = labelFor(part);
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
    if (out.length >= max) break;
  }
  return out;
}
