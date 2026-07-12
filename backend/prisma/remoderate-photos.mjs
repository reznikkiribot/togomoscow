// Retroactive photo moderation: re-check EVERY review photo against its dish name
// (CLIP). A graph/screenshot/unrelated photo (name-match < 0.5) is removed from
// the review and its listing gallery. Owner rule 12.07.2026.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const APP = 'https://togomoscow-production.up.railway.app';
console.log('CLIP…');
const t = await import('@xenova/transformers');
t.env.cacheDir = path.join(__dirname, '..', '.models-cache');
const zs = await t.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
const { RawImage } = t;
const DICT = [[/пармезан|сыр\b/i,'cheese'],[/пельмен/i,'dumplings'],[/пицц/i,'pizza'],[/бургер/i,'burger'],[/паста|карбонара|болонье/i,'pasta'],[/суши|ролл/i,'sushi'],[/стейк/i,'steak'],[/салат|детокс|цезарь/i,'salad'],[/суп|рамен/i,'soup'],[/торт|десерт|тирамису|чизкейк/i,'cake'],[/мороженое|сорбет/i,'ice cream'],[/кофе|латте|капучино|раф|эспрессо/i,'coffee'],[/чай|матча/i,'tea'],[/смузи/i,'smoothie'],[/креветк/i,'shrimp'],[/рыб|лосос|семг/i,'fish'],[/курин|цыпл/i,'chicken'],[/картофель|фри/i,'french fries'],[/яич|омлет/i,'eggs']];
const en=(n,c)=>{for(const[re,q]of DICT)if(re.test(n))return q; c=(c||'').toLowerCase(); if(/кофе/.test(c))return'coffee'; if(/десерт/.test(c))return'dessert'; if(/суп/.test(c))return'soup'; if(/салат/.test(c))return'salad'; return'food or a drink';};
const revs = await p.review.findMany({ where: { NOT: { photoUrls: { isEmpty: true } } }, include: { listing: { select: { name: true, category: true, photos: true, id: true } } } });
console.log('отзывов с фото:', revs.length);
let removed = 0;
for (const r of revs) {
  const q = en(r.listing?.name ?? '', r.listing?.category);
  const keep = [];
  for (const url of r.photoUrls) {
    try {
      const abs = url.startsWith('/') ? APP + url + (url.includes('?')?'':'?w=400') : url;
      const resp = await fetch(abs, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) { keep.push(url); continue; }
      const img = await RawImage.fromBlob(new Blob([new Uint8Array(await resp.arrayBuffer())]));
      const out = await zs(img, [`a photo of ${q}`, 'a photo of a screenshot, chart, document or unrelated object']);
      const s = out.find(o => o.label === `a photo of ${q}`)?.score ?? 1;
      if (s >= 0.5) keep.push(url);
      else { removed++; console.log(`✗ ${r.listing?.name} [${q}] ${s.toFixed(2)} → снято`); }
    } catch { keep.push(url); }
  }
  if (keep.length !== r.photoUrls.length) {
    await p.review.update({ where: { id: r.id }, data: { photoUrls: keep } });
    // also purge from the listing gallery
    const rmv = r.photoUrls.filter(u => !keep.includes(u));
    if (r.listing?.photos?.length) {
      const gal = r.listing.photos.filter(u => !rmv.includes(u));
      await p.listing.update({ where: { id: r.listing.id }, data: { photos: gal } }).catch(()=>{});
    }
  }
}
console.log('снято фото:', removed);
await p.$disconnect();
