import { Injectable } from '@nestjs/common';
import { isNonStandalone } from '../common/non-standalone';
import { buildAffinities, loadVenueTraits, scorePriceSegment, scoreVenueTier } from '../common/taste-affinity';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';

/**
 * Recommendation signals + serving.
 *
 * Phase 1 (now): collect implicit-feedback `interactions` and serve a transparent
 * COLD-START "probability you'll like" from existing signals (item quality, the
 * user's category affinity, onboarding quiz). No model required, never shows raw
 * scores, always returns a human reason.
 *
 * Phase 2 (when data accrues): a LightFM model trains offline (recsys/train.py via
 * cron), writes per-user top-N + a calibrated probability into `rec_cache`, and
 * `likeProbability`/`recommend` read that cache, falling back to cold-start here
 * whenever the user/item is unknown to the model. See docs/recsys-lightfm.md.
 */
// PHOTO POLICY (2026-07-09): parsed chain photos are copyrighted and were replaced
// with openly-licensed ones matched by dish name (or a neutral placeholder). Every
// non-user photo is labeled "информационный характер" in the UI, so licensed stock
// is now a legitimate catalog photo — the feed just requires SOME photo + coffee.
// OWNER RULE: a recommendation card must have a VENUE attachment AND a PRICE —
// venue-less/price-less cards are banned from the discovery feed entirely.
const REAL_PHOTO_OR_COFFEE = {
  OR: [
    { category: { contains: 'Кофе', mode: 'insensitive' as const } },
    { photoUrl: { not: null } },
  ],
  servedAt: { some: { status: 'APPROVED' as const, price: { not: null } } },
};

@Injectable()
export class RecsysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
  ) {}

  // categories never shown in recommendations: breakfast, all alcohol, and
  // "not premium" everyday food (baking, grill, sandwiches).
  // ('Безалкогольные' is safe — none of these substrings match it.)
  static readonly EXCLUDED_CATS = [
    'завтрак', 'пиво', 'вино', 'коктейл', 'крепк', 'сидр',
    'выпечк', 'гриль', 'сэндвич', 'сендвич',
  ];

  // "народные"/everyday dishes excluded by NAME (they live in mixed categories
  // like Супы/Русская, so category rules can't catch them). Not "дорого-богато".
  static readonly EXCLUDED_NAMES = [
    'уха', 'борщ', 'окрошк', 'солянк', 'рассольник', 'пельмен', 'вареник',
    'холодец', 'студень', 'винегрет', 'селёдк', 'сельдь', 'гречк', 'каша',
    'оладь', 'драник', 'заливн', 'квашен', 'кисель', 'квас', 'морс',
    'глинтвейн', 'грог', 'сангри', 'пунш', // alcohol that hides in non-bar categories
    // ALCOHOL IS NEVER RECOMMENDED (owner rule 19.07.2026). Category alone is not
    // enough: bar premixes get parsed as «Безалкогольные» (e.g. Тоник "The
    // Gardenist"), so ban the drink words and known alcoholic brands by NAME too.
    'виски', 'водк', 'текил', 'коньяк', 'ликёр', 'ликер', 'бренди',
    'вермут', 'кампари', 'самбука', 'абсент', 'граппа', 'кальвадос', 'шампанск',
    'игрист', 'просекко', 'портвейн', 'мартини', 'апероль', 'бейлиз', 'ягермейстер',
    'jager', 'jack daniel', 'jameson', 'chivas', 'absolut', 'beefeater', 'bacardi',
    'gardenist', 'aperol', 'campari', 'martini', 'prosecco', 'lambrusco',
    // NB: 'эль'/'ipa' are NOT listed — as bare substrings they'd hit «кисель»,
    // «мельба» and Latin names; beer is already caught by the «Пиво» category.
    'сидр', 'лагер', 'стаут', 'портер', 'мохито', 'негрони', 'спритц',
    // retail coffee (bags of beans / ground / drip / capsules) — a product to buy,
    // not a drink to taste, and its "photo" is often just packaging.
    'в зёрнах', 'в зернах', 'зернах', 'зерновой', 'молот', 'дрип-пакет', 'дрип пакет',
    'капсул', 'чалда', 'помол',
    // NON-STANDALONE substrings safe for SQL `contains` (owner rule 13.07.2026).
    // Word-boundary cases (мёд, хлеб, лимон, соус…) CANNOT be expressed here —
    // '\b' inside a JS string is a literal backspace, so those entries silently
    // matched nothing. They are enforced by the isNonStandalone() post-filter.
    'халапеньо', 'халапенью', 'кетчуп', 'майонез', 'горчиц', 'васаби',
    'сметан', 'сироп', 'топпинг', 'посыпк', 'варень',
    'приправ', 'гарнир', 'булочк', 'лаваш',
    'маслин', 'оливк', 'сахар', 'взбитые', 'корица',
  ];

  // Prisma OR-filter of everything we never recommend (use inside `NOT:`).
  // Only restaurant-grade cuisine — Russian/folk cuisine is excluded entirely.
  private excludeFilter() {
    return {
      OR: [
        ...RecsysService.EXCLUDED_CATS.map((c) => ({ category: { contains: c, mode: 'insensitive' as const } })),
        ...RecsysService.EXCLUDED_NAMES.map((n) => ({ name: { contains: n, mode: 'insensitive' as const } })),
        { category: { contains: 'русск', mode: 'insensitive' as const } },
        // NULL-safe: `NOT(NULL LIKE …)` is NULL (drops the row), and most items have
        // no cuisine — so only exclude when cuisine is set AND matches.
        { AND: [{ cuisine: { not: null } }, { cuisine: { contains: 'русск', mode: 'insensitive' as const } }] },
      ],
    };
  }

  // action → implicit weight (per product spec)
  static readonly WEIGHTS: Record<string, number> = {
    RATE_HIGH: 5, // rating 9–10 / 5★
    RATE_GOOD: 4, // rating 8 / 4★
    SAVE: 3, // saved/favorited
    VIEW: 2, // card open > 15s
    OPEN: 1, // card opened
  };

  /** Append an implicit-feedback event (deduped softly by upserting the max weight). */
  async log(userId: string, listingId: string, type: string) {
    const weight = RecsysService.WEIGHTS[type];
    if (!weight || !userId || !listingId) return { ok: false };
    await this.prisma.interaction.create({ data: { userId, listingId, type, weight } });
    return { ok: true };
  }

  /** Map a 5★ rating to a weighted RATE event (used by the review flow). */
  ratingType(rating: number): string | null {
    if (rating >= 5) return 'RATE_HIGH';
    if (rating >= 4) return 'RATE_GOOD';
    return null; // low ratings are negative signal, handled by Dislike/exclusions
  }

  /**
   * Cold-start probability the user will like an item, as 0–100% + a reason.
   * Blends: item quality (community), the user's affinity for the same category,
   * and onboarding-quiz interests. Clamped to a friendly 40–97% band.
   */
  async likeProbability(userId: string, listingId: string) {
    // OWNER RULE 16.07.2026: the % is shown only when the taste profile is real —
    // after 25 ratings. Before that it's noise dressed as precision.
    const myRatings = await this.prisma.review.count({ where: { userId } });
    const item = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!item) return { probability: null, reason: '', ratingCount: myRatings };
    if (myRatings < 25) {
      const reason = myRatings === 0
        ? item.reviewCount > 0 && item.avgRating >= 4.2
          ? 'Часто высоко оценивают'
          : 'Популярно рядом'
        : '';
      return { probability: null, reason, ratingCount: myRatings };
    }

    let score = 0.55; // prior
    let reason = 'Популярный выбор';

    // 1) community quality of the item itself
    if (item.reviewCount > 0) {
      score += ((item.avgRating - 3) / 2) * 0.18;
      if (item.avgRating >= 4.3) reason = `Высокая оценка у других — ${item.avgRating.toFixed(1)}★`;
    }

    // 2) the user's affinity for this category (avg of their ratings there)
    if (item.category) {
      const mine = await this.prisma.review.findMany({
        where: { userId, status: 'APPROVED', listing: { category: item.category } },
        select: { rating: true },
      });
      if (mine.length) {
        const avg = mine.reduce((s, r) => s + r.rating, 0) / mine.length;
        score += ((avg - 3) / 2) * 0.28;
        if (avg >= 4) reason = `Вам нравится категория «${item.category}»`;
      }
    }

    // 3) onboarding-quiz interests (price + categories)
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    const prefs = (u?.preferences as any) ?? {};
    const cats: string[] = prefs.categories ?? [];
    const hay = `${item.category ?? ''} ${item.cuisine ?? ''} ${item.name}`.toLowerCase();
    if (cats.some((k) => hay.includes(String(k).toLowerCase()))) {
      score += 0.08;
      reason = 'Совпадает с вашими интересами из анкеты';
    }

    const probability = Math.round(Math.max(0.4, Math.min(0.97, score)) * 100);
    return { probability, reason, ratingCount: myRatings };
  }

  /**
   * AI-profile recommendations: rank dishes/drinks against the LLM-built taste
   * profile (preferences.aiTaste — cuisines/loves boost, dislikes penalise),
   * minus what the user already rated or swiped away. Falls back to cold-start
   * when no profile has been built yet.
   */
  async recommendByTaste(userId: string, take = 30) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const ai = (u?.preferences as any)?.aiTaste;
    if (!ai) return this.recommend(userId, take);

    const cuisines: string[] = (ai.cuisines ?? []).map((s: string) => String(s).toLowerCase());
    const loves: string[] = (ai.loves ?? []).map((s: string) => String(s).toLowerCase());
    const dislikes: string[] = (ai.dislikes ?? []).map((s: string) => String(s).toLowerCase());

    const rated = await this.prisma.review.findMany({ where: { userId }, select: { listingId: true } });
    const swiped = await this.prisma.dislike.findMany({ where: { userId }, select: { itemId: true } });
    const exclude = new Set([...rated.map((r) => r.listingId), ...swiped.map((d) => d.itemId)]);

    // ── YouTube-style CATEGORY + VENUE AFFINITY — shared with the catalog
    //    «Рекомендуемые» sort (common/taste-affinity.ts). Rebuilt on each
    //    request, so it adapts after every action.
    const { catAffinity, venueAffinity, priceSegmentAffinity, venueTierAffinity } = await buildAffinities(this.prisma, userId);

    // only dishes actually served somewhere — every recommendation is "блюдо в
    // конкретном месте", with a real venue attached (servedAt = APPROVED menu links).
    const items = await this.prisma.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        id: { notIn: [...exclude] },
        NOT: this.excludeFilter(),
        ...REAL_PHOTO_OR_COFFEE, // feed shows only real (legally-parsed) photos + coffee
      },
      include: {
        servedAt: {
          where: { status: 'APPROVED' },
          select: {
            venue: { select: { id: true, name: true, category: true, cuisine: true, groupKey: true, priceLevel: true } },
            price: true,
            photoUrl: true,
          },
          take: 30,
        },
      },
      orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }],
      take: 500,
    });

    const candidateVenueIds = [...new Set(items.flatMap((item) => item.servedAt.map((link) => link.venue.id)))];
    const venueTraits = await loadVenueTraits(this.prisma, candidateVenueIds);

    let scored = items
      .filter((it) => !isNonStandalone(it.name)) // permanent ban: sauces/ingredients/sides
      .map((it) => {
        const hay = `${it.name} ${it.category ?? ''} ${it.cuisine ?? ''}`.toLowerCase();
        let s = (it.avgRating - 3) * 0.3; // base quality
        let why = '';
        for (const c of cuisines) if (hay.includes(c)) { s += 2; why ||= `вы любите ${c}`; }
        for (const l of loves) if (hay.includes(l)) { s += 3; why = `похоже на «${l}», что вам нравится`; }
        for (const d of dislikes) if (hay.includes(d)) s -= 4;
        // learned category affinity (YouTube-style): strong pull toward categories
        // the user engages with, push away from ones they reject
        const aff = catAffinity.get((it.category ?? '').toLowerCase().trim());
        if (aff) {
          s += aff * 3;
          if (aff > 0.4 && !why) why = 'вы часто выбираете такое';
          if (aff < -0.4) s -= 1; // extra damping for actively-rejected categories
        }
        // Score a concrete serving, not an abstract dish median. This prevents a
        // premium match from later being attached to a random economy venue.
        const links = (it as any).servedAt ?? [];
        let recLink: any = undefined;
        let bestServingScore = -Infinity;
        let bestPriceFit = 0;
        let bestTierFit = 0;
        let bestVenueFit = 0;
        for (const link of links) {
          const traits = venueTraits.get(link.venue?.id);
          const venueFit = venueAffinity.get(link.venue?.id) ?? 0;
          const priceFit = scorePriceSegment(priceSegmentAffinity, link.price ?? traits?.menuMedian);
          const tierFit = scoreVenueTier(venueTierAffinity, traits);
          const servingScore = venueFit * 2.5 + priceFit * 3.25 + tierFit * 3.5;
          if (servingScore > bestServingScore) {
            bestServingScore = servingScore;
            bestPriceFit = priceFit;
            bestTierFit = tierFit;
            bestVenueFit = venueFit;
            recLink = link;
          }
        }
        if (Number.isFinite(bestServingScore)) s += bestServingScore;
        if (bestVenueFit > 0.5 && !why) why = `из «${recLink?.venue?.name}», где вам нравится`;
        if (bestTierFit > 0.3 && !why) why = 'из заведения вашего класса';
        if (bestPriceFit > 0.35 && !why) why = 'в вашем ценовом диапазоне';
        return { it, s, recLink, why: why || ai.summary || 'подобрано под ваш вкус' };
      })
      .filter((x) => x.s > -1)
      .sort((a, b) => b.s - a.s);

    // one per dish name (no duplicate "Глинтвейн" from different venues)
    const seenName = new Set<string>();
    scored = scored.filter((x) => {
      const n = x.it.name.toLowerCase().trim();
      if (seenName.has(n)) return false;
      seenName.add(n);
      return true;
    });

    // take a generous top pool, then SHUFFLE → a fresh set of good items every
    // time the user returns to home (not the same deterministic top each time)
    const pool = scored.slice(0, Math.max(Number(take) * 5, 120)); // wider pool → less repetition across visits
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const pick = pool.slice(0, Number(take));

    // "match %" (unlocked after N ratings, gamification): calibrated from the
    // internal score — 60% floor (it passed the filters) up to 97% (never a
    // fake-certain 100). Only meaningful once the user HAS a taste profile.
    const showPct = rated.length >= 25;
    const maxS = Math.max(0.5, ...pool.map((x) => x.s));

    const cards = await this.listings.enrichCards(pick.map((x) => x.it));
    return cards.map((c, i) => {
      // pick one real venue for this dish. Prefer a venue that has ITS OWN
      // generated photo, so the shown image matches "попробуйте в: X" and rotates
      // with the venue (owner rule 12.07.2026).
      const links = ((pick[i].it as any).servedAt ?? []).filter((l: any) => l.venue);
      // prefer a venue the user GRAVITATES to (venue affinity), then one that has
      // its own generated photo, else any
      const liked = links.filter((l: any) => (venueAffinity.get(l.venue?.id) ?? 0) > 0.3);
      const withPhoto = (liked.length ? liked : links).filter((l: any) => l.photoUrl);
      const pool = liked.length ? liked : withPhoto.length ? withPhoto : links;
      const link = pick[i].recLink ?? (pool.length ? pool[Math.floor(Math.random() * pool.length)] : undefined);
      const recVenue = link ? { ...link.venue, price: link.price ?? null } : undefined;
      // user photos (on the shared card) always win; else the venue's own photo
      const isUserPhoto = c.photoUrl?.startsWith('/api/files/') && !c.photoUrl?.startsWith('/api/files/aigen-');
      const photoUrl = !isUserPhoto && link?.photoUrl ? link.photoUrl : c.photoUrl;
      const matchPct = showPct ? Math.round(60 + 37 * Math.max(0, Math.min(1, pick[i].s / maxS))) : undefined;
      // unified 0..1 score so rec cards can outrank friends' posts in the feed
      const normScore = Math.max(0, Math.min(1, pick[i].s / maxS));
      return { ...c, photoUrl, recReason: pick[i].why, recVenue, matchPct, normScore };
    });
  }

  /**
   * Cold-start recommendations: popular, well-rated items in the user's affine
   * categories, minus what they already rated/disliked. (LightFM replaces this in
   * Phase 2 via rec_cache.)
   */
  async recommend(userId: string, take = 20) {
    const rated = await this.prisma.review.findMany({ where: { userId }, select: { listingId: true } });
    const disliked = await this.prisma.dislike.findMany({ where: { userId }, select: { itemId: true } });
    const exclude = new Set([...rated.map((r) => r.listingId), ...disliked.map((d) => d.itemId)]);
    return this.buildColdFeed(exclude, take);
  }

  /** Anonymous cold-start feed — the home screen renders on the FIRST request even
   *  before Telegram auth is ready (no user context, nothing to exclude). */
  async anonFeed(take = 20) {
    return this.buildColdFeed(new Set(), take);
  }

  private async buildColdFeed(exclude: Set<string>, take = 20) {

    // same shape as recommendByTaste (cards + recVenue) so a brand-new user (no
    // taste profile yet) still gets a real "dish in a place" deck, not a dropped feed.
    const items = await this.prisma.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        id: { notIn: [...exclude] },
        NOT: this.excludeFilter(),
        ...REAL_PHOTO_OR_COFFEE,
      },
      include: {
        servedAt: {
          where: { status: 'APPROVED' },
          select: { venue: { select: { id: true, name: true } }, price: true, photoUrl: true },
          take: 30,
        },
      },
      orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }],
      take: 200,
    });

    // one per dish name, then shuffle a generous top pool for variety on each load
    const seenName = new Set<string>();
    const uniq = items.filter((it) => {
      if (isNonStandalone(it.name)) return false; // permanent ban: sauces/ingredients/sides
      const n = it.name.toLowerCase().trim();
      if (seenName.has(n)) return false;
      seenName.add(n);
      return true;
    });
    const pool = uniq.slice(0, Math.max(Number(take) * 5, 120)); // wider pool → less repetition
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const pick = pool.slice(0, Number(take));

    const cards = await this.listings.enrichCards(pick);
    return cards.map((c, i) => {
      const links = ((pick[i] as any).servedAt ?? []).filter((l: any) => l.venue);
      const link = links.length ? links[Math.floor(Math.random() * links.length)] : undefined;
      const recVenue = link ? { ...link.venue, price: link.price ?? null } : undefined;
      return { ...c, recReason: 'популярно сейчас', recVenue };
    });
  }
}
