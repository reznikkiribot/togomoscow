// Builds exports/venues.xlsx from exports/venues.json using SheetJS.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '..', 'exports');
const rows = JSON.parse(fs.readFileSync(path.join(outDir, 'venues.json'), 'utf8'));

const HEADERS = {
  id: 'ID', name: 'Название', category: 'Категория', cuisine: 'Кухня', city: 'Город',
  address: 'Адрес', lat: 'Широта', lng: 'Долгота', phone: 'Телефон', website: 'Сайт',
  telegram: 'Telegram', vk: 'VK', priceLevel: 'Ценник', avgRating: 'Рейтинг',
  reviewCount: 'Отзывов', branchCount: 'Точек сети', hours: 'Часы', source: 'Источник',
  externalId: 'OSM id', sourcesCount: 'Источников', eventsCount: 'Событий',
};
const COLS = Object.keys(HEADERS);

const aoa = [COLS.map((c) => HEADERS[c]), ...rows.map((r) => COLS.map((c) => r[c]))];
const ws = XLSX.utils.aoa_to_sheet(aoa);
ws['!cols'] = COLS.map((c) =>
  ({ id: 38, name: 28, category: 14, cuisine: 16, address: 36, website: 30, telegram: 18, vk: 18, hours: 26, externalId: 18 }[c] ?? 11)
).map((w) => ({ wch: w }));
ws['!freeze'] = { xSplit: 0, ySplit: 1 };
ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: COLS.length - 1 } }) };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Заведения');
XLSX.writeFile(wb, path.join(outDir, 'venues.xlsx'));
console.log(`venues.xlsx — ${rows.length} rows, ${COLS.length} columns`);
