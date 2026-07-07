// Clean product photos for branded drinks (beer / wine / spirits).
// STRICT pipeline — the old version pulled asteroids ("3959 Purcari"), landscapes
// (Жигулёвские горы), cheese ("Fromage Blanc") and beach shots because it fell back
// to a bare name search and only filtered caps/labels.
//
// Now, per item:
//   1. VISION-VERIFY the current photo (moondream). If it already shows a bottle/
//      glass/drink → keep it (skip).
//   2. Otherwise search Wikimedia — the file TITLE must mention a bottle/beverage and
//      must NOT mention an off-topic subject (planet, mountain, cheese, person…),
//      then vision-verify the actual image before accepting.
//   3. Fall back to Open Food Facts with a STRICT brand + category match, vision-verified.
//   4. If nothing passes → set photoUrl = null so the card shows a neutral category
//      glass instead of a misleading image.
//   node prisma/fix-brand-photos.mjs [--dry]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) { if (!l || l.startsWith('#') || !l.includes('=')) continue; const i = l.indexOf('='); const k = l.slice(0, i).trim(); if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ''); }
const UA = 'togomoscow/1.0 (reznik.kiri@gmail.com)';
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// off-topic Wikimedia subjects that must never become a drink photo
const BAD_TITLE = /minor planet|asteroid|orbit|\bplanet\b|crater|galaxy|nebula|constellation|star ?map|mountain|\bhill|volcano|\blake\b|\briver\b|valley|glacier|waterfall|forest|landscape|panorama|aerial|satellite|\bmap\b|locator|coat of arms|flag of|emblem|seal of|church|cathedral|monaster|castle|palace|monument|statue|stadium|bridge|street|railway|station|portrait|politician|actor|singer|player|\bperson\b|\bwoman\b|\bman\b|people|cheese|fromage|yogurt|yoghurt|\bmilk\b|butter|bread|\bcap\b|crown|coaster|\blabel\b|\blogo\b|tap handle|building|truck|\bcan\b|barrel|\bkeg\b|diagram|\bchart\b|\bgraph\b|\bsign\b/i;
// a valid drink file title should mention the drink or its vessel
const GOOD_TITLE = /bottle|\bglass|wine|beer|champagne|vodka|whisky|whiskey|cognac|\brum\b|\bgin\b|tequila|liqueur|brandy|prosecco|sparkling|\bale\b|lager|stout|pilsner|drink|beverage|spirit|cuv[eé]e|vintage/i;
// moondream description gates
const DRINK_DESC = /bottle|glass of|\bglass\b|wine|beer|champagne|vodka|whisk|cocktail|liquor|\bdrink|beverage|pint|goblet|decanter|flask|can of soda|\bcup\b/i;
const NOTDRINK_DESC = /landscape|mountain|\bhill|\blake|\briver|\bsky\b|\bfield\b|beach|\bsand\b|forest|diagram|orbit|\bmap\b|\bchart|\bgraph|\bplanet|building|church|street|portrait|\bperson\b|\bman\b|\bwoman\b|people|animal|\bdog\b|\bcat\b|cheese|yogurt|\bmilk|carton|packaging|\bbox of|\bbag of|\blogo\b|\bsign\b|\btext\b/i;

async function fetchB64(url) {
  for (let a = 0; a < 2; a++) {
    try { return Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })).arrayBuffer()).toString('base64'); }
    catch { if (a === 0) await sleep(600); }
  }
  return null;
}
async function describe(b64) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, { method: 'POST', body: JSON.stringify({ model: 'moondream', prompt: 'Describe the main object in this image in one short sentence.', images: [b64], stream: false, keep_alive: '20m', options: { temperature: 0 } }), signal: AbortSignal.timeout(60000) });
    return ((await r.json()).response || '').replace(/\s+/g, ' ').trim().toLowerCase();
  } catch { return null; }
}
// true = the image clearly shows a bottle/glass/drink and nothing off-topic
async function looksLikeDrink(url) {
  const b64 = await fetchB64(url);
  if (!b64) return null; // couldn't fetch → unknown
  const desc = await describe(b64);
  if (!desc) return null;
  if (NOTDRINK_DESC.test(desc)) return false;
  return DRINK_DESC.test(desc);
}

async function wikiCandidates(q) {
  try {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json`;
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    const d = await r.json();
    const pages = Object.values(d.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
    const out = [];
    for (const pg of pages) {
      const title = pg.title || '';
      if (BAD_TITLE.test(title) || !GOOD_TITLE.test(title)) continue; // must look like a drink, not a place/person
      const x = pg.imageinfo?.[0]?.thumburl;
      if (x && /\.(jpe?g|png)$/i.test(x.split('?')[0])) out.push(x);
    }
    return out;
  } catch { return []; }
}
const norm = (s) => (s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '');
async function offStrict(brand, kind) {
  const cat = kind === 'Пиво' ? 'beers' : kind === 'Вино' ? 'wines' : 'alcoholic-beverages';
  const u = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(brand)}&tagtype_0=categories&tag_contains_0=contains&tag_0=${cat}&json=1&page_size=8&fields=product_name,brands,image_front_url`;
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!/json/.test(r.headers.get('content-type') || '')) return null;
    const d = await r.json();
    const bn = norm(brand);
    for (const pr of d.products ?? []) {
      if (!pr.image_front_url) continue;
      const hay = norm(pr.brands) + norm(pr.product_name);
      if (hay.includes(bn) || (norm(pr.brands) && bn.includes(norm(pr.brands)))) return pr.image_front_url; // brand must match
    }
  } catch { /* ignore */ }
  return null;
}

// first verified drink photo from a list of candidate URLs
async function firstVerified(urls) {
  for (const url of urls) {
    if (await looksLikeDrink(url)) return url;
  }
  return null;
}

const dry = process.argv.includes('--dry');
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const items = await p.listing.findMany({
  where: { type: 'DRINK', category: { in: ['Пиво', 'Вино', 'Крепкие напитки'] } },
  select: { id: true, name: true, brand: true, category: true, photoUrl: true },
});
console.log(`branded drinks: ${items.length}`);
let kept = 0, fixed = 0, cleared = 0, errs = 0;
for (const it of items) {
  const label = it.brand || it.name;
  // 1) is the CURRENT photo already a valid drink shot? then leave it alone
  if (it.photoUrl && /^https?:\/\//.test(it.photoUrl)) {
    const cur = await looksLikeDrink(it.photoUrl);
    if (cur === true) { kept++; continue; }
    if (cur === null) { errs++; continue; } // couldn't fetch → don't risk clearing a maybe-good photo
  }
  // 2) Wikimedia (title-filtered) → verified, 3) OFF strict → verified
  const kind = it.category;
  const bev = kind === 'Пиво' ? 'beer bottle' : kind === 'Вино' ? 'wine bottle' : 'bottle';
  let url = await firstVerified(await wikiCandidates(`${label} ${bev}`));
  if (!url) url = await firstVerified(await wikiCandidates(`${label} ${kind === 'Пиво' ? 'beer' : 'wine'}`));
  if (!url) { const o = await offStrict(label, kind); if (o && (await looksLikeDrink(o))) url = o; }

  if (url && url !== it.photoUrl) {
    if (dry) console.log(`  FIX  «${it.name}» -> ${url.slice(0, 60)}`);
    else await p.listing.update({ where: { id: it.id }, data: { photoUrl: url } }).catch(() => {});
    fixed++;
  } else if (!url) {
    // nothing trustworthy → neutral category placeholder (VenuePhoto shows a glass)
    if (dry) console.log(`  CLEAR «${it.name}» [${it.category}] (was bad, no good replacement)`);
    else await p.listing.update({ where: { id: it.id }, data: { photoUrl: null } }).catch(() => {});
    cleared++;
  }
  await sleep(150);
}
console.log(`\n${dry ? '[DRY] ' : ''}kept ${kept}, fixed ${fixed}, cleared ${cleared}, fetch-errors ${errs} / ${items.length}`);
await p.$disconnect();
