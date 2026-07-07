import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private venueSelect = {
    select: { id: true, name: true, photoUrl: true, category: true, address: true },
  };

  // новинки must carry a REAL post photo of the dish — never a fetched stock image.
  // Excludes the stock hosts an older enrich step used, so those events drop out.
  private realPhoto = {
    photoUrl: { not: null },
    NOT: [
      { photoUrl: { contains: 'pexels' } },
      { photoUrl: { contains: 'unsplash' } },
      { photoUrl: { contains: 'wikimedia' } },
      { photoUrl: { contains: 'pixabay' } },
    ],
  };

  /** Recent NEW DISHES/DRINKS across the city (home "Новинки заведений" strip).
   *  Schedule changes never appear in the feed — only inside the venue card. */
  recent(take = 30) {
    return this.prisma.venueEvent.findMany({
      where: { kind: 'dish', aiProcessed: true, ...this.realPhoto }, // AI-cleaned + REAL dish photo
      orderBy: { publishedAt: 'desc' },
      take: Number(take),
      include: { venue: this.venueSelect },
    });
  }

  /** New dishes/drinks matched to the user's taste (quiz interests + what they
   *  rate highly). Cold-start: falls back to recent dishes. */
  async forTaste(userId: string, take = 24) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const quiz: string[] = ((u?.preferences as any)?.categories ?? []).map((c: string) =>
      String(c).toLowerCase(),
    );
    const liked = await this.prisma.review.findMany({
      where: { userId, rating: { gte: 4 } },
      select: { listing: { select: { category: true, name: true } } },
    });
    const tokens = new Set<string>(quiz);
    for (const r of liked) {
      const c = r.listing?.category?.toLowerCase();
      if (c && !/^(блюдо|напиток)$/.test(c)) tokens.add(c);
      const w = r.listing?.name
        ?.toLowerCase()
        .split(/\s+/)
        .sort((a, b) => b.length - a.length)[0];
      if (w && w.length >= 4) tokens.add(w);
    }
    const toks = [...tokens].filter((t) => t.length >= 3).slice(0, 25);

    // taste-matched dishes first, then fill with recent dishes; always distinct
    // venues (so chains don't eat the whole feed). AI-cleaned ones rank higher.
    const order = [{ aiProcessed: 'desc' as const }, { publishedAt: 'desc' as const }];
    const matched = toks.length
      ? await this.prisma.venueEvent.findMany({
          where: { kind: 'dish', aiProcessed: true, ...this.realPhoto, OR: toks.map((t) => ({ text: { contains: t, mode: 'insensitive' as const } })) },
          orderBy: order,
          take: Number(take) * 6,
          include: { venue: this.venueSelect },
        })
      : [];
    const recent = await this.prisma.venueEvent.findMany({
      where: { kind: 'dish', aiProcessed: true, ...this.realPhoto },
      orderBy: order,
      take: Number(take) * 6,
      include: { venue: this.venueSelect },
    });

    // one card per venue AND per dish — same dish (e.g. shared group channel) shows once
    const seenVenue = new Set<string>();
    const seenDish = new Set<string>();
    const pool: any[] = [];
    for (const e of [...matched, ...recent]) {
      const v = (e.venue?.name ?? e.venueId).toLowerCase();
      const t = (e.title ?? '').toLowerCase().trim();
      if (seenVenue.has(v) || (t && seenDish.has(t))) continue;
      seenVenue.add(v);
      if (t) seenDish.add(t);
      pool.push(e);
      if (pool.length >= Number(take) * 4) break;
    }
    // shuffle the candidate pool → a fresh set of new dishes every time you return home
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Number(take));
  }

  /** New dishes/drinks at venues the user favorited. */
  async forUser(userId: string, take = 30) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    const ids = favs.map((f) => f.listingId);
    if (!ids.length) return [];
    return this.prisma.venueEvent.findMany({
      where: { venueId: { in: ids }, kind: 'dish', aiProcessed: true, ...this.realPhoto },
      orderBy: { publishedAt: 'desc' },
      take: Number(take),
      include: { venue: this.venueSelect },
    });
  }

  /** A single venue's recent events (shown on its card). */
  forVenue(venueId: string, take = 12) {
    return this.prisma.venueEvent.findMany({
      where: { venueId },
      orderBy: { publishedAt: 'desc' },
      take: Number(take),
    });
  }
}
