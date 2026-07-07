import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) { if (!line||line.startsWith('#')||!line.includes('=')) continue; const i=line.indexOf('='); const k=line.slice(0,i).trim(); if(!process.env[k]) process.env[k]=line.slice(i+1).trim().replace(/^["']|["']$/g,''); }

const PROMPT = (text) =>
  `Определи, анонсирует ли пост кафе/ресторана НОВОЕ блюдо или напиток в меню.
Ответь СТРОГО JSON. Поле is_new_dish только true или false (никогда null).
dish_name — краткое название позиции на русском, иначе null.

Примеры:
"Новинка в десертной карте — торт Эстерхази" => {"is_new_dish": true, "dish_name": "Торт Эстерхази"}
"Встречайте раф лавандовый!" => {"is_new_dish": true, "dish_name": "Раф лавандовый"}
"Появились новые коктейли" => {"is_new_dish": true, "dish_name": "Новые коктейли"}
"Лето в разгаре, заходите!" => {"is_new_dish": false, "dish_name": null}
"Ищем бармена в команду" => {"is_new_dish": false, "dish_name": null}
"26 июня скидка 20%" => {"is_new_dish": false, "dish_name": null}

Пост:
"""${(text || '').slice(0, 700)}"""`;

async function ask(t) {
  const r = await fetch('http://localhost:11434/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5:3b', prompt: PROMPT(t), stream: false, format: 'json', options: { temperature: 0 } }),
  });
  const d = await r.json();
  return d.response;
}

const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
// distinct venues so we don't test the same duplicated post
const evs = await p.venueEvent.findMany({ where: { kind: 'dish' }, take: 40, orderBy: { publishedAt: 'desc' }, include: { venue: { select: { name: true } } } });
const seen = new Set(); let n = 0;
for (const e of evs) {
  if (seen.has(e.venue.name) || n >= 8) continue;
  seen.add(e.venue.name); n++;
  console.log(`\n[${e.venue.name}] ${(e.text||'').slice(0,90).replace(/\n/g,' ')}`);
  console.log('  → ' + (await ask(e.text || '')).replace(/\s+/g, ' '));
}
await p.$disconnect();
