import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Public user card with counts + whether the current user follows them. */
  private async publicUser(
    u: { id: string; firstName: string | null; username: string | null; photoUrl: string | null },
    meId: string,
  ) {
    const [reviews, followers, following, mine] = await Promise.all([
      this.prisma.review.count({ where: { userId: u.id, status: 'APPROVED' } }),
      this.prisma.follow.count({ where: { followingId: u.id } }),
      this.prisma.follow.count({ where: { followerId: u.id } }),
      meId
        ? this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: meId, followingId: u.id } },
          })
        : null,
    ]);
    return {
      id: u.id,
      firstName: u.firstName,
      username: u.username,
      photoUrl: u.photoUrl,
      reviews,
      followers,
      following,
      isFollowing: !!mine,
      isMe: u.id === meId,
    };
  }

  async followers(userId: string, meId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.publicUser(r.follower, meId)));
  }

  async following(userId: string, meId: string) {
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.publicUser(r.following, meId)));
  }

  async search(q: string, meId: string) {
    const query = (q ?? '').trim().replace(/^@/, '');
    if (!query) return [];
    const users = await this.prisma.user.findMany({
      where: {
        NOT: { id: meId },
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
    return Promise.all(users.map((u) => this.publicUser(u, meId)));
  }

  async userProfile(targetId: string, meId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!u) throw new NotFoundException('User not found');
    const card = await this.publicUser(u, meId);
    // PENDING included on purpose: the profile is a social surface like the follow
    // feed — moderation gates public ratings/the general feed, not a person's page.
    // Without this a fresh review shows on the wall but "disappears" on the profile.
    const reviewList = await this.prisma.review.findMany({
      where: { userId: targetId, status: { in: ['APPROVED', 'PENDING'] } },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    await this.attachItemVenues(reviewList);
    await this.attachVoteCounts(reviewList); // reactions must show real counts
    // taster LEVEL (same ladder as gamification) — shown on the public profile
    const LEVELS = [
      { title: 'Новичок', icon: '🌱', need: 0 },
      { title: 'Исследователь', icon: '🧭', need: 5 },
      { title: 'Гурман', icon: '🍷', need: 15 },
      { title: 'Критик', icon: '✒️', need: 30 },
      { title: 'Эксперт', icon: '🎓', need: 60 },
      { title: 'Амбассадор', icon: '👑', need: 120 },
    ];
    const allReviews = await this.prisma.review.findMany({
      where: { userId: targetId },
      select: { text: true, photoUrls: true },
    });
    const quality = allReviews.filter(
      (r) => (r.text?.trim().length ?? 0) >= 30 || (r.photoUrls?.length ?? 0) > 0,
    ).length;
    const level = [...LEVELS].reverse().find((l) => quality >= l.need) ?? LEVELS[0];
    // taster map (specializations) — everyone can see it on anyone's profile
    const specializations = (await this.specializations(targetId)).filter((s: any) => s.count > 0);
    return { ...card, reviewList, level: { title: level.title, icon: level.icon, quality }, specializations };
  }

  /** For dish/drink reviews, attach the venue that serves the item. */
  async attachItemVenues(reviews: any[]) {
    const items = reviews.filter((r) => r.listing && r.listing.type !== 'RESTAURANT');
    if (items.length === 0) return;

    // the exact place the user picked when rating (most accurate)
    const explicitIds = [
      ...new Set(items.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
    ] as string[];
    const venueById = new Map<string, { id: string; name: string }>();
    if (explicitIds.length) {
      const vs = await this.prisma.listing.findMany({
        where: { id: { in: explicitIds } },
        select: { id: true, name: true },
      });
      for (const v of vs) venueById.set(v.id, v);
    }

    // fallback: any venue that lists this item on its menu
    const itemIds = items.map((r) => r.listing.id);
    const links = await this.prisma.menuLink.findMany({
      where: { itemId: { in: itemIds } },
      include: { venue: true },
    });
    const venueByItem = new Map<string, { id: string; name: string }>();
    for (const l of links) {
      if (l.venue && !venueByItem.has(l.itemId)) {
        venueByItem.set(l.itemId, { id: l.venue.id, name: l.venue.name });
      }
    }

    for (const r of reviews) {
      const vid = (r.attributes as any)?.venueId;
      if (vid && venueById.has(vid)) r.venue = venueById.get(vid);
      else if (r.listing && venueByItem.has(r.listing.id)) r.venue = venueByItem.get(r.listing.id);
    }
  }

  /** Recent posts from people the user follows (for the home feed). */
  async followingFeed(meId: string, take = 20) {
    const ids = (
      await this.prisma.follow.findMany({
        where: { followerId: meId },
        select: { followingId: true },
      })
    ).map((f) => f.followingId);
    if (ids.length === 0) return [];
    // followers see their followees' tastings immediately (moderation still
    // governs public ratings + the general feed, not your own social feed)
    const list = await this.prisma.review.findMany({
      where: { userId: { in: ids } },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take,
    });
    await this.attachItemVenues(list);
    await this.attachCommentPreview(list);
    await this.attachVoteCounts(list);
    return list;
  }

  /** Adds reaction counts (👍😄😎🙀) to each review for the social feed. */
  async attachVoteCounts(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const grouped = await this.prisma.reviewVote.groupBy({
      by: ['reviewId', 'type'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    for (const r of reviews) {
      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
    }
  }

  /** commentCount + first comment per review (feed preview). */
  async attachCommentPreview(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const comments = await this.prisma.comment.findMany({
      where: { reviewId: { in: ids } },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const byReview = new Map<string, any[]>();
    for (const c of comments) {
      if (!byReview.has(c.reviewId)) byReview.set(c.reviewId, []);
      byReview.get(c.reviewId)!.push(c);
    }
    for (const r of reviews) {
      const arr = byReview.get(r.id) ?? [];
      r.commentCount = arr.length;
      r.topComment = arr[0] ?? null;
    }
  }

  /**
   * After rating a dish/drink: where it lands in the user's OWN ranking for that
   * category, how it compares to their average, and a not-yet-tried item to taste
   * next. Pure personal data — works from the very first review, no crowd needed.
   */
  async tasteRanking(userId: string, itemId: string) {
    const item = await this.prisma.listing.findUnique({
      where: { id: itemId },
      select: { id: true, name: true, category: true, type: true },
    });
    if (!item || item.type === 'RESTAURANT' || !item.category) return null;
    const cat = item.category;

    const reviews = await this.prisma.review.findMany({
      where: { userId, listing: { category: cat, type: { in: ['DISH', 'DRINK'] } } },
      include: { listing: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // latest rating per item
    const byItem = new Map<string, { id: string; name: string; rating: number }>();
    for (const r of reviews) {
      if (!byItem.has(r.listingId)) {
        byItem.set(r.listingId, { id: r.listing.id, name: r.listing.name, rating: r.rating });
      }
    }
    const ranked = [...byItem.values()].sort((a, b) => b.rating - a.rating);
    const total = ranked.length;
    const rank = ranked.findIndex((x) => x.id === itemId) + 1;
    const thisRating = byItem.get(itemId)?.rating ?? null;
    const others = ranked.filter((x) => x.id !== itemId);
    const delta =
      thisRating != null && others.length
        ? thisRating - others.reduce((s, x) => s + x.rating, 0) / others.length
        : null;

    // a same-category item the user hasn't rated yet → "сравни, попробуй это"
    const ratedIds = [...byItem.keys()];
    const candidates = await this.prisma.listing.findMany({
      where: { type: { in: ['DISH', 'DRINK'] }, category: cat, id: { notIn: ratedIds } },
      take: 25,
      select: { id: true, name: true },
    });
    const next = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null;

    // opponent for a quick pairwise: the item just above in the ranking (or below if #1)
    const idx = ranked.findIndex((x) => x.id === itemId);
    const opp = idx > 0 ? ranked[idx - 1] : ranked[idx + 1];
    const compareWith = opp ? { id: opp.id, name: opp.name } : null;

    return {
      category: cat,
      rank,
      total,
      thisRating,
      thisName: item.name,
      delta,
      top: ranked.slice(0, 5),
      next,
      compareWith,
    };
  }

  /**
   * Untappd-style taste portrait built purely from the user's own reviews:
   * favourite category, what they tend to love, average strictness, best find.
   * Meaningful from the very first review — no crowd data required.
   */
  // How many reviews the user has in each category. A category's rankings
  // ("король бургеров" etc.) and precise recs unlock at THRESHOLD reviews — this
  // trains the recommender on the user's taste before showing category verdicts.
  static readonly UNLOCK_THRESHOLD = 5;

  async categoryProgress(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { listing: { select: { category: true } } },
    });
    const counts = new Map<string, number>();
    for (const r of reviews) {
      const c = r.listing?.category;
      if (!c || /^(блюдо|напиток)$/i.test(c)) continue; // skip generic placeholders
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const threshold = SocialService.UNLOCK_THRESHOLD;
    const categories = [...counts.entries()]
      .map(([name, count]) => ({ name, count, unlocked: count >= threshold }))
      .sort((a, b) => b.count - a.count);
    return { threshold, total: reviews.length, categories };
  }

  async tasteProfile(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { listing: { select: { name: true, category: true, type: true } } },
    });
    if (reviews.length === 0) return { total: 0 };

    const total = reviews.length;
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;

    const catMap = new Map<string, { count: number; sum: number }>();
    for (const r of reviews) {
      const c = r.listing?.category;
      if (!c) continue;
      const e = catMap.get(c) ?? { count: 0, sum: 0 };
      e.count++;
      e.sum += r.rating;
      catMap.set(c, e);
    }
    const topCategories = [...catMap.entries()]
      .map(([name, e]) => ({ name, count: e.count, avg: e.sum / e.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    const favorite = topCategories[0] ?? null;

    // "loves": recurring tasting choices, preferring well-rated reviews
    const tally = (minRating: number) => {
      const freq = new Map<string, number>();
      for (const r of reviews) {
        if (r.rating < minRating) continue;
        const ch = ((r.attributes as any)?.choices ?? {}) as Record<string, string[]>;
        for (const arr of Object.values(ch)) {
          for (const v of arr ?? []) {
            if (!v || v === 'Не знаю') continue;
            freq.set(v, (freq.get(v) ?? 0) + 1);
          }
        }
      }
      return freq;
    };
    let freq = tally(4);
    if (freq.size === 0) freq = tally(0);
    const loves = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([v]) => v)
      .slice(0, 5);

    // best find: highest-rated reviewed item (with text/name)
    const bestR = [...reviews].sort((a, b) => b.rating - a.rating)[0];
    const best = bestR?.listing
      ? { name: bestR.listing.name, rating: bestR.rating }
      : null;

    return { total, avg, favorite, topCategories, loves, best, categoriesTried: catMap.size };
  }

  /** Swipe-left: not interested. Hides the item and feeds the recommender. */
  async skip(userId: string, itemId: string, category?: string) {
    if (!itemId) return { ok: false };
    await this.prisma.dislike.upsert({
      where: { userId_itemId: { userId, itemId } },
      create: { userId, itemId, category: category ?? null },
      update: {},
    });
    return { ok: true };
  }

  /** Item ids the user swiped away — excluded from their feed. */
  async skips(userId: string) {
    const rows = await this.prisma.dislike.findMany({
      where: { userId },
      select: { itemId: true },
    });
    return rows.map((r) => r.itemId);
  }

  /** Records a pairwise "A tasted better than B, because…" — kept for AI training. */
  async compare(
    userId: string,
    dto: { winnerId: string; loserId: string; reason?: string; category?: string },
  ) {
    if (!dto.winnerId || !dto.loserId || dto.winnerId === dto.loserId) return { ok: false };
    await this.prisma.comparison.create({
      data: {
        userId,
        winnerId: dto.winnerId,
        loserId: dto.loserId,
        reason: dto.reason?.trim() || null,
        category: dto.category ?? null,
      },
    });
    return { ok: true };
  }

  /** Onboarding quiz status + saved preferences. */
  async onboarding(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    return { onboarded: !!u?.onboardedAt, preferences: u?.preferences ?? null };
  }

  async setOnboarding(userId: string, prefs: { categories: string[]; price?: number }) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardedAt: new Date(), preferences: prefs as any },
    });
    return { ok: true };
  }

  /** Gamification stats: streak, daily goal, level, badges (from the user's reviews). */
  async stats(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });
    const total = reviews.length;
    const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);
    const days = new Set(reviews.map((r) => dayKey(r.createdAt)));
    const today = new Date().toISOString().slice(0, 10);
    const ratedToday = days.has(today);
    const todayCount = reviews.filter((r) => dayKey(r.createdAt) === today).length;
    const dailyGoal = 3; // small daily target to keep the tasting habit going

    // consecutive days up to today (or yesterday if not rated yet today)
    let streak = 0;
    const cur = new Date();
    if (!ratedToday) cur.setUTCDate(cur.getUTCDate() - 1);
    while (days.has(cur.toISOString().slice(0, 10))) {
      streak++;
      cur.setUTCDate(cur.getUTCDate() - 1);
    }

    const LEVELS: [number, string][] = [
      [0, 'Новичок'],
      [5, 'Любитель'],
      [20, 'Гурман'],
      [50, 'Эксперт'],
      [150, 'Мастер вкуса'],
    ];
    let level = 'Новичок';
    let nextAt: number | null = 5;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (total >= LEVELS[i][0]) {
        level = LEVELS[i][1];
        nextAt = LEVELS[i + 1] ? LEVELS[i + 1][0] : null;
        break;
      }
    }

    const drinkCount = reviews.filter((r) => r.listing?.type === 'DRINK').length;
    const dishCount = reviews.filter((r) => r.listing?.type === 'DISH').length;
    const cats = new Set(reviews.map((r) => r.listing?.category).filter(Boolean));
    const withPhoto = reviews.filter((r) => (r.photoUrls?.length ?? 0) > 0).length;
    const badges = [
      { id: 'first', label: 'Первая оценка', icon: '🥇', earned: total >= 1 },
      { id: 'ten', label: '10 оценок', icon: '🔟', earned: total >= 10 },
      { id: 'drinks5', label: '5 напитков', icon: '🍷', earned: drinkCount >= 5 },
      { id: 'dishes5', label: '5 блюд', icon: '🍽', earned: dishCount >= 5 },
      { id: 'cuisines5', label: '5 категорий', icon: '🌍', earned: cats.size >= 5 },
      { id: 'photo', label: 'С фото', icon: '📸', earned: withPhoto >= 1 },
      { id: 'week', label: '7 дней подряд', icon: '🔥', earned: streak >= 7 },
    ];

    return { total, streak, ratedToday, todayCount, dailyGoal, level, nextAt, badges };
  }

  /** Specializations: tiered expertise per category, from the user's reviews. */
  async specializations(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { listing: true },
    });
    const SPECS = [
      { id: 'coffee', label: 'Эксперт по кофе', icon: '☕', keys: ['кофе', 'эспрессо', 'латте', 'капучино', 'раф'] },
      { id: 'steak', label: 'Мастер стейка', icon: '🥩', keys: ['стейк', 'рибай', 'миньон'] },
      { id: 'burger', label: 'Король бургеров', icon: '🍔', keys: ['бургер'] },
      { id: 'pizza', label: 'Легенда пиццы', icon: '🍕', keys: ['пицц'] },
      { id: 'dessert', label: 'Охотник за десертами', icon: '🍰', keys: ['десерт', 'торт', 'чизкейк', 'тирамису', 'мороженое', 'эклер'] },
      { id: 'sushi', label: 'Мастер суши', icon: '🍣', keys: ['суши', 'ролл', 'японск'] },
      { id: 'georgian', label: 'Знаток Грузии', icon: '🫓', keys: ['грузин', 'хачапури', 'хинкали'] },
    ];
    const TIERS = [
      { n: 3, t: 'Знаток' },
      { n: 10, t: 'Эксперт' },
      { n: 25, t: 'Мастер' },
    ];
    const match = (r: any, keys: string[]) => {
      const c = (r.listing?.category ?? '').toLowerCase();
      const n = (r.listing?.name ?? '').toLowerCase();
      return keys.some((k) => c.includes(k) || n.includes(k));
    };
    return SPECS.map((s) => {
      const count = reviews.filter((r) => match(r, s.keys)).length;
      let tier: string | null = null;
      let next: number | null = TIERS[0].n;
      for (let i = TIERS.length - 1; i >= 0; i--) {
        if (count >= TIERS[i].n) {
          tier = TIERS[i].t;
          next = TIERS[i + 1] ? TIERS[i + 1].n : null;
          break;
        }
      }
      return {
        id: s.id,
        label: s.label,
        icon: s.icon,
        count,
        tier,
        next,
        earned: count >= TIERS[0].n,
        // a specialization activates only once its category is unlocked (5 reviews)
        unlocked: count >= SocialService.UNLOCK_THRESHOLD,
      };
    });
  }

  /** Instagram-style profile header: the user + their counts. */
  async profile(userId: string) {
    const [user, reviews, followers, following, favorites] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.review.count({ where: { userId } }),
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    return { user, counts: { reviews, followers, following, favorites } };
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) return { ok: false };
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    });
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
      create: { followerId: userId, followingId: targetId },
      update: {},
    });
    // bell notification + capped bot push (owner re-enabled 16.07.2026)
    if (!existing) {
      void (async () => {
        const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, username: true } });
        const name = me?.firstName || me?.username || 'Кто-то';
        await this.notifications.add({
          userId: targetId,
          kind: 'follow',
          actorId: userId,
          actorName: name,
          text: `${name} подписался(лась) на вас`,
        });
      })().catch(() => {});
    }
    return { ok: true };
  }

  /** Push "На вас подписался {name}" to the followed user via the bot. */
  private async notifyFollow(userId: string, targetId: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;
    const [me, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: targetId } }),
    ]);
    if (!target?.telegramId) return;
    const name = me?.firstName ?? me?.username ?? 'Кто-то';
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: String(target.telegramId), text: `👤 На вас подписался ${name}` }),
    }).catch(() => {});
  }

  async unfollow(userId: string, targetId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId: userId, followingId: targetId },
    });
    return { ok: true };
  }
}
