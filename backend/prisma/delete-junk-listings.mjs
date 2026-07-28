// Deletes parsing debris from the catalogue: rows imported from a venue's site
// that are not food at all (Bosco sells watches and jewellery, and its «menu»
// parse produced «Кольца Pomellato» as a DISH).
//
// Every row is dumped to i2i-junk-deleted.json before deletion, so the removal
// can be undone from the file if one of them turns out to be wanted after all.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const junk = JSON.parse(fs.readFileSync(new URL('./i2i-junk.json', import.meta.url), 'utf8'));

for (let i = 0; i < 8; i++) {
  try {
    const backup = [];
    for (const j of junk) {
      const row = await p.listing.findUnique({ where: { id: j.id } });
      if (row) backup.push(row);
    }
    fs.writeFileSync(
      new URL('./i2i-junk-deleted.json', import.meta.url),
      JSON.stringify(backup, null, 1, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
    );

    // Refuse to delete anything a user has actually touched — that would be a
    // data loss, not a cleanup.
    let removed = 0;
    for (const row of backup) {
      const c = await p.listing.findUnique({
        where: { id: row.id },
        select: { _count: { select: { reviews: true, favorites: true, interactions: true, children: true } } },
      });
      const touched = c._count.reviews + c._count.favorites + c._count.interactions + c._count.children;
      if (touched > 0) {
        console.log(`  ПРОПУСК (есть данные пользователей): ${row.name.slice(0, 44)}`);
        continue;
      }
      await p.listing.delete({ where: { id: row.id } });
      console.log(`  удалено: ${row.name.slice(0, 50)}`);
      removed++;
    }
    console.log(`\nудалено ${removed} из ${junk.length}; копия в prisma/i2i-junk-deleted.json`);
    break;
  } catch (e) {
    console.log(`retry ${i}: ${(e.code ?? e.message).slice(0, 70)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
await p.$disconnect();
