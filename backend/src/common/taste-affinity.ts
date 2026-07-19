// Shared, request-time taste profile used by both the feed and catalog sorting.
// It intentionally stays outside Nest DI to avoid a RecsysService <->
// ListingsService cycle. Every rating/favorite/open is visible on the next request.
import type { PrismaService } from '../prisma/prisma.service';

export type VenueTier = 'economy' | 'casual' | 'premium' | 'fastfood';

export type PriceSegmentAffinity = {
  sampleCount: number;
  effectiveWeight: number;
  median: number;
  p20: number;
  p80: number;
  low: number;
  high: number;
  confidence: number;
};

export type VenueTraits = {
  tier: VenueTier;
  menuMedian: number | null;
  estimatedCheck: number | null;
  priceLevel: number | null;
};

export type TasteAffinities = {
  catAffinity: Map<string, number>; // lowercase category -> [-1, 1]
  venueAffinity: Map<string, number>; // venueId -> [-1, 1]
  priceSegmentAffinity: PriceSegmentAffinity | null;
  venueTierAffinity: Map<VenueTier, number>; // venue class -> [-1, 1]
};

type WeightedSample = { value: number; weight: number };
type VenueRow = {
  id: string;
  name: string;
  category: string | null;
  cuisine: string | null;
  groupKey: string | null;
  priceLevel: number | null;
};

const TIERS: VenueTier[] = ['economy', 'casual', 'premium', 'fastfood'];
const PRICE_LEVEL_ITEM_PRICE = [0, 350, 650, 1100, 1800];

function cleanPrice(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.replace(/[^0-9.,]/g, '').replace(',', '.')) : Number(value);
  return Number.isFinite(n) && n >= 50 && n <= 100_000 ? n : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function weightedQuantile(samples: WeightedSample[], q: number): number {
  const sorted = [...samples].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, sample) => sum + sample.weight, 0);
  const target = Math.max(0, Math.min(1, q)) * total;
  let seen = 0;
  for (const sample of sorted) {
    seen += sample.weight;
    if (seen >= target) return sample.value;
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function estimateCheck(row: VenueRow, menuMedian: number | null): number | null {
  const hay = `${row.name} ${row.category ?? ''} ${row.cuisine ?? ''}`.toLowerCase();
  const multiplier = /кофе|coffee|кондитер|десерт|пекар/.test(hay)
    ? 1.7
    : /бар|паб|pub|bar/.test(hay)
      ? 2.4
      : /fast.?food|фастфуд|бургер|шаурм|донер|кебаб|kebab/.test(hay)
        ? 1.8
        : 2.2;
  const fromMenu = menuMedian == null ? null : menuMedian * multiplier;
  const fromLevel = row.priceLevel ? [0, 700, 1600, 3500, 6000][row.priceLevel] ?? null : null;
  if (fromMenu != null && fromLevel != null) {
    // Geometric blending is stable when a sparse menu and the Yelp-style level disagree.
    return Math.sqrt(fromMenu * fromLevel);
  }
  return fromMenu ?? fromLevel;
}

function inferVenueTier(row: VenueRow, estimatedCheck: number | null): VenueTier {
  const hay = `${row.name} ${row.category ?? ''} ${row.cuisine ?? ''}`.toLowerCase();
  if (/fast.?food|фастфуд|бургерн|шаурм|донер|кебаб|kebab|burger/.test(hay)) return 'fastfood';
  if (/столов|canteen|буфет|кулинар/.test(hay)) return 'economy';
  if ((row.priceLevel ?? 0) >= 3 || (estimatedCheck ?? 0) >= 2400) return 'premium';
  if (row.priceLevel === 1 || (estimatedCheck != null && estimatedCheck <= 1000)) return 'economy';
  return 'casual';
}

/** Resolve venue class from chain-wide menu prices, priceLevel and category. */
export async function loadVenueTraits(prisma: PrismaService, venueIds: string[]): Promise<Map<string, VenueTraits>> {
  const ids = [...new Set(venueIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const venues = await prisma.listing.findMany({
    where: { id: { in: ids }, type: 'RESTAURANT' },
    select: { id: true, name: true, category: true, cuisine: true, groupKey: true, priceLevel: true },
  });
  const groupKeys = [...new Set(venues.map((v) => v.groupKey).filter((v): v is string => !!v))];
  const ungroupedIds = venues.filter((v) => !v.groupKey).map((v) => v.id);
  const priceLinks = await prisma.menuLink.findMany({
    where: {
      status: 'APPROVED',
      price: { not: null },
      OR: [
        ...(groupKeys.length ? [{ venue: { groupKey: { in: groupKeys } } }] : []),
        ...(ungroupedIds.length ? [{ venueId: { in: ungroupedIds } }] : []),
      ],
    },
    select: { price: true, venue: { select: { id: true, groupKey: true } } },
  });
  const pricesByGroup = new Map<string, number[]>();
  for (const link of priceLinks) {
    const price = cleanPrice(link.price);
    if (price == null) continue;
    const key = link.venue.groupKey || link.venue.id;
    if (!pricesByGroup.has(key)) pricesByGroup.set(key, []);
    pricesByGroup.get(key)!.push(price);
  }
  const result = new Map<string, VenueTraits>();
  for (const venue of venues) {
    const menuMedian = median(pricesByGroup.get(venue.groupKey || venue.id) ?? []);
    const estimatedCheck = estimateCheck(venue, menuMedian);
    result.set(venue.id, {
      tier: inferVenueTier(venue, estimatedCheck),
      menuMedian,
      estimatedCheck,
      priceLevel: venue.priceLevel,
    });
  }
  return result;
}

/** Positive inside the robust comfort band, logarithmic penalty outside it. */
export function scorePriceSegment(profile: PriceSegmentAffinity | null, price: number | null | undefined): number {
  const p = cleanPrice(price);
  if (!profile || p == null) return 0;
  if (p >= profile.low && p <= profile.high) {
    const halfSpan = Math.max(100, (profile.high - profile.low) / 2);
    const centrality = Math.max(0, 1 - Math.abs(p - profile.median) / halfSpan);
    return profile.confidence * (0.55 + 0.45 * centrality);
  }
  const boundary = p < profile.low ? profile.low : profile.high;
  const ratio = Math.max(p, boundary) / Math.max(1, Math.min(p, boundary));
  return -profile.confidence * Math.min(1, Math.log(ratio) / Math.log(2));
}

export function scoreVenueTier(affinity: Map<VenueTier, number>, traits: VenueTraits | undefined): number {
  return traits ? affinity.get(traits.tier) ?? 0 : 0;
}

export async function buildAffinities(prisma: PrismaService, userId: string): Promise<TasteAffinities> {
  const [reviews, favorites, interactions, swiped] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      select: {
        rating: true,
        attributes: true,
        listing: { select: { id: true, type: true, category: true, priceLevel: true } },
      },
    }),
    prisma.favorite.findMany({
      where: { userId },
      select: { listing: { select: { id: true, type: true, category: true, priceLevel: true } } },
    }),
    prisma.interaction.groupBy({
      by: ['listingId', 'type'],
      where: { userId, type: { in: ['OPEN', 'VIEW'] } },
      _count: true,
    }),
    prisma.dislike.findMany({ where: { userId }, select: { category: true } }),
  ]);

  const interactionIds = [...new Set(interactions.map((row) => row.listingId))];
  const interactionListings = interactionIds.length
    ? await prisma.listing.findMany({
      where: { id: { in: interactionIds } },
      select: { id: true, type: true, category: true, priceLevel: true },
    })
    : [];
  const listingById = new Map(interactionListings.map((listing) => [listing.id, listing]));

  const catAffinity = new Map<string, number>();
  const bumpCategory = (category: string | null | undefined, weight: number) => {
    const key = (category ?? '').toLowerCase().trim();
    if (key) catAffinity.set(key, (catAffinity.get(key) ?? 0) + weight);
  };
  for (const review of reviews) bumpCategory(review.listing.category, review.rating >= 4 ? 2.5 : review.rating <= 2 ? -2.5 : 0.3);
  for (const favorite of favorites) bumpCategory(favorite.listing.category, 1.5);
  for (const dislike of swiped) bumpCategory(dislike.category, -3);
  for (const interaction of interactions) {
    const perEvent = interaction.type === 'VIEW' ? 0.55 : 0.25;
    bumpCategory(listingById.get(interaction.listingId)?.category, Math.min(1.5, perEvent * interaction._count));
  }
  const catMax = Math.max(1, ...[...catAffinity.values()].map(Math.abs));
  for (const [key, value] of catAffinity) catAffinity.set(key, value / catMax);

  const venueAffinity = new Map<string, number>();
  const bumpVenue = (id: unknown, weight: number) => {
    if (typeof id === 'string' && id) venueAffinity.set(id, (venueAffinity.get(id) ?? 0) + weight);
  };
  for (const review of reviews) bumpVenue((review.attributes as any)?.venueId, review.rating >= 4 ? 2 : review.rating <= 2 ? -1.5 : 0.5);
  for (const favorite of favorites) if (favorite.listing.type === 'RESTAURANT') bumpVenue(favorite.listing.id, 1.5);
  for (const interaction of interactions) {
    const listing = listingById.get(interaction.listingId);
    if (listing?.type === 'RESTAURANT') {
      const perEvent = interaction.type === 'VIEW' ? 0.65 : 0.3;
      bumpVenue(listing.id, Math.min(1.8, perEvent * interaction._count));
    }
  }
  const venueMax = Math.max(1, ...[...venueAffinity.values()].map(Math.abs));
  for (const [key, value] of venueAffinity) venueAffinity.set(key, value / venueMax);

  const exactVenueIds = new Set<string>();
  for (const review of reviews) {
    const id = (review.attributes as any)?.venueId;
    if (typeof id === 'string' && id) exactVenueIds.add(id);
  }
  for (const favorite of favorites) if (favorite.listing.type === 'RESTAURANT') exactVenueIds.add(favorite.listing.id);
  for (const interaction of interactions) {
    const listing = listingById.get(interaction.listingId);
    if (listing?.type === 'RESTAURANT') exactVenueIds.add(listing.id);
  }

  const itemIds = new Set<string>();
  for (const review of reviews) if (review.listing.type !== 'RESTAURANT') itemIds.add(review.listing.id);
  for (const favorite of favorites) if (favorite.listing.type !== 'RESTAURANT') itemIds.add(favorite.listing.id);
  for (const listing of interactionListings) if (listing.type !== 'RESTAURANT') itemIds.add(listing.id);
  const itemLinks = itemIds.size
    ? await prisma.menuLink.findMany({
      where: { itemId: { in: [...itemIds] }, status: 'APPROVED', price: { not: null } },
      select: { itemId: true, venueId: true, price: true },
    })
    : [];
  const itemPrices = new Map<string, number[]>();
  const exactLinkPrice = new Map<string, number>();
  for (const link of itemLinks) {
    const price = cleanPrice(link.price);
    if (price == null) continue;
    if (!itemPrices.has(link.itemId)) itemPrices.set(link.itemId, []);
    itemPrices.get(link.itemId)!.push(price);
    exactLinkPrice.set(`${link.itemId}|${link.venueId}`, price);
  }

  const venueTraits = await loadVenueTraits(prisma, [...exactVenueIds]);
  const priceSamples: WeightedSample[] = [];
  const addPrice = (value: unknown, weight: number) => {
    const price = cleanPrice(value);
    if (price != null && weight > 0) priceSamples.push({ value: price, weight });
  };
  const fallbackItemPrice = (itemId: string) => median(itemPrices.get(itemId) ?? []);
  const venueRepresentativePrice = (venueId: string) => {
    const traits = venueTraits.get(venueId);
    return traits?.menuMedian ?? (traits?.priceLevel ? PRICE_LEVEL_ITEM_PRICE[traits.priceLevel] : null);
  };

  for (const review of reviews) {
    const attributes = (review.attributes as any) ?? {};
    const venueId = typeof attributes.venueId === 'string' ? attributes.venueId : '';
    const price = cleanPrice(attributes.price)
      ?? (venueId ? exactLinkPrice.get(`${review.listing.id}|${venueId}`) ?? null : null)
      ?? fallbackItemPrice(review.listing.id)
      ?? (review.listing.type === 'RESTAURANT' ? venueRepresentativePrice(review.listing.id) : null);
    // A review proves price tolerance even when the dish itself was disappointing.
    addPrice(price, review.rating >= 4 ? 3.5 : review.rating <= 2 ? 2 : 2.75);
  }
  for (const favorite of favorites) {
    addPrice(
      favorite.listing.type === 'RESTAURANT'
        ? venueRepresentativePrice(favorite.listing.id)
        : fallbackItemPrice(favorite.listing.id),
      2.5,
    );
  }
  for (const interaction of interactions) {
    const listing = listingById.get(interaction.listingId);
    if (!listing) continue;
    const price = listing.type === 'RESTAURANT'
      ? venueRepresentativePrice(listing.id)
      : fallbackItemPrice(listing.id);
    const perEvent = interaction.type === 'VIEW' ? 0.65 : 0.25;
    addPrice(price, Math.min(2, perEvent * interaction._count));
  }

  let priceSegmentAffinity: PriceSegmentAffinity | null = null;
  const effectiveWeight = priceSamples.reduce((sum, sample) => sum + sample.weight, 0);
  if (priceSamples.length >= 3 && effectiveWeight >= 6) {
    const priceMedian = weightedQuantile(priceSamples, 0.5);
    const p20 = weightedQuantile(priceSamples, 0.2);
    const p80 = weightedQuantile(priceSamples, 0.8);
    // Percentile band plus a modest proportional pad: broad enough for different
    // dish categories, but still separates premium and economy habits.
    const low = Math.max(50, Math.min(p20 * 0.8, priceMedian * 0.72));
    const high = Math.max(p80 * 1.25, priceMedian * 1.38);
    priceSegmentAffinity = {
      sampleCount: priceSamples.length,
      effectiveWeight,
      median: priceMedian,
      p20,
      p80,
      low,
      high,
      confidence: Math.min(1, effectiveWeight / 18),
    };
  }

  const tierWeights = new Map<VenueTier, number>();
  const addTier = (venueId: string, weight: number) => {
    const tier = venueTraits.get(venueId)?.tier;
    if (tier) tierWeights.set(tier, (tierWeights.get(tier) ?? 0) + weight);
  };
  for (const review of reviews) {
    const venueId = (review.attributes as any)?.venueId;
    if (typeof venueId === 'string') addTier(venueId, review.rating >= 4 ? 3 : review.rating <= 2 ? 0.6 : 1.5);
  }
  for (const favorite of favorites) if (favorite.listing.type === 'RESTAURANT') addTier(favorite.listing.id, 2.5);
  for (const interaction of interactions) {
    const listing = listingById.get(interaction.listingId);
    if (listing?.type !== 'RESTAURANT') continue;
    const perEvent = interaction.type === 'VIEW' ? 0.7 : 0.3;
    addTier(listing.id, Math.min(2, perEvent * interaction._count));
  }
  const venueTierAffinity = new Map<VenueTier, number>();
  const totalTierWeight = [...tierWeights.values()].reduce((sum, value) => sum + value, 0);
  if (totalTierWeight >= 3) {
    const confidence = Math.min(1, totalTierWeight / 15);
    for (const tier of TIERS) {
      const share = (tierWeights.get(tier) ?? 0) / totalTierWeight;
      // 25% is neutral for four classes. Both a concentrated preference and a
      // completely absent class reach the ends of the scale.
      const normalized = share >= 0.25 ? (share - 0.25) / 0.75 : (share - 0.25) / 0.25;
      venueTierAffinity.set(tier, Math.max(-1, Math.min(1, normalized * confidence)));
    }
  }

  return { catAffinity, venueAffinity, priceSegmentAffinity, venueTierAffinity };
}
