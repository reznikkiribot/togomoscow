// Backfills venue contacts from OpenStreetMap (legal/open): website, Telegram,
// VK — using the contact:* tags that weren't imported originally. Re-queries
// Overpass by each venue's stored OSM id (listing.externalId = "node/123").
// Adds listing.website where missing and creates VenueSource rows (website/telegram/vk).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OVERPASS = 'https://overpass-api.de/api/interpreter';

function tgHandle(s) {
  const m = String(s).match(/(?:t\.me\/|telegram\.me\/|@)([A-Za-z0-9_]{4,})/i);
  if (!m) return null;
  const h = m[1].toLowerCase();
  return ['share', 'joinchat', 'iv'].includes(h) ? null : h;
}
function vkHandle(s) {
  const m = String(s).match(/vk\.com\/([A-Za-z0-9_.]{3,})/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9_.]{3,}$/.test(String(s))) return String(s);
  return null;
}

async function overpass(type, ids) {
  const q = `[out:json][timeout:120];${type}(id:${ids.join(',')});out tags;`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(OVERPASS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'togomoscow/1.0 (osm enrich)' },
        body: 'data=' + encodeURIComponent(q),
      });
      if (res.status === 429 || res.status === 504) { await sleep(8000); continue; }
      if (!res.ok) return [];
      const d = await res.json();
      return d.elements ?? [];
    } catch {
      await sleep(5000);
    }
  }
  return [];
}

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const venues = await prisma.listing.findMany({
    where: { type: 'RESTAURANT', source: 'osm', externalId: { not: null } },
    select: { id: true, externalId: true, website: true },
  });
  // group osm ids by element type
  const byType = { node: new Map(), way: new Map(), relation: new Map() };
  for (const v of venues) {
    const [t, id] = (v.externalId ?? '').split('/');
    if (byType[t]) byType[t].set(id, v);
  }

  let sitesAdded = 0, tgAdded = 0, vkAdded = 0;
  for (const [type, map] of Object.entries(byType)) {
    const ids = [...map.keys()];
    for (let i = 0; i < ids.length; i += 180) {
      const batch = ids.slice(i, i + 180);
      const els = await overpass(type, batch);
      for (const el of els) {
        const v = map.get(String(el.id));
        if (!v) continue;
        const tags = el.tags ?? {};
        const site = tags.website || tags['contact:website'] || tags.url;
        const tgRaw = tags['contact:telegram'] || tags.telegram ||
          Object.values(tags).find((x) => /t\.me\/|telegram\.me\//i.test(String(x)));
        const vkRaw = tags['contact:vk'] || tags['contact:vkontakte'] ||
          Object.values(tags).find((x) => /vk\.com\//i.test(String(x)));

        if (site && !v.website && /^https?:\/\//.test(site)) {
          await prisma.listing.update({ where: { id: v.id }, data: { website: site } }).catch(() => {});
          await prisma.venueSource.create({ data: { venueId: v.id, type: 'website', url: site } }).catch(() => {});
          sitesAdded++;
        }
        const th = tgRaw && tgHandle(tgRaw);
        if (th) {
          await prisma.venueSource.create({ data: { venueId: v.id, type: 'telegram', url: `https://t.me/${th}`, handle: th } }).catch(() => {});
          tgAdded++;
        }
        const vh = vkRaw && vkHandle(vkRaw);
        if (vh) {
          await prisma.venueSource.create({ data: { venueId: v.id, type: 'vk', url: `https://vk.com/${vh}`, handle: vh } }).catch(() => {});
          vkAdded++;
        }
      }
      console.log(`${type} ${i + batch.length}/${ids.length} — +site ${sitesAdded} +tg ${tgAdded} +vk ${vkAdded}`);
      await sleep(2500); // be gentle with Overpass
    }
  }
  console.log(`DONE. websites added ${sitesAdded}, telegram ${tgAdded}, vk ${vkAdded}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
