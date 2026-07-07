// Refines new-dish events with a LOCAL open-source LLM (Ollama — free, no API):
//   • extracts a clean dish/drink name from the post text
//   • drops posts the model says are NOT a real new dish (keyword false positives)
//   • pulls a matching food photo from Pexels for the dish name
// Incremental: only processes events with ai_processed = false. Graceful: if Ollama
// isn't running it just exits, and the keyword pipeline keeps working.
//
// Run: node prisma/ai-enrich-events.mjs [limit]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const PEXELS = process.env.PEXELS_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// food/drink vocabulary — used to reject LLM mistakes (a non-food post named as a dish)
const FOOD_RE =
  /бургер|пицц|паст|ролл|сашими|суши|салат|\bсуп\b|\bсет\b|стейк|шаурм|шаверм|хачапур|хинкал|долм|десерт|торт|чизкейк|тирамису|выпечк|завтрак|сэндвич|сендвич|блюд|пельмен|вареник|\bвок\b|боул|поке|рамен|том.?ям|круассан|эклер|пончик|мороже|шашлык|кебаб|плов|лазань|ризотто|гирос|фалафель|хот.?дог|наггетс|картофель фри|кофе|латте|капучин|\bраф\b|\bчай\b|матч|какао|коктейл|лимонад|смузи|\bвино\b|\bпиво\b|сидр|напит|глинтвейн|эспрессо|американо|сангри|креветк|лосось|пельмен|окрошк|борщ|уха|том ям|гаспачо|комбо|сэт|меню/i;

async function ollamaUp() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return false;
    const d = await r.json();
    return (d.models ?? []).some((m) => m.name.startsWith(MODEL.split(':')[0]));
  } catch {
    return false;
  }
}

const PROMPT = (text) =>
  `Определи, анонсирует ли пост кафе/ресторана НОВОЕ блюдо или напиток в меню.
Ответь СТРОГО JSON. Поле is_new_dish только true или false (никогда null).
dish_name — КОРОТКОЕ название позиции на русском, НЕ длиннее 3 слов (как в меню), иначе null.

Примеры:
"Новинка в десертной карте — торт Эстерхази" => {"is_new_dish": true, "dish_name": "Торт Эстерхази"}
"Встречайте раф лавандовый!" => {"is_new_dish": true, "dish_name": "Раф лавандовый"}
"Появились новые коктейли" => {"is_new_dish": true, "dish_name": "Новые коктейли"}
"Лето в разгаре, заходите!" => {"is_new_dish": false, "dish_name": null}
"Ищем бармена в команду" => {"is_new_dish": false, "dish_name": null}
"26 июня скидка 20%" => {"is_new_dish": false, "dish_name": null}

Пост:
"""${(text || '').slice(0, 700)}"""`;

async function aiExtract(text) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt: PROMPT(text), stream: false, format: 'json', options: { temperature: 0 } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const obj = JSON.parse(d.response);
    // keep it short enough to fit the card (≤ ~30 chars, drop trailing junk)
    let name = obj.dish_name ? String(obj.dish_name).trim().replace(/^[«"']|[»"']$/g, '').slice(0, 30).trim() : null;
    if (name && name.length < 2) name = null;
    return { isDish: !!obj.is_new_dish, name };
  } catch {
    return null;
  }
}

// moondream (vision): describe the REAL post photo. We keep new-dish events ONLY when
// the venue's own post photo actually shows a dish/drink — marketing banners, text
// cards and logos are dropped. We NEVER substitute a stock photo (per product rule:
// новинки show a real photo of the dish or nothing).
async function describe(b64) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'moondream', prompt: 'Describe this image in one short sentence.', images: [b64], stream: false, keep_alive: '20m', options: { temperature: 0 } }),
      signal: AbortSignal.timeout(60000),
    });
    return ((await r.json()).response || '').replace(/\s+/g, ' ').trim().toLowerCase();
  } catch { return null; }
}
const NOTFOOD = /\b(logo|banner|advertisement|advert|poster|flyer|billboard|\btext\b|words|sign that reads|price list|menu board|schedule|announcement|screenshot|collage|barcode|\bqr\b|a person|people|\bman\b|\bwoman\b|selfie|building|storefront|\bstreet\b|interior of|empty room|business card|nail|manicure)\b/i;
const FOODWORD = /\b(food|dish|meal|plate|bowl|glass|cup|mug|coffee|tea|latte|cappuccino|burger|pizza|salad|soup|cake|dessert|pastry|meat|steak|chicken|fish|sushi|roll|sandwich|cocktail|drink|beverage|smoothie|juice|lemonade|bottle|breakfast|noodles|pasta|ice ?cream|fruit|bread|pancake|croissant|donut|waffle|wrap)\b/i;
const isFoodPhoto = (d) => !!d && !NOTFOOD.test(d) && FOODWORD.test(d);
async function fetchB64(url) {
  for (let a = 0; a < 2; a++) {
    try { return Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(20000) })).arrayBuffer()).toString('base64'); }
    catch { if (a === 0) await sleep(600); }
  }
  return null;
}

async function main() {
  const limit = Number(process.argv[2] ?? 150);
  if (!(await ollamaUp())) {
    console.log(`Ollama не запущен или нет модели ${MODEL} — пропускаю (keyword-пайплайн работает).`);
    console.log('Установи: winget install Ollama.Ollama  →  ollama pull ' + MODEL);
    return;
  }
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const batch = await prisma.venueEvent.findMany({
    where: { kind: 'dish', aiProcessed: false },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
  const GENERIC = /^(нов(ый|ое|ая|инка|инки)\s*)?(напиток|напитки|блюдо|блюда|позиция|позиции|меню|новинка|новинки|товар|продукт|десерт|акция|спецпредложение)\.?\s*$/i;
  // PASS 1 (qwen, text): clean the name + drop non-dishes and photo-less posts. The
  // REAL post photo is kept as-is (never replaced). One model loaded → no thrash.
  let dropped = 0;
  const named = [];
  for (const e of batch) {
    const r = await aiExtract(e.text || e.title);
    if (!r) continue; // model hiccup → leave unprocessed, retry next run
    const badName = !r.isDish || !r.name || r.name.length < 3 || GENERIC.test(r.name.trim());
    const notFoodText = !FOOD_RE.test(r.name || '') && !FOOD_RE.test(e.text || '') && !FOOD_RE.test(e.title || '');
    if (badName || notFoodText || !e.photoUrl) {
      // no clean dish name, or no real post photo → can't show a real dish → drop
      await prisma.venueEvent.delete({ where: { id: e.id } }).catch(() => {});
      dropped++;
      continue;
    }
    named.push({ e, name: r.name });
  }
  // PASS 2 (moondream, vision): publish ONLY events whose real post photo shows the
  // dish; drop marketing banners / text cards. No stock substitution.
  let kept = 0, banners = 0;
  for (const { e, name } of named) {
    const b64 = await fetchB64(e.photoUrl);
    const desc = b64 ? await describe(b64) : null;
    if (desc && !isFoodPhoto(desc)) {
      await prisma.venueEvent.delete({ where: { id: e.id } }).catch(() => {}); // banner / not the dish
      banners++;
      continue;
    }
    // real dish photo (or vision temporarily unavailable → keep real data) → publish
    await prisma.venueEvent.update({ where: { id: e.id }, data: { aiProcessed: true, title: name } }).catch(() => {});
    kept++;
  }
  console.log(`AI: batch ${batch.length}, опубликовано ${kept}, баннеров отброшено ${banners}, не-блюд ${dropped}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
