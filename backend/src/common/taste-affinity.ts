// Shared taste-profile builder (YouTube-style affinities) used by BOTH the
// recsys feed and the catalog «Рекомендуемые» sort, so every surface ranks with
// the same brain. Standalone function (not a service) to avoid the
// RecsysService ⇄ ListingsService DI cycle. Rebuilt per request — the profile
// updates after every user action (rating, favorite, open, «не интересно»).
import type { PrismaService } from '../prisma/prisma.service';

export type TasteAffinities = {
  catAffinity: Map<string, number>; // category (lowercase) → [-1, 1]
  venueAffinity: Map<string, number>; // venueId → [-1, 1]
};

export async function buildAffinities(prisma: PrismaService, userId: string): Promise<TasteAffinities> {
  const catAffinity = new Map<string, number>();
  const bump = (cat: string | null | undefined, w: number) => {
    const k = (cat ?? '').toLowerCase().trim();
    if (k) catAffinity.set(k, (catAffinity.get(k) ?? 0) + w);
  };
  const [ratedFull, favs, opens, swiped] = await Promise.all([
    prisma.review.findMany({ where: { userId }, select: { rating: true, listing: { select: { category: true } } } }),
    prisma.favorite.findMany({ where: { userId }, select: { listing: { select: { category: true } } } }),
    prisma.interaction.groupBy({ by: ['listingId'], where: { userId, type: { in: ['OPEN', 'VIEW'] } }, _count: true }),
    prisma.dislike.findMany({ where: { userId } }),
  ]);
  for (const r of ratedFull) bump(r.listing?.category, r.rating >= 4 ? 2.5 : r.rating <= 2 ? -2.5 : 0.3);
  for (const f of favs) bump(f.listing?.category, 1.5);
  for (const d of swiped) bump((d as any).category, -3); // dislike / «не интересно»
  if (opens.length) {
    const oids = opens.map((o) => o.listingId);
    const oCats = await prisma.listing.findMany({ where: { id: { in: oids } }, select: { id: true, category: true } });
    const catById = new Map(oCats.map((c) => [c.id, c.category]));
    for (const o of opens) bump(catById.get(o.listingId), Math.min(1, 0.4 * o._count));
  }
  const maxAbs = Math.max(1, ...[...catAffinity.values()].map((v) => Math.abs(v)));
  for (const [k, v] of catAffinity) catAffinity.set(k, v / maxAbs);

  const venueAffinity = new Map<string, number>();
  const vbump = (id: string | null | undefined, w: number) => {
    if (id) venueAffinity.set(id, (venueAffinity.get(id) ?? 0) + w);
  };
  const [venueReviews, venueFavs, venueOpens] = await Promise.all([
    prisma.review.findMany({ where: { userId }, select: { rating: true, attributes: true } }),
    prisma.favorite.findMany({ where: { userId, listing: { type: 'RESTAURANT' } }, select: { listingId: true } }),
    prisma.interaction.groupBy({ by: ['listingId'], where: { userId, type: { in: ['OPEN', 'VIEW'] }, listing: { type: 'RESTAURANT' } }, _count: true }),
  ]);
  for (const r of venueReviews) vbump((r.attributes as any)?.venueId, r.rating >= 4 ? 2 : r.rating <= 2 ? -1.5 : 0.5);
  for (const f of venueFavs) vbump(f.listingId, 1.5);
  for (const o of venueOpens) vbump(o.listingId, Math.min(1.5, 0.5 * o._count));
  const vMax = Math.max(1, ...[...venueAffinity.values()].map((v) => Math.abs(v)));
  for (const [k, v] of venueAffinity) venueAffinity.set(k, v / vMax);

  return { catAffinity, venueAffinity };
}
