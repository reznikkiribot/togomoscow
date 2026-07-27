// Drops the verified flag from every Pexels-sourced photo so the import can lay
// them down again under the corrected query rules. The file itself stays in the
// bucket and the row keeps its photoUrl — only the "show it" flag is cleared, so
// nothing is lost if this is interrupted halfway.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });

// Railway's pooler drops idle connections with P1001; every call needs retries.
for (let i = 0; i < 8; i++) {
  try {
    const r = await p.listing.updateMany({
      where: { photoUrl: { contains: '/dish-' } },
      data: { photoVerifiedAt: null, photoScore: null },
    });
    console.log(`снято с показа (перезальются): ${r.count}`);
    break;
  } catch (e) {
    console.log(`retry ${i}: ${e.code ?? e.message.slice(0, 60)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
await p.$disconnect();
