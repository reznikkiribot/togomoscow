// PHOTO POLICY (2026-07-09): catalog photos must be legally usable.
// Parsed chain photos (coffeemania.ru, Dodo CDN, vkusnoitochka.ru, Papa John's…)
// are copyrighted → replaced with openly-licensed Pexels photos (their license
// allows commercial use) found by the item's name (translated ru→en via local
// qwen). No match → photoUrl = NULL (neutral licensed placeholder takes over).
// The frontend labels every non-user photo "Фото носит информационный характер".
// Re-runnable: only touches the parsed domains; stops gracefully on rate limits.
//   node prisma/replace-parsed-photos.mjs [--dry] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
if (!process.env.DATABASE_URL_OVERRIDE) {
  const f = path.join(__dirname, '..', '.railway-db-url');
  if (fs.existsSync(f)) process.env.DATABASE_URL = fs.readFileSync(f, 'utf8').trim();
}
const PEXELS = process.env.PEXELS_API_KEY;
if (!PEXELS) { console.error('нет PEXELS_API_KEY'); process.exit(1); }

const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const PARSED = ['coffeemania.ru', 'cdn.smt.bz', 'vkusnoitochka.ru', 'images.papajohns.ru', 'userapi.com', 'telesco.pe'];
const dry = process.argv.includes('--dry');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

// dictionary first (qwen mistranslates Russian classics: Пельмени→"Penne"),
// then qwen with few-shot examples, then the raw name
const DICT = [
  [/пельмен/i, 'pelmeni russian dumplings'], [/сырник/i, 'syrniki cottage cheese pancakes'],
  [/борщ/i, 'borscht beet soup'], [/блин/i, 'russian crepes blini'], [/оливье/i, 'olivier salad'],
  [/хачапури/i, 'khachapuri cheese bread'], [/хинкал/i, 'khinkali dumplings'], [/шаурм|шаверм/i, 'shawarma wrap'],
  [/плов/i, 'plov rice pilaf'], [/вареник/i, 'vareniki dumplings'], [/окрошк/i, 'okroshka cold soup'],
  [/солянк/i, 'solyanka soup'], [/щи\b/i, 'shchi cabbage soup'], [/голубц/i, 'stuffed cabbage rolls'],
  [/драник/i, 'potato pancakes draniki'], [/морс/i, 'berry drink mors'], [/компот/i, 'fruit compote drink'],
  [/квас/i, 'kvass drink'], [/сбитень/i, 'hot honey drink'], [/раф/i, 'raf coffee latte'],
  [/капучино/i, 'cappuccino'], [/латте/i, 'latte coffee'], [/эспрессо/i, 'espresso'],
  [/люля/i, 'lula kebab'], [/чебурек/i, 'cheburek fried pastry'], [/манты/i, 'manti steamed dumplings'], [/наггетс/i, 'chicken nuggets'], [/фри/i, 'french fries'], [/цезарь/i, 'caesar salad'], [/паста/i, 'pasta'],
];
async function toEnglish(name) {
  for (const [re, q] of DICT) if (re.test(name)) return q;
  try {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: `Translate the Russian dish/drink name into a short English food photo search query (2-4 words). Keep the dish TYPE correct.\nExamples:\nПельмени -> pelmeni dumplings\nКотлета с пюре -> cutlet mashed potatoes\nТом ям -> tom yum soup\nМедовик -> honey cake medovik\nNow translate (answer with the query only): ${name}`,
        stream: false,
        options: { temperature: 0 },
      }),
    });
    const j = await r.json();
    const t = (j.response ?? '').trim().split('\n')[0].replace(/["'.]/g, '').slice(0, 60);
    return t || name;
  } catch {
    return name;
  }
}

async function pexelsSearch(query) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' food')}&per_page=3&orientation=landscape`,
    { headers: { Authorization: PEXELS } },
  );
  if (r.status === 429) return { rateLimited: true };
  if (!r.ok) return { photos: [] };
  const j = await r.json();
  return { photos: j.photos ?? [] };
}

const items = await p.listing.findMany({
  where: {
    type: { in: ['DISH', 'DRINK'] },
    OR: PARSED.map((d) => ({ photoUrl: { contains: d } })),
  },
  select: { id: true, name: true, photoUrl: true },
});
console.log(`к замене: ${items.length} (лимит прогона: ${LIMIT})`);

let replaced = 0, nulled = 0, done = 0;
for (const it of items) {
  if (done >= LIMIT) break;
  done++;
  const q = await toEnglish(it.name);
  const res = await pexelsSearch(q);
  if (res.rateLimited) {
    console.log(`\nPexels rate limit — стоп. Прогресс: ${done - 1}/${items.length}. Перезапусти позже.`);
    break;
  }
  const photo = res.photos[0]?.src?.large ?? null;
  if (dry) {
    console.log(`  ${it.name} → [${q}] → ${photo ? 'НАЙДЕНО' : 'null'}`);
    continue;
  }
  await p.listing.update({ where: { id: it.id }, data: { photoUrl: photo } }).catch(() => {});
  photo ? replaced++ : nulled++;
  process.stdout.write(`\r${done}/${items.length} (заменено ${replaced}, обнулено ${nulled})`);
  await new Promise((r) => setTimeout(r, 400)); // ~150/час запас под лимит Pexels
}
console.log(`\nИтог: заменено ${replaced}, обнулено ${nulled}, обработано ${done}/${items.length}`);
await p.$disconnect();
