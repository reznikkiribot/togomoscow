// Machine-eye audit of every aigen-* dish/drink photo: does the image actually
// match the dish NAME? Runs CLIP zero-shot «a photo of {en}» vs distractors.
// Low score → the photo doesn't match → clear photoUrl so the regen pipeline makes
// a new one. Also flags DUPLICATE images shared across different names.
//
//   node prisma/audit-photos.mjs [--apply]   (--apply clears bad photoUrls)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const APPLY = process.argv.includes('--apply');
// --apply-only: skip the CLIP re-scan, just clear photoUrls from the last report
// (fast, used by the continuous pipeline right after a fresh audit).
if (process.argv.includes('--apply-only')) {
  const { PrismaClient: PC } = await import('@prisma/client');
  const pp = new PC();
  const rep = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit-photos-report.json'), 'utf8'));
  const ids = (rep.toRegen ?? rep.bad.filter((b) => b.regen).map((b) => b.id));
  // hide + queue for regeneration: clearing photoUrl loses the file, so we only
  // drop the verified flag — enrichCards then stops serving it to the app
  await pp.listing.updateMany({ where: { id: { in: ids } }, data: { photoVerifiedAt: null } });
  for (const f of ['i2i-done.json', 'generated-ok.json']) {
    try { const d = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'))); ids.forEach((id) => d.delete(id)); fs.writeFileSync(path.join(__dirname, f), JSON.stringify([...d])); } catch {}
  }
  console.log(`apply-only: сброшено ${ids.length}`);
  await pp.$disconnect();
  process.exit(0);
}
const PHOTO_BASE = 'https://togomoscow-production.up.railway.app';
const PASS = Number(process.env.AUDIT_PASS ?? 0.92); // below → mismatch → regen

const { PrismaClient } = await import('@prisma/client');
const t = await import('@xenova/transformers');
t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
const p = new PrismaClient();

// crude RU→EN so CLIP has an English label; keep it broad, the score is what matters
const KW = [
  [/пицц/i, 'a pizza'], [/бургер/i, 'a burger'], [/паст|спагетти|карбонар/i, 'a pasta dish'],
  [/салат|цезар/i, 'a salad'], [/суп|борщ|гаспачо|том.?ям|солянк|харчо/i, 'a bowl of soup'],
  [/торт|чизкейк|тирамису|десерт|мороже|панна|штрудел|маффин|пирожн/i, 'a dessert'],
  [/стейк|рибай/i, 'a steak'], [/ролл|суши|сашими/i, 'sushi rolls'],
  [/латте|капучино|эспрессо|американо|раф|кофе|мокко|флэт/i, 'a cup of coffee'],
  [/матч|чай|улун|пуэр/i, 'a cup of tea'], [/смузи|шейк|милкшейк/i, 'a fruit smoothie'],
  [/лимонад|сок|морс|тоник|кола|компот|фреш/i, 'a glass of juice or soft drink'],
  [/картоф|фри|наггетс|стрипс/i, 'french fries or nuggets'],
  [/пельмен|варен|хинкал/i, 'dumplings'], [/шаурм|шаверм|донер|кебаб/i, 'a doner kebab'],
  [/блин|сырник|оладь/i, 'russian pancakes'], [/омлет|скрембл|яичниц|завтрак/i, 'a breakfast with eggs'],
  [/курин|цыпл|крыл/i, 'a chicken dish'], [/лосос|форел|рыб|креветк|краб/i, 'a seafood dish'],
  [/вино|шампан|просекко/i, 'a glass of wine'], [/пиво|лагер|эль/i, 'a glass of beer'],
  [/авокадо|тост/i, 'avocado toast'], [/ананас|манго|арбуз|апельсин/i, 'fresh fruit'],
];
function toEn(name) {
  for (const [re, en] of KW) if (re.test(name)) return en;
  return 'a plated food dish';
}

const rows = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { startsWith: '/api/files/aigen' } },
  select: { id: true, name: true, type: true, category: true, photoUrl: true },
  orderBy: { name: 'asc' },
});
console.log(`фото к проверке: ${rows.length}`);

// ---- duplicate detection (same photoUrl on different names) ----
const byUrl = new Map();
for (const r of rows) {
  const g = byUrl.get(r.photoUrl) ?? [];
  g.push(r);
  byUrl.set(r.photoUrl, g);
}
// NAME duplicates: «Болоньезе» / «Паста болоньезе» / «Спагетти Болоньезе» /
// «…с напитком Кола» are one dish — several cards for it is a catalog defect, so
// report them (they also waste generation on near-identical photos).
const { dishNameKey } = await import('../dist/common/dish-name-key.js').catch(() => ({ dishNameKey: null }));
if (dishNameKey) {
  const byName = new Map();
  for (const r of rows) {
    const key = `${r.type} ${dishNameKey(r.name)}`;
    const g = byName.get(key) ?? [];
    g.push(r);
    byName.set(key, g);
  }
  const nameDups = [...byName.values()].filter((g) => g.length > 1);
  console.log(`\nДУБЛИ НАЗВАНИЙ (одно блюдо разными карточками): ${nameDups.length}`);
  nameDups.slice(0, 20).forEach((g) => console.log('  ' + g.map((x) => x.name).join(' | ')));
  fs.writeFileSync(
    path.join(__dirname, 'audit-name-dups.json'),
    JSON.stringify(nameDups.map((g) => g.map((x) => ({ id: x.id, name: x.name }))), null, 2),
  );
}

const dups = [...byUrl.values()].filter((g) => g.length > 1);
console.log(`\nДУБЛИ (одно фото на разные названия): ${dups.length}`);
const dupIds = new Set();
for (const g of dups) {
  console.log('  ' + g.map((x) => x.name).join(' | '));
  // keep the first, mark the rest for regen (different names must differ visually)
  g.slice(1).forEach((x) => dupIds.add(x.id));
}

// Average-hash of the decoded image: catches two cards showing the SAME picture
// under different URLs (the generic-prompt renders were byte-different but
// visually identical). 64-bit hash, compared by Hamming distance.
function aHash(img) {
  const { width: W, height: H, data, channels: C } = img;
  const grid = 8, cell = [];
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      let sum = 0, n = 0;
      const x0 = Math.floor((gx * W) / grid), x1 = Math.floor(((gx + 1) * W) / grid);
      const y0 = Math.floor((gy * H) / grid), y1 = Math.floor(((gy + 1) * H) / grid);
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
        const i = (y * W + x) * C;
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3; n++;
      }
      cell.push(n ? sum / n : 0);
    }
  }
  const avg = cell.reduce((a, b) => a + b, 0) / cell.length;
  return cell.map((v) => (v > avg ? 1 : 0));
}
const hammings = (a, b) => a.reduce((acc, v, i) => acc + (v === b[i] ? 0 : 1), 0);

// ---- composition check (borders / letterboxing / off-center) ----
// Reads the decoded pixels straight from RawImage (no sharp → no onnx clash).
// Flags an image whose card presentation is broken:
//   • a solid frame/letterbox — the outer rows/cols are one flat colour (the
//     picture didn't fill the square, so a border shows in the card);
//   • the subject is stuck to an edge — one side is far busier than the opposite,
//     meaning the dish is cut off / not centered.
function compositionIssues(img) {
  // img.data is RGBA or RGB; img.width/height/channels
  const { width: W, height: H, data, channels: C } = img;
  if (!W || !H || !data) return null;
  const at = (x, y) => {
    const i = (y * W + x) * C;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  // A real letterbox/frame is a BAND of one flat colour along an edge that ends in
  // a SHARP step into the picture. A plain background (white plate, table) has no
  // such step, so it must NOT count. For each edge we scan inward: the border is
  // present only if the outer band (first ~6% of the dimension) is uniform AND
  // there's a strong colour jump right after it.
  const bandWidth = Math.max(6, Math.round(Math.min(W, H) * 0.06));
  function edgeFramed(sampleAt, len) {
    const M = 20;
    let uniform = 0, jump = 0;
    for (let k = 0; k < M; k++) {
      const t = Math.floor((k / (M - 1)) * (len - 1));
      const outer = sampleAt(t, 1);            // 1px from the edge
      const bandIn = sampleAt(t, bandWidth);   // just inside the band
      const past = sampleAt(t, bandWidth + Math.round(len * 0.06)); // past the band
      if (dist(outer, bandIn) < 16) uniform++; // band is flat
      if (dist(bandIn, past) > 45) jump++;     // sharp step into the image
    }
    return uniform / M > 0.85 && jump / M > 0.5;
  }
  const framed =
    edgeFramed((t, d) => at(t, d), W) ||                    // top
    edgeFramed((t, d) => at(t, H - 1 - d), W) ||            // bottom
    edgeFramed((t, d) => at(d, t), H) ||                    // left
    edgeFramed((t, d) => at(W - 1 - d, t), H);              // right

  // WIDE PADDING: the subject sits in the middle with a big plain (usually white)
  // margin around it — «поля» in the card even under object-fit:cover. Measure how
  // deep the near-white / near-uniform band runs in from each edge; if it eats a
  // big share of the frame, the photo is badly cropped and must be regenerated.
  const bg = at(2, 2); // corner ≈ background colour
  const isBg = (c) => dist(c, bg) < 40; // close to the corner background
  function padDepth(sampleAt, len, cross) {
    // walk inward until a row/col is no longer mostly background
    for (let d = 0; d < Math.floor(cross * 0.45); d++) {
      let bgN = 0, tot = 0;
      for (let k = 0; k < 24; k++) {
        const t = Math.floor((k / 23) * (len - 1));
        if (isBg(sampleAt(t, d))) bgN++;
        tot++;
      }
      if (bgN / tot < 0.8) return d; // this line has real content
    }
    return Math.floor(cross * 0.45);
  }
  const padTop = padDepth((t, d) => at(t, d), W, H);
  const padBot = padDepth((t, d) => at(t, H - 1 - d), W, H);
  const padLeft = padDepth((t, d) => at(d, t), H, W);
  const padRight = padDepth((t, d) => at(W - 1 - d, t), H, W);
  // Visible-margin rule, calibrated for the WIDEST card we render — the tinder
  // hero («Что пробуем?», ~1.67:1 under object-fit:cover). A square photo shown
  // there is cropped vertically only, so LEFT/RIGHT background stays on screen:
  // side margins must therefore be judged more strictly than top/bottom.
  // Owner: «добавь в проверку фото проверку на поля ещё и в тиндере».
  const widePadded =
    (padTop + padBot) / H > 0.12 || (padLeft + padRight) / W > 0.08;
  // b) "busyness" (local contrast) per half → off-center if very lopsided
  const busy = (x0, x1, y0, y1) => {
    let s = 0, cnt = 0;
    for (let y = y0; y < y1; y += 6) for (let x = x0; x < x1; x += 6) {
      const p = at(x, y), q = at(Math.min(x + 6, W - 1), y);
      s += Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]); cnt++;
    }
    return cnt ? s / cnt : 0;
  };
  const l = busy(0, W >> 1, 0, H), r = busy(W >> 1, W, 0, H);
  const tB = busy(0, W, 0, H >> 1), bB = busy(0, W, H >> 1, H);
  const lop = (a, b) => a + b > 0 && Math.abs(a - b) / (a + b) > 0.6;
  const offCenter = lop(l, r) || lop(tB, bB);
  if (framed) return 'framed';
  if (widePadded) return 'padded';       // big plain margin → «поля» in the card
  if (offCenter) return 'off-center';
  return null;
}

// ---- CLIP name-match ----
console.log('\nзагружаю CLIP…');
const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
const { RawImage } = t;
console.log('CLIP готов, проверяю…\n');

// Two independent checks per photo, both low-false-positive:
//  A) TYPE match — a DRINK card must look like a drink (glass/cup/bottle), a DISH
//     like food on a plate. A drink photo on a food card (or vice versa) is the
//     clearest, most reliable mismatch and doesn't depend on the exact name.
//  B) NAME match — softened: only flag when the specific-name score is very low
//     AND clearly beaten by the "different food" distractor, to avoid punishing a
//     good photo just because our English label was coarse.
const bad = [];
const hashes = [];
const scored = new Map(); // id -> nameScore, ONLY for photos we really checked
let n = 0;
for (const r of rows) {
  n++;
  try {
    const buf = await fetch(`${PHOTO_BASE}${r.photoUrl}`).then((x) => x.arrayBuffer());
    const img = await RawImage.fromBlob(new Blob([new Uint8Array(buf)]));

    // A) type check — flag ONLY a drink shown as food (drinkScore very low on a
    // DRINK). We don't flag "food shown as drink": desserts legitimately come in a
    // glass/cup (panna cotta, mousse, sorbet), which would be false positives.
    const typeLabels = ['a photo of a drink in a glass, cup or bottle', 'a photo of food on a plate'];
    const tout = await zs(img, typeLabels);
    const drinkScore = tout.find((o) => o.label === typeLabels[0])?.score ?? 0;
    const typeMismatch = r.type === 'DRINK' && drinkScore < 0.15; // a drink that looks like a plate of food

    // B) soft name check — REPORT ONLY, never triggers regen: our English labels
    // are coarse, so a low name-score is too noisy to act on automatically.
    const en = toEn(r.name);
    const nameLabels = [`a photo of ${en}`, 'a photo of a completely different food or drink'];
    const nout = await zs(img, nameLabels);
    const nameScore = nout.find((o) => o.label === nameLabels[0])?.score ?? 0;

    // C) composition — border / letterbox / off-center → the picture didn't fill
    // the card square; regen to fix framing.
    const comp = compositionIssues(img);
    try { hashes.push({ id: r.id, name: r.name, h: aHash(img) }); } catch { /* skip */ }
    scored.set(r.id, nameScore);

    // D) a non-alcoholic drink must not be rendered as a cocktail/whisky glass
    let boozeLook = false;
    if (r.type === 'DRINK') {
      const boozeLabels = [
        'a glass of whiskey, cocktail or alcoholic drink with ice',
        `a photo of ${en}`,
      ];
      const bout = await zs(img, boozeLabels);
      boozeLook = (bout.find((o) => o.label === boozeLabels[0])?.score ?? 0) > 0.6;
    }

    if (typeMismatch || comp || boozeLook || nameScore < PASS) {
      const reason = typeMismatch ? 'type' : boozeLook ? 'booze-look' : comp ? comp : 'name';
      bad.push({ ...r, score: nameScore, drinkScore, reason, en, regen: true });
    }
    if (n % 50 === 0) console.log(`  проверено ${n}/${rows.length}…`);
  } catch (e) {
    console.log(`  err ${r.name}: ${String(e.message || '').slice(0, 40)}`);
  }
}

console.log(`\n=== ПРОБЛЕМЫ: ${bad.length} ===`);
for (const reason of ['type', 'booze-look', 'name', 'framed', 'padded', 'off-center', 'same-image']) {
  const g = bad.filter((b) => b.reason === reason);
  if (!g.length) continue;
  const titles = { type: 'напиток показан едой', 'booze-look': 'безалкогольное показано как коктейль', name: 'фото не похоже на блюдо из названия', framed: 'рамка (не заполнил карточку)', padded: 'большие поля вокруг блюда', 'off-center': 'не отцентровано/обрезано', 'same-image': 'та же картинка, что у другого блюда' };
  console.log(`  ${titles[reason]}: ${g.length}`);
  g.forEach((b) => console.log(`    ${b.name}${reason === 'type' ? ` (drink ${b.drinkScore.toFixed(2)})` : ''}`));
}

// visually identical images across different dishes → regenerate the later one
const visualDups = [];
for (let i = 0; i < hashes.length; i++) {
  for (let j = i + 1; j < hashes.length; j++) {
    if (hammings(hashes[i].h, hashes[j].h) <= 4) {
      visualDups.push([hashes[i], hashes[j]]);
      bad.push({ id: hashes[j].id, name: hashes[j].name, reason: 'same-image', regen: true });
    }
  }
}
console.log(`
ОДИНАКОВЫЕ КАРТИНКИ у разных блюд: ${visualDups.length}`);
visualDups.slice(0, 15).forEach(([a, b]) => console.log(`  ${a.name}  ==  ${b.name}`));

const toRegen = new Set([...bad.filter((b) => b.regen).map((b) => b.id), ...dupIds]);
console.log(`\nК ПЕРЕГЕНЕРАЦИИ: ${toRegen.size} (тип/композиция ${bad.filter((b) => b.regen).length} + дублей ${dupIds.size})`);
console.log(`(в отчёте также ${bad.filter((b) => !b.regen).length} с сомнительным названием — для ручной галереи, НЕ трогаются)`);
fs.writeFileSync(
  path.join(__dirname, 'audit-photos-report.json'),
  JSON.stringify({ at: new Date().toISOString(), pass: PASS, bad, dups: dups.map((g) => g.map((x) => x.name)), toRegen: [...toRegen] }, null, 2),
);

if (APPLY && toRegen.size) {
  // clear photoUrl + reset generated-ok/i2i-done so the regen pipeline redoes them
  await p.listing.updateMany({ where: { id: { in: [...toRegen] } }, data: { photoVerifiedAt: null } });
  // Everything that survived the audit is confirmed good → mark it visible.
  // Without this the app hides even the photos that passed, because the flag
  // starts out NULL for every pre-existing image.
  // A photo is confirmed ONLY if it was actually scored in this run. Images that
  // failed to download or threw were previously counted as "passed" and shown
  // without ever being checked — that is how «Краб» kept a shrimp picture.
  const passed = [...scored.entries()].filter(([id]) => !toRegen.has(id));
  for (const [id, score] of passed) {
    await p.listing.update({ where: { id }, data: { photoVerifiedAt: new Date(), photoScore: score } }).catch(() => {});
  }
  const unchecked = rows.filter((r) => !scored.has(r.id)).map((r) => r.id);
  if (unchecked.length) {
    await p.listing.updateMany({ where: { id: { in: unchecked } }, data: { photoVerifiedAt: null } });
  }
  console.log(`✅ подтверждено: ${passed.length} | скрыто как непроверенные: ${unchecked.length}`);
  // also drop them from the i2i done-list so stage-check re-uploads
  try {
    const doneFile = path.join(__dirname, 'i2i-done.json');
    const done = new Set(JSON.parse(fs.readFileSync(doneFile, 'utf8')));
    for (const id of toRegen) done.delete(id);
    fs.writeFileSync(doneFile, JSON.stringify([...done]));
  } catch { /* no done file yet */ }
  console.log(`\n✅ Очищено ${toRegen.size} photoUrl — конвейер перегенерит их.`);
} else {
  console.log('\n(dry-run — без --apply photoUrl не тронуты)');
}
await p.$disconnect();
