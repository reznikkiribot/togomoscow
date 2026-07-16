// PERMANENT ban-list of NON-STANDALONE positions (owner rule, 16.07.2026):
// sauces, single ingredients, toppings, sides, service items — things you order
// WITH a dish, never review on their own. A card matching this list must never
// appear on any discovery surface (first-taster, rate pool, recsys, feed recs).
// JS \b does not work with Cyrillic — boundaries are explicit char classes.
const B = '(^|[^а-яёa-z0-9])'; // left word boundary
const E = '($|[^а-яёa-z0-9])'; // right word boundary

export const NON_STANDALONE_RE = new RegExp(
  [
    // ── соусы, дипы, заправки, маринады. «Соус» банится только как главное
    //    слово (начало или именительный конец) — «паста в сливочном соусе» жива
    `^соус${E}`, `${B}соус\\.?\\)?$`, 'кетчуп', 'майонез', 'горчиц', 'васаби',
    'аджик', 'ткемали', 'сацебели', 'наршараб', 'заправк', `${B}дип${E}`,
    `^маринад${E}`, `^песто${E}`, `^айоли${E}`, 'бешамель',
    // ── одиночные ингредиенты и добавки
    'халапеньо', 'халапенью', 'каперс', 'маслин', 'оливк', `${B}лимон${E}`,
    `${B}лайм${E}`, `${B}имбирь${E}`, 'имбирь маринован', 'маринованный имбирь',
    `${B}зелень${E}`, `${B}лук${E}`, `${B}чеснок${E}`, `${B}укроп${E}`,
    `${B}петрушк`, `${B}базилик${E}`, `${B}руккола${E}`, `${B}авокадо${E}`,
    `${B}яйцо${E}`, `${B}бекон${E}`, `^пармезан${E}`, `${B}сыр${E}`,
    // ── сиропы, топпинги, сладкие добавки
    'сироп', 'топпинг', 'посыпк', `${B}джем${E}`, 'варень', 'конфитюр',
    `${B}мёд${E}`, `${B}мед${E}`, 'сгущёнк', 'сгущенк', `карамель${E}`,
    // ── молочные добавки к кофе/чаю
    `${B}молоко${E}`, `${B}сливки${E}`, `${B}сметан`, 'альтернативное молоко',
    // ── хлеб и сопровождение
    `${B}хлеб${E}`, `${B}хлебц`, 'лаваш', 'гренк', 'сухарик', `багет${E}`,
    `фокачча${E}`, `${B}пита${E}`, `чиабатта${E}`, 'крутон',
    // ── гарниры и стороны
    'гарнир', `${B}рис${E}`, 'картофель отварн', `(?<![а-яё-])пюре${E}`,
    // ── порционные модификаторы и сервис
    `${B}порция${E}`, 'добавка', `${B}допы?${E}`, `${B}лёд${E}`, `${B}лед${E}`,
    `${B}сахар${E}`, 'приборы', 'упаковк', `${B}пакет${E}`, 'стаканчик пуст',
    // ── специи
    'приправ', `${B}специи${E}`, `${B}соль${E}`, `${B}перец${E}`,
  ].join('|'),
  'i',
);

/** true → the position is an add-on/ingredient, never a standalone card */
export function isNonStandalone(name?: string | null): boolean {
  if (!name) return false;
  return NON_STANDALONE_RE.test(name.toLowerCase());
}

/** Substrings safe for a Prisma `contains` SQL pre-filter (no boundaries needed).
 *  The JS post-filter above stays the source of truth. */
export const NON_STANDALONE_CONTAINS = [
  'кетчуп', 'майонез', 'горчиц', 'васаби', 'аджик', 'ткемали',
  'сацебели', 'заправк', 'маринад', 'халапеньо', 'халапенью', 'сироп',
  'топпинг', 'посыпк', 'варень', 'сгущёнк', 'сгущенк', 'лаваш', 'гренк',
  'сухарик', 'гарнир', 'приправ', 'приборы', 'упаковк', 'добавка',
];
