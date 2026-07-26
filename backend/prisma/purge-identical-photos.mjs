// Finds photos that are visually IDENTICAL across different dishes (the generic
// text2img prompt + fixed seeds produced one picture for many items) and clears
// them so the fixed generator makes distinct ones. Uses an average-hash over the
// decoded pixels — sharp only, no onnx in this process.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const BASE = 'https://togomoscow-production.up.railway.app';
const sharp = (await import('sharp')).default;
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

async function aHash(buf) {
  const { data, info } = await sharp(buf).greyscale().resize(8, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const px = [...data.slice(0, info.width * info.height)];
  const avg = px.reduce((a, b) => a + b, 0) / px.length;
  return px.map((v) => (v > avg ? 1 : 0));
}
const ham = (a, b) => a.reduce((s, v, i) => s + (v === b[i] ? 0 : 1), 0);

const rows = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { startsWith: '/api/files/aigen' } },
  select: { id: true, name: true, photoUrl: true },
});
console.log(`фото к проверке: ${rows.length}`);

const hashed = [];
for (const [i, r] of rows.entries()) {
  try {
    const buf = Buffer.from(await fetch(`${BASE}${r.photoUrl}`).then((x) => x.arrayBuffer()));
    hashed.push({ ...r, h: await aHash(buf) });
  } catch { /* unreachable image — leave it alone */ }
  if ((i + 1) % 100 === 0) console.log(`  прочитано ${i + 1}/${rows.length}`);
}

// group by near-identical hash; keep the first of each group, clear the rest
const groups = [];
for (const item of hashed) {
  const g = groups.find((grp) => ham(grp[0].h, item.h) <= 4);
  if (g) g.push(item); else groups.push([item]);
}
const dupGroups = groups.filter((g) => g.length > 1);
const toClear = dupGroups.flatMap((g) => g.slice(1).map((x) => x.id));

console.log(`\nгрупп одинаковых картинок: ${dupGroups.length}`);
dupGroups.slice(0, 10).forEach((g) => console.log(`  ${g.length}× ${g.map((x) => x.name).slice(0, 4).join(' | ')}`));
console.log(`к перегенерации: ${toClear.length}`);

if (toClear.length) {
  await p.listing.updateMany({ where: { id: { in: toClear } }, data: { photoUrl: null } });
  for (const f of ['generated-ok.json', 'i2i-done.json']) {
    try {
      const d = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')));
      toClear.forEach((id) => d.delete(id));
      fs.writeFileSync(path.join(__dirname, f), JSON.stringify([...d]));
    } catch { /* no list yet */ }
  }
  console.log('очищено, конвейер сгенерит их заново с индивидуальными сидами');
}
await p.$disconnect();
