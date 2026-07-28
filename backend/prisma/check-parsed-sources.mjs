// How many of the items still without a shown photo have a PARSED menu photo we
// could use as an image-to-image reference? Parsed photos live in `photos[]` /
// `photoUrl` pointing at the original menu source rather than at our bucket.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

for (let i = 0; i < 8; i++) {
  try {
    const rows = await p.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        photoVerifiedAt: null,
        category: { notIn: ['Пиво', 'Вино', 'Крепкие напитки', 'Коктейли', 'Коктейль'] },
      },
      select: { id: true, name: true, category: true, photoUrl: true, photos: true, source: true },
    });
    console.log(`позиций без показываемого фото: ${rows.length}\n`);

    const bySource = new Map();
    let withAny = 0;
    for (const r of rows) {
      const all = [r.photoUrl, ...(r.photos ?? [])].filter(Boolean);
      // anything not produced by us is a candidate reference
      const external = all.filter((u) => /^https?:\/\//.test(u) && !u.includes('togomoscow'));
      if (external.length) withAny++;
      const key = external.length ? new URL(external[0]).hostname : `— нет (${r.source})`;
      bySource.set(key, (bySource.get(key) ?? 0) + 1);
    }
    console.log(`из них есть внешнее (спарсенное) фото-референс: ${withAny}\n`);
    for (const [k, v] of [...bySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`  ${String(v).padStart(5)}  ${k}`);
    }

    console.log('\nпримеры позиций с референсом:');
    let shown = 0;
    for (const r of rows) {
      const ext = [r.photoUrl, ...(r.photos ?? [])].filter((u) => u && /^https?:\/\//.test(u) && !u.includes('togomoscow'));
      if (!ext.length) continue;
      console.log(`  ${r.name.slice(0, 34).padEnd(36)} ${String(r.category).padEnd(10)} ${ext[0].slice(0, 68)}`);
      if (++shown >= 8) break;
    }
    break;
  } catch (e) {
    console.log(`retry ${i}: ${e.code ?? e.message.slice(0, 60)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
await p.$disconnect();
