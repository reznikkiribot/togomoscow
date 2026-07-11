// Builds prisma/gen-todo.json — every DISH/DRINK with NO photo, each with a
// proper English SD/CLIP prompt (dictionary → qwen → category hint). The
// generate-missing-photos.mjs stages then work through this list.
//   node prisma/build-gen-todo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const DICT = [
  [/пельмен/i, 'pelmeni russian dumplings'], [/сырник/i, 'syrniki cottage cheese pancakes'],
  [/борщ/i, 'borscht beet soup with sour cream'], [/блин/i, 'russian crepes blini'],
  [/оливье/i, 'olivier salad'], [/хачапури/i, 'khachapuri cheese bread boat'],
  [/хинкал/i, 'khinkali dumplings'], [/шаурм|шаверм/i, 'shawarma wrap'],
  [/плов/i, 'uzbek plov rice with lamb'], [/вареник/i, 'vareniki dumplings'],
  [/окрошк/i, 'okroshka cold soup'], [/солянк/i, 'solyanka meat soup'],
  [/щи\b/i, 'shchi cabbage soup'], [/голубц/i, 'stuffed cabbage rolls'],
  [/драник/i, 'potato pancakes with sour cream'], [/морс/i, 'red berry drink mors in a glass'],
  [/компот/i, 'fruit compote drink'], [/квас/i, 'kvass dark bread drink'],
  [/раф/i, 'raf coffee latte in a glass'], [/капучино/i, 'cappuccino with latte art'],
  [/латте/i, 'latte coffee in a tall glass'], [/эспрессо/i, 'espresso shot in a small cup'],
  [/американо/i, 'americano black coffee'], [/флэт уайт|флет уайт/i, 'flat white coffee'],
  [/люля/i, 'lula kebab minced meat skewer'], [/чебурек/i, 'cheburek fried pastry'],
  [/манты/i, 'manti steamed dumplings'], [/наггетс/i, 'crispy chicken nuggets'],
  [/фри\b/i, 'french fries'], [/цезарь/i, 'caesar salad with chicken'],
  [/греческ/i, 'greek salad with feta'], [/том ям/i, 'tom yum soup with shrimp'],
  [/фо бо|фо-бо/i, 'pho bo vietnamese soup'], [/рамен/i, 'ramen noodle soup with egg'],
  [/паста|спагетти|феттучин|тальятелле|пенне/i, 'italian pasta dish'],
  [/карбонара/i, 'pasta carbonara'], [/болоньезе/i, 'pasta bolognese'],
  [/пицц/i, 'italian pizza'], [/бургер/i, 'burger with beef patty'],
  [/стейк/i, 'grilled steak on a plate'], [/рибай/i, 'ribeye steak'],
  [/суши|ролл/i, 'sushi rolls on a plate'], [/сашими/i, 'sashimi slices'],
  [/поке/i, 'poke bowl with salmon'], [/боул/i, 'healthy bowl with vegetables'],
  [/тирамису/i, 'tiramisu dessert'], [/чизкейк/i, 'cheesecake slice with berries'],
  [/медовик/i, 'honey layer cake medovik'], [/наполеон/i, 'napoleon puff pastry cake'],
  [/эклер/i, 'chocolate eclair'], [/круассан/i, 'french croissant'],
  [/панкейк/i, 'pancakes with syrup'], [/вафл/i, 'belgian waffles with berries'],
  [/мороженое|пломбир/i, 'ice cream scoops in a bowl'],
  [/смузи/i, 'fruit smoothie in a glass'], [/лимонад/i, 'lemonade with ice and citrus'],
  [/милкшейк|молочный коктейл/i, 'milkshake with whipped cream'],
  [/матча/i, 'iced matcha drink'], [/какао/i, 'hot cocoa with marshmallows'],
  [/глинтвейн/i, 'mulled wine with orange and spices'],
  [/чай/i, 'tea in a glass teapot'], [/сок/i, 'glass of fresh juice'],
  [/суп/i, 'soup in a bowl'], [/салат/i, 'fresh salad plate'],
  [/десерт/i, 'plated dessert'], [/завтрак/i, 'breakfast plate'],
  [/омлет/i, 'omelette with herbs'], [/каша/i, 'porridge bowl with berries'],
  [/тост/i, 'toast with toppings'], [/сэндвич|сендвич/i, 'sandwich on a plate'],
  [/котлет/i, 'cutlets with garnish'], [/курин|курица|цыпл/i, 'roasted chicken dish'],
  [/лосос|сёмг|семг/i, 'grilled salmon fillet'], [/тунец/i, 'tuna dish'],
  [/креветк/i, 'grilled shrimp on a plate'], [/митбол/i, 'meatballs in sauce'],
  [/ризотто/i, 'creamy risotto'], [/паэль/i, 'spanish paella'],
  [/фалафел/i, 'falafel balls with sauce'], [/хумус/i, 'hummus plate with pita'],
];

async function qwen(name) {
  try {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: `Translate the Russian dish/drink name into a short English food-photo description (3-6 words, only latin letters). Keep the dish TYPE correct.\nExamples:\nПельмени -> pelmeni dumplings\nТом ям -> tom yum soup\nМедовик -> honey cake\nКотлета по-киевски -> chicken kiev cutlet\nNow translate (answer with the description only): ${name}`,
        stream: false,
        options: { temperature: 0 },
      }),
    });
    const j = await r.json();
    const out = (j.response ?? '').trim().split('\n')[0].replace(/["'.]/g, '').slice(0, 60);
    // reject transliteration garbage / non-latin output
    if (!out || /[^a-z0-9\s-]/i.test(out)) return null;
    return out.toLowerCase();
  } catch {
    return null;
  }
}

const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: null },
  select: { id: true, name: true, category: true, type: true },
  orderBy: { name: 'asc' },
});
console.log(`позиции без фото: ${items.length}`);
const todo = [];
for (const it of items) {
  let en = null;
  for (const [re, q] of DICT) if (re.test(it.name)) { en = q; break; }
  if (!en) en = await qwen(it.name);
  if (!en) {
    // last resort by category/type — a generic but honest image
    const cat = (it.category ?? '').toLowerCase();
    en = /кофе/.test(cat) ? 'specialty coffee drink in a cup'
      : /вино/.test(cat) ? 'glass of wine'
      : /пиво/.test(cat) ? 'glass of craft beer'
      : /коктейл/.test(cat) ? 'craft cocktail in a glass'
      : /чай/.test(cat) ? 'tea in a glass'
      : it.type === 'DRINK' ? 'refreshing drink in a glass' : 'restaurant plated dish';
  }
  todo.push({ id: it.id, name: it.name, en });
  if (todo.length % 50 === 0) console.log(`  переведено ${todo.length}/${items.length}`);
}
fs.writeFileSync(path.join(__dirname, 'gen-todo.json'), JSON.stringify({ mismatches: todo }, null, 1));
console.log(`gen-todo.json: ${todo.length} позиций`);
await p.$disconnect();
