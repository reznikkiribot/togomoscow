// STRICT photo↔name verification for every catalog dish/drink photo.
// CLIP zero-shot (local, ONNX): does the picture actually show THIS dish?
//   1. current photo scored against the dish name → keep if it passes;
//   2. fail → try up to 6 Pexels candidates, verify EACH, keep the best passing
//      one (premium only: large size, landscape preferred);
//   3. nothing passes → photoUrl = NULL + the item goes into the mismatch report
//      (candidates for a human decision / other sources).
// Report: prisma/photo-verify-report.json. Re-runnable; Pexels-limit safe.
//   node prisma/verify-photos.mjs [--dry] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
{
  const f = path.join(__dirname, '..', '.railway-db-url');
  if (fs.existsSync(f)) process.env.DATABASE_URL = fs.readFileSync(f, 'utf8').trim();
}
const PEXELS = process.env.PEXELS_API_KEY;
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const dry = process.argv.includes('--dry');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const ACCEPT = 0.5; // current photo must beat the distractors with ≥50%
const ACCEPT_NEW = 0.55; // replacements are held to a higher bar

// ---- CLIP zero-shot (local) ----
console.log('загружаю CLIP…');
const { pipeline, env, RawImage } = await import('@xenova/transformers');
env.cacheDir = path.join(__dirname, '..', '.models-cache');
const zs = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
console.log('CLIP готов');

async function scorePhoto(url, en) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { score: 0, dead: true };
    const buf = Buffer.from(await r.arrayBuffer());
    const img = await RawImage.fromBlob(new Blob([new Uint8Array(buf)]));
    const labels = [
      `a photo of ${en}`,
      'a photo of a different food dish',
      'a photo of an unrelated object or scene',
    ];
    const out = await zs(img, labels);
    const s = out.find((o) => o.label === labels[0])?.score ?? 0;
    return { score: s, w: img.width, h: img.height };
  } catch {
    return { score: 0, dead: true };
  }
}

// ---- ru→en (dictionary first, then local qwen) ----
const DICT = [
  [/пельмен/i, 'pelmeni russian dumplings'], [/сырник/i, 'syrniki cottage cheese pancakes'],
  [/борщ/i, 'borscht beet soup'], [/блин/i, 'russian crepes blini'], [/оливье/i, 'olivier salad'],
  [/хачапури/i, 'khachapuri cheese bread'], [/хинкал/i, 'khinkali dumplings'], [/шаурм|шаверм/i, 'shawarma wrap'],
  [/плов/i, 'plov rice pilaf'], [/вареник/i, 'vareniki dumplings'], [/окрошк/i, 'okroshka cold soup'],
  [/солянк/i, 'solyanka soup'], [/щи\b/i, 'shchi cabbage soup'], [/голубц/i, 'stuffed cabbage rolls'],
  [/драник/i, 'potato pancakes draniki'], [/морс/i, 'red berry drink mors'], [/компот/i, 'fruit compote drink'],
  [/квас/i, 'kvass dark drink'], [/раф/i, 'raf coffee latte'], [/капучино/i, 'cappuccino coffee'],
  [/латте/i, 'latte coffee'], [/эспрессо/i, 'espresso coffee'], [/люля/i, 'lula kebab'],
  [/чебурек/i, 'cheburek fried pastry'], [/манты/i, 'manti steamed dumplings'],
  [/наггетс/i, 'chicken nuggets'], [/фри\b/i, 'french fries'], [/цезарь/i, 'caesar salad'],
];
async function toEnglish(name) {
  for (const [re, q] of DICT) if (re.test(name)) return q;
  try {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: `Translate the Russian dish/drink name into a short English food photo search query (2-4 words). Keep the dish TYPE correct.\nExamples:\nПельмени -> pelmeni dumplings\nТом ям -> tom yum soup\nМедовик -> honey cake medovik\nNow translate (answer with the query only): ${name}`,
        stream: false,
        options: { temperature: 0 },
      }),
    });
    const j = await r.json();
    return ((j.response ?? '').trim().split('\n')[0].replace(/["'.]/g, '').slice(0, 60)) || name;
  } catch {
    return name;
  }
}

async function pexelsCandidates(en) {
  if (!PEXELS) return { photos: [] };
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(en + ' food')}&per_page=6&orientation=landscape&size=large`,
    { headers: { Authorization: PEXELS } },
  );
  if (r.status === 429) return { rateLimited: true, photos: [] };
  if (!r.ok) return { photos: [] };
  const j = await r.json();
  return { photos: (j.photos ?? []).filter((ph) => ph.width >= 1200) };
}

// ---- run ----
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { startsWith: 'https://' } },
  select: { id: true, name: true, photoUrl: true, category: true },
  orderBy: { name: 'asc' },
});
// resume support: photos that already passed are skipped on re-runs
const OK_FILE = path.join(__dirname, 'verified-ok.json');
let okIds = new Set();
try { okIds = new Set(JSON.parse(fs.readFileSync(OK_FILE, 'utf8'))); } catch { /* first run */ }
const saveOk = () => { try { fs.writeFileSync(OK_FILE, JSON.stringify([...okIds])); } catch { /* ignore */ } };
const todo = items.filter((it) => !okIds.has(it.id));
console.log(`к проверке: ${todo.length} (пропущено уже проверенных: ${items.length - todo.length})`);

const report = { checked: 0, keptOk: 0, replaced: 0, nulled: 0, mismatches: [] };
let rateLimited = false;
for (const it of todo) {
  if (report.checked >= LIMIT) break;
  report.checked++;
  // brand drinks translate poorly ("Barefoot food") — steer by category
  const catHint = /вино/i.test(it.category ?? '') ? ' wine bottle'
    : /пиво/i.test(it.category ?? '') ? ' beer'
    : /коктейл/i.test(it.category ?? '') ? ' cocktail'
    : /кофе/i.test(it.category ?? '') ? ' coffee' : '';
  let en = await toEnglish(it.name);
  if (catHint && !en.toLowerCase().includes(catHint.trim().split(' ')[0])) en += catHint;
  const cur = await scorePhoto(it.photoUrl, en);
  const line = `${String(report.checked).padStart(4)}/${items.length} ${it.name} [${en}] тек=${cur.score.toFixed(2)}${(cur.w ?? 0) < 600 && !cur.dead ? ' МЕЛКОЕ' : ''}`;
  const tooSmall = (cur.w ?? 0) < 600; // not premium → replace even if it matches
  if (cur.score >= ACCEPT && !tooSmall) {
    report.keptOk++;
    okIds.add(it.id);
    if (report.checked % 20 === 0) saveOk();
    console.log(`${line} ✓`);
    continue;
  }
  // current photo FAILED → hunt for a verified premium replacement
  let best = null;
  if (!rateLimited) {
    const cands = await pexelsCandidates(en);
    if (cands.rateLimited) rateLimited = true;
    for (const ph of cands.photos) {
      const s = await scorePhoto(ph.src.large, en);
      if (s.score >= ACCEPT_NEW && (!best || s.score > best.score)) best = { url: ph.src.large, score: s.score };
      if (best && best.score > 0.75) break; // good enough, stop burning cycles
    }
  }
  if (best) {
    report.replaced++;
    okIds.add(it.id);
    console.log(`${line} → ЗАМЕНА (${best.score.toFixed(2)})`);
    if (!dry) await p.listing.update({ where: { id: it.id }, data: { photoUrl: best.url } }).catch(() => {});
  } else {
    report.nulled++;
    report.mismatches.push({ id: it.id, name: it.name, en, old: it.photoUrl, oldScore: +cur.score.toFixed(2) });
    console.log(`${line} → НЕТ СОВПАДЕНИЯ${rateLimited ? ' (pexels limit)' : ''}`);
    if (!dry) await p.listing.update({ where: { id: it.id }, data: { photoUrl: null } }).catch(() => {});
  }
}
saveOk();
fs.writeFileSync(path.join(__dirname, 'photo-verify-report.json'), JSON.stringify(report, null, 1));
console.log(`\nИтог: ok=${report.keptOk} заменено=${report.replaced} без-совпадения=${report.nulled}${rateLimited ? ' | Pexels limit — часть без кандидатов, перезапусти позже' : ''}`);
console.log('отчёт: prisma/photo-verify-report.json');
await p.$disconnect();
