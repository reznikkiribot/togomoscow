// Beer/wine BRANDS: no AI photos — assign rotating commercial-free stock
// (beer pouring variations, wine). Owner rule 12.07.2026.
import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url', 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const BEER = ['drink_beer', 'drink_beer2', 'drink_beer3', 'drink_beer4'];
const WINE = ['drink_wine', 'drink_wine2', 'drink_wine3'];
const isBeer = (s) => /пив|beer|ipa|лагер|эль|стаут|портер|пшенич|kozel|козел|guiness|weiss|бельг|чешск|пилзнер|жатецк|spaten|kronen|балтик/i.test(s);
const isWine = (s) => /вино|wine|шампан|игрист|просекко|prosecco|розе|мерло|каберне|шардоне|фанагор|саперави|киндзмараул|мукузани|блан|нуар|совиньон|рислинг|мальбек|санджовезе/i.test(s);
const items = await p.listing.findMany({ where: { type: 'DRINK' }, select: { id: true, name: true, category: true } });
let beer = 0, wine = 0;
for (const it of items) {
  const t = `${it.name} ${it.category ?? ''}`;
  let pool = null;
  if (/пиво/i.test(it.category ?? '') || isBeer(t)) pool = BEER;
  else if (/вино/i.test(it.category ?? '') || isWine(t)) pool = WINE;
  if (!pool) continue;
  let h = 0; for (const c of it.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const key = pool[h % pool.length];
  await p.listing.update({ where: { id: it.id }, data: { photoUrl: `/api/stock/${key}` } });
  if (pool === BEER) beer++; else wine++;
}
console.log(`пиво→сток: ${beer}, вино→сток: ${wine}`);
await p.$disconnect();
