// Curated stock photos used as ILLUSTRATIVE placeholders for venues that have no
// real user photos yet. All are licensed for commercial use without attribution
// (Unsplash License / Pexels License / Pixabay Content License). They are served
// through our own /api/stock/:id proxy so the client only talks to our domain and
// is never blocked by hotlink/region restrictions. Each venue's gallery replaces
// these automatically once real check-in / review photos arrive.
export const STOCK: Record<string, string> = {
  rest_1: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=70',
  rest_2: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=70',
  rest_3: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=70',
  rest_4: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&w=800',
  rest_5: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&w=800',
  dish_1: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=70',
  dish_2: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=70',
  dish_3: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=70',
  dish_4: 'https://cdn.pixabay.com/photo/2017/01/26/02/06/platter-2009590_640.jpg',
  dish_5: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&w=800',
  drink_1: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=70',
  drink_2: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=70',
  drink_3: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=70',
  bar_1: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=70',
  bar_2: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=70',
  bar_3: 'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&w=800',

  // real dish/drink photos by type (commercial-licensed: Unsplash/Pexels/Pixabay)
  food_soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=70',
  food_pelmeni: 'https://images.pexels.com/photos/4079520/pexels-photo-4079520.jpeg?auto=compress&w=600',
  food_sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=70',
  food_pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=70',
  food_pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=70',
  food_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=70',
  food_steak: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=70',
  food_kebab: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=70',
  food_salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=70',
  food_cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=70',
  food_icecream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=70',
  food_breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=70',
  food_seafood: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=70',
  food_fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=70',
  food_khachapuri: 'https://images.pexels.com/photos/5640033/pexels-photo-5640033.jpeg?auto=compress&w=600',
  food_bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=70',
  drink_coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=70',
  drink_tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=70',
  drink_cocktail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=70',
  drink_beer: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=70',
  // beer «красиво наливающееся» variations (commercial-free, Unsplash)
  drink_beer2: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&q=70',
  drink_beer3: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&q=70',
  drink_beer4: 'https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=600&q=70',
  drink_wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=70',
  drink_wine2: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=70',
  drink_wine3: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=70',
  drink_lemonade: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=600&q=70',
  drink_hotchoc: 'https://images.unsplash.com/photo-1542990253-a781e04c0082?w=600&q=70',
};

const POOLS: Record<string, string[]> = {
  restaurant: ['rest_1', 'rest_2', 'rest_3', 'rest_4', 'rest_5', 'dish_1', 'dish_3'],
  beer: ['drink_beer', 'drink_beer2', 'drink_beer3', 'drink_beer4'],
  wine: ['drink_wine', 'drink_wine2', 'drink_wine3'],
  bar: ['bar_1', 'bar_2', 'bar_3', 'drink_1', 'drink_3'],
  dish: ['dish_1', 'dish_2', 'dish_3', 'dish_4', 'dish_5'],
  drink: ['drink_1', 'drink_2', 'drink_3', 'bar_1'],
};

// Specific stock by dish/drink KIND, detected from the item's name + category. This
// keeps a burger from getting a generic-salad placeholder and a tea from getting a
// food-bowl one — the old version only looked at the (often generic "Блюдо") category.
const FOOD_MAP: [RegExp, string][] = [
  [/бургер|гамбургер|чизбургер|burger|сэндвич|сендвич|бутерброд/i, 'food_burger'],
  [/шаурм|шаверм|shawarma|донер|денер|kebab|кебаб|шашлык|люля/i, 'food_kebab'],
  [/пицц|pizza/i, 'food_pizza'],
  [/суши|сашими|нигир|sushi|sashimi|nigiri|(?<![а-яё])ролл|\broll\b|маки/i, 'food_sushi'],
  [/паст[аыуе]|спагетти|лапш|фетучин|pasta|spaghetti|noodl|рамен|ramen|удон/i, 'food_pasta'],
  [/(?<![а-яё])суп(?![а-яё])|бульон|soup|борщ|солянк|харчо|том.?ям/i, 'food_soup'],
  [/пельмен|вареник|манты|хинкали|dumpling|гёдза|позы/i, 'food_pelmeni'],
  [/хачапури|khachapuri|хинкал|аджарул/i, 'food_khachapuri'],
  [/торт|пирожн|чизкейк|cheesecake|десерт|\bcake\b|dessert|тирамису|tiramisu|маффин|muffin|круассан|croissant|донат|donut|пончик|вафл|waffle|штрудель/i, 'food_cake'],
  [/мороженое|ice ?cream|джелато|gelato|сорбет|sorbet/i, 'food_icecream'],
  [/рыб|лосос|форел|тунец|креветк|краб|fish|salmon|trout|tuna|shrimp|seafood|морепродукт|устриц|мидии/i, 'food_seafood'],
  [/(?<![а-яё])фри(?![а-яё])|fries|картош.*фри/i, 'food_fries'],
  [/стейк|steak|рибай|ribeye|миньон|говядин|beef|антрекот|томагавк/i, 'food_steak'],
  [/салат|salad|(?<![а-яё])боул(?![а-яё])|\bbowl\b|поке|poke/i, 'food_salad'],
  [/завтрак|омлет|яичниц|сырник|(?<![а-яё])блин|оладь|панкейк|pancake|каша|гранол|breakfast/i, 'food_breakfast'],
  [/хлеб|булочк|багет|bread|тост(?![а-яё])/i, 'food_bread'],
];
const DRINK_MAP: [RegExp, string][] = [
  [/пив|beer|ipa|лагер|эль|стаут|портер|пшенич/i, 'drink_beer'],
  [/вино|wine|шампан|игрист|просекко|prosecco|розе|saperavi|blanc|noir|мерло|каберне|шардоне/i, 'drink_wine'],
  [/кофе|coffee|эспрессо|espresso|латте|latte|капучино|cappuccino|(?<![а-яё])раф|американо|мокко|mocha|макиато|флэт|flat white|бамбл/i, 'drink_coffee'],
  [/коктейл|cocktail|мохито|mojito|негрони|маргарит|margarita|апероль|spritz|спритц/i, 'drink_cocktail'],
  [/(?<![а-яё])ча[йёеюя]|\btea\b|матч[аеую]|matcha/i, 'drink_tea'],
  [/какао|горячий шоколад|hot chocolate/i, 'drink_hotchoc'],
  [/лимонад|lemonade|морс|компот|тоник|tonic|смузи|smoothie|(?<![а-яё])сок(?![а-яё])|juice|фреш|шейк|milkshake/i, 'drink_lemonade'],
];

/** Pick 2–4 placeholder keys, deterministically per venue (stable across reloads). */
export function placeholderKeys(
  type: string,
  category: string | null | undefined,
  name: string | null | undefined,
  seed: string,
  n = 3,
): string[] {
  let pool = POOLS.restaurant;
  const text = `${category ?? ''} ${name ?? ''}`;
  const findIn = (map: [RegExp, string][]) => {
    for (const [re, key] of map) if (re.test(text)) return key;
    return null;
  };
  if (type === 'DRINK') {
    // beer/wine BRANDS get a rotating pool (owner: no AI for beer/wine, use nice
    // stock — «красиво наливающееся пиво и разные его вариации»)
    if (/пив|beer|ipa|лагер|эль|стаут|портер|пшенич|kozel|козел/i.test(text)) pool = POOLS.beer;
    else if (/вино|wine|шампан|игрист|просекко|prosecco|розе|мерло|каберне|шардоне|фанагор|саперави/i.test(text)) pool = POOLS.wine;
    else {
      // name+category aware: tea→tea, coffee→coffee… (fall back to a food kind for
      // the odd drink miscategorised, then a generic drink)
      const k = findIn(DRINK_MAP) ?? findIn(FOOD_MAP);
      if (k) return [k];
      pool = POOLS.drink;
    }
  } else if (type === 'DISH') {
    // burgers, pizza, sushi… detected from the name even when category is just "Блюдо";
    // teas/coffees miscategorised as DISH still get the right drink stock
    const k = findIn(FOOD_MAP) ?? findIn(DRINK_MAP);
    if (k) return [k];
    pool = POOLS.dish;
  } else if (category && /бар|паб|pub|bar/i.test(category)) pool = POOLS.bar;

  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const start = h % pool.length;
  const count = Math.min(n, pool.length);
  const keys: string[] = [];
  for (let i = 0; i < count; i++) keys.push(pool[(start + i) % pool.length]);
  return keys;
}
