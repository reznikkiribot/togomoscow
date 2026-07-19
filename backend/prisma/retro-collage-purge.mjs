// Retroactive quality gate for generated catalog photos already stored in prod.
// Checks every /api/files/aigen-* reference in both menu_links.photo_url and
// listings.photo_url. A rejected URL is detached from the card; the bucket
// object is intentionally kept, making the operation recoverable and idempotent.
//
//   node prisma/retro-collage-purge.mjs --dry
//   node prisma/retro-collage-purge.mjs --apply
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dry = process.argv.includes('--dry');
const apply = process.argv.includes('--apply');
if (dry === apply) {
  console.error('Specify exactly one mode: --dry or --apply');
  process.exit(1);
}

const limitIndex = process.argv.indexOf('--limit');
const LIMIT = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : Infinity;
if (!(LIMIT > 0)) {
  console.error('--limit must be a positive number');
  process.exit(1);
}

function productionUrl() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  // DATABASE_SSLMODE is only a local-client escape hatch. Production and Linux
  // runs use the requested URL unchanged apart from the connection limits.
  const sslMode = process.env.DATABASE_SSLMODE
    ? `&sslmode=${encodeURIComponent(process.env.DATABASE_SSLMODE)}`
    : '';
  return `${raw}${separator}connect_timeout=30&connection_limit=1${sslMode}`;
}

process.env.DATABASE_URL = productionUrl();
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
let tempDir = null;

const BASE = (process.env.PUBLIC_APP_URL || 'https://togomoscow-production.up.railway.app').replace(/\/$/, '');
const AIGEN_PREFIX = '/api/files/aigen-';
const COLLAGE_ACCEPT = 0.68; // same threshold as regen-per-venue.mjs
const NAME_ACCEPT = 0.5; // same product rule as reviews.service.ts
const COLLAGE_LABELS = [
  'a food collage or grid showing multiple separate dishes and photos',
  'one single dish in one continuous photograph',
];
const UNRELATED_LABEL = 'a photo of a different unrelated food, drink, object, screenshot or scene';

async function retryP1001(label, fn) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = String(error?.message ?? error);
      const transient = error?.code === 'P1001' || message.includes('P1001');
      if (!transient || attempt === 6) throw error;
      const delayMs = attempt * 5000;
      console.log(`P1001: ${label}, retry ${attempt}/6 in ${delayMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Mirrors reviews.service.ts/toFoodQuery and adds the menu categories that occur
// in historical imports. CLIP ViT-B/32 understands the English query reliably.
const FOOD_DICT = [
  // Dish/drink type comes before ingredients: «малиновый кофе» is coffee, and
  // «чизкейк с малиной» is dessert, not a bowl of raspberries.
  [/пицц|пепперони|маргарита.*кругл/i, 'pizza'],
  [/тирамису|чизкейк|торт(?!иль)|медовик|десерт|эклер|штрудель|тарталетк|панна|павлова/i, 'cake dessert'],
  [/кофе(?!мания)|латте|капучин|раф(?:[^а-яёa-z0-9]|$)|эспрессо|американо|флэт|мокко|кортадо|пикколо|глясе/i, 'cup of coffee'],
  [/чай|матча|улун|пуэр|айс.?ти/i, 'cup of tea'], [/смузи/i, 'smoothie in a glass'],
  [/паст|спагетти|карбонар|болонье|тальятел|тальолин|феттучин/i, 'pasta with sauce'],
  [/суп|рамен|том.?ям|гаспачо|солянк|харчо|мисо|фо.?бо|уха|бульон/i, 'soup in a bowl'],
  [/салат|цезарь|греческ|нисуаз|детокс/i, 'salad'],
  [/пельмен/i, 'pelmeni dumplings'], [/сырник/i, 'cottage cheese pancakes'], [/борщ/i, 'borscht beet soup'],
  [/блин/i, 'russian crepes'], [/оливье/i, 'olivier salad'], [/хачапур/i, 'khachapuri cheese bread'],
  [/хинкал/i, 'khinkali dumplings'], [/бургер|чизбургер/i, 'burger'],
  [/суши|ролл|сашими|нигир|гункан/i, 'sushi rolls'], [/стейк|рибай|миньон|бриск/i, 'grilled steak'],
  [/мороженое|пломбир|сорбет|джелато/i, 'ice cream'], [/круассан|булочк|слойк|даниш|плюшк/i, 'pastry'],
  [/пирог|расстега|рогалик|хлеб/i, 'bread or baked pastry'], [/каша|овсян|пшён|рисов.*каш/i, 'porridge in a bowl'],
  [/какао/i, 'cup of hot cocoa'], [/молоко/i, 'glass of milk'], [/йогурт/i, 'yogurt'],
  [/лимонад|морс|сок|компот|тоник|фреш|кола|coca.?cola|pepsi|evervess/i, 'cold non-alcoholic drink in a glass'], [/коктейл|мохито|негрони|спритц/i, 'cocktail in a glass'],
  [/пиво|лагер|эль|стаут|портер|сидр|нефильтр/i, 'glass of beer'], [/вино|шардоне|мерло|просекко|брют|рислинг|каберне/i, 'glass or bottle of wine'],
  [/картофель.?фри|(?:^|[^а-яёa-z0-9])фри(?:[^а-яёa-z0-9]|$)|батат/i, 'french fries'], [/картофельн.*пюре|пюре/i, 'mashed potatoes'],
  [/(?:^|[^а-яёa-z0-9])сыр(?:[^а-яёa-z0-9]|$)|пармезан|моцарелл|горгонзол/i, 'cheese'], [/креветк/i, 'shrimp dish'],
  [/лосос|сёмг|семг|рыб|палтус|тунец|форел/i, 'fish dish'], [/курин|курица|цыпл|наггетс|крыл/i, 'chicken dish'],
  [/котлет|тефтел|фрикадел/i, 'meat cutlet'], [/ветчин|колбас|свинин|говядин|индейк/i, 'meat dish'],
  [/яич|омлет|бенедикт|скрэмбл/i, 'eggs'], [/вок|лапша|удон|пад.?тай/i, 'noodles'], [/(?:^|[^а-яёa-z0-9])рис(?:[^а-яёa-z0-9]|$)|плов|тяхан/i, 'rice dish'],
  [/клубник/i, 'fresh strawberries'], [/малин/i, 'raspberries'], [/шпинат|кабач|овощ/i, 'vegetable dish'],
  [/мёд|мед(?:[^а-яёa-z0-9]|$)/i, 'honey'], [/майонез|соус|икра/i, 'sauce or spread'],
];

function toFoodQuery(name, category) {
  const value = (category ?? '').toLowerCase();
  // Curated category is stronger than an ingredient word in a compound name.
  if (/кофе/.test(value)) return 'cup of coffee';
  if (/чай/.test(value)) return 'cup of tea';
  if (/десерт|выпечк/.test(value)) return 'dessert or pastry';
  if (/суп/.test(value)) return 'soup in a bowl';
  if (/салат/.test(value)) return 'salad';
  if (/пицц/.test(value)) return 'pizza';
  if (/паст/.test(value)) return 'pasta with sauce';
  if (/смузи/.test(value)) return 'smoothie in a glass';
  for (const [pattern, query] of FOOD_DICT) if (pattern.test(name)) return query;
  // A strong word in the name (e.g. «виноградный улун») beats a historically
  // misclassified generic alcohol category. Foreign brand names still use it.
  if (/пив/.test(value)) return 'glass of beer';
  if (/вин/.test(value)) return 'glass or bottle of wine';
  if (/напит|лимонад|сок|смузи|безалкоголь/.test(value)) return 'drink in a glass';
  return 'plated restaurant food';
}

function loadTranslationCache() {
  const translations = new Map();
  const usefulEnglish = (value) => {
    const text = String(value ?? '').trim().toLowerCase();
    return /^[a-z0-9][a-z0-9 '&-]{1,79}$/.test(text)
      && !/^(?:restaurant )?(?:plated )?(?:food|dish|drink|meal)$|^italian (?:pizza|pasta dish)$|^(?:refreshing|specialty) (?:drink|coffee drink)(?: in a (?:glass|cup))?$/.test(text);
  };
  try {
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-todo.json'), 'utf8'));
    for (const row of json.mismatches ?? []) {
      const en = String(row.en ?? '').trim().toLowerCase();
      if (usefulEnglish(en)) translations.set(normalizeKey(row.name), en);
    }
  } catch { /* dictionary/category fallback is complete */ }
  return translations;
}

const normalizeKey = (value) => String(value ?? '')
  .toLocaleLowerCase('ru-RU')
  .replace(/ё/g, 'е')
  .replace(/[^a-zа-я0-9]+/g, ' ')
  .trim();

async function loadClip() {
  console.log('Загружаю CLIP…');
  const transformers = await import('@xenova/transformers');
  transformers.env.cacheDir = path.join(__dirname, '..', '.models-cache');
  const model = 'Xenova/clip-vit-base-patch32';
  const embedder = await transformers.pipeline('image-feature-extraction', model);
  const tokenizer = await transformers.AutoTokenizer.from_pretrained(model);
  const textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(model);

  const normalizeVector = (values) => {
    const vector = Array.from(values);
    const length = Math.hypot(...vector) || 1;
    return vector.map((value) => value / length);
  };
  const cosine = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
  const probabilities = (imageVector, textVectors) => {
    const similarities = textVectors.map((vector) => cosine(imageVector, vector));
    const logits = similarities.map((similarity) => similarity * 100);
    const max = Math.max(...logits);
    const exponents = logits.map((logit) => Math.exp(logit - max));
    const total = exponents.reduce((sum, value) => sum + value, 0);
    return { similarities, probabilities: exponents.map((value) => value / total) };
  };
  async function textVectors(labels) {
    const vectors = [];
    for (let offset = 0; offset < labels.length; offset += 128) {
      const batch = labels.slice(offset, offset + 128);
      const { text_embeds: embeddings } = await textModel(tokenizer(batch, { padding: true, truncation: true }));
      const [, dimension] = embeddings.dims;
      for (let index = 0; index < batch.length; index++) {
        vectors.push(normalizeVector(embeddings.data.slice(index * dimension, (index + 1) * dimension)));
      }
    }
    return vectors;
  }
  async function embedImage(buffer) {
    const image = await transformers.RawImage.fromBlob(new Blob([new Uint8Array(buffer)]));
    const output = await embedder(image, { pooling: 'mean', normalize: true });
    return normalizeVector(output.data);
  }
  console.log('CLIP готов');
  return { embedImage, probabilities, textVectors };
}

try {
  // Keep these sequential: the requested production URL has connection_limit=1.
  const menuLinks = await retryP1001('read menu links', () => prisma.menuLink.findMany({
    where: { photoUrl: { startsWith: AIGEN_PREFIX } },
    select: {
      venueId: true,
      itemId: true,
      photoUrl: true,
      item: { select: { name: true, category: true } },
    },
  }));
  const listings = await retryP1001('read listings', () => prisma.listing.findMany({
    where: { photoUrl: { startsWith: AIGEN_PREFIX } },
    select: { id: true, name: true, category: true, photoUrl: true },
  }));

  // One semantic assignment per (storage field kind, card, URL). A menu-link
  // assignment may fan out to many chain branches and is cleared in one update.
  const assignments = new Map();
  for (const link of menuLinks) {
    const key = `menuLink|${link.itemId}|${link.photoUrl}`;
    if (!assignments.has(key)) assignments.set(key, {
      kind: 'menuLink', itemId: link.itemId, name: link.item.name,
      category: link.item.category, photoUrl: link.photoUrl, sourceRows: 0,
    });
    assignments.get(key).sourceRows++;
  }
  for (const listing of listings) {
    const key = `listing|${listing.id}|${listing.photoUrl}`;
    assignments.set(key, {
      kind: 'listing', itemId: listing.id, name: listing.name,
      category: listing.category, photoUrl: listing.photoUrl, sourceRows: 1,
    });
  }

  const selectedAssignments = [...assignments.values()].slice(0, LIMIT);
  const selectedUrls = [...new Set(selectedAssignments.map((entry) => entry.photoUrl))];
  console.log(`Режим: ${dry ? 'DRY' : 'APPLY'}`);
  console.log(`К проверке: ${selectedUrls.length} файлов, ${selectedAssignments.length} назначений, ${selectedAssignments.reduce((sum, entry) => sum + entry.sourceRows, 0)} полей БД`);

  const translations = loadTranslationCache();
  const queries = new Map();
  for (const entry of selectedAssignments) {
    const dictionaryQuery = toFoodQuery(entry.name, entry.category);
    const query = dictionaryQuery === 'plated restaurant food'
      ? (translations.get(normalizeKey(entry.name)) || dictionaryQuery)
      : dictionaryQuery;
    queries.set(`${entry.name}\0${entry.category ?? ''}`, query);
  }
  // Download + structural analysis run in a sharp-only child process. The image
  // files are then reused by the ONNX-only parent, avoiding a second download.
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'togomoscow-retro-photo-'));
  const manifestPath = path.join(tempDir, 'manifest.json');
  const structureResultPath = path.join(tempDir, 'structure.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ base: BASE, cacheDir: tempDir, resultPath: structureResultPath, urls: selectedUrls }));
  execFileSync(process.execPath, [path.join(__dirname, 'retro-collage-structure-worker.mjs'), manifestPath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    timeout: 60 * 60_000,
  });
  const structureResults = new Map(JSON.parse(fs.readFileSync(structureResultPath, 'utf8')).map((entry) => [entry.photoUrl, entry]));

  const clip = await loadClip();
  const queryValues = [...new Set(queries.values())];
  const labels = [...COLLAGE_LABELS, UNRELATED_LABEL, ...queryValues.map((query) => `a photo of ${query}`)];
  const vectors = await clip.textVectors(labels);
  const collageVectors = vectors.slice(0, 2);
  const unrelatedVector = vectors[2];
  const queryVectors = new Map(queryValues.map((query, index) => [query, vectors[index + 3]]));

  const imageResults = new Map();
  let downloadErrors = 0;
  for (let index = 0; index < selectedUrls.length; index++) {
    const photoUrl = selectedUrls[index];
    try {
      const cached = structureResults.get(photoUrl);
      if (!cached || cached.error) throw new Error(cached?.error || 'missing structural result');
      const imageVector = await clip.embedImage(fs.readFileSync(cached.file));
      const collageScore = clip.probabilities(imageVector, collageVectors).probabilities[0];
      imageResults.set(photoUrl, { imageVector, structure: cached.structure, collageScore });
    } catch (error) {
      downloadErrors++;
      console.log(`  ERROR ${photoUrl}: ${String(error?.message ?? error).slice(0, 120)}`);
    }
    if ((index + 1) % 50 === 0) console.log(`  …файлов проверено ${index + 1}/${selectedUrls.length}`);
  }

  const rejected = [];
  const collageUrls = new Set();
  const mismatchUrls = new Set();
  for (const entry of selectedAssignments) {
    const image = imageResults.get(entry.photoUrl);
    if (!image) continue; // unavailable photos remain for a later idempotent run
    if (image.structure.collage || image.collageScore >= COLLAGE_ACCEPT) {
      collageUrls.add(entry.photoUrl);
      rejected.push({ ...entry, reason: 'collage', collageScore: image.collageScore, structure: image.structure });
      continue;
    }
    const query = queries.get(`${entry.name}\0${entry.category ?? ''}`);
    const nameVector = queryVectors.get(query);
    const score = clip.probabilities(image.imageVector, [nameVector, unrelatedVector]);
    const nameScore = score.probabilities[0];
    const closerToUnrelated = score.similarities[1] >= score.similarities[0];
    if (nameScore < NAME_ACCEPT || closerToUnrelated) {
      mismatchUrls.add(entry.photoUrl);
      rejected.push({ ...entry, reason: 'name-mismatch', query, nameScore, closerToUnrelated });
    }
  }

  for (const entry of rejected.slice(0, 100)) {
    const details = entry.reason === 'collage'
      ? `struct=${entry.structure.collage} clip=${entry.collageScore.toFixed(2)}`
      : `query="${entry.query}" name=${entry.nameScore.toFixed(2)} unrelated=${entry.closerToUnrelated}`;
    console.log(`  ${entry.reason === 'collage' ? 'COLLAGE' : 'MISMATCH'} ${entry.kind} «${entry.name}»: ${details} (${entry.sourceRows} fields)`);
  }
  if (rejected.length > 100) console.log(`  …ещё отклонено назначений: ${rejected.length - 100} (полный список в JSON-отчёте)`);

  let collageFields = 0;
  let mismatchFields = 0;
  if (apply) {
    for (const entry of rejected) {
      const result = entry.kind === 'menuLink'
        ? await retryP1001(`clear menu links ${entry.itemId}`, () => prisma.menuLink.updateMany({
            where: { itemId: entry.itemId, photoUrl: entry.photoUrl },
            data: { photoUrl: null },
          }))
        : await retryP1001(`clear listing ${entry.itemId}`, () => prisma.listing.updateMany({
            where: { id: entry.itemId, photoUrl: entry.photoUrl },
            data: { photoUrl: null },
          }));
      if (entry.reason === 'collage') collageFields += result.count;
      else mismatchFields += result.count;
    }
  } else {
    for (const entry of rejected) {
      if (entry.reason === 'collage') collageFields += entry.sourceRows;
      else mismatchFields += entry.sourceRows;
    }
  }

  const report = {
    at: new Date().toISOString(),
    mode: dry ? 'dry' : 'apply',
    checked: { files: imageResults.size, assignments: selectedAssignments.length, fields: selectedAssignments.reduce((sum, entry) => sum + entry.sourceRows, 0) },
    rejected: {
      collageFiles: collageUrls.size,
      collageAssignments: rejected.filter((entry) => entry.reason === 'collage').length,
      collageFields,
      mismatchFiles: mismatchUrls.size,
      mismatchAssignments: rejected.filter((entry) => entry.reason === 'name-mismatch').length,
      mismatchFields,
    },
    downloadErrors,
    entries: rejected.map((entry) => ({
      kind: entry.kind, itemId: entry.itemId, name: entry.name, photoUrl: entry.photoUrl,
      sourceRows: entry.sourceRows, reason: entry.reason,
      ...(entry.reason === 'collage'
        ? { structural: entry.structure.collage, collageScore: Number(entry.collageScore.toFixed(4)) }
        : { query: entry.query, nameScore: Number(entry.nameScore.toFixed(4)) }),
    })),
  };
  fs.writeFileSync(path.join(__dirname, `retro-collage-purge-${report.mode}.json`), JSON.stringify(report, null, 2));
  console.log(`\n[${report.mode.toUpperCase()}] коллажей: файлов=${report.rejected.collageFiles}, назначений=${report.rejected.collageAssignments}, полей=${report.rejected.collageFields}`);
  console.log(`[${report.mode.toUpperCase()}] мисматчей: файлов=${report.rejected.mismatchFiles}, назначений=${report.rejected.mismatchAssignments}, полей=${report.rejected.mismatchFields}`);
  console.log(`[${report.mode.toUpperCase()}] успешно проверено файлов=${report.checked.files}, ошибок загрузки=${downloadErrors}`);
} finally {
  await prisma.$disconnect().catch(() => {});
  if (tempDir) {
    const resolved = path.resolve(tempDir);
    const expectedParent = path.resolve(os.tmpdir());
    if (path.dirname(resolved) === expectedParent && path.basename(resolved).startsWith('togomoscow-retro-photo-')) {
      fs.rmSync(resolved, { recursive: true, force: true });
    }
  }
}
