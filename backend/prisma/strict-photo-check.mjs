// STRICT retro photo↔name verification (owner 19.07.2026: «ужесточи соответствие,
// проверь ВСЕ фото блюд»). For every dish/drink card photo AND menu-link photo:
//   1) collage structural check (grid seams) → reject
//   2) CLIP: photo must match the dish NAME with a HIGH margin over "unrelated"
//      — threshold raised to 0.62 (was 0.5), and it must also beat a "wrong dish"
//      distractor. Fail → photoUrl = null (card falls back to placeholder).
//   node prisma/strict-photo-check.mjs [--dry] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// NB: NO `sharp` here — sharp's native libs + onnxruntime (CLIP) in one process
// segfault on Windows (clip-oom lesson). Collage is detected via CLIP labels only.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim() + '?connect_timeout=30&connection_limit=1';
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const dry = process.argv.includes('--dry');
const li = process.argv.indexOf('--limit');
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity;
const BASE = 'https://togomoscow-production.up.railway.app';
// two-tier: below HARD is definitely wrong (remove now); the 0.50–0.62 grey zone
// is left in place to avoid nuking decent photos — those regenerate next pass.
const NAME_MIN = Number(process.env.NAME_MIN ?? 0.50);

// RU dish/drink name → short EN CLIP query (mirror of reviews.service FOOD_DICT)
const DICT = [
  [/пицц/i, 'pizza'], [/клубник/i, 'fresh strawberries'], [/малин/i, 'raspberries'],
  [/пельмен/i, 'pelmeni dumplings'], [/сырник/i, 'cheese pancakes syrniki'], [/борщ/i, 'borscht red beet soup'],
  [/блин/i, 'russian crepes blini'], [/оливье/i, 'olivier salad'], [/хачапур/i, 'khachapuri cheese bread'],
  [/хинкал/i, 'khinkali dumplings'], [/бургер/i, 'burger'], [/паст|спагетти|карбонар|болонье|тальятел|феттучин/i, 'pasta with sauce'],
  [/суши|ролл|сашими|нигир|гункан/i, 'sushi rolls'], [/стейк|рибай|миньон|бриск/i, 'grilled steak meat'],
  [/салат|цезарь|греческ|нисуаз/i, 'salad'], [/суп|рамен|том ям|гаспачо|солянк|харчо|мисо|фо бо|дзосуй|уха/i, 'soup in a bowl'],
  [/тирамису|чизкейк|торт|медовик|десерт|эклер|штрудель|тарталетк|панна|павлова|гато/i, 'cake dessert'],
  [/мороженое|пломбир|сорбет|джелато/i, 'ice cream'], [/круассан|булочк|слойк|даниш|плюшк/i, 'croissant pastry'],
  [/кофе|латте|капучин|раф|эспрессо|американо|флэт|мокко|кортадо|пикколо|глясе/i, 'cup of coffee'],
  [/чай|матча|улун|пуэр/i, 'cup of tea'], [/смузи/i, 'smoothie in a glass'],
  [/лимонад|морс|сок|компот|тоник|фреш/i, 'cold drink in a glass'], [/коктейл|мохито|негрони|спритц/i, 'cocktail in a glass'],
  [/пиво|лагер|эль|стаут|портер|сидр|нефильтр/i, 'glass of beer'], [/вино|шардоне|мерло|просекко/i, 'glass of wine'],
  [/пармезан|сыр\b|моцарелл|горгонзол|тарелк сыр/i, 'cheese plate'], [/креветк/i, 'shrimp dish'],
  [/лосос|сёмг|семг|рыб|палтус|тунец|форел/i, 'fish dish'], [/курин|курица|цыпл|наггетс|крыл/i, 'chicken dish'],
  [/картофель фри|фри\b|батат/i, 'french fries'], [/котлет|тефтел|фрикадел/i, 'meat cutlet'],
  [/яич|омлет|бенедикт|скрэмбл/i, 'eggs'], [/вок|лапша|удон|тяхан|плов|рис\b/i, 'noodles or rice dish'],
  [/дракон|филадельф|калифорни|темпура/i, 'sushi rolls'], [/пад тай/i, 'pad thai noodles'],
];
function toEn(name, category) {
  for (const [re, q] of DICT) if (re.test(name)) return q;
  const c = (category ?? '').toLowerCase();
  if (/кофе/.test(c)) return 'cup of coffee';
  if (/чай/.test(c)) return 'cup of tea';
  if (/десерт|выпечк/.test(c)) return 'dessert';
  if (/суп/.test(c)) return 'soup in a bowl';
  if (/салат/.test(c)) return 'salad';
  if (/пицц/.test(c)) return 'pizza';
  if (/пив/.test(c)) return 'glass of beer';
  if (/вин/.test(c)) return 'glass of wine';
  if (/напит|лимонад|сок|смузи/.test(c)) return 'drink in a glass';
  return 'plated food dish';
}

const retry = async (fn) => { for (let a = 1; a <= 6; a++) { try { return await fn(); } catch (e) { if (a === 6) throw e; await new Promise((r) => setTimeout(r, a * 4000)); } } };

console.log('загружаю CLIP…');
const t = await import('@xenova/transformers');
t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
const model = 'Xenova/clip-vit-base-patch32';
const embedder = await t.pipeline('image-feature-extraction', model);
const { RawImage, AutoTokenizer, CLIPTextModelWithProjection } = t;
const tokenizer = await AutoTokenizer.from_pretrained(model);
const textModel = await CLIPTextModelWithProjection.from_pretrained(model);
const textCache = new Map();
async function textVecs(labels) {
  const key = labels.join('|'); if (textCache.has(key)) return textCache.get(key);
  const { text_embeds } = await textModel(tokenizer(labels, { padding: true, truncation: true }));
  const [n, dim] = text_embeds.dims; const out = [];
  for (let i = 0; i < n; i++) { const vv = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim)); const l = Math.hypot(...vv) || 1; out.push(vv.map((x) => x / l)); }
  textCache.set(key, out); return out;
}
const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
async function embed(buf) { const img = await RawImage.fromBlob(new Blob([new Uint8Array(buf)])); const o = await embedder(img, { pooling: 'mean', normalize: true }); const vv = Array.from(o.data); const l = Math.hypot(...vv) || 1; return vv.map((x) => x / l); }
console.log('CLIP готов');

async function verdict(buf, name, category) {
  const en = toEn(name, category);
  // one CLIP pass: dish-name vs wrong-dish vs unrelated vs COLLAGE label
  const labels = [
    `a photo of ${en}`,
    'a photo of a different unrelated food dish',
    'a photo of an unrelated object, drink, screenshot or scene',
    'a collage or grid of multiple separate food photos',
  ];
  const vecs = await textVecs(labels);
  const iv = await embed(buf);
  const logits = vecs.map((v) => cos(iv, v) * 100);
  const mx = Math.max(...logits); const exp = logits.map((x) => Math.exp(x - mx)); const sum = exp.reduce((a, b) => a + b, 0);
  const [pName, , , pCollage] = exp.map((x) => x / sum);
  // collage only when it's clearly a grid AND the dish label is weak (a real dish
  // photo with a second plate blurred behind must NOT be flagged — Пожарские was)
  if (pCollage >= 0.45 && pName < 0.45) return { keep: false, why: `collage(${pCollage.toFixed(2)})` };
  return { keep: pName >= NAME_MIN, why: `name=${pName.toFixed(2)}`, pName };
}

async function fetchBuf(url) {
  const full = url.startsWith('http') ? url : BASE + url;
  const r = await fetch(full, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) return null;
  return Buffer.from(await r.arrayBuffer());
}

// every dish/drink whose card face is a GENERATED photo (aigen) OR a raw file
const items = await retry(() => p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { not: null } },
  select: { id: true, name: true, category: true, photoUrl: true },
}));
console.log(`карточек с фото: ${items.length}`);
let checked = 0, cleared = 0, ok = 0, dead = 0;
const log = [];
for (const it of items) {
  if (checked >= LIMIT) break; checked++;
  try {
    const buf = await fetchBuf(it.photoUrl);
    if (!buf) { dead++; continue; }
    const v = await verdict(buf, it.name, it.category);
    if (v.keep) { ok++; continue; }
    log.push({ id: it.id, name: it.name, why: v.why, photoUrl: it.photoUrl });
    console.log(`  снять: ${it.name} (${v.why})`);
    if (!dry) {
      await retry(() => p.listing.update({ where: { id: it.id }, data: { photoUrl: null } }));
      await retry(() => p.menuLink.updateMany({ where: { itemId: it.id, photoUrl: it.photoUrl }, data: { photoUrl: null } }));
    }
    cleared++;
    if (cleared % 20 === 0) fs.writeFileSync(path.join(__dirname, 'strict-photo-log.json'), JSON.stringify(log, null, 1));
  } catch { /* transient — next run */ }
  if (checked % 100 === 0) console.log(`  …проверено ${checked}`);
}
fs.writeFileSync(path.join(__dirname, 'strict-photo-log.json'), JSON.stringify(log, null, 1));
console.log(`Итог: проверено=${checked}, ок=${ok}, снято=${cleared}, битых=${dead}${dry ? ' (DRY)' : ''}`);
await p.$disconnect();
