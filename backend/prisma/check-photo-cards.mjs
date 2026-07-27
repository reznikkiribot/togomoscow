// Spot-check what the app actually serves for named cards: source is readable
// straight off the URL (dish- = Pexels photo, aigen- = old AI generation, which
// the server no longer hands out).
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

const names = process.argv.slice(2);
for (let i = 0; i < 8; i++) {
  try {
    const total = await p.listing.count({ where: { type: { in: ['DISH', 'DRINK'] } } });
    const shown = await p.listing.count({ where: { type: { in: ['DISH', 'DRINK'] }, photoVerifiedAt: { not: null } } });
    console.log(`показывается фото: ${shown} из ${total} (${Math.round((shown / total) * 100)}%)\n`);

    for (const n of names) {
      const r = await p.listing.findFirst({
        where: { name: { contains: n, mode: 'insensitive' } },
        select: { name: true, category: true, photoUrl: true, photoVerifiedAt: true },
      });
      if (!r) { console.log(`  «${n}» — не найдено`); continue; }
      const src = !r.photoUrl ? 'нет фото'
        : r.photoUrl.includes('/dish-') ? 'Pexels'
        : r.photoUrl.includes('aigen') ? 'ИИ (не отдаётся)' : 'своё';
      console.log(`  ${r.name.slice(0, 36).padEnd(38)} ${String(r.category).padEnd(10)} ${src.padEnd(18)} показ: ${r.photoVerifiedAt ? 'да' : 'нет'}`);
    }
    break;
  } catch (e) {
    console.log(`retry ${i}: ${e.code ?? e.message.slice(0, 60)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
await p.$disconnect();
