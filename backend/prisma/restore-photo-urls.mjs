import fs from 'node:fs';
process.env.DATABASE_URL = fs.readFileSync('.railway-db-url','utf8').trim() + '?connect_timeout=30&connection_limit=1';
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

// name → aigen url, from the check logs and the last audit report
const pairs = new Map();
for (const f of ['.logs-photocheck2.out', '.logs-i2i-check.out', '.logs-audit.out']) {
  let txt = ''; try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const m of txt.matchAll(/^OK (.+?) -> (\/api\/files\/aigen-[0-9a-f-]{36})/gm)) {
    pairs.set(m[1].trim(), m[2]);
  }
}
try {
  const rep = JSON.parse(fs.readFileSync('prisma/audit-photos-report.json', 'utf8'));
  for (const b of rep.bad ?? []) if (b.photoUrl && b.id) pairs.set('#id:' + b.id, b.photoUrl);
} catch {}
console.log('восстановимых записей:', pairs.size);

let byId = 0, byName = 0;
for (const [k, url] of pairs) {
  try {
    if (k.startsWith('#id:')) {
      await p.listing.update({ where: { id: k.slice(4) }, data: { photoUrl: url } });
      byId++;
    } else {
      const hit = await p.listing.findFirst({
        where: { name: k, type: { in: ['DISH', 'DRINK'] }, photoUrl: null },
        select: { id: true },
      });
      if (hit) { await p.listing.update({ where: { id: hit.id }, data: { photoUrl: url } }); byName++; }
    }
  } catch { /* skip */ }
}
console.log(`восстановлено: по id ${byId}, по названию ${byName}`);
const total = await p.listing.count({ where: { type: { in: ['DISH','DRINK'] }, photoUrl: { not: null } } });
console.log('фото на проде теперь:', total);
await p.$disconnect();
