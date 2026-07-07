// OSM cuisine token → readable Russian label (mirror of frontend/src/cuisine.ts).
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
  azerbaijani: 'Азербайджанская',
  turkish: 'Турецкая',
  caucasian: 'Кавказская',
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
  pie: 'Пироги',
  spanish: 'Испанская',
  greek: 'Греческая',
  vietnamese: 'Вьетнамская',
  german: 'Немецкая',
};

export function cuisineLabel(token: string): string {
  const t = token.trim().toLowerCase().replace(/\s+/g, '_');
  if (CUISINE_RU[t]) return CUISINE_RU[t];
  const raw = token.trim().replace(/_/g, ' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// readable RU label → OSM cuisine token (e.g. "Бургеры" → "burger"), for tag search
const LABEL_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(CUISINE_RU).map(([token, label]) => [label.toLowerCase(), token]),
);
export function cuisineToken(label: string): string | null {
  return LABEL_TO_TOKEN[label.trim().toLowerCase()] ?? null;
}
