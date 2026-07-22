// PERMANENT ban-list of NON-STANDALONE positions (owner rule, 16.07.2026):
// sauces, single ingredients, toppings, sides, service items — things you order
// WITH a dish, never review on their own. A card matching this list must never
// appear on any discovery surface (first-taster, rate pool, recsys, feed recs).
// JS \b does not work with Cyrillic — boundaries are explicit char classes.
const B = '(^|[^а-яёa-z0-9])'; // left word boundary
const E = '($|[^а-яёa-z0-9])'; // right word boundary

export const NON_STANDALONE_RE = new RegExp(
  [
    // ── sauces and dips. Anchors matter: «креветки васаби» and «паста в
    //    сливочном соусе» are dishes, while «Васаби» and «Шашлычный соус» are not.
    `^соус${E}`, `${B}соус\\.?\\)?$`,
    `^(?:кетчуп|майонез|горчица|васаби|аджика|ткемали|сацебели|наршараб)(?:${E}.*)?$`,
    `^заправк`, `^дип${E}`, `^маринад${E}`, `^(?:песто|айоли|бешамель)(?:${E}.*)?$`,
    // ── single ingredients and pizza/bowl modifiers. Never match an ingredient
    //    merely because it occurs inside a complete dish name.
    `^(?:маринованн[а-яё]*\\s+)?(?:халапеньо|халапенью|каперсы?|маслины?|оливки?|лимон|лайм|имбирь|зелень|лук|чеснок|укроп|петрушка|базилик|руккола|авокадо|яйцо|бекон|пармезан|сыр|(?:грецкий\\s+)?орех)(?:\\s+(?:маринованн[а-яё]*|жарен[а-яё]*|красн[а-яё]*|говяж[а-яё]*|моцарелла|чеддер|реджанито|d\\d+|дополнительно)){0,3}$`,
    // ── syrups, toppings and sweet add-ons
    `^(?:сироп|топпинг|посыпка|джем|варенье|конфитюр|мёд|мед|сгущёнка|сгущенка|карамель)(?:${E}.*)?$`,
    // ── dairy add-ons to coffee/tea
    `^(?:(?:альтернативное|арахисовое|кокосовое|овсяное|миндальное)\\s+)?(?:молоко|сливки|сметана)(?:\\s+\\d+(?:[.,]\\d+)?%?)?$`,
    // ── bread served as accompaniment; filled/toasted dishes stay eligible
    `^хлеб${E}`, `^хлебц`, `^лаваш${E}`, `^(?:бородинские|чесночные|ржаные)?\\s*гренки(?:${E}.*)?$`,
    `^сухарик`, `^багет${E}`, `^фокачча(?:$|\\s+с\\s+(?:розмарином|томатами|прованскими травами)$)`,
    `^пита${E}`, `^чиабатта${E}`, `^крутоны?${E}`,
    // ── standalone sides, not complete dishes that happen to mention a side
    `^гарнир${E}`, `^(?:(?:дикий|отварной|японский)\\s+)?рис(?:\\s+(?:ташкент|хаэнуки))?$`,
    `^(?:(?:картофельное|двойное)\\s+)?пюре(?:\\s+картофельное)?$`, `^картофель отварн`,
    // ── portion modifiers and service
    `^порция${E}`, `^добавка${E}`, `^допы?${E}`, `^(?:лёд|лед|сахар)${E}`,
    `^приборы${E}`, `^упаковк`, `^пакет${E}`, `^стаканчик пуст`,
    // ── spices
    `^приправ`, `^специи${E}`, `^соль${E}`, `^(?:зел[её]ный\\s+)?перец(?:\\s+d\\d+)?$`,
    // ── бутилированная вода (owner 16.07.2026: «воду тоже убери»)
    `${B}вод[аы]${E}`, 'минеральн', 'аква минерале', 'бонаква', 'bonaqua',
    'боржоми', 'нарзан', `${B}evian${E}`, `${B}perrier${E}`, `${B}vittel${E}`,
    'пеллегрино', 'pellegrino',
  ].join('|'),
  'i',
);

/** true → the position is an add-on/ingredient, never a standalone card */
const ADJECTIVE_ENDING_RE = /(?:ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ому|ему|ым|им|ую|юю|ых|их|ыми|ими|ом|ем)$/i;

/** Cheap adjective-only rows are usually unnamed modifiers, not dishes.
 * Example: Papa John's «Особый Чесночный» (60 ₽) is a sauce whose noun was
 * omitted by the source menu. The price guard keeps legitimate branded dish
 * names from being rejected merely for their grammar. */
export function isCheapModifierName(name?: string | null, price?: number | null): boolean {
  if (!name || price == null || !Number.isFinite(price) || price > 100) return false;
  const words = name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^а-яёa-z-]+/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length >= 1 && words.length <= 3 && words.every((word) => ADJECTIVE_ENDING_RE.test(word));
}

export function isNonStandalone(name?: string | null, price?: number | null): boolean {
  if (!name) return false;
  return NON_STANDALONE_RE.test(name.toLowerCase()) || isCheapModifierName(name, price);
}

/** Substrings safe for a Prisma `contains` SQL pre-filter (no boundaries needed).
 *  The JS post-filter above stays the source of truth. */
export const NON_STANDALONE_CONTAINS = [
  'кетчуп', 'майонез', 'горчиц', 'васаби', 'аджик', 'ткемали',
  'сацебели', 'заправк', 'маринад', 'халапеньо', 'халапенью', 'сироп',
  'топпинг', 'посыпк', 'варень', 'сгущёнк', 'сгущенк', 'лаваш', 'гренк',
  'сухарик', 'гарнир', 'приправ', 'приборы', 'упаковк', 'добавка',
];
