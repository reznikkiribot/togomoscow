// Real dish photos from Pexels instead of AI generation.
//
// Why this replaced the generator: every local check we tried (CLIP, SigLIP 2)
// scores Russian dish names near zero — SigLIP 2 gives 0.0001 on a Russian label
// versus 0.0021 on the English one for the SAME image, so no honest threshold can
// be set. A real photograph of the actual dish needs no such verification.
//
// Pexels is free for commercial use and requires no attribution.
//   node prisma/pexels-dish-photos.mjs [--limit N] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i > 0 && !process.env[line.slice(0, i).trim()]) {
    process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const KEY = process.env.PEXELS_API_KEY;
if (!KEY) { console.log('нет PEXELS_API_KEY в backend/.env'); process.exit(1); }

const DRY = process.argv.includes('--dry');
const limArg = process.argv.indexOf('--limit');
const LIMIT = limArg > -1 ? Number(process.argv[limArg + 1]) : Infinity;

const { PrismaClient } = await import('@prisma/client');
const aws = await import('@aws-sdk/client-s3');
const p = new PrismaClient();
const creds = JSON.parse(
  execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }),
);
const s3 = new aws.S3Client({
  endpoint: creds.endpoint, region: creds.region,
  credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
  forcePathStyle: creds.urlStyle !== 'virtual-host',
});

// Russian dish word → English search term. Pexels indexes food in English, and a
// precise term is what makes the result actually match the dish.
const DISH_EN = [
  [/гаспачо/i, 'gazpacho soup'], [/борщ/i, 'borscht soup'], [/солянк/i, 'solyanka soup'],
  [/окрошк/i, 'okroshka cold soup'], [/харчо/i, 'kharcho soup'], [/том.?ям/i, 'tom yum soup'],
  [/уха|рыбный суп/i, 'fish soup'], [/крем.?суп|суп.?пюре/i, 'cream soup'], [/бульон/i, 'broth'],
  [/суп/i, 'soup'],
  [/пепперони/i, 'pepperoni pizza'], [/маргарит.*пицц|пицц.*маргарит/i, 'margherita pizza'],
  [/четыре сыра|4 сыра/i, 'four cheese pizza'], [/пицц/i, 'pizza'],
  [/чизбургер/i, 'cheeseburger'], [/бургер/i, 'burger'],
  [/карбонар/i, 'pasta carbonara'], [/болонье/i, 'pasta bolognese'], [/песто/i, 'pasta pesto'],
  [/лазань/i, 'lasagna'], [/паст|спагетти|феттучин|тальятелл/i, 'pasta dish'],
  [/цезар/i, 'caesar salad'], [/греческ.*салат/i, 'greek salad'], [/оливье/i, 'olivier salad'],
  [/салат/i, 'fresh salad'],
  [/ролл|суши|маки/i, 'sushi rolls'], [/сашими/i, 'sashimi'], [/поке/i, 'poke bowl'],
  [/том.?ям|вок|лапш/i, 'asian noodles'], [/рамен/i, 'ramen'],
  [/стейк|рибай|миньон/i, 'steak'], [/шашлык|кебаб/i, 'grilled meat skewers'],
  [/котлет/i, 'meat cutlet'], [/пельмен/i, 'dumplings'], [/хинкал/i, 'khinkali dumplings'],
  [/шаурм|шаверм/i, 'doner kebab wrap'], [/хачапур/i, 'khachapuri'], [/самса/i, 'samsa pastry'],
  [/плов/i, 'pilaf rice'], [/ризотто/i, 'risotto'], [/паэль/i, 'paella'],
  [/лосос|сёмга|семга/i, 'salmon dish'], [/форел/i, 'trout dish'], [/креветк/i, 'shrimp dish'],
  [/краб/i, 'crab dish'], [/мидии/i, 'mussels'], [/устриц/i, 'oysters'], [/икра/i, 'caviar'],
  [/тунец/i, 'tuna dish'], [/рыб/i, 'fish dish'],
  [/сырник/i, 'syrniki cottage cheese pancakes'], [/блин/i, 'russian pancakes'],
  [/оладь/i, 'pancakes'], [/вафл/i, 'waffles'], [/омлет/i, 'omelette'], [/яичниц/i, 'fried eggs'],
  [/каша|овсян/i, 'porridge bowl'], [/гранол/i, 'granola bowl'], [/тост/i, 'toast'],
  [/чизкейк/i, 'cheesecake'], [/тирамису/i, 'tiramisu'], [/наполеон/i, 'napoleon cake'],
  [/медовик/i, 'honey cake'], [/эклер/i, 'eclair'], [/круассан/i, 'croissant'],
  [/маффин|капкейк/i, 'muffin'], [/панна.?котт/i, 'panna cotta'], [/штрудел/i, 'apple strudel'],
  [/мороже|сорбет|пломбир/i, 'ice cream'], [/торт/i, 'cake slice'], [/пирожн/i, 'pastry'],
  [/пирог/i, 'pie'], [/десерт/i, 'dessert'], [/фондан/i, 'chocolate fondant'],
  [/халв/i, 'halva'], [/пахлав/i, 'baklava'],
  [/капучин/i, 'cappuccino'], [/латте/i, 'latte coffee'], [/раф/i, 'raf coffee'],
  [/эспрессо/i, 'espresso'], [/американо/i, 'americano coffee'], [/флэт.?уайт/i, 'flat white'],
  [/фильтр.?кофе|пуровер|дрип/i, 'filter coffee'], [/какао/i, 'hot cocoa'], [/кофе/i, 'coffee cup'],
  [/матч/i, 'matcha latte'], [/улун|пуэр|дарджилинг|ассам|эрл.?грей/i, 'tea cup'], [/чай/i, 'tea cup'],
  [/лимонад/i, 'lemonade glass'], [/смузи/i, 'smoothie glass'], [/милкшейк|шейк/i, 'milkshake'],
  [/морс/i, 'berry drink'], [/компот/i, 'fruit compote drink'], [/фреш|сок/i, 'fresh juice glass'],
  [/картоф.*фри|фри/i, 'french fries'], [/наггетс/i, 'chicken nuggets'],
  [/крыл/i, 'chicken wings'], [/курин|цыпл/i, 'chicken dish'], [/индейк/i, 'turkey dish'],
  [/говядин|бифстроган/i, 'beef dish'], [/свинин/i, 'pork dish'], [/баранин|люля/i, 'lamb dish'],
  [/овощи|гриль/i, 'grilled vegetables'], [/сыр/i, 'cheese plate'], [/хумус/i, 'hummus'],
  [/брускетт/i, 'bruschetta'], [/сэндвич|сендвич/i, 'sandwich'], [/боул/i, 'food bowl'],
];

function toQuery(name, category) {
  for (const [re, en] of DISH_EN) if (re.test(name)) return en;
  const byCat = {
    Пицца: 'pizza', Бургеры: 'burger', Паста: 'pasta dish', Салаты: 'fresh salad',
    Супы: 'soup', Десерты: 'dessert', Стейки: 'steak', Японская: 'sushi rolls',
    Кофе: 'coffee cup', Чай: 'tea cup', Смузи: 'smoothie glass',
    Безалкогольные: 'soft drink glass', Завтраки: 'breakfast plate', Фастфуд: 'fast food',
  };
  return byCat[category] ?? null; // no guess → skip the item rather than fake it
}

async function pexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}`
    + '&per_page=5&orientation=landscape&size=medium';
  const r = await fetch(url, { headers: { Authorization: KEY } }).then((x) => x.json()).catch(() => null);
  return r?.photos ?? [];
}

const rows = await p.listing.findMany({
  where: {
    type: { in: ['DISH', 'DRINK'] },
    photoVerifiedAt: null, // everything currently without a shown photo
    category: { notIn: ['Пиво', 'Вино', 'Крепкие напитки', 'Коктейли', 'Коктейль'] },
  },
  select: { id: true, name: true, category: true },
  orderBy: { reviewCount: 'desc' },
});
console.log(`позиций без показываемого фото: ${rows.length}`);

// one Pexels photo must not end up on two different dishes
const used = new Set();
let done = 0, skipped = 0, n = 0;
for (const r of rows) {
  if (n >= LIMIT) break;
  n++;
  const q = toQuery(r.name, r.category);
  if (!q) { skipped++; continue; }
  try {
    const photos = await pexels(q);
    const pick = photos.find((ph) => !used.has(ph.id));
    if (!pick) { skipped++; continue; }
    used.add(pick.id);
    if (DRY) { console.log(`  ${r.name.slice(0, 30)} → [${q}] ${pick.alt?.slice(0, 40)}`); done++; continue; }
    const buf = Buffer.from(await fetch(pick.src.large).then((x) => x.arrayBuffer()));
    const key = `dish-${randomUUID()}`;
    await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: key, Body: buf, ContentType: 'image/jpeg' }));
    // a real photograph is shown immediately: there is nothing to verify
    await p.listing.update({
      where: { id: r.id },
      data: { photoUrl: `/api/files/${key}`, photoVerifiedAt: new Date(), photoScore: 1 },
    });
    done++;
    if (done % 20 === 0) console.log(`  загружено ${done}…`);
  } catch (e) {
    console.log(`  err ${r.name.slice(0, 24)}: ${String(e.message).slice(0, 50)}`);
  }
  await new Promise((res) => setTimeout(res, 120)); // stay polite to the API
}
console.log(`\nГотово: загружено ${done}, пропущено (нет точного запроса) ${skipped}, обработано ${n}`);
await p.$disconnect();
