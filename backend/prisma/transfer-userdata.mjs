// Transfers USER data from the local Docker DB into the Railway production DB:
// users, reviews (+votes/comments), follows, favorites, dislikes, interactions,
// user-added menu links. Insert-only + remap, never deletes:
//   • users matched by telegramId (re-registered users keep their prod id)
//   • listings matched by id, then by (type, lower(name)) — items were re-seeded
//     on prod so their ids differ; missing cards are copied over
// Re-runnable (skips existing rows). Run: node prisma/transfer-userdata.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// LOCAL comes from .env; REMOTE from .railway-db-url
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('=');
  const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const REMOTE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const { PrismaClient } = await import('@prisma/client');
const L = new PrismaClient(); // local (env DATABASE_URL)
const R = new PrismaClient({ datasources: { db: { url: REMOTE_URL } } }); // railway

const dry = process.argv.includes('--dry');
const log = (...a) => console.log(...a);

// ---------- 1) users: map local id -> remote id ----------
const localUsers = await L.user.findMany();
const userMap = new Map(); // localId -> remoteId
let uNew = 0, uMatched = 0;
for (const u of localUsers) {
  const existing = await R.user.findFirst({ where: { telegramId: u.telegramId } });
  if (existing) {
    userMap.set(u.id, existing.id);
    uMatched++;
    // enrich the prod user with the richer local profile (avatar, name) if missing
    if (!dry && !existing.photoUrl && u.photoUrl) {
      await R.user.update({ where: { id: existing.id }, data: { photoUrl: u.photoUrl } }).catch(() => {});
    }
  } else {
    userMap.set(u.id, u.id);
    uNew++;
    if (!dry) {
      const { id, telegramId, firstName, lastName, username, photoUrl, role, preferences, createdAt } = u;
      await R.user.create({ data: { id, telegramId, firstName, lastName, username, photoUrl, role, preferences: preferences ?? undefined, createdAt } }).catch((e) => log('  user fail', u.firstName, e.code ?? e.message));
    }
  }
}
log(`users: ${localUsers.length} local → ${uNew} new, ${uMatched} matched by telegramId`);

// ---------- 2) listing remap: local listingId -> remote listingId ----------
const listingCache = new Map();
async function mapListing(localId) {
  if (!localId) return null;
  if (listingCache.has(localId)) return listingCache.get(localId);
  let remoteId = null;
  const byId = await R.listing.findUnique({ where: { id: localId }, select: { id: true } });
  if (byId) remoteId = byId.id;
  else {
    const loc = await L.listing.findUnique({ where: { id: localId } });
    if (loc) {
      const byName = await R.listing.findFirst({
        where: { type: loc.type, name: { equals: loc.name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (byName) remoteId = byName.id;
      else if (!dry) {
        // card missing on prod → copy it (keeps the review's subject alive)
        const { reviews, ...data } = loc;
        await R.listing.create({ data: { ...data, avgRating: 0, reviewCount: 0 } }).catch(() => {});
        remoteId = loc.id;
      } else remoteId = loc.id;
    }
  }
  listingCache.set(localId, remoteId);
  return remoteId;
}

// ---------- 3) reviews (+ remapped attributes.venueId) ----------
const reviews = await L.review.findMany();
let rNew = 0, rSkip = 0;
const reviewMap = new Map(); // localReviewId -> remoteReviewId
for (const r of reviews) {
  const listingId = await mapListing(r.listingId);
  const userId = userMap.get(r.userId);
  if (!listingId || !userId) { rSkip++; continue; }
  const existing = await R.review.findFirst({ where: { listingId, userId }, select: { id: true } });
  if (existing) { reviewMap.set(r.id, existing.id); rSkip++; continue; }
  reviewMap.set(r.id, r.id);
  rNew++;
  if (dry) continue;
  const attrs = r.attributes && typeof r.attributes === 'object' ? { ...r.attributes } : r.attributes;
  if (attrs && attrs.venueId) attrs.venueId = (await mapListing(attrs.venueId)) ?? attrs.venueId;
  await R.review.create({
    data: {
      id: r.id, listingId, userId, rating: r.rating, text: r.text,
      attributes: attrs ?? undefined, photoUrls: r.photoUrls, videoUrls: r.videoUrls,
      status: r.status, createdAt: r.createdAt,
    },
  }).catch((e) => log('  review fail', e.code ?? e.message));
}
log(`reviews: +${rNew} new, ${rSkip} existing/skipped`);

// ---------- 4) votes + comments ----------
let vN = 0;
for (const v of await L.reviewVote.findMany()) {
  const reviewId = reviewMap.get(v.reviewId);
  const userId = userMap.get(v.userId);
  if (!reviewId || !userId) continue;
  if (!dry) await R.reviewVote.create({ data: { reviewId, userId, type: v.type } }).then(() => vN++).catch(() => {});
  else vN++;
}
log(`votes: +${vN}`);
let cN = 0;
const comments = await L.comment.findMany({ orderBy: { createdAt: 'asc' } }); // parents first
for (const c of comments) {
  const reviewId = reviewMap.get(c.reviewId);
  const userId = userMap.get(c.userId);
  if (!reviewId || !userId) continue;
  if (!dry) await R.comment.create({ data: { id: c.id, reviewId, userId, text: c.text, parentId: c.parentId, createdAt: c.createdAt } }).then(() => cN++).catch(() => {});
  else cN++;
}
log(`comments: +${cN}`);

// ---------- 5) follows / favorites / dislikes / interactions ----------
let fN = 0;
for (const f of await L.follow.findMany()) {
  const a = userMap.get(f.followerId), b = userMap.get(f.followingId);
  if (!a || !b) continue;
  if (!dry) await R.follow.create({ data: { followerId: a, followingId: b } }).then(() => fN++).catch(() => {});
  else fN++;
}
log(`follows: +${fN}`);
let favN = 0;
for (const f of await L.favorite.findMany()) {
  const userId = userMap.get(f.userId);
  const listingId = await mapListing(f.listingId);
  if (!userId || !listingId) continue;
  if (!dry) await R.favorite.create({ data: { userId, listingId, createdAt: f.createdAt } }).then(() => favN++).catch(() => {});
  else favN++;
}
log(`favorites: +${favN}`);
let dN = 0;
for (const d of await L.dislike.findMany()) {
  const userId = userMap.get(d.userId);
  const itemId = await mapListing(d.itemId);
  if (!userId || !itemId) continue;
  if (!dry) await R.dislike.create({ data: { userId, itemId, category: d.category } }).then(() => dN++).catch(() => {});
  else dN++;
}
log(`dislikes: +${dN}`);
let iN = 0;
for (const it of await L.interaction.findMany()) {
  const userId = userMap.get(it.userId);
  const listingId = await mapListing(it.listingId);
  if (!userId || !listingId) continue;
  if (!dry) await R.interaction.create({ data: { userId, listingId, type: it.type, weight: it.weight, createdAt: it.createdAt } }).then(() => iN++).catch(() => {});
  else iN++;
}
log(`interactions: +${iN}`);

// ---------- 6) user-added menu links (linkChain results incl. prices) ----------
let mN = 0;
for (const m of await L.menuLink.findMany({ where: { addedByUserId: { not: null } } })) {
  const venueId = await mapListing(m.venueId);
  const itemId = await mapListing(m.itemId);
  const addedByUserId = userMap.get(m.addedByUserId) ?? null;
  if (!venueId || !itemId) continue;
  if (!dry) {
    await R.menuLink.upsert({
      where: { venueId_itemId: { venueId, itemId } },
      create: { venueId, itemId, status: m.status, price: m.price, addedByUserId },
      update: m.price != null ? { price: m.price } : {},
    }).then(() => mN++).catch(() => {});
  } else mN++;
}
log(`user menu links: +${mN}`);

// ---------- 7) recompute ratings for affected listings (real APPROVED only) ----------
if (!dry) {
  const affected = [...new Set([...reviewMap.keys()].map(() => null))]; // recompute via distinct listings
  const listingIds = [...new Set((await R.review.findMany({ select: { listingId: true } })).map((x) => x.listingId))];
  for (const lid of listingIds) {
    const agg = await R.review.aggregate({ where: { listingId: lid, status: 'APPROVED' }, _avg: { rating: true }, _count: true });
    await R.listing.update({ where: { id: lid }, data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count } }).catch(() => {});
  }
  log(`ratings recomputed for ${listingIds.length} listings`);
}

await L.$disconnect();
await R.$disconnect();
log(dry ? '[DRY] done' : 'DONE');
