// Restore real menu photos from the extracted menu-out/*.json (undoes a bad
// photo-replacement). Matches by the same sanitized name used at import time.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
function sanitizeName(name) {
  let n = name.replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\((?:м3|m3|зона ?\d|ночн[а-я]*)\)/gi, '');
  n = n.replace(/\s*\d+([.,]\d+)?\s?(мл|ml|литр|л|l|гр|г|g)(?![а-яёa-z])\.?/gi, ' ');
  n = n.replace(/\s*\d+\s?шт(?![а-яё])\.?/gi, ' ').replace(/\s*[xх]\s?\d+(?![\dа-яёa-z])/gi, ' ');
  n = n.replace(/\s+(гранде|венти|grande|venti|tall|большой|больш(?:ая|ое)|средн(?:ий|яя|ее)|маленьк\w+|мал(?:ый|ая))(?![а-яё])/gi, ' ');
  n = n.replace(/\s+(xl|xxl|[sml])\s*$/i, '');
  return n.replace(/\s+/g, ' ').trim();
}
const OUT = path.join(__dirname, 'menu-out');
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
let restored = 0;
const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.json') && f !== '_import-log.json');
for (const f of files) {
  let data; try { data = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch { continue; }
  for (const raw of data.items ?? []) {
    if (!raw.image || !/^https?:\/\//.test(raw.image)) continue;
    const name = sanitizeName(raw.name.trim().replace(/\s+/g, ' '));
    const r = await p.listing.updateMany({
      where: { name: { equals: name, mode: 'insensitive' }, type: { in: ['DISH', 'DRINK'] } },
      data: { photoUrl: raw.image },
    });
    if (r.count) restored += r.count;
  }
}
console.log(`restored menu photos: ${restored}`);
await p.$disconnect();
