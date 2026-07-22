// Owner rule (permanent): «Запрещено рекомендовать алкогольные напитки!»
// Alcohol must never appear in ANY recommendation surface — first-taster,
// TasteHero swipes, the rec feed, top lists. It may still exist as a catalog
// entry (a venue really serves it); this module only gates recommendations.
//
// Cyrillic note: JS `\b` does not work on Cyrillic, so word edges are spelled
// out as explicit character classes — same approach as non-standalone.ts.

const WORD_CH = 'а-яёa-z0-9';
const B = `(^|[^${WORD_CH}])`;
const E = `($|[^${WORD_CH}])`;

// Stems, not full words: matching is prefix-based so declensions are covered
// («вино», «вина», «вином»; «настойка», «настойки»).
const ALCOHOL_STEMS = [
  // spirits
  'водк', 'самбук', 'виск', 'ром', 'текил', 'джин', 'ликер', 'ликёр', 'коньяк',
  'бренди', 'абсент', 'вермут', 'мартини', 'граппа', 'чач', 'самогон', 'бурбон',
  'скотч', 'текиль', 'мескаль', 'кальвадос', 'арманьяк', 'шнапс', 'узо', 'ракия',
  'сакэ', 'саке', 'соджу', 'бехеровк', 'егермейстер', 'ягермейстер', 'амаретто',
  'бейлиз', 'куантро', 'трипл сек', 'кампари', 'апероль', 'лимончелло',
  // wine & co
  'вино', 'вина', 'вином', 'шампанск', 'игрист', 'просекко', 'просеко', 'кава',
  'портвейн', 'херес', 'мадер', 'вермут', 'сангри', 'глинтвейн', 'мускат',
  'каберне', 'мерло', 'шардоне', 'совиньон', 'пино', 'рислинг', 'сира', 'шираз',
  'темпранильо', 'санджовезе', 'неббиоло', 'зинфандель', 'мальбек',
  // beer & cider & mead
  'пиво', 'пива', 'пивн', 'эль', 'лагер', 'стаут', 'портер', 'ipa', 'апа',
  'пшеничн', 'сидр', 'медовух', 'бланш', 'вайцен', 'пилзнер', 'пилснер',
  // cocktails (alcoholic by definition)
  'коктейл', 'мохито', 'маргарит', 'дайкири', 'негрони', 'спритц', 'шприц',
  'олд фешн', 'манхэттен', 'космополит', 'кайпиринь', 'пина колад', 'белый русск',
  'кровавая мэри', 'кровавая мери', 'лонг айленд', 'апероль шприц', 'беллини',
  'мимоз', 'сауэр', 'джулеп', 'гимлет', 'дайкири', 'шот', 'шотт',
  // generic markers
  'алкогол', 'крепк напит', 'настойк', 'наливк', 'бальзам',
];

// Short stems are dangerous as prefixes: «ром» would swallow «ромашковый чай» and
// «ромовая баба», «эль» would swallow «эльзасский пирог». These must match as a
// WHOLE word; everything else stays prefix-based to cover declensions.
const EXACT_WORD_STEMS = new Set([
  'ром', 'эль', 'джин', 'кава', 'узо', 'шот', 'шотт', 'сира', 'пино', 'ipa', 'апа',
  'вино', 'вина', 'вином', 'пиво', 'пива', 'мускат', 'бренди', 'мартини', 'граппа',
]);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const prefixStems = ALCOHOL_STEMS.filter((s) => !EXACT_WORD_STEMS.has(s)).map(escape);
const exactStems = [...EXACT_WORD_STEMS].map(escape);

const ALCOHOL_RE = new RegExp(
  `${B}(?:(?:${prefixStems.join('|')})|(?:${exactStems.join('|')})${E})`,
  'i',
);

// «б/а», «безалкогольное», «0.0» — explicitly NON-alcoholic, so a match on the
// drink-family stem above (e.g. "Пиво ... б/а") must NOT count as alcohol.
// No trailing boundary: the word carries declension endings («безалкогольнОЕ»).
const NON_ALCOHOLIC_RE = new RegExp(
  `${B}(?:б/а|бе?залкогольн|non-?alcohol|alcohol[- ]?free|0[.,]0\\s*%?)`,
  'i',
);

/**
 * True when the name denotes an alcoholic drink and must be kept out of
 * recommendations. Non-alcoholic variants ("б/а", "безалкогольное") return false
 * — they are drinkable suggestions, subject only to the branded-drink ban.
 */
export function isAlcohol(name?: string | null, listingType?: string | null): boolean {
  if (!name) return false;
  // dishes cooked with wine/beer are food, not a drink to recommend against
  if (listingType && String(listingType).toUpperCase() === 'RESTAURANT') return false;
  const normalized = name.normalize('NFKC').toLowerCase().replace(/ё/g, 'е');
  if (NON_ALCOHOLIC_RE.test(normalized)) return false;
  return ALCOHOL_RE.test(normalized);
}
