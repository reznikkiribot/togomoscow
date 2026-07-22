import { Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

export const EXPLORATION_CONFIG_KEY = 'recsysExploration';
export const EXPLORATION_IMPRESSION = 'EXPLORE_IMPRESSION';
export const EXPLORATION_REACTION = 'EXPLORE_REACTION';
export const EXPLORATION_KNOWN = 'EXPLORE_KNOWN';

export type ExplorationBand = { maxReviews: number | null; share: number };
export type ExplorationConfig = {
  enabled: boolean;
  bands: ExplorationBand[];
  maxPerCategory: number;
  bayesianPriorMean: number;
  bayesianPriorWeight: number;
  attributionDays: number;
};

export const DEFAULT_EXPLORATION_CONFIG: ExplorationConfig = {
  enabled: true,
  bands: [
    { maxReviews: 4, share: 0.3 },
    { maxReviews: 24, share: 0.15 },
    { maxReviews: null, share: 0.08 },
  ],
  maxPerCategory: 1,
  bayesianPriorMean: 4,
  bayesianPriorWeight: 8,
  attributionDays: 30,
};

type ExplorationCandidate = {
  it: {
    id: string;
    category: string | null;
    avgRating: number;
    reviewCount: number;
  };
};

const log = new Logger('RecsysExploration');
let configCache: { expires: number; value: ExplorationConfig } | null = null;
const metricsLoggedAt = new Map<string, number>();
const reactionInFlight = new Set<string>();

export function categoryKey(category?: string | null): string {
  return (category ?? '').toLowerCase().trim();
}

function validShare(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0.01, Math.min(0.8, n)) : fallback;
}

function normalizeConfig(value: unknown): ExplorationConfig {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Partial<ExplorationConfig> : {};
  const rawBands = Array.isArray(raw.bands) ? raw.bands : DEFAULT_EXPLORATION_CONFIG.bands;
  const bands = rawBands
    .map((band, index) => ({
      maxReviews: band?.maxReviews == null ? null : Math.max(0, Math.floor(Number(band.maxReviews))),
      share: validShare(band?.share, DEFAULT_EXPLORATION_CONFIG.bands[index]?.share ?? 0.08),
    }))
    .filter((band) => band.maxReviews == null || Number.isFinite(band.maxReviews))
    .sort((a, b) => (a.maxReviews ?? Number.MAX_SAFE_INTEGER) - (b.maxReviews ?? Number.MAX_SAFE_INTEGER));
  if (!bands.some((band) => band.maxReviews == null)) {
    bands.push({ maxReviews: null, share: DEFAULT_EXPLORATION_CONFIG.bands[DEFAULT_EXPLORATION_CONFIG.bands.length - 1].share });
  }
  return {
    enabled: raw.enabled !== false,
    bands,
    maxPerCategory: Math.max(1, Math.min(2, Math.floor(Number(raw.maxPerCategory) || 1))),
    bayesianPriorMean: Math.max(1, Math.min(5, Number(raw.bayesianPriorMean) || 4)),
    bayesianPriorWeight: Math.max(1, Math.min(100, Number(raw.bayesianPriorWeight) || 8)),
    attributionDays: Math.max(1, Math.min(180, Math.floor(Number(raw.attributionDays) || 30))),
  };
}

export async function loadExplorationConfig(prisma: PrismaService): Promise<ExplorationConfig> {
  if (configCache && configCache.expires > Date.now()) return configCache.value;
  const row = await prisma.gameConfig.findUnique({ where: { key: EXPLORATION_CONFIG_KEY } }).catch(() => null);
  const value = normalizeConfig(row?.value);
  configCache = { value, expires: Date.now() + 60_000 };
  return value;
}

export function invalidateExplorationConfig(): void {
  configCache = null;
}

export function explorationShare(reviewCount: number, config: ExplorationConfig): number {
  if (!config.enabled) return 0;
  return config.bands.find((band) => band.maxReviews == null || reviewCount <= band.maxReviews)!.share;
}

export function explorationSlotCount(take: number, share: number, candidateCount: number): number {
  if (take <= 0 || share <= 0 || candidateCount <= 0) return 0;
  return Math.min(take, candidateCount, Math.max(1, Math.round(take * share)));
}

export function bayesianRating(candidate: ExplorationCandidate['it'], config: ExplorationConfig): number {
  const count = Math.max(0, candidate.reviewCount || 0);
  const rating = count > 0 ? Math.max(1, Math.min(5, candidate.avgRating || config.bayesianPriorMean)) : config.bayesianPriorMean;
  return (count * rating + config.bayesianPriorWeight * config.bayesianPriorMean)
    / (count + config.bayesianPriorWeight);
}

/** Best unknown item from each category first; a second round is optional via config. */
export function selectExploration<T extends ExplorationCandidate>(
  candidates: T[],
  knownCategories: Set<string>,
  count: number,
  config: ExplorationConfig,
): T[] {
  if (!config.enabled || count <= 0) return [];
  const byCategory = new Map<string, T[]>();
  for (const candidate of candidates) {
    const category = categoryKey(candidate.it.category);
    if (!category || knownCategories.has(category)) continue;
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category)!.push(candidate);
  }
  for (const rows of byCategory.values()) {
    rows.sort((a, b) =>
      bayesianRating(b.it, config) - bayesianRating(a.it, config)
      || b.it.reviewCount - a.it.reviewCount
      || a.it.id.localeCompare(b.it.id));
  }
  const categories = [...byCategory.entries()]
    .sort((a, b) => bayesianRating(b[1][0].it, config) - bayesianRating(a[1][0].it, config));
  const selected: T[] = [];
  for (let round = 0; round < config.maxPerCategory && selected.length < count; round++) {
    for (const [, rows] of categories) {
      if (rows[round]) selected.push(rows[round]);
      if (selected.length >= count) break;
    }
  }
  return selected;
}

/** Spread learning cards through the page so they never arrive as a block. */
export function interleaveExploration<T>(exploitation: T[], exploration: T[], take: number): T[] {
  const total = Math.min(take, exploitation.length + exploration.length);
  if (!exploration.length) return exploitation.slice(0, total);
  const rows = exploration.slice(0, total);
  const positions = new Set(rows.map((_, index) => {
    // Home appends the first few cards from a wider server page. Put one learning
    // slot near the top, then spread the remainder across the complete page.
    const position = index === 0
      ? Math.min(2, total - 1)
      : Math.round(((index + 1) * (total + 1)) / (rows.length + 1)) - 1;
    return Math.max(0, Math.min(total - 1, position));
  }));
  const output: T[] = [];
  let exploitIndex = 0;
  let exploreIndex = 0;
  for (let position = 0; position < total; position++) {
    if (positions.has(position) && exploreIndex < exploration.length) output.push(exploration[exploreIndex++]);
    else if (exploitIndex < exploitation.length) output.push(exploitation[exploitIndex++]);
    else if (exploreIndex < exploration.length) output.push(exploration[exploreIndex++]);
  }
  return output;
}

export async function recordExplorationImpression(prisma: PrismaService, userId: string, listingId: string) {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const duplicate = await prisma.interaction.findFirst({
    where: { userId, listingId, type: EXPLORATION_IMPRESSION, createdAt: { gte: since } },
    select: { id: true },
  });
  if (duplicate) return { ok: true, duplicate: true };
  await prisma.interaction.create({ data: { userId, listingId, type: EXPLORATION_IMPRESSION, weight: 0 } });
  log.log(JSON.stringify({ event: 'exploration_impression', userId, listingId }));
  return { ok: true };
}

/** Attribute the first real action after an exploration impression and count one category transition. */
export async function recordExplorationReaction(
  prisma: PrismaService,
  userId: string,
  listingId: string,
  reaction: string,
  attributionDays = DEFAULT_EXPLORATION_CONFIG.attributionDays,
): Promise<void> {
  const lockKey = `${userId}:${listingId}`;
  if (reactionInFlight.has(lockKey)) return;
  reactionInFlight.add(lockKey);
  try {
    const since = new Date(Date.now() - attributionDays * 86_400_000);
  const impression = await prisma.interaction.findFirst({
    where: { userId, listingId, type: EXPLORATION_IMPRESSION, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (!impression) return;
  const alreadyAttributed = await prisma.interaction.findFirst({
    where: { userId, listingId, type: EXPLORATION_REACTION, createdAt: { gte: impression.createdAt } },
    select: { id: true },
  });
  if (alreadyAttributed) return;
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { category: true } });
  const category = categoryKey(listing?.category);
  const priorTransition = category
    ? await prisma.interaction.findFirst({
      where: { userId, type: EXPLORATION_KNOWN, listing: { category: { equals: listing!.category, mode: 'insensitive' } } },
      select: { id: true },
    })
    : null;
  await prisma.$transaction([
    prisma.interaction.create({ data: { userId, listingId, type: EXPLORATION_REACTION, weight: 0 } }),
    ...(!priorTransition && category
      ? [prisma.interaction.create({ data: { userId, listingId, type: EXPLORATION_KNOWN, weight: 0 } })]
      : []),
  ]);
    log.log(JSON.stringify({
      event: 'exploration_reaction', userId, listingId, category, reaction,
      unknownToKnown: !priorTransition && !!category,
    }));
  } finally {
    reactionInFlight.delete(lockKey);
  }
}

/** Periodic rolling aggregate; individual impression/reaction logs remain available too. */
export async function logExplorationMetrics(prisma: PrismaService, userId: string): Promise<void> {
  const last = metricsLoggedAt.get(userId) ?? 0;
  if (Date.now() - last < 5 * 60_000) return;
  metricsLoggedAt.set(userId, Date.now());
  const since = new Date(Date.now() - 30 * 86_400_000);
  const rows: { type: string; _count: number }[] = await prisma.interaction.groupBy({
    by: ['type'],
    where: { userId, type: { in: [EXPLORATION_IMPRESSION, EXPLORATION_REACTION, EXPLORATION_KNOWN] }, createdAt: { gte: since } },
    _count: true,
  }).catch(() => [] as { type: string; _count: number }[]);
  const count = (type: string) => rows.find((row) => row.type === type)?._count ?? 0;
  const impressions = count(EXPLORATION_IMPRESSION);
  const reactions = count(EXPLORATION_REACTION);
  log.log(JSON.stringify({
    event: 'exploration_metrics_30d', userId, impressions, reactions,
    reactionRate: impressions ? Number((reactions / impressions).toFixed(3)) : 0,
    learnedCategories: count(EXPLORATION_KNOWN),
  }));
}
