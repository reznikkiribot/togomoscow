// Real brand product photos from Open Food Facts (CC-licensed, free, commercial).
// Matches STRICTLY by brand (so we don't show another brand's bottle); if no
// confident match, clears the photo so the card shows a neutral category glass
// rather than a misleading one. Run: node prisma/enrich-brand-photos-off.mjs
const UA = 'togomoscow/1.0 (tasting club; contact reznik.kiri@gmail.com)';

const norm = (s) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');

async function offPhoto(brand, kind) {
  const cat = kind === 'Пиво' ? 'beers' : 'wines';
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(brand)}` +
    `&tagtype_0=categories&tag_contains_0=contains&tag_0=${cat}` +
    `&json=1&page_size=8&fields=product_name,brands,image_front_url,image_url`;
  let data;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }
  const bn = norm(brand);
  for (const p of data.products ?? []) {
    const img = p.image_front_url || p.image_url;
    if (!img) continue;
    const hay = norm(p.brands) + norm(p.product_name);
    if (hay.includes(bn) || bn.includes(norm(p.brands))) return img;
  }
  return null;
}

async function main() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://yelp:yelp_dev_password@localhost:5432/yelp?schema=public';
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const items = await prisma.listing.findMany({
    where: { type: 'DRINK', category: { in: ['Пиво', 'Вино'] }, brand: { not: null } },
    select: { id: true, brand: true, category: true },
  });
  let real = 0;
  let cleared = 0;
  for (const it of items) {
    const img = await offPhoto(it.brand, it.category);
    if (img) {
      await prisma.listing.update({ where: { id: it.id }, data: { photoUrl: img } });
      real++;
      console.log('OK  ', it.brand);
    } else {
      // drop the misleading Pexels photo → neutral category glass
      await prisma.listing.update({ where: { id: it.id }, data: { photoUrl: null } });
      cleared++;
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log(`\nРеальные фото бренда: ${real}, нейтральная заглушка: ${cleared}, всего: ${items.length}.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
