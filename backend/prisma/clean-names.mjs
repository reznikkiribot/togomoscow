// One-time production cleanup for historical dish/drink names.
// Dry-run is mandatory before applying:
//   node prisma/clean-names.mjs --dry
//   node prisma/clean-names.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isJunk, normalizeMenuName } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dry = process.argv.includes('--dry');
const apply = process.argv.includes('--apply');
if (dry === apply) {
  console.error('Specify exactly one mode: --dry or --apply');
  process.exit(1);
}

function productionUrl() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
  const separator = raw.includes('?') ? '&' : '?';
  const sslMode = process.env.DATABASE_SSLMODE ? `&sslmode=${encodeURIComponent(process.env.DATABASE_SSLMODE)}` : '';
  return `${raw}${separator}connect_timeout=30&connection_limit=1${sslMode}`;
}

process.env.DATABASE_URL = productionUrl();
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

async function retryP1001(label, fn) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = String(error?.message ?? error);
      const transient = error?.code === 'P1001' || message.includes('P1001');
      if (!transient || attempt === 6) throw error;
      const delayMs = attempt * 5000;
      console.log(`P1001: ${label}, retry ${attempt}/6 in ${delayMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

try {
  const items = await retryP1001('read listings', () => prisma.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] } },
    select: {
      id: true,
      type: true,
      name: true,
      category: true,
      groupKey: true,
      source: true,
      _count: { select: { reviews: true, servedAt: true } },
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  }));

  const keyOf = (item, name) => [
    item.type,
    item.category ?? '',
    name.toLocaleLowerCase('ru-RU'),
  ].join('|');
  const rows = items.map((item) => {
    const name = normalizeMenuName(item.name);
    return { item, name, junk: !name || isJunk(name) };
  });
  const skipped = [];
  const groups = new Map();
  for (const row of rows) {
    if (row.junk) {
      if (row.name !== row.item.name) skipped.push(row);
      continue;
    }
    const key = keyOf(row.item, row.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const renames = [];
  const merges = [];
  const blocked = [];
  for (const group of groups.values()) {
    const changed = group.filter((row) => row.name !== row.item.name);
    if (!changed.length) continue;

    const ranked = [...group].sort((a, b) =>
      b.item._count.reviews - a.item._count.reviews
      || Number(b.item.name === b.name) - Number(a.item.name === a.name)
      || b.item._count.servedAt - a.item._count.servedAt
      || a.item.id.localeCompare(b.item.id));
    const canonical = ranked[0];
    if (canonical.name !== canonical.item.name) {
      renames.push({
        ...canonical,
        updateGroupKey: canonical.item.groupKey === canonical.item.name.toLocaleLowerCase('ru-RU'),
      });
    }

    for (const duplicate of ranked.slice(1)) {
      if (duplicate.item._count.reviews > 0) {
        blocked.push({ duplicate, canonical });
      } else {
        merges.push({ duplicate, canonical });
      }
    }
  }

  for (const rename of renames) {
    console.log(`RENAME ${rename.item.type} ${rename.item.id}: «${rename.item.name}» → «${rename.name}»`);
  }
  for (const merge of merges) {
    console.log(`MERGE ${merge.duplicate.item.type} ${merge.duplicate.item.id}: «${merge.duplicate.item.name}» → «${merge.canonical.name}» (${merge.duplicate.item._count.servedAt} menuLinks, 0 reviews)`);
  }
  for (const entry of blocked) {
    console.log(`KEEP ${entry.duplicate.item.type} ${entry.duplicate.item.id}: «${entry.duplicate.item.name}» — дубль «${entry.canonical.name}», но есть отзывов: ${entry.duplicate.item._count.reviews}`);
  }
  for (const entry of skipped) {
    console.log(`SKIP ${entry.item.type} ${entry.item.id}: «${entry.item.name}» → «${entry.name || '∅'}» (результат пустой/мусорный)`);
  }

  if (apply) {
    let updated = 0;
    for (const rename of renames) {
      const data = { name: rename.name };
      if (rename.updateGroupKey) data.groupKey = rename.name.toLocaleLowerCase('ru-RU');
      await retryP1001(`update ${rename.item.id}`, () => prisma.listing.update({
        where: { id: rename.item.id },
        data,
      }));
      updated++;
    }

    let merged = 0;
    for (const { duplicate, canonical } of merges) {
      const result = await retryP1001(`merge ${duplicate.item.id}`, () => prisma.$transaction(async (tx) => {
        // Lock before the review check so a concurrent review cannot be silently
        // cascade-deleted between the safety check and deleting the duplicate.
        await tx.$queryRaw`SELECT id FROM listings WHERE id = ${duplicate.item.id} FOR UPDATE`;
        const fresh = await tx.listing.findUnique({
          where: { id: duplicate.item.id },
          select: { id: true, _count: { select: { reviews: true } } },
        });
        if (!fresh) return { status: 'already-merged', links: 0 };
        if (fresh._count.reviews > 0) return { status: 'blocked', reviews: fresh._count.reviews, links: 0 };

        const links = await tx.menuLink.findMany({ where: { itemId: duplicate.item.id } });
        for (const link of links) {
          const target = await tx.menuLink.findUnique({
            where: { venueId_itemId: { venueId: link.venueId, itemId: canonical.item.id } },
          });
          if (target) {
            await tx.menuLink.update({
              where: { venueId_itemId: { venueId: link.venueId, itemId: canonical.item.id } },
              data: {
                status: target.status === 'APPROVED' || link.status === 'APPROVED' ? 'APPROVED' : target.status,
                price: target.price ?? link.price,
                photoUrl: target.photoUrl ?? link.photoUrl,
                refImage: target.refImage ?? link.refImage,
                addedByUserId: target.addedByUserId ?? link.addedByUserId,
              },
            });
          } else {
            await tx.menuLink.create({
              data: {
                venueId: link.venueId,
                itemId: canonical.item.id,
                status: link.status,
                price: link.price,
                photoUrl: link.photoUrl,
                refImage: link.refImage,
                addedByUserId: link.addedByUserId,
              },
            });
          }
        }
        await tx.listing.delete({ where: { id: duplicate.item.id } });
        return { status: 'merged', links: links.length };
      }, { maxWait: 30_000, timeout: 120_000 }));
      if (result.status === 'blocked') {
        console.log(`KEEP ${duplicate.item.id}: во время apply появились отзывы: ${result.reviews}`);
      } else {
        merged++;
      }
    }
    console.log(`\n[APPLY] названий обновлено: ${updated}; дублей слито: ${merged}; оставлено дублей с отзывами: ${blocked.length}; пропущено как мусор: ${skipped.length}; всего проверено: ${items.length}`);
  } else {
    console.log(`\n[DRY] названий изменится: ${renames.length}; дублей сольётся: ${merges.length}; останется дублей с отзывами: ${blocked.length}; пропущено как мусор: ${skipped.length}; всего проверено: ${items.length}`);
    console.log('Записи в БД не выполнялись. Для применения: node prisma/clean-names.mjs --apply');
  }
} finally {
  await prisma.$disconnect().catch(() => {});
}
