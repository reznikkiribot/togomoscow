// Builds the image-to-image queue: catalogue items that still have no shown photo
// but DO have a parsed menu photo to use as a reference.
//
// A parsed reference is the strongest signal we have — it came off the dish's own
// menu card, so it matches the name by construction, unlike a keyword search.
// We do not publish it directly (it's someone else's photo); it only steers
// generation, and the CLIP name-match gate still decides what gets shown.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

const read = (f) => { try { return JSON.parse(fs.readFileSync(new URL(f, import.meta.url), 'utf8')); } catch { return null; } };

// Two historical shapes hold references: i2i-map keyed by listing id, and
// perv-map keyed by menu item with a `links` list of the listing ids it feeds.
const byId = new Map();
for (const [id, v] of Object.entries(read('./i2i-map.json') ?? {})) if (v?.ref) byId.set(id, v.ref);
for (const v of Object.values(read('./perv-map.json') ?? {})) {
  if (!v?.image) continue;
  for (const pair of v.links ?? []) {
    for (const id of Array.isArray(pair) ? pair : [pair]) if (!byId.has(id)) byId.set(id, v.image);
  }
}
console.log(`референсов в файлах: ${byId.size}`);

// bosco.ru sells watches and rings — those rows are parsing debris, not dishes,
// and must be dropped from the catalogue rather than illustrated.
const JUNK_HOST = /bosco\.ru/i;

for (let i = 0; i < 8; i++) {
  try {
    const rows = await p.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        photoVerifiedAt: null,
        category: { notIn: ['Пиво', 'Вино', 'Крепкие напитки', 'Коктейли', 'Коктейль'] },
      },
      select: { id: true, name: true, category: true, type: true },
    });

    const queue = [];
    const junk = [];
    for (const r of rows) {
      const ref = byId.get(r.id);
      if (!ref) continue;
      (JUNK_HOST.test(ref) ? junk : queue).push({ id: r.id, name: r.name, category: r.category, type: r.type, ref });
    }

    fs.writeFileSync(new URL('./i2i-queue.json', import.meta.url), JSON.stringify(queue, null, 1));
    fs.writeFileSync(new URL('./i2i-junk.json', import.meta.url), JSON.stringify(junk, null, 1));
    console.log(`без показываемого фото: ${rows.length}`);
    console.log(`в очередь на генерацию по референсу: ${queue.length}`);
    console.log(`мусор парсинга (не еда, на удаление): ${junk.length}`);
    for (const j of junk) console.log(`   ${j.name.slice(0, 52)}`);
    break;
  } catch (e) {
    console.log(`retry ${i}: ${e.code ?? e.message.slice(0, 60)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
await p.$disconnect();
