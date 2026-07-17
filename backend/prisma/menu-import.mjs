// Imports extracted chain menus (prisma/menu-out/<domain>.json) into the catalog.
// A chain shares one menu, so each item is linked to ALL the chain's venues
// (matched by website host), with the price stored on the menu link.
//
//   node prisma/menu-import.mjs <domain...> [--pending]
// Default status APPROVED (authoritative chain data → usable immediately).
// Tagged with source='menu-import' + logged to menu-out/_import-log.json for undo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'menu-out');

// JS \b is ASCII-only (breaks on Cyrillic) → use explicit Cyrillic/Latin boundaries.
const WORD_CH = 'а-яёa-z0-9';
const B = (w) => `(?<![${WORD_CH}])(?:${w})(?![${WORD_CH}])`;
const DRINK_RE = new RegExp([
  'латте', 'капучин', 'эспрессо', 'американо', 'какао', 'матч', 'тоник', 'лимонад', 'смузи', 'джус', 'juice',
  'морс', 'компот', 'коктейл', 'глинтвейн', 'бамбл', 'флэт.?уайт', 'колд.?брю', 'фраппе', 'глясе', 'милкшейк',
  'напиток', 'айс.?латте', 'айсти', 'айс.?ти', 'ice.?tea', 'айс.?кофе', 'мокко', 'мокка', 'кортадо', 'пикколо',
  'чино', 'маршмеллоу', 'пунш', 'газиров', 'минерал', 'боржоми', 'нарзан', 'добрый', 'фанта', 'спрайт', 'пепси',
  'швепс', 'энергет', 'red.?bull', 'milkis', 'миринда', 'байкал', 'тархун', 'дюшес',
  B('кофе'), B('раф'), B('чай'), B('сок'), B('вино'), B('пиво'), B('вода'), B('кола'), B('шейк'), B('эль'),
  B('tea'), B('coffee'), B('latte'), B('juice'), B('wine'), B('beer'), // English drink words in brand names (Rich Tea, Stars Coffee…)
].join('|'), 'i');
// alcohol → a proper category so the recsys filter (which excludes пиво/вино/коктейли/
// крепкие by category) actually catches it. Checked BEFORE the generic drink branch.
const WINE_RE = new RegExp(['вино', 'шардоне', 'каберне', 'мерло', 'совиньон', 'просекко', 'игрист', 'рислинг', B('пино'), 'санджовезе', 'мальбек', 'ламбруско', 'портвейн', 'шампанск', 'просек', 'sauvignon', 'savignon', 'chardonnay', 'merlot', 'cabernet', 'riesling', B('blanc'), B('rose')].join('|'), 'i');
const BEER_RE = new RegExp(['пиво', 'лагер', B('эль'), B('ipa'), 'ипа', 'стаут', 'портер', 'пилснер', B('вайс'), 'сидр', 'хугарден', 'гиннес'].join('|'), 'i');
const SPIRIT_RE = new RegExp(['виски', 'водк', B('ром'), B('джин'), 'текил', 'коньяк', 'ликёр', 'ликер', 'бренди', 'вермут', 'кампари', 'самбука', 'абсент', 'граппа', 'кальвадос', B('мартини'), B('саке')].join('|'), 'i');
// note: NOT "маргарит" (collides with Маргарита pizza) — only explicit cocktails
const COCKTAIL_RE = new RegExp(['коктейл', 'мохито', 'негрони', 'спритц', 'апероль', 'дайкири', 'космополит', 'b52', 'лонг.?айленд', 'пина.?колада', 'кровавая мэри'].join('|'), 'i');
const MILKSHAKE_RE = new RegExp(['милкшейк', 'молочн.{0,5}коктейл', B('шейк'), 'фраппе'].join('|'), 'i');
// strong food words → it's a dish even if the name mentions "напиток" (combos like "Пицца и напиток")
const FOOD_OVERRIDE = new RegExp(`пицц|бургер|салат|ролл|спагетти|шаурм|шаверм|стейк|сэндвич|сендвич|донер|кебаб|(?<![${WORD_CH}])суп(?![${WORD_CH}])|наггетс|картоф|хачапур|хинкал|(?<![${WORD_CH}])вок(?![${WORD_CH}])|боул|поке|том.?ям|лазань|ризотто|карбонар|болонье|тост|брускетт|сырник|блин|паст`, 'i');
export function classify(name) {
  const n = name.toLowerCase();
  if (MILKSHAKE_RE.test(n)) return { type: 'DRINK', category: 'Смузи' }; // milkshake ≠ alcohol cocktail
  // filter/specialty coffee (coffeemania "hoop", Sber filter, pour-over, origins) → DRINK/Кофе
  if (/\bhoop\b|пуровер|пур.?овер|фильтр.?кофе|аэропресс|кемекс|\bv60\b|дрип.?пакет/i.test(n) ||
      (/фильтр/i.test(n) && new RegExp(['эфиоп', 'йемен', 'колумб', 'кени', 'бразил', 'гватемал', 'кост.?рик', B('перу'), 'никарагуа'].join('|'), 'i').test(n))) {
    return { type: 'DRINK', category: 'Кофе' };
  }
  if (WINE_RE.test(n)) return { type: 'DRINK', category: 'Вино' };
  if (BEER_RE.test(n)) return { type: 'DRINK', category: 'Пиво' };
  if (SPIRIT_RE.test(n)) return { type: 'DRINK', category: 'Крепкие напитки' };
  if (COCKTAIL_RE.test(n)) return { type: 'DRINK', category: 'Коктейли' };
  if (!FOOD_OVERRIDE.test(n) && DRINK_RE.test(n)) {
    let c = 'Напитки';
    if (new RegExp(['кофе', 'латте', 'капучин', 'эспрессо', 'американо', B('раф'), 'флэт', 'колд.?брю', 'мокко', 'мокка', 'кортадо', 'пикколо', 'бамбл', 'айс.?латте', 'глясе', 'айс.?кофе', B('coffee'), B('latte'), B('espresso')].join('|'), 'i').test(n)) c = 'Кофе';
    else if (new RegExp([B('чай'), 'матч', 'улун', 'пуэр', 'айсти', 'айс.?ти', 'ice.?tea', B('tea')].join('|'), 'i').test(n)) c = 'Чай';
    else if (/коктейл/.test(n)) c = 'Коктейли';
    else if (new RegExp(['смузи', B('шейк'), 'милкшейк', 'фраппе'].join('|'), 'i').test(n)) c = 'Смузи';
    else if (new RegExp(['лимонад', B('сок'), 'джус', 'juice', 'морс', 'компот', 'тоник', B('вода'), B('кола')].join('|'), 'i').test(n)) c = 'Безалкогольные';
    return { type: 'DRINK', category: c };
  }
  let c = 'Блюдо';
  if (/пицц/.test(n)) c = 'Пицца';
  else if (/бургер|чизбургер/.test(n)) c = 'Бургеры';
  else if (/паст|спагетти|карбонар|болонье|лазань/.test(n)) c = 'Паста';
  else if (/суши|ролл|сашими|поке/.test(n)) c = 'Японская';
  else if (/салат|цезарь/.test(n)) c = 'Салаты';
  else if (new RegExp(`(?<![${WORD_CH}])суп(?![${WORD_CH}])|том.?ям|борщ`).test(n)) c = 'Супы';
  else if (/десерт|торт|чизкейк|тирамису|маффин|круассан|штрудель|мороже|панна/.test(n)) c = 'Десерты';
  else if (/картоф|наггетс|стрипс|твистер|шаурм|хот.?дог|фри/.test(n)) c = 'Фастфуд';
  else if (/стейк|рибай|миньон/.test(n)) c = 'Стейки';
  return { type: 'DISH', category: c };
}

const DAY_TOKEN = '(?:пн|вт|ср|чт|пт|сб|вс|понедельник(?:а)?|вторник(?:а)?|сред(?:а|ы)|четверг(?:а)?|пятниц(?:а|ы)|суббот(?:а|ы)|воскресень(?:е|я))';
const AMOUNT_TOKEN = '\\d+(?:[.,]\\d+)?(?:\\s*[/xх×]\\s*\\d+(?:[.,]\\d+)?)*';
const UNIT_TOKEN = '(?:мм|см|cm|мл|ml|cl|дл|литр(?:а|ов)?|л|l|кг|kg|гр|г|g|oz|шт(?:ук(?:а|и)?)?)';
const PURE_SIZE_RE = new RegExp(`^\\s*(?:[ø⌀]\\s*)?${AMOUNT_TOKEN}\\s*${UNIT_TOKEN}\\.?\\s*$|^\\s*(?:xxl|xl|xs|[sml])\\s*$`, 'i');

// Keep the semantic dish name while removing parser/UI metadata. The same
// function is imported by clean-names.mjs, so new and historical rows converge.
export function normalizeMenuName(name) {
  let n = String(name ?? '').normalize('NFKC').replace(/\u00a0/g, ' ').trim();
  if (!n) return '';

  n = n
    .replace(/&#\d+;/g, ' ')
    .replace(/\s*\[[^\]]*\]/g, ' ') // [NEW], [AT], internal menu codes
    .replace(new RegExp(`\\(\\s*(?:${DAY_TOKEN}|\\d+[.,]\\d+|xxl|xl|xs|[sml]|сред\\.?|м3|m3|зона\\s*\\d+|ночн[а-яё]*|new|hit|хит|арт(?:икул)?\\s*[:№#-]?\\s*[a-zа-яё0-9_-]+|код\\s*[:№#-]?\\s*[a-zа-яё0-9_-]+)\\s*\\)`, 'gi'), ' ')
    .replace(new RegExp(`(?<![${WORD_CH}])(?:арт(?:икул)?|код|sku)\\s*(?:[:№#-]\\s*)?[a-zа-яё_-]*\\d[a-zа-яё0-9_-]*(?![${WORD_CH}])`, 'gi'), ' ')
    .replace(/[#№]\s*[a-zа-яё]*\d{2,}[a-zа-яё0-9_-]*/gi, ' ')
    .replace(new RegExp(`(?:диаметр\\s*[:=-]?\\s*|[ø⌀]\\s*)?${AMOUNT_TOKEN}\\s*${UNIT_TOKEN}(?![${WORD_CH}])\\.?`, 'gi'), ' ')
    .replace(/\d+\s*(?:персон(?:а|ы)?|порци(?:я|и))(?![а-яёa-z])/gi, ' ')
    .replace(/\s*[xх×]\s*\d+(?![\dа-яёa-z])/gi, ' ');

  // Dough is metadata only when expressed as a pizza option or a trailing UI tag.
  n = n.replace(/(?<![а-яёa-z])на\s+(?:тонком|толстом)\s+тесте(?![а-яёa-z])/gi, ' ')
    .replace(/(?<![а-яёa-z])(?:тонкое|толстое)\s+тесто(?![а-яёa-z])/gi, ' ');
  if (/пицц/i.test(n)) n = n.replace(/(?<![а-яёa-z])(?:тонкое|толстое)(?![а-яёa-z])/gi, ' ');
  else n = n.replace(/\s+(?:тонкое|толстое)\s*$/i, ' ');

  n = n
    .replace(new RegExp(`(?<![${WORD_CH}])${DAY_TOKEN}(?![${WORD_CH}])`, 'gi'), ' ')
    .replace(/(?<![а-яёa-z])размер\s+(?:xxl|xl|xs|[sml])(?![а-яёa-z])/gi, ' ')
    .replace(/(?<![а-яёa-z])(?:большая|средняя|маленькая|малая)\s+порци(?:я|и)(?![а-яёa-z])/gi, ' ')
    .replace(/\s+(гранде|венти|grande|venti|tall|большой|больш(?:ая|ое)|сред(?:\.|ний|няя|нее)|маленьк[а-яёa-z]*|мал(?:ый|ая))(?![а-яё])/gi, ' ')
    .replace(/\s+(xxl|xl|xs|[sml])\s*$/i, ' ')
    .replace(/[(){}]/g, ' ') // unwrap meaningful parenthetical text
    .replace(/\s*[-–—,:;/]+\s*$/g, ' ')
    .replace(/^\s*[-–—,:;/]+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return n;
}
// skip non-dish noise the engine sometimes catches (combos / banners / sets / descriptions)
export function isJunk(name) {
  const n = name.toLowerCase();
  if (n.length < 2 || n.length > 55) return true;
  if (PURE_SIZE_RE.test(n)) return true;
  if (n.split(/\s+/).length > 7) return true; // a sentence/description, not a menu name
  if (/^меню(?:\s+на)?$/i.test(n)) return true;
  if (new RegExp(`^\\d+\\s*(?:любые|пицц|штук|шт(?![${WORD_CH}]))`).test(n)) return true; // "3 любые пиццы"
  if (new RegExp(`любые пицц|комбо|(?<![${WORD_CH}])сет(?![${WORD_CH}])|(?<![${WORD_CH}])набор(?![${WORD_CH}])|меню дня|за \\d+\\s*₽|выгодн|подарок|конструктор|собери|акци|скидк|сертификат|доставк|для офиса|идеальных|\\+ ?\\d|\\d ?\\+ ?\\d`).test(n)) return true;
  // «X и закуска», «пицца и напиток» — combos in disguise (their photos are collages)
  if (new RegExp(`(?<![${WORD_CH}])и\\s+(?:закуск|напит|десерт|салат)|(?<![${WORD_CH}])с\\s+напитк|ассорти из \\d`).test(n)) return true;
  // Retail/DIY products do not belong in a restaurant dish catalog.
  if (/кофе.{0,20}(?:в\s+з[её]рнах|молот|капсул|дрип[ -]?пак)|(?:з[её]рна|капсул|дрип[ -]?пак).{0,20}кофе|полуфабрикат|замороженн|для\s+приготовления\s+дома|котлет[а-яё]*\s+для\s+бургер/i.test(n)) return true;
  if (new RegExp(`^\\s*${DAY_TOKEN}\\s*$|меню\\s+(?:на\\s+)?${DAY_TOKEN}`, 'i').test(n)) return true;
  // OWNER RULE (13.07.2026): a SINGLE adjective is not a dish name ("Малиновый",
  // "Сырный", "Ванильный") — it's missing the noun. Reject one-word names that
  // are just an adjective (Russian adjective endings).
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length === 1 && /(ый|ий|ой|ая|яя|ое|ее|ые|ими|ого|осн?ый)$/.test(words[0]) && words[0].length >= 5) return true;
  // mostly non-letters (codes/garbage)
  const letters = (n.match(/[а-яёa-z]/gi) || []).length;
  if (letters < n.length * 0.5) return true;
  return false;
}

// mass fast-food chains the owner doesn't want in the catalog — skipped on parse
const FASTFOOD_BLOCK = /burgerking|burger.?king|бургер.?кинг|vkusnoitochka|вкусно.?и.?точка|rostics|rostic|ростикс|kfc|макдо|mcdonald|додо.?экспресс|subway|сабвэй|carls|hesburger|теремок|крошка.?картошка|стардог|stardog/i;

async function undo() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  // delete every menu link this import created (incl. links to pre-existing items)…
  const logPath = path.join(OUT, '_import-log.json');
  if (fs.existsSync(logPath)) {
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    let n = 0;
    for (const [venueId, itemId] of log.links || []) {
      await prisma.menuLink.delete({ where: { venueId_itemId: { venueId, itemId } } }).catch(() => {});
      n++;
    }
    console.log(`removed ${n} logged menu links`);
  }
  // …then delete every item the import created (cascades any remaining links)
  const del = await prisma.listing.deleteMany({ where: { source: 'menu-import' } });
  console.log(`deleted ${del.count} imported items. Undo complete.`);
  await prisma.$disconnect();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--undo')) return undo();
  const pending = args.includes('--pending');
  let domains;
  if (args.includes('--all')) {
    // import every successfully-extracted menu (count >= 5) in menu-out/
    domains = fs.readdirSync(OUT)
      .filter((f) => f.endsWith('.json') && f !== '_import-log.json')
      .map((f) => { try { const j = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); return j.count >= 5 ? j.domain : null; } catch { return null; } })
      .filter(Boolean);
  } else {
    domains = args.filter((a) => !a.startsWith('--'));
  }
  if (!domains.length) { console.log('usage: node prisma/menu-import.mjs <domain...> | --all [--pending]'); return; }
  const status = pending ? 'PENDING' : 'APPROVED';

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const log = { at: new Date().toISOString(), status, createdItems: [], links: [] };

  for (const domain of domains) {
    if (FASTFOOD_BLOCK.test(domain)) { console.log(`${domain}: mass fast-food — skip (owner rule)`); continue; }
    const file = path.join(OUT, domain.replace(/[^\w.-]/g, '_') + '.json');
    if (!fs.existsSync(file)) { console.log(`${domain}: no extract file, skip`); continue; }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.items?.length) { console.log(`${domain}: empty, skip`); continue; }

    // chain venues = restaurants whose website host matches this domain
    const venues = await prisma.listing.findMany({
      where: { type: 'RESTAURANT', website: { contains: domain.replace(/^www\./, '') } },
      select: { id: true, name: true },
    });
    if (!venues.length) { console.log(`${domain}: no venues in catalog, skip`); continue; }

    let newItems = 0, links = 0;
    for (const raw of data.items) {
      const name = normalizeMenuName(raw.name);
      if (isJunk(name)) continue;
      const { type, category } = classify(name);
      // PHOTO POLICY: parsed photos are only a GENERATION REFERENCE, never shown
      // directly. New items get NO direct photo here — regen-from-refs.mjs turns
      // the official image into our own AI derivative. An existing aigen- photo
      // is FINAL: future parses must never touch it (owner rule 11.07.2026).
      const photoUrl = null;
      // find-or-create the shared catalog item (dedup by name + type).
      // ANTI-DUPE RULE (owner, 11.07.2026): «Карбонара» and «Паста Карбонара»
      // are the same item — match the stripped form too (same dish kind only).
      const stripped = name.toLowerCase().replace(/ё/g, 'е').replace(/^(паста|пицца|салат|суп|ролл|роллы|напиток|коктейль)\s+/, '');
      let item = await prisma.listing.findFirst({
        where: { type, name: { equals: name, mode: 'insensitive' } },
        select: { id: true, photoUrl: true },
      });
      if (!item) {
        const near = await prisma.listing.findMany({
          where: { type, OR: [
            { name: { equals: stripped, mode: 'insensitive' } },
            { name: { endsWith: ' ' + stripped, mode: 'insensitive' } },
          ] },
          select: { id: true, photoUrl: true, name: true, category: true },
        });
        const kindOf = (n, cat) => {
          const s = (n ?? '').toLowerCase(); const cc = (cat ?? '').toLowerCase();
          if (/^пицца |пицц/.test(s + ' ' + cc)) return 'pizza';
          if (/^паста |паст/.test(s + ' ' + cc)) return 'pasta';
          if (/^суп |суп/.test(s + ' ' + cc)) return 'soup';
          return 'any';
        };
        const myKind = kindOf(name, category);
        item = near.find((x) => { const k = kindOf(x.name, x.category); return k === 'any' || myKind === 'any' || k === myKind; }) ?? null;
      }
      if (!item) {
        item = await prisma.listing.create({
          data: { type, name, category, groupKey: name.toLowerCase(), source: 'menu-import', photoUrl },
          select: { id: true, photoUrl: true },
        });
        newItems++;
        log.createdItems.push(item.id);
      }
      const price = raw.price > 0 && raw.price < 100000 ? Math.round(raw.price) : null;
      // this venue's own menu photo → the reference for THIS venue's AI image
      const refImage = typeof raw.image === 'string' && /^https?:\/\//.test(raw.image) ? raw.image : null;
      for (const v of venues) {
        await prisma.menuLink.upsert({
          where: { venueId_itemId: { venueId: v.id, itemId: item.id } },
          create: { venueId: v.id, itemId: item.id, status, price, refImage },
          // don't wipe an existing generated photo; only fill a missing reference
          update: { status, price, ...(refImage ? { refImage } : {}) },
        });
        links++;
        log.links.push([v.id, item.id]);
      }
    }
    console.log(`${domain}: ${venues.length} venues × ${data.count} items → +${newItems} new items, ${links} menu links (${status})`);
  }

  fs.writeFileSync(path.join(OUT, '_import-log.json'), JSON.stringify(log, null, 2));
  console.log(`\nDone. Log: menu-out/_import-log.json (${log.createdItems.length} items created, ${log.links.length} links).`);
  await prisma.$disconnect();
}
// only run the importer when executed directly (so `classify` can be reused elsewhere)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
