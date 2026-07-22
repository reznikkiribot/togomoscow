import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameService } from '../game/game.service';
import { ResponseCacheService } from '../common/response-cache.service';
import {
  DEFAULT_GOAL_TEMPLATES,
  GoalTemplate,
  pickTemplate,
  renderTemplate,
} from './goal-templates';

// ===== Personal goals =====
// One motivating goal above the home feed. Everything shown is derived from real
// progress — the owner rule is explicit: «Запрещено придумывать … прогресс,
// количество шагов до цели, вес мнения». When a number cannot be computed, the
// template that needs it is skipped rather than filled with a guess.
//
// The wording is about the USER's standing (звание, уровень, влияние, первенство),
// never «помогите приложению» / «обучите рекомендации».

export type GoalCandidate = {
  goalType: string;
  goalKey: string;
  entityName?: string | null;
  current: number;
  target: number;
  remaining: number;
  prestige: number;
  attainability: number;
  urgency: number;
  relevance: number;
  novelty: number;
  fatiguePenalty: number;
  finalScore: number;
  explanationCode: string;
  actionUrl: string;
};

export type RenderedGoal = {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  current: number;
  target: number;
  percent: number;
  actionUrl: string;
  explanationCode: string;
};

/** Tunables. Every weight lives in game_config (`goalRanking`) so the cabinet can
 *  change ranking without a deploy — nothing here is a hard-coded constant. */
export const DEFAULT_GOAL_CONFIG = {
  weights: {
    relevance: 1.0,
    attainability: 0.8,
    prestige: 0.7,
    novelty: 0.5,
    urgency: 0.6,
    fatigue: 1.2,
  },
  /** share of shows that deliberately pick a lower-ranked candidate */
  exploration: { topRate: 0.7, nearTopRate: 0.2, randomRate: 0.1 },
  limits: {
    maxCandidates: 12,
    maxSameTypeInARow: 2,
    maxShowsPerGoalPer7Days: 3,
    fatigueHoursAfterIgnores: 48,
    ignoresBeforeFatigue: 3,
  },
  /** per-type prestige (0..1): how much status the reward carries */
  prestigeByType: {
    specialization: 0.9,
    achievement: 0.85,
    level: 0.8,
    reputation: 0.75,
    discovery: 0.6,
    streak: 0.5,
    comeback: 0.45,
    exploration: 0.4,
  } as Record<string, number>,
};

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly game: GameService,
    private readonly cache: ResponseCacheService,
  ) {}

  private async config() {
    const cfg = await this.game.config();
    const custom = (cfg.goalRanking ?? {}) as Partial<typeof DEFAULT_GOAL_CONFIG>;
    return {
      ...DEFAULT_GOAL_CONFIG,
      ...custom,
      weights: { ...DEFAULT_GOAL_CONFIG.weights, ...(custom as any).weights },
      exploration: { ...DEFAULT_GOAL_CONFIG.exploration, ...(custom as any).exploration },
      limits: { ...DEFAULT_GOAL_CONFIG.limits, ...(custom as any).limits },
      prestigeByType: { ...DEFAULT_GOAL_CONFIG.prestigeByType, ...(custom as any).prestigeByType },
    };
  }

  private async templates(): Promise<GoalTemplate[]> {
    const cfg = await this.game.config();
    const custom = cfg.goalTemplates;
    return Array.isArray(custom) && custom.length ? (custom as GoalTemplate[]) : DEFAULT_GOAL_TEMPLATES;
  }

  // ---------------------------------------------------------------- interests
  /**
   * Per-category interest from in-app behaviour only. Recent actions weigh more
   * (exponential decay, 30-day half-life) and a single stray view never reads as
   * real interest — a rating counts far more than an open.
   */
  private async interestByCategory(userId: string): Promise<Map<string, number>> {
    const since = new Date(Date.now() - 120 * 24 * 3600_000);
    const [interactions, reviews, favorites, dislikes] = await Promise.all([
      this.prisma.interaction.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { type: true, weight: true, createdAt: true, listing: { select: { category: true } } },
        take: 1500,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, rating: true, listing: { select: { category: true } } },
        take: 500,
      }),
      this.prisma.favorite.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, listing: { select: { category: true } } },
        take: 300,
      }),
      this.prisma.dislike.findMany({ where: { userId }, select: { category: true }, take: 300 }),
    ]);

    const now = Date.now();
    const decay = (at: Date) => Math.pow(0.5, (now - at.getTime()) / (30 * 24 * 3600_000));
    const score = new Map<string, number>();
    const add = (category: string | null | undefined, value: number) => {
      if (!category) return;
      score.set(category, (score.get(category) ?? 0) + value);
    };

    for (const i of interactions) add(i.listing?.category, (i.weight ?? 1) * 0.25 * decay(i.createdAt));
    for (const r of reviews) add(r.listing?.category, (2 + (r.rating ?? 0) * 0.4) * decay(r.createdAt));
    for (const f of favorites) add(f.listing?.category, 1.5 * decay(f.createdAt));
    for (const d of dislikes) add(d.category, -2);

    // normalise to 0..1 so the weight is comparable with the other score parts
    const max = Math.max(1, ...[...score.values()]);
    for (const [k, v] of score) score.set(k, Math.max(0, v) / max);
    return score;
  }

  // --------------------------------------------------------------- generation
  /** Build every goal the user is genuinely eligible for, from real counters. */
  async generateCandidates(userId: string): Promise<GoalCandidate[]> {
    const [cfg, gameCfg, state, interests] = await Promise.all([
      this.config(),
      this.game.config(),
      this.game.state(userId).catch(() => null as any),
      this.interestByCategory(userId),
    ]);
    if (!state) return [];

    const out: GoalCandidate[] = [];
    const prestige = (type: string) => cfg.prestigeByType[type] ?? 0.5;
    // closer goals are more attainable; beyond ~10 steps the pull fades
    const attain = (remaining: number) => Math.max(0.05, 1 - Math.min(remaining, 12) / 12);

    const push = (c: Omit<GoalCandidate, 'finalScore' | 'fatiguePenalty' | 'novelty' | 'urgency' | 'attainability' | 'prestige'> & Partial<GoalCandidate>) => {
      const remaining = c.remaining;
      out.push({
        prestige: prestige(c.goalType),
        attainability: attain(remaining),
        urgency: c.urgency ?? 0,
        novelty: 0,
        fatiguePenalty: 0,
        finalScore: 0,
        ...c,
      } as GoalCandidate);
    };

    // ---- specializations: «Эксперт по кофе» ----
    const specs = (gameCfg.specializations ?? []) as any[];
    const catCounts = new Map<string, { reviews: number; venues: number }>();
    const myReviews = await this.prisma.review.findMany({
      where: { userId },
      select: { listingId: true, listing: { select: { category: true } } },
      take: 1000,
    });
    for (const r of myReviews) {
      const cat = r.listing?.category;
      if (!cat) continue;
      const cur = catCounts.get(cat) ?? { reviews: 0, venues: 0 };
      cur.reviews += 1;
      catCounts.set(cat, cur);
    }
    const earnedKeys = new Set((state.specializations ?? []).filter((s: any) => s.earned).map((s: any) => s.key));
    for (const spec of specs) {
      if (spec.enabled === false || earnedKeys.has(spec.key)) continue;
      const have = (spec.categories ?? []).reduce(
        (sum: number, cat: string) => sum + (catCounts.get(cat)?.reviews ?? 0),
        0,
      );
      const need = Number(spec.minReviews ?? 10);
      const remaining = need - have;
      // only surface a specialization the user has actually started or likes
      const interest = Math.max(...(spec.categories ?? ['']).map((c: string) => interests.get(c) ?? 0), 0);
      if (remaining <= 0 || remaining > need) continue;
      if (have === 0 && interest < 0.15) continue; // untouched + uninteresting → not a goal
      push({
        goalType: 'specialization',
        goalKey: spec.key,
        entityName: spec.title,
        current: have,
        target: need,
        remaining,
        relevance: 0.4 + interest * 0.6,
        explanationCode: 'spec_progress',
        actionUrl: `/?category=${encodeURIComponent((spec.categories ?? [])[0] ?? '')}`,
      });
    }

    // ---- level ----
    if (state.next && state.level) {
      const remaining = Math.max(0, Number(state.next.need) - Number(state.counters?.quality ?? 0));
      if (remaining > 0) {
        push({
          goalType: 'level',
          goalKey: `level:${state.next.key}`,
          entityName: state.next.title,
          current: Number(state.counters?.quality ?? 0),
          target: Number(state.next.need),
          remaining,
          relevance: 0.7,
          explanationCode: 'level_progress',
          actionUrl: '/me',
        });
      }
    }

    // ---- achievements ----
    const achievements = (gameCfg.achievements ?? []) as any[];
    const earnedAch = new Set((state.achievements ?? []).filter((a: any) => a.earned).map((a: any) => a.key));
    const counters = state.counters ?? {};
    for (const ach of achievements) {
      if (ach.enabled === false || earnedAch.has(ach.key)) continue;
      const have = Number(counters[ach.metric] ?? 0);
      const need = Number(ach.need ?? 0);
      const remaining = need - have;
      if (remaining <= 0 || remaining > 5) continue; // only genuinely near ones
      push({
        goalType: 'achievement',
        goalKey: ach.key,
        entityName: ach.title,
        current: have,
        target: need,
        remaining,
        relevance: 0.6,
        urgency: remaining <= 1 ? 0.8 : 0.3,
        explanationCode: 'achievement_near',
        actionUrl: '/me',
      });
    }

    // ---- streak ----
    const streak = Number(counters.streak ?? 0);
    if (streak > 0) {
      const target = streak < 3 ? 3 : streak < 7 ? 7 : streak < 30 ? 30 : streak + 7;
      push({
        goalType: 'streak',
        goalKey: `streak:${target}`,
        entityName: null,
        current: streak,
        target,
        remaining: target - streak,
        relevance: 0.5,
        urgency: 0.9, // a streak is lost if ignored today — genuinely time-critical
        explanationCode: 'streak_alive',
        actionUrl: '/',
      });
    }

    // ---- discovery: be the first taster ----
    const unrated = await this.cache
      .getOrSet('goals:unrated-count', 300_000, () =>
        this.prisma.listing.count({
          where: { type: { in: ['DISH', 'DRINK'] }, reviewCount: 0, photoUrl: { not: null } },
        }),
      )
      .catch(() => 0);
    if (unrated > 0) {
      push({
        goalType: 'discovery',
        goalKey: 'first-taster',
        entityName: null,
        current: Number(counters.discoveries ?? 0),
        target: Number(counters.discoveries ?? 0) + 1,
        remaining: 1,
        relevance: 0.55,
        explanationCode: 'discovery_available',
        actionUrl: '/?section=first-taster',
      });
    }

    // ---- comeback: a category the user used to rate and dropped ----
    const topInterest = [...interests.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [category, weight] of topInterest) {
      const last = await this.prisma.review.findFirst({
        where: { userId, listing: { category } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      const daysSince = last ? (Date.now() - last.createdAt.getTime()) / 86_400_000 : Infinity;
      if (last && daysSince >= 14) {
        push({
          goalType: 'comeback',
          goalKey: `comeback:${category}`,
          entityName: category,
          current: 0,
          target: 1,
          remaining: 1,
          relevance: 0.3 + weight * 0.5,
          explanationCode: 'category_cooling',
          actionUrl: `/?category=${encodeURIComponent(category)}`,
        });
      }
    }

    // ---- exploration: a category never rated (cold-start friendly) ----
    const ratedCats = new Set([...catCounts.keys()]);
    const knownCats = (gameCfg.specializations ?? []).flatMap((s: any) => s.categories ?? []);
    const unexplored = knownCats.filter((c: string) => !ratedCats.has(c));
    if (unexplored.length) {
      const category = unexplored[0];
      push({
        goalType: 'exploration',
        goalKey: `explore:${category}`,
        entityName: category,
        current: 0,
        target: 1,
        remaining: 1,
        relevance: 0.35,
        explanationCode: 'never_tried',
        actionUrl: `/?category=${encodeURIComponent(category)}`,
      });
    }

    return out.slice(0, cfg.limits.maxCandidates);
  }

  // ---------------------------------------------------------------- selection
  /**
   * Score, rotate and pick ONE goal for this session. Rotation state lives in
   * user_goal_impressions / user_goal_preferences, so a restart of the app does
   * not reset it — the same goal does not greet the user twice in a row.
   */
  async goalForSession(userId: string, sessionId: string): Promise<RenderedGoal | null> {
    const [cfg, templates, candidates] = await Promise.all([
      this.config(),
      this.templates(),
      this.generateCandidates(userId),
    ]);
    if (!candidates.length) return null;

    const [prefs, recent] = await Promise.all([
      this.prisma.userGoalPreference.findMany({ where: { userId } }).catch(() => []),
      this.prisma.userGoalImpression
        .findMany({
          where: { userId, shownAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
          orderBy: { shownAt: 'desc' },
          take: 40,
        })
        .catch(() => []),
    ]);
    const prefByType = new Map(prefs.map((p) => [p.goalType, p]));
    const lastShown = recent[0];
    const lastTwoTypes = recent.slice(0, cfg.limits.maxSameTypeInARow).map((r) => r.goalType);
    const typeSaturated =
      lastTwoTypes.length === cfg.limits.maxSameTypeInARow &&
      new Set(lastTwoTypes).size === 1
        ? lastTwoTypes[0]
        : null;

    const now = Date.now();
    const scored = candidates
      .map((c) => {
        const pref = prefByType.get(c.goalType);
        const shows7d = recent.filter((r) => r.goalType === c.goalType).length;
        // learned affinity: clicks raise a type, ignores lower it
        const learned = pref
          ? Math.max(0.2, Math.min(2, pref.interestWeight))
          : 1;
        const novelty = shows7d === 0 ? 1 : Math.max(0, 1 - shows7d / cfg.limits.maxShowsPerGoalPer7Days);
        const fatigue =
          (pref?.fatigueUntil && pref.fatigueUntil.getTime() > now ? 1 : 0) +
          (shows7d >= cfg.limits.maxShowsPerGoalPer7Days ? 1 : 0) +
          (typeSaturated === c.goalType ? 1 : 0);
        const w = cfg.weights;
        const finalScore =
          (c.relevance * w.relevance +
            c.attainability * w.attainability +
            c.prestige * w.prestige +
            novelty * w.novelty +
            c.urgency * w.urgency) *
            learned -
          fatigue * w.fatigue;
        return { ...c, novelty, fatiguePenalty: fatigue, finalScore };
      })
      // never repeat the exact goal shown last session unless it is one step away
      // or genuinely urgent (a streak about to break)
      .filter((c) => {
        if (!lastShown) return true;
        const sameAsLast = recent[0] && recent[0].goalType === c.goalType;
        if (!sameAsLast) return true;
        return c.remaining <= 1 || c.urgency >= 0.8;
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const pool = scored.length ? scored : candidates;
    if (!pool.length) return null;

    // controlled exploration: mostly the best goal, sometimes a runner-up
    const roll = Math.random();
    const { topRate, nearTopRate } = cfg.exploration;
    const chosen =
      roll < topRate || pool.length === 1
        ? pool[0]
        : roll < topRate + nearTopRate
          ? pool[Math.min(1 + Math.floor(Math.random() * 2), pool.length - 1)]
          : pool[Math.floor(Math.random() * pool.length)];

    // persist the candidate so the impression can reference it
    const stored = await this.prisma.userGoalCandidate
      .upsert({
        where: { userId_goalType_goalKey: { userId, goalType: chosen.goalType, goalKey: chosen.goalKey } },
        create: {
          userId,
          goalType: chosen.goalType,
          goalKey: chosen.goalKey,
          entityName: chosen.entityName ?? null,
          currentValue: chosen.current,
          targetValue: chosen.target,
          relevanceScore: chosen.relevance,
          attainability: chosen.attainability,
          prestige: chosen.prestige,
          noveltyScore: chosen.novelty,
          urgencyScore: chosen.urgency,
          fatiguePenalty: chosen.fatiguePenalty,
          finalScore: chosen.finalScore,
          explanationCode: chosen.explanationCode,
        },
        update: {
          currentValue: chosen.current,
          targetValue: chosen.target,
          finalScore: chosen.finalScore,
          noveltyScore: chosen.novelty,
          fatiguePenalty: chosen.fatiguePenalty,
          completedAt: null,
        },
      })
      .catch(() => null);

    const seed = [...sessionId].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const template = pickTemplate(templates, chosen.goalType, chosen.remaining, seed);
    if (!template) return null;

    const vars = {
      remaining: chosen.remaining,
      current: chosen.current,
      target: chosen.target,
      name: chosen.entityName ?? '',
      level: chosen.entityName ?? '',
    };
    const title = renderTemplate(template.title, vars);
    const subtitle = renderTemplate(template.subtitle, vars);
    // a template that needed a number we could not compute → show nothing rather
    // than a half-filled promise
    if (!title || !subtitle) return null;

    if (stored) {
      await this.prisma.userGoalImpression
        .create({
          data: { userId, candidateId: stored.id, sessionId, goalType: chosen.goalType },
        })
        .catch(() => {});
      await this.bumpPreference(userId, chosen.goalType, 'shown');
    }

    return {
      id: stored?.id ?? `${chosen.goalType}:${chosen.goalKey}`,
      type: chosen.goalType,
      icon: template.icon,
      title,
      subtitle,
      current: chosen.current,
      target: chosen.target,
      percent: chosen.target > 0 ? Math.min(100, Math.round((chosen.current / chosen.target) * 100)) : 0,
      actionUrl: chosen.actionUrl,
      explanationCode: chosen.explanationCode,
    };
  }

  // ----------------------------------------------------------------- learning
  /** Feedback loop: clicks raise a goal type's weight, repeated ignores lower it
   *  and open a fatigue window. */
  async bumpPreference(userId: string, goalType: string, event: 'shown' | 'clicked' | 'completed' | 'dismissed') {
    const cfg = await this.config();
    const existing = await this.prisma.userGoalPreference
      .findUnique({ where: { userId_goalType: { userId, goalType } } })
      .catch(() => null);

    const shownCount = (existing?.shownCount ?? 0) + (event === 'shown' ? 1 : 0);
    const clickCount = (existing?.clickCount ?? 0) + (event === 'clicked' ? 1 : 0);
    const completeCount = (existing?.completeCount ?? 0) + (event === 'completed' ? 1 : 0);
    const ignoreCount = event === 'clicked' || event === 'completed' ? 0 : (existing?.ignoreCount ?? 0) + (event === 'dismissed' ? 1 : 0);

    let weight = existing?.interestWeight ?? 1;
    if (event === 'clicked') weight = Math.min(2, weight + 0.15);
    if (event === 'completed') weight = Math.min(2, weight + 0.25);
    if (event === 'dismissed') weight = Math.max(0.2, weight - 0.2);

    const fatigueUntil =
      ignoreCount >= cfg.limits.ignoresBeforeFatigue
        ? new Date(Date.now() + cfg.limits.fatigueHoursAfterIgnores * 3600_000)
        : existing?.fatigueUntil ?? null;

    await this.prisma.userGoalPreference
      .upsert({
        where: { userId_goalType: { userId, goalType } },
        create: { userId, goalType, interestWeight: weight, shownCount, clickCount, completeCount, ignoreCount, lastShownAt: new Date(), fatigueUntil },
        update: { interestWeight: weight, shownCount, clickCount, completeCount, ignoreCount, lastShownAt: new Date(), fatigueUntil },
      })
      .catch(() => {});
  }

  /** Mark the reaction to a shown goal (called from the controller). */
  async react(userId: string, impressionId: string, event: 'clicked' | 'dismissed' | 'completed') {
    const field =
      event === 'clicked' ? 'clickedAt' : event === 'dismissed' ? 'dismissedAt' : 'completedAt';
    const impression = await this.prisma.userGoalImpression
      .update({ where: { id: impressionId }, data: { [field]: new Date() } })
      .catch(() => null);
    if (impression) await this.bumpPreference(userId, impression.goalType, event);
    return { ok: !!impression };
  }
}
