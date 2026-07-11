// Generates card images for the items that failed strict CLIP verification
// (photo-verify-report.json → mismatches) with LOCAL Stable Diffusion (sd-turbo,
// Vulkan). Two stages, because onnxruntime (CLIP) + child-process spawning in one
// node process segfaults on Windows:
//   --stage-gen    only run sd-cli: 3 seeds per item → tools/sd/out/<id>-<n>.png
//   --stage-check  only CLIP-score the PNGs, upload the best (≥0.5) to the bucket
//                  as aigen-<uuid> and set listing.photoUrl
// The aigen- prefix makes the frontend show the «Сгенерировано ИИ» disclaimer.
//   node prisma/generate-missing-photos.mjs --stage-gen | --stage-check [--dry] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const dry = process.argv.includes('--dry');
const STAGE = process.argv.includes('--stage-gen') ? 'gen' : process.argv.includes('--stage-check') ? 'check' : 'both';
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const SD = path.join(__dirname, '..', '..', 'tools', 'sd');
const ACCEPT = 0.5; // generated image must beat the distractors, same bar as real photos

// heavy deps are stage-scoped: CLIP/S3/sharp only for check (gen must stay spawn-only)
let zs = null, RawImage = null, s3 = null, creds = null, PutObjectCommand = null;
if (STAGE !== 'gen') {
  const aws = await import('@aws-sdk/client-s3');
  PutObjectCommand = aws.PutObjectCommand;
  creds = JSON.parse(
    execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }),
  );
  s3 = new aws.S3Client({
    endpoint: creds.endpoint,
    region: creds.region,
    credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    forcePathStyle: creds.urlStyle !== 'virtual-host',
  });
  console.log('загружаю CLIP…');
  const t = await import('@xenova/transformers');
  t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
  RawImage = t.RawImage;
  zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  console.log('CLIP готов');
}

async function scoreFile(file, en) {
  const img = await RawImage.fromBlob(new Blob([new Uint8Array(fs.readFileSync(file))]));
  const labels = [`a photo of ${en}`, 'a photo of a different food dish', 'a photo of an unrelated object or scene'];
  const out = await zs(img, labels);
  return out.find((o) => o.label === labels[0])?.score ?? 0;
}

// ---- manual EN fixes for names qwen mangled in the report ----
const EN_FIX = [
  [/имбирн/i, 'ginger tea drink'], [/капрезе/i, 'caprese salad with mozzarella and tomatoes'],
  [/по-киевски/i, 'chicken kiev cutlet'], [/круассан с миндал/i, 'almond croissant'],
  [/круассан/i, 'french croissant'], [/курага/i, 'dried apricots'],
  [/куриный суп/i, 'chicken noodle soup'], [/лечо/i, 'lecho pepper and tomato stew'],
  [/лютениц/i, 'lyutenitsa red pepper relish'], [/малиновый арбуз/i, 'raspberry watermelon lemonade'],
  [/матча/i, 'iced matcha tonic drink'], [/бараш/i, 'lamb burger on a bun'],
  [/красная икра/i, 'red salmon caviar in a bowl'], [/майонез/i, 'mayonnaise sauce in a bowl'],
  [/^мёд$|^мед$/i, 'honey in a glass jar'],
  [/минестроне/i, 'minestrone vegetable soup'], [/огурц/i, 'pickled cucumbers on a plate'],
  [/оливье/i, 'olivier russian salad with mayonnaise'], [/чесночн/i, 'garlic dip sauce in a small bowl'],
  [/палтус/i, 'halibut fish fillet with butter sauce'], [/панна котта/i, 'panna cotta dessert with berry coulis'],
  [/физз|черноголовка/i, 'glass of cherry soda with ice'], [/пибимпаб/i, 'korean bibimbap rice bowl with vegetables and egg'],
  [/пирожок/i, 'baked hand pie pastry'], [/^плов/i, 'uzbek plov rice with lamb and carrots in a plate'],
  [/пожарск/i, 'breaded chicken cutlets with mashed potatoes'], [/пхали/i, 'georgian pkhali vegetable balls with walnut'],
  [/расстегай/i, 'russian rasstegai open-top baked pie'], [/ризотто/i, 'creamy italian risotto in a plate'],
  [/калифорния|ролл/i, 'california sushi rolls with crab and avocado'], [/самса/i, 'uzbek samsa baked meat pastry'],
  [/сациви/i, 'georgian satsivi chicken in walnut sauce'], [/свекольник/i, 'cold beet soup with sour cream'],
  [/сок вишн|баринофф/i, 'glass of cherry juice'], [/сет/i, 'sushi and rolls set on a wooden platter'],
  [/темпура/i, 'japanese shrimp tempura in batter'], [/тирамису/i, 'tiramisu dessert with cocoa on a plate'],
  [/том ям/i, 'tom yum soup with shrimp and lime'], [/узелки/i, 'sweet knotted buns pastry'],
  [/французский торт/i, 'french layered cream cake slice'], [/хумус/i, 'hummus plate with olive oil and pita'],
  [/чахохбили/i, 'georgian chakhokhbili chicken stew with tomatoes'], [/четыре сыра/i, 'four cheese pizza'],
  [/шницель/i, 'milanese breaded schnitzel cutlet'], [/штрудель/i, 'apple strudel with ice cream scoop'],
  [/тарталетка/i, 'berry tartlet dessert'], [/бенедикт/i, 'eggs benedict with hollandaise sauce on english muffin'],
  [/соус карри/i, 'curry sauce in a dipping bowl'], [/соус ореховый/i, 'walnut sauce in a dipping bowl'],
  [/соус/i, 'sauce in a small dipping bowl'], [/накаяма|рейк|фигаро|эфенди/i, 'craft cocktail in a glass on a bar counter'],

];
function fixEn(name, en) {
  for (const [re, q] of EN_FIX) if (re.test(name)) return q;
  return en;
}

const todoFile = fs.existsSync(path.join(__dirname, 'gen-todo.json')) ? 'gen-todo.json' : 'photo-verify-report.json';
console.log('источник задания:', todoFile);
const report = JSON.parse(fs.readFileSync(path.join(__dirname, todoFile), 'utf8'));
const doneFile = path.join(__dirname, 'generated-ok.json');
let done = new Set();
try { done = new Set(JSON.parse(fs.readFileSync(doneFile, 'utf8'))); } catch { /* first run */ }
const todo = report.mismatches.filter((m) => !done.has(m.id));
console.log(`стадия=${STAGE}, к обработке: ${todo.length} из ${report.mismatches.length}`);

const outDir = path.join(SD, 'out');
fs.mkdirSync(outDir, { recursive: true });
let made = 0, failed = 0, checked = 0;
for (const m of todo) {
  if (checked >= LIMIT) break;
  checked++;
  const item = await p.listing.findUnique({ where: { id: m.id }, select: { photoUrl: true } });
  if (!item || item.photoUrl) { done.add(m.id); fs.writeFileSync(doneFile, JSON.stringify([...done])); continue; }
  const en = fixEn(m.name, m.en);

  if (STAGE !== 'check') {
    for (let a = 0; a < 3; a++) {
      const rel = `out/${m.id}-${a}.png`;
      if (fs.existsSync(path.join(SD, rel))) continue; // resumable
      try {
        execFileSync('./sd-cli.exe', [
          '-m', 'sd_turbo.safetensors', '--steps', '5', '--cfg-scale', '1.0', '-W', '512', '-H', '512',
          '-s', String(1000 + a * 777), '-o', rel,
          '-p', `professional food photography of ${en}, restaurant plating, natural light, appetizing, high detail`,
        ], { stdio: 'pipe', timeout: 300000, cwd: SD });
        console.log(`gen ${m.name} [${en}] #${a}`);
      } catch (e) {
        console.log(`gen FAIL ${m.name} #${a}: ${String(e.message || '').slice(0, 100)}`);
      }
    }
  }

  if (STAGE !== 'gen') {
    let best = { score: 0, file: null };
    for (let a = 0; a < 3; a++) {
      const file = path.join(outDir, `${m.id}-${a}.png`);
      if (!fs.existsSync(file)) continue;
      const s = await scoreFile(file, en);
      if (s > best.score) best = { score: s, file };
    }
    if (best.score >= ACCEPT && best.file) {
      const key = `aigen-${randomUUID()}`;
      const png = fs.readFileSync(best.file); // sharp+onnxruntime in one process segfault (GLib clash) — ship the 512px PNG, ?w= resizes on delivery
      if (!dry) {
        await s3.send(new PutObjectCommand({ Bucket: creds.bucketName, Key: key, Body: png, ContentType: 'image/png' }));
        await p.listing.update({ where: { id: m.id }, data: { photoUrl: `/api/files/${key}` } });
      }
      made++;
      done.add(m.id);
      console.log(`OK ${m.name} -> /api/files/${key} (${best.score.toFixed(2)})`);
    } else {
      failed++;
      console.log(`SKIP ${m.name} — лучший скор ${best.score.toFixed(2)}`);
    }
    fs.writeFileSync(doneFile, JSON.stringify([...done]));
  }
}
console.log(`Итог (${STAGE}): загружено=${made} не прошло=${failed} обработано=${checked}`);
await p.$disconnect();
