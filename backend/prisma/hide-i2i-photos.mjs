// Takes every reference-generated photo back off display.
//
// Reference similarity turned out to measure the wrong thing: a render that
// copies the crockery and background of its reference scores high even when the
// dish itself is wrong («Шиповник» 0.877 — a teapot with a yellow slab in it),
// while a correct one can sit at the bottom («Сало соленое» 0.821 — right).
// Raising the bar does not separate them, and CLIP with English labels does not
// either (0.93 for both a correct and a broken render). With no honest automatic
// check, none of these may be shown.
//
// The files stay in the bucket and photoUrl is kept, so re-enabling any of them
// later is one UPDATE away.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

for (let i = 0; i < 8; i++) {
  try {
    const r = await p.listing.updateMany({
      where: { photoUrl: { contains: '/dishgen-' } },
      data: { photoVerifiedAt: null, photoScore: null },
    });
    console.log(`снято с показа: ${r.count}`);
    break;
  } catch (e) {
    console.log(`retry ${i}: ${(e.code ?? e.message).slice(0, 60)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
await p.$disconnect();
