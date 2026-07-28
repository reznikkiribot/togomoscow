// Builds a contact sheet of the reference-generated photos so they can be
// approved (or rejected) by eye — the only honest gate available for these
// items, since no automatic score separates a correct render from a broken one.
//
// Output: prisma/i2i-review/sheet-N.jpg, 12 cards per sheet, each captioned with
// its number and dish name. Approve by listing the numbers.
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const DIR = path.join(process.cwd(), 'prisma', 'i2i-review');
fs.mkdirSync(DIR, { recursive: true });

const COLS = 4, ROWS = 3, CELL = 320, CAP = 34;
const PER = COLS * ROWS;

let rows = [];
for (let i = 0; i < 8; i++) {
  try {
    rows = await p.listing.findMany({
      where: { photoUrl: { contains: '/dishgen-' } },
      select: { id: true, name: true, photoUrl: true, photoScore: true },
      orderBy: { photoScore: 'desc' },
    });
    break;
  } catch (e) {
    console.log(`retry ${i}: ${(e.code ?? e.message).slice(0, 60)}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}
console.log(`фото на просмотр: ${rows.length}`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const index = [];

for (let s = 0; s * PER < rows.length; s++) {
  const batch = rows.slice(s * PER, (s + 1) * PER);
  const tiles = [];
  for (const [i, r] of batch.entries()) {
    const n = s * PER + i + 1;
    index.push({ n, id: r.id, name: r.name, score: r.photoScore });
    try {
      const buf = Buffer.from(
        await fetch(`https://togomoscow-production.up.railway.app${r.photoUrl}`).then((x) => x.arrayBuffer()),
      );
      const img = await sharp(buf).resize(CELL, CELL - CAP, { fit: 'cover' }).toBuffer();
      const caption = Buffer.from(
        `<svg width="${CELL}" height="${CAP}"><rect width="100%" height="100%" fill="#111"/>`
        + `<text x="6" y="22" font-family="sans-serif" font-size="15" fill="#fff">`
        + `${n}. ${esc(r.name.slice(0, 30))}</text></svg>`,
      );
      tiles.push({
        input: await sharp({ create: { width: CELL, height: CELL, channels: 3, background: '#111' } })
          .composite([{ input: img, top: 0, left: 0 }, { input: caption, top: CELL - CAP, left: 0 }])
          .png().toBuffer(),
        top: Math.floor(i / COLS) * CELL,
        left: (i % COLS) * CELL,
      });
    } catch { /* skip unreachable */ }
  }
  const file = path.join(DIR, `sheet-${s + 1}.jpg`);
  await sharp({ create: { width: COLS * CELL, height: ROWS * CELL, channels: 3, background: '#111' } })
    .composite(tiles).jpeg({ quality: 82 }).toFile(file);
  console.log(`  ${path.basename(file)} — карточек ${tiles.length}`);
}

fs.writeFileSync(path.join(DIR, 'index.json'), JSON.stringify(index, null, 1));
console.log(`\nлистов: ${Math.ceil(rows.length / PER)}, соответствие номеров — prisma/i2i-review/index.json`);
await p.$disconnect();
