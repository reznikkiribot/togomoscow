// Publishes the reference-generated photos that passed HUMAN review.
//
// No automatic score can do this job (see the note in i2i-from-refs.mjs), so the
// contact sheets in prisma/i2i-review were looked at and the rejects listed by
// number below. Everything not rejected goes on display.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

// Rejected on review, by contact-sheet number:
//   9 Глория — shapeless purple object          52 Имбирь маринованный — soup, not ginger
//  40,41,42 BIG… — logo outlines, not photos    57 Травяной сбор — a printed box
//  43 Bakalar, 44 Kristoffel Brune — BEER       59 Денеб — branded bottles
//  63 Большой Вабабай — incoherent              70 халапеньо — potatoes, not peppers
//  71 Гребешки — served on blue gravel          82 Чипсы креветочные — pink slabs
//  88 Печенье Гречишное — ribboned parcel       89 Печенье Куркума — cake and powder
// 100 Пьяная груша — a cone                    102 Накаяма — labelled jar
// 110 Изюм — not raisins                       117 Шиповник — teapot with a yellow slab
// 119 Milaf cola — branded can                 129 Лаймон Фрэш — branded bottle
//
// Alcohol and branded drinks are banned outright, so those are rejects
// regardless of how good the render looks.
const REJECTED = new Set([
  9, 40, 41, 42, 43, 44, 52, 57, 59, 63, 70, 71, 82, 88, 89, 100, 102, 110, 117, 119, 129,
]);

const url = `${fs.readFileSync(new URL('../.railway-db-url', import.meta.url), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
const p = new PrismaClient({ datasources: { db: { url } } });
const index = JSON.parse(fs.readFileSync(new URL('./i2i-review/index.json', import.meta.url), 'utf8'));

// Only the first 132 have actually been looked at (11 contact sheets × 12).
// Anything beyond that is unreviewed and must stay hidden — publishing it would
// be exactly the unchecked-photo problem this whole pass exists to avoid.
const REVIEWED_UPTO = 132;
const reviewed = index.filter((r) => r.n <= REVIEWED_UPTO);
const approved = reviewed.filter((r) => !REJECTED.has(r.n));
console.log(`просмотрено: ${reviewed.length} из ${index.length}`);
console.log(`одобрено: ${approved.length}, отклонено: ${reviewed.length - approved.length}`);
console.log(`ждут просмотра: ${index.length - reviewed.length}`);

let ok = 0;
for (const r of approved) {
  for (let i = 0; i < 6; i++) {
    try {
      await p.listing.update({
        where: { id: r.id },
        data: { photoVerifiedAt: new Date(), photoScore: r.score },
      });
      ok++;
      break;
    } catch (e) {
      if (i === 5) console.log(`  не удалось: ${r.name.slice(0, 40)}`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}
console.log(`выложено на показ: ${ok}`);

// The rejects keep their file but stay hidden, and are queued for another pass
// further from the reference.
const tries = (() => { try { return JSON.parse(fs.readFileSync(new URL('./i2i-ref-tries.json', import.meta.url), 'utf8')); } catch { return {}; } })();
for (const r of reviewed.filter((x) => REJECTED.has(x.n))) tries[r.id] = (tries[r.id] ?? 0) + 1;
fs.writeFileSync(new URL('./i2i-ref-tries.json', import.meta.url), JSON.stringify(tries, null, 1));
await p.$disconnect();
