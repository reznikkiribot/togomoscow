import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ===== Gamification core =====
// Everything tunable lives in game_config (DB) and applies live (60s cache):
// levels, feature unlocks, achievements, quality rules, home-section settings.
// The philosophy (product): reviews make the algorithm smarter → the app
// gradually unlocks new abilities. No "+10 XP" — human motivation only.

export const DEFAULT_CONFIG: Record<string, any> = {
  quality: { minTextLen: 30, orPhoto: true },
  unlocks: [
    { key: 'tasteProfile', title: 'Вкусовой профиль', icon: '🎨', need: 5, metric: 'reviews',
      teaser: 'любимые категории, кухни, диапазон цен и первые персональные рекомендации' },
    { key: 'recommendations', title: 'Персональные рекомендации', icon: '🤖', need: 10, metric: 'reviews',
      teaser: 'вероятность, что блюдо вам понравится — на каждой карточке' },
    { key: 'tasterMap', title: 'Карта дегустатора', icon: '🗺', need: 20, metric: 'reviews',
      teaser: 'исследованные районы, любимые заведения и кухни' },
    { key: 'reputation', title: 'Репутация', icon: '⭐', need: 30, metric: 'quality',
      teaser: 'полезность отзывов, место среди дегустаторов, значки' },
  ],
  levels: [
    { key: 'novice', title: 'Новичок', icon: '🌱', need: 0 },
    { key: 'explorer', title: 'Исследователь', icon: '🧭', need: 5 },
    { key: 'gourmet', title: 'Гурман', icon: '🍷', need: 15 },
    { key: 'critic', title: 'Критик', icon: '✒️', need: 30 },
    { key: 'expert', title: 'Эксперт', icon: '🎓', need: 60 },
    { key: 'ambassador', title: 'Амбассадор', icon: '👑', need: 120 },
  ],
  achievements: [
    { key: 'first_review', title: 'Первый отзыв', icon: '🥇', metric: 'reviews', need: 1, enabled: true },
    { key: 'reviews_10', title: '10 отзывов', icon: '🔟', metric: 'reviews', need: 10, enabled: true },
    { key: 'reviews_50', title: '50 отзывов', icon: '🏆', metric: 'reviews', need: 50, enabled: true },
    { key: 'reviews_100', title: '100 отзывов', icon: '💯', metric: 'reviews', need: 100, enabled: true },
    { key: 'first_photo', title: 'Первое фото', icon: '📷', metric: 'photos', need: 1, enabled: true },
    { key: 'photos_100', title: '100 фотографий', icon: '🎞', metric: 'photos', need: 100, enabled: true },
    { key: 'first_useful', title: 'Первый полезный отзыв', icon: '👍', metric: 'useful', need: 1, enabled: true },
    { key: 'useful_100', title: '100 полезных отзывов', icon: '🙌', metric: 'useful', need: 100, enabled: true },
    { key: 'first_taster_dish', title: 'Первый дегустатор блюда', icon: '🏅', metric: 'discoveries_dish', need: 1, enabled: true },
    { key: 'first_taster_drink', title: 'Первый дегустатор напитка', icon: '🥂', metric: 'discoveries_drink', need: 1, enabled: true },
    { key: 'district_explorer', title: 'Исследователь района', icon: '📍', metric: 'districts', need: 3, enabled: true },
    { key: 'moscow_explorer', title: 'Исследователь Москвы', icon: '🌆', metric: 'districts', need: 15, enabled: true },
    { key: 'streak_30', title: '30 дней подряд', icon: '🔥', metric: 'streak', need: 30, enabled: true },
  ],
  specializations: [
    { key: 'coffee_expert', title: 'Эксперт по кофе', icon: '☕', categories: ['Кофе'], minReviews: 10, minVenues: 3, enabled: true },
    { key: 'burger_master', title: 'Мастер бургеров', icon: '🍔', categories: ['Бургеры'], minReviews: 10, minVenues: 3, enabled: true },
    { key: 'steak_savant', title: 'Знаток стейков', icon: '🥩', categories: ['Стейки', 'Мясо'], minReviews: 10, minVenues: 3, enabled: true },
    { key: 'dessert_lover', title: 'Любитель десертов', icon: '🍰', categories: ['Десерты'], minReviews: 10, minVenues: 3, enabled: true },
  ],
  discovery: { enabled: true, showInProfile: true },
  home: { firstTasterCards: 8 },
};

@Injectable()
export class GameService {
  private cache: { at: number; config: Record<string, any> } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Live config: DB rows override DEFAULT_CONFIG per key; cached for 60s. */
  async config(): Promise<Record<string, any>> {
    if (this.cache && Date.now() - this.cache.at < 60_000) return this.cache.config;
    const rows = await this.prisma.gameConfig.findMany().catch(() => []);
    const merged = { ...DEFAULT_CONFIG };
    for (const r of rows) merged[r.key] = r.value;
    this.cache = { at: Date.now(), config: merged };
    return merged;
  }

  async setConfig(key: string, value: any) {
    await this.prisma.gameConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
    this.cache = null; // apply immediately
    return { ok: true };
  }

  /** All the user's raw counters the rules run on. */
  private async counters(userId: string, cfg: Record<string, any>) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      select: { id: true, listingId: true, text: true, photoUrls: true, createdAt: true, listing: { select: { type: true, category: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const q = cfg.quality ?? DEFAULT_CONFIG.quality;
    const isQuality = (r: (typeof reviews)[number]) =>
      (r.text?.trim().length ?? 0) >= (q.minTextLen ?? 30) || (q.orPhoto !== false && (r.photoUrls?.length ?? 0) > 0);

    // discoveries: my review is the EARLIEST on its listing
    const listingIds = [...new Set(reviews.map((r) => r.listingId))];
    const firsts = listingIds.length
      ? await this.prisma.$queryRaw<{ listing_id: string; user_id: string; type: string }[]>`
          SELECT DISTINCT ON (r.listing_id) r.listing_id, r.user_id, l.type::text AS type
          FROM reviews r JOIN listings l ON l.id = r.listing_id
          WHERE r.listing_id = ANY(${listingIds})
          ORDER BY r.listing_id, r.created_at ASC`
      : [];
    const myFirsts = firsts.filter((f) => f.user_id === userId);

    // useful votes received across my reviews
    const useful = await this.prisma.reviewVote.count({
      where: { type: 'USEFUL', review: { userId } },
    });

    // districts explored: distinct metro/city areas of venues I reviewed at
    const venueIds = [
      ...new Set(reviews.map((r) => (r as any).attributes?.venueId).filter(Boolean)),
    ] as string[];
    // fall back to the listing itself when it IS a venue
    for (const r of reviews) if (r.listing?.type === 'RESTAURANT') venueIds.push(r.listingId);
    const districts = venueIds.length
      ? await this.prisma.listing.findMany({ where: { id: { in: venueIds } }, select: { lat: true, lng: true } })
      : [];
    const cells = new Set(
      districts.filter((d) => d.lat != null).map((d) => `${d.lat!.toFixed(1)}:${d.lng!.toFixed(1)}`),
    );

    // streak (consecutive days with a review, ending today/yesterday)
    const days = new Set(reviews.map((r) => r.createdAt.toISOString().slice(0, 10)));
    let streak = 0;
    const cur = new Date();
    if (!days.has(cur.toISOString().slice(0, 10))) cur.setUTCDate(cur.getUTCDate() - 1);
    while (days.has(cur.toISOString().slice(0, 10))) {
      streak++;
      cur.setUTCDate(cur.getUTCDate() - 1);
    }

    return {
      reviews: reviews.length,
      quality: reviews.filter(isQuality).length,
      photos: reviews.reduce((s, r) => s + (r.photoUrls?.length ?? 0), 0),
      useful,
      discoveries: myFirsts.length,
      discoveries_dish: myFirsts.filter((f) => f.type === 'DISH').length,
      discoveries_drink: myFirsts.filter((f) => f.type === 'DRINK').length,
      districts: cells.size,
      streak,
    };
  }

  /** Full game state + awards anything newly earned (returned once as justEarned). */
  async state(userId: string) {
    const cfg = await this.config();
    const c = await this.counters(userId, cfg);

    const metric = (m: string) => (c as any)[m] ?? 0;
    const unlocks = (cfg.unlocks as any[]).map((u) => ({
      ...u,
      have: metric(u.metric ?? 'reviews'),
      unlocked: metric(u.metric ?? 'reviews') >= u.need,
    }));

    const levels = cfg.levels as any[];
    let level = levels[0];
    for (const l of levels) if (c.quality >= l.need) level = l;
    const next = levels.find((l) => l.need > level.need) ?? null;

    const achievements = (cfg.achievements as any[])
      .filter((a) => a.enabled !== false)
      .map((a) => ({ ...a, have: metric(a.metric), earned: metric(a.metric) >= a.need }));

    // persist newly earned things ONCE → they come back as justEarned for the UI toast
    const earnedKeys = [
      ...achievements.filter((a) => a.earned).map((a) => `ach:${a.key}`),
      ...unlocks.filter((u) => u.unlocked).map((u) => `unlock:${u.key}`),
    ];
    const existing = new Set(
      (await this.prisma.userAchievement.findMany({ where: { userId }, select: { key: true } })).map((x) => x.key),
    );
    const fresh = earnedKeys.filter((k) => !existing.has(k));
    if (fresh.length) {
      await this.prisma.userAchievement
        .createMany({ data: fresh.map((key) => ({ userId, key })), skipDuplicates: true })
        .catch(() => {});
    }

    return {
      counters: c,
      level: { ...level, nextAt: next?.need ?? null, nextTitle: next?.title ?? null },
      unlocks,
      achievements,
      justEarned: fresh,
    };
  }

  /** The card's "first taster" plaque: who reviewed it first and when. */
  async firstTaster(listingId: string) {
    const r = await this.prisma.review.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, user: { select: { id: true, firstName: true, username: true } } },
    });
    return r ? { user: r.user, at: r.createdAt } : null;
  }
}
