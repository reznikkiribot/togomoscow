import brandData from './branded-beverages.json';

// One policy boundary keeps import-time and discovery-time brand decisions aligned.

const WORD_CH = 'a-zа-яё0-9';
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Canonical list used by imports and every discovery surface. Keep aliases in
 * branded-beverages.json so menu scripts and the Nest application cannot drift.
 */
export const BRANDED_BEVERAGE_ALIASES = [...new Set(brandData.aliases.map((alias) => alias.trim()).filter(Boolean))];

// Prisma `contains` has no word boundaries. One- and two-character aliases
// (notably «Я» and J7) are enforced only by the exact JS post-filter below.
const UNSAFE_SQL_SUBSTRINGS = new Set([
  'любимый', 'street', 'fancy', 'drive', 'flash', 'monster', 'burn', 'mio', 'black', 'я',
]);
export const BRANDED_BEVERAGE_CONTAINS = BRANDED_BEVERAGE_ALIASES.filter(
  (alias) => alias.length >= 3 && !UNSAFE_SQL_SUBSTRINGS.has(alias.toLowerCase()),
);

const BRANDED_BEVERAGE_RE = new RegExp(
  `(^|[^${WORD_CH}])(?:${BRANDED_BEVERAGE_ALIASES
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')})($|[^${WORD_CH}])`,
  'i',
);

const FOOD_CONTEXT_RE = /бургер|ребр|стейк|спагетти|паст[аы]|пицц|оливье|салат|суп|лапш|ролл|суши|крыл|куриц|цыпл|говядин|свинин|кревет|десерт|торт|пирог|сэндвич|сендвич|хот.?дог|наггетс|картоф/i;

export function isBrandedBeverage(name?: string | null, listingType?: string | null): boolean {
  if (!name) return false;
  const normalized = name.normalize('NFKC').toLowerCase();
  // OCR/menu feeds occasionally mix Cyrillic lookalikes into Latin brands
  // (for example Riсh with Cyrillic «с»).
  const latinLookalikes = normalized.replace(/[аеорсух]/g, (char) => ({
    а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', у: 'y', х: 'x',
  })[char] ?? char);
  if (!BRANDED_BEVERAGE_RE.test(normalized) && !BRANDED_BEVERAGE_RE.test(latinLookalikes)) return false;
  // Some imported packaged drinks were incorrectly classified as DISH, so a
  // type check alone is insufficient. Only preserve a DISH when its name has a
  // clear food noun (e.g. «Свиные рёбра Jack Daniel's»).
  return listingType !== 'DISH' || !FOOD_CONTEXT_RE.test(name);
}
