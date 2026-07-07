// Vision check of catalog photos with a local model (moondream via Ollama).
// For each dish/drink photo: ask the model what's shown. If it's NOT a clean photo
// of food/drink (a logo, packaging, text, person, blurry/dark), replace it with a
// proper food photo from Pexels (food-biased query by name).
//   node prisma/ai-check-photos.mjs [limit]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';
const PEXELS = process.env.PEXELS_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pexelsOne(q, locale) {
  try {
    const u = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape${locale ? `&locale=${locale}` : ''}`;
    const r = await fetch(u, { headers: { Authorization: PEXELS }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null; const d = await r.json();
    return d.photos?.[0]?.src?.large ?? d.photos?.[0]?.src?.medium ?? null;
  } catch { return null; }
}
// Wikimedia Commons image search (free, generous limits) — primary photo source
async function wikimedia(q) {
  try {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json`;
    const r = await fetch(u, { headers: { 'User-Agent': 'togomoscow/1.0 (reznik.kiri@gmail.com)' }, signal: AbortSignal.timeout(12000) });
    const d = await r.json();
    const pages = Object.values(d.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
    for (const pg of pages) {
      const url = pg.imageinfo?.[0]?.thumburl || pg.imageinfo?.[0]?.url;
      if (url && /\.(jpe?g|png)$/i.test(url.split('?')[0])) return url;
    }
  } catch { /* ignore */ }
  return null;
}
// qwen: translate the Russian dish name to a short English term for the image search
async function translateEn(name) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'qwen2.5:3b', prompt: `Переведи название блюда или напитка на английский, 1-3 слова, только перевод без кавычек и пояснений: «${name}»`, stream: false, keep_alive: '20m', options: { temperature: 0 } }),
      signal: AbortSignal.timeout(30000),
    });
    const a = ((await r.json()).response || '').trim().replace(/^["'«]+|["'».]+$/g, '').split('\n')[0];
    return a.slice(0, 40) || name;
  } catch { return name; }
}
// replacement photo: Wikimedia first (no hard limits), Pexels only as a fallback
async function foodPhoto(name, drink) {
  const en = await translateEn(name);
  const kind = drink ? 'drink' : 'food';
  return (
    (await wikimedia(`${en} ${kind}`)) ||
    (await wikimedia(en)) ||
    (await pexelsOne(`${name} ${drink ? 'напиток' : 'еда'}`, 'ru-RU')) ||
    (await pexelsOne(drink ? 'drink' : 'food dish'))
  );
}

// moondream answers YES/NO poorly, so we have it DESCRIBE the image and classify
// the description by food vs non-food vocabulary (much more reliable).
const NOTFOOD_WORDS = /\b(logo|brand name|watermark|\btext\b|sign that reads|poster|banner|advertisement|screenshot|web ?site|web page|document|barcode|qr code|smartphone|mobile phone|holding a phone|a map|a building|a car|a cartoon|a drawing|a person posing|a man posing|a woman posing|a selfie)\b/i;

// Deterministic ingredient check — far more reliable than a weak LLM judge, which
// defaults to "НЕТ" and would wipe out correct photos. Each entry pairs the Russian
// name pattern with the English word moondream uses. A mismatch is flagged ONLY when
// the name and the photo both name a CONCRETE but DIFFERENT ingredient (orange vs kiwi).
const INGREDIENTS = [
  ['orange', /апельсин|orange/i], ['kiwi', /киви|kiwi/i],
  ['strawberry', /клубни|земляник|strawberr/i], ['raspberry', /малин|raspberr/i],
  ['blueberry', /черник|голубик|blueberr/i], ['banana', /банан|banana/i],
  ['cherry', /вишн|черешн|cherr/i], ['mango', /манго|mango/i],
  ['peach', /персик|peach/i], ['apple', /яблок|apple/i],
  ['grape', /виноград|\bgrape/i], ['lemon', /лимон|lemon/i],
  ['lime', /лайм|lime/i], ['pineapple', /ананас|pineapple/i],
  ['watermelon', /арбуз|watermelon/i], ['coconut', /кокос|coconut/i],
  ['chocolate', /шокол|chocolate/i], ['matcha', /матч[аеу]|matcha/i],
  ['pear', /груш|\bpear/i], ['pomegranate', /гранат|pomegranate/i],
  ['grapefruit', /грейпфрут|grapefruit/i], ['passionfruit', /маракуй|passion ?fruit/i],
  ['coffee', /кофе|эспрессо|капучино|латте|американо|(?<![а-яё])раф|\braf\b|coffee|espresso|cappuccino|latte|americano/i],
  ['tea', /(?<![а-яё])ча[йёеюя]|\btea\b/i], ['cola', /(?<![а-яё])кол[аыуе]|cola|coke/i],
];
function ingredientMismatch(name, desc) {
  const nameIng = INGREDIENTS.filter(([, re]) => re.test(name)).map(([k]) => k);
  const descIng = INGREDIENTS.filter(([, re]) => re.test(desc)).map(([k]) => k);
  if (!nameIng.length || !descIng.length) return false;        // nothing concrete to compare
  return !nameIng.some((k) => descIng.includes(k));            // no shared ingredient → mismatch
}

// moondream (vision) → short English description of what's in the photo
async function describe(b64) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: 'moondream', prompt: 'Describe the food or drink in this image in one short sentence.', images: [b64], stream: false, keep_alive: '20m', options: { temperature: 0 } }),
      signal: AbortSignal.timeout(60000),
    });
    const a = ((await r.json()).response || '').replace(/\s+/g, ' ').trim();
    return a || null;
  } catch { return null; }
}
// qwen (bilingual text) → does the English photo description match the Russian dish name?
async function matches(name, desc) {
  try {
    const prompt = `Блюдо или напиток называется: «${name}».\nНа фото (описание на английском): «${desc}».\nСравни ГЛАВНЫЙ ингредиент/продукт названия и фото. Учитывай перевод и синонимы (cappuccino=капучино, coffee=кофе, orange=апельсин, juice=сок, pizza=пицца, beer=пиво, soup=суп, salad=салат, cake=торт).\nПравило: если главный продукт СОВПАДАЕТ — отвечай ДА, даже если отличается подача (лёд/горячее/кружка), гарнир, украшение или ракурс. Отвечай НЕТ только если на фото ЯВНО ДРУГОЙ главный продукт: название «апельсиновый», а на фото киви; название «кофе», а на фото фруктовый смузи; название «клубника», а на фото шоколад.\nОтветь СТРОГО одним словом: ДА или НЕТ.`;
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'qwen2.5:3b', prompt, stream: false, keep_alive: '20m', options: { temperature: 0 } }),
      signal: AbortSignal.timeout(40000),
    });
    const a = ((await r.json()).response || '').toLowerCase();
    if (/\bнет\b|\bno\b/.test(a)) return false;
    if (/\bда\b|\byes\b/.test(a)) return true;
    return null; // unclear → don't act
  } catch { return null; }
}
// STRICT verdict: photo must be food AND match the dish name
async function looksFood(b64, name) {
  const desc = await describe(b64);
  if (!desc) return null;
  const short = desc.toLowerCase().slice(0, 70);
  if (NOTFOOD_WORDS.test(desc.toLowerCase())) return { ok: false, desc: short, why: 'не еда' };
  const m = await matches(name, desc);
  if (m === null) return null; // model unsure → leave as is
  return { ok: m, desc: short, why: m ? '' : 'не соответствует названию' };
}

const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const dry = process.argv.includes('--dry');
const all = process.argv.includes('--all');       // process the WHOLE catalog in one run
const recheck = process.argv.includes('--recheck'); // ignore the ledger, check everything again
const limit = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 40);
// progress ledger: ids already checked, so repeated runs advance through the catalog
// instead of re-checking the same first N items every time.
const ledgerPath = path.join(__dirname, 'photo-check-ledger.json');
let checked = new Set();
if (!recheck && fs.existsSync(ledgerPath)) {
  try { checked = new Set(JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))); } catch { /* ignore */ }
}
let items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { startsWith: 'http' } },
  select: { id: true, name: true, type: true, photoUrl: true },
  orderBy: { id: 'asc' },
});
items = items.filter((it) => !checked.has(it.id));
if (!all) items = items.slice(0, limit);
console.log(`to check: ${items.length} (ledger has ${checked.size} already checked)`);
const undo = []; // { id, old } so a bad run can always be reversed
let ok = 0, replaced = 0, errs = 0;

// PASS 1 (vision): moondream describes every photo — model stays loaded the whole pass
console.log('pass 1/2: vision — describing photos…');
const staged = [];
for (const it of items) {
  let b64 = null;
  for (let attempt = 0; attempt < 2 && !b64; attempt++) {
    try { b64 = Buffer.from(await (await fetch(it.photoUrl, { signal: AbortSignal.timeout(25000) })).arrayBuffer()).toString('base64'); }
    catch { if (attempt === 0) await sleep(800); } // one retry for transient timeouts
  }
  if (!b64) { errs++; continue; }
  const desc = await describe(b64);
  if (!desc) { errs++; continue; }
  staged.push({ it, desc: desc.toLowerCase() });
}

// PASS 2 (text): qwen judges match + translates for the replacement — one model, no swaps
console.log(`pass 2/2: matching ${staged.length} descriptions…`);
for (const { it, desc } of staged) {
  checked.add(it.id); // got a real description + verdict → don't re-check next run
  let bad, why;
  if (NOTFOOD_WORDS.test(desc)) { bad = true; why = 'не еда'; }
  else if (ingredientMismatch(it.name, desc)) { bad = true; why = 'другой ингредиент'; }
  else { ok++; continue; } // main ingredient matches (or nothing concrete) → keep the photo
  if (!bad) { ok++; continue; }
  if (dry) { console.log(`  FLAG «${it.name}» [${why}] — на фото: "${desc.slice(0, 70)}"`); replaced++; continue; }
  const np = await foodPhoto(it.name, it.type === 'DRINK');
  if (np && np !== it.photoUrl) {
    undo.push({ id: it.id, old: it.photoUrl });
    await p.listing.update({ where: { id: it.id }, data: { photoUrl: np } }).catch(() => {});
    replaced++;
    console.log(`  replaced «${it.name}» [${why}] (was: "${desc.slice(0, 50)}")`);
  }
}
if (!dry && undo.length) {
  fs.writeFileSync(path.join(__dirname, 'photo-check-undo.json'), JSON.stringify(undo, null, 2));
  console.log(`undo log: prisma/photo-check-undo.json (${undo.length} entries)`);
}
if (!dry) fs.writeFileSync(ledgerPath, JSON.stringify([...checked])); // advance progress
console.log(`\n${dry ? '[DRY] ' : ''}checked ${items.length}: ok ${ok}, ${dry ? 'flagged' : 'replaced'} ${replaced}, errors ${errs}`);
await p.$disconnect();
