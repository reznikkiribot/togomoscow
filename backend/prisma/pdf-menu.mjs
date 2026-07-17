// PDF menus (owner rule 17.07.2026: «ни одно меню не пропускать»): download the
// chain's official menu PDF, extract text locally, pull {name, price} pairs.
// No photos in text PDFs — cards go photo-less (per-venue AI photos need refs).
//   node prisma/pdf-menu.mjs <domain> <pdf-url>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [domain, url] = process.argv.slice(2);
if (!domain || !url) { console.log('usage: node prisma/pdf-menu.mjs <domain> <pdf-url>'); process.exit(1); }

const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0' }, signal: AbortSignal.timeout(60000) });
if (!r.ok) { console.log('download failed', r.status); process.exit(1); }
const buf = Buffer.from(await r.arrayBuffer());
console.log('pdf:', (buf.length / 1024).toFixed(0), 'KB');
const parser = new PDFParse({ data: new Uint8Array(buf) });
const { text } = await parser.getText();
const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// dish line heuristics: «Название ..... 590» or «Название 590 ₽» — a name with
// letters followed by a 2-5 digit price at the end of the line (or next line)
const items = new Map();
const NAME_OK = /^[А-ЯЁA-Z«"][а-яёА-ЯЁa-zA-Z0-9\s\-«»"',.()/]{3,60}$/;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let m = line.match(/^(.{4,60}?)[\s.…]{2,}(\d{2,5})\s*(?:₽|руб)?\.?$/);
  if (!m) m = line.match(/^(.{4,60}?)\s+(\d{3,5})\s*(?:₽|руб)\.?$/);
  let name = null, price = null;
  if (m) { name = m[1].trim(); price = parseInt(m[2]); }
  else if (NAME_OK.test(line) && i + 1 < lines.length && /^(\d{2,5})\s*(?:₽|руб)?\.?$/.test(lines[i + 1])) {
    name = line; price = parseInt(lines[i + 1]);
  }
  if (!name || !price || price < 50 || price > 20000) continue;
  name = name.replace(/[.…]+$/, '').replace(/\s{2,}/g, ' ').trim();
  // drop weights/volumes-only, numbers, section headers in caps
  if (/^\d|^[А-ЯЁ\s]{6,}$/.test(name) || /(гр|мл|шт)\.?$/.test(name)) continue;
  if (!items.has(name.toLowerCase())) items.set(name.toLowerCase(), { name, price, image: null });
}
const arr = [...items.values()];
const out = { domain, method: 'pdf', status: arr.length >= 10 ? 'ok' : 'manual_required', source: url, count: arr.length, withPhoto: 0, items: arr };
fs.writeFileSync(path.join(__dirname, 'menu-out', domain.replace(/[^\w.-]/g, '_') + '.json'), JSON.stringify(out, null, 2));
console.log(`Итог: ${arr.length} позиций → menu-out/${domain}.json`);
console.log(arr.slice(0, 10).map((i) => `${i.name} — ${i.price}`).join('\n'));
