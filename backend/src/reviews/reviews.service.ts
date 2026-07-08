import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, VoteType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// auto-moderation: obvious profanity / spam is rejected before a comment is saved
const PROFANITY = /(?:\bхуй|хуё|хуя|пизд|\bебать|ебан|ёбан|бляд|\bсук[аи]\b|мудак|долбоёб|пидор|гандон|залуп)/i;
// NB: outer group is non-capturing so the `(.)\1{6,}` backreference points at the
// `(.)` (group 1) — with a capturing outer group `\1` was empty and matched EVERY char.
const SPAM = /(?:https?:\/\/|www\.|t\.me\/|@[a-z0-9_]{4,}|\b\d{10,}\b|(.)\1{6,})/i;

export interface CreateReviewDto {
  rating: number;
  text?: string;
  attributes?: Prisma.InputJsonValue;
  photoUrls?: string[];
  videoUrls?: string[];
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All comments on a review (flat, oldest first) — frontend builds the tree. */
  async comments(reviewId: string) {
    return this.prisma.comment.findMany({
      where: { reviewId },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Add a comment (or a reply when parentId is set) to a review. Auto-moderated. */
  async addComment(userId: string, reviewId: string, text: string, parentId?: string) {
    const t = (text ?? '').trim();
    if (!t) return null;
    if (PROFANITY.test(t)) throw new BadRequestException('Комментарий содержит недопустимую лексику');
    if (SPAM.test(t)) throw new BadRequestException('Похоже на спам — ссылки и контакты запрещены');
    return this.prisma.comment.create({
      data: { reviewId, userId, text: t.slice(0, 1000), parentId: parentId ?? null },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
    });
  }

  /** Delete a comment. Allowed for its author, or for an admin (@reznik_kir1ll).
   *  A user can never delete someone else's comment. */
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (!comment) throw new NotFoundException('Комментарий не найден');
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = me?.role === Role.ADMIN;
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    }
    await this.prisma.comment.delete({ where: { id: commentId } }); // replies cascade
    return { ok: true };
  }

  /** Prepare a rich Telegram message to send to a friend: the check-in PHOTO +
   *  the user's note as caption + a single "Open in app" button (no raw long link).
   *  Returns a prepared_message_id the Mini App passes to tg.shareMessage(). */
  async preparePost(tgUserId: number, listingId: string, text?: string, photoUrl?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !tgUserId) throw new BadRequestException('share unavailable');
    const APP = (process.env.PUBLIC_APP_URL || 'https://togomoscow-production.up.railway.app').replace(/\/$/, '');
    const deepLink = `https://t.me/togomoscow_bot?startapp=l_${listingId}`;
    const reply_markup = { inline_keyboard: [[{ text: '🍽 Открыть в togomoscow', url: deepLink }]] };
    const caption = (text ?? '').trim().slice(0, 1000);
    const abs = photoUrl ? (/^https?:\/\//.test(photoUrl) ? photoUrl : APP + photoUrl) : null;
    const result = abs
      ? { type: 'photo', id: 'p' + Date.now(), photo_url: abs, thumbnail_url: abs, caption, reply_markup }
      : { type: 'article', id: 'a' + Date.now(), title: 'togomoscow', description: caption.slice(0, 80), input_message_content: { message_text: caption || 'Зацени в togomoscow 🍽' }, reply_markup };
    const r = await fetch(`https://api.telegram.org/bot${token}/savePreparedInlineMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: tgUserId, result, allow_user_chats: true, allow_group_chats: false }),
    });
    const d: any = await r.json();
    if (!d.ok) throw new BadRequestException(d.description || 'prepare failed');
    return { id: d.result.id };
  }

  /** Add a photo to a listing WITHOUT a rating/review. ACCUMULATES into the gallery
   *  (a 2nd/3rd photo adds, never replaces) and sets the card face if there's none yet. */
  async addPhoto(_userId: string, listingId: string, url: string) {
    if (!url || !/^https?:\/\/|^\//.test(url)) throw new BadRequestException('bad url');
    const l = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { photoUrl: true, photos: true },
    });
    const photos = [...new Set([...(l?.photos ?? []), url])];
    await this.prisma.listing
      .update({ where: { id: listingId }, data: { photos, ...(l?.photoUrl ? {} : { photoUrl: url }) } })
      .catch(() => {});
    return { ok: true };
  }

  async create(userId: string, listingId: string, dto: CreateReviewDto) {
    const rating = Math.max(1, Math.min(5, Number(dto.rating) || 0));
    // every review goes through moderation (admin approves in the cabinet)
    const status: 'APPROVED' | 'PENDING' = 'PENDING';
    const review = await this.prisma.review.upsert({
      where: { listingId_userId: { listingId, userId } },
      create: {
        listingId,
        userId,
        rating,
        text: dto.text ?? null,
        attributes: dto.attributes ?? Prisma.JsonNull,
        photoUrls: dto.photoUrls ?? [],
        videoUrls: dto.videoUrls ?? [],
        status,
      },
      update: {
        rating,
        text: dto.text ?? null,
        attributes: dto.attributes ?? Prisma.JsonNull,
        photoUrls: dto.photoUrls ?? [],
        videoUrls: dto.videoUrls ?? [],
        status,
      },
    });
    // review photos ACCUMULATE into the listing gallery (deduped); the first real
    // photo also becomes the card face if there isn't one yet.
    if (dto.photoUrls?.length) {
      const l = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { photoUrl: true, photos: true },
      });
      const photos = [...new Set([...(l?.photos ?? []), ...dto.photoUrls])];
      await this.prisma.listing
        .update({
          where: { id: listingId },
          data: { photos, ...(l?.photoUrl ? {} : { photoUrl: dto.photoUrls[0] }) },
        })
        .catch(() => {});
    }
    // a dish/drink review carries the venue it was tasted at → make sure the item
    // is on that venue's menu (and on every branch of the chain). Done server-side
    // so it works no matter which rating path the client used.
    const venueId = (dto.attributes as any)?.venueId;
    const price = (dto.attributes as any)?.price;
    if (venueId) await this.linkChain(userId, listingId, venueId, price);
    // implicit-feedback signal for the recommender (high ratings = strong positive)
    const recType = rating >= 5 ? 'RATE_HIGH' : rating >= 4 ? 'RATE_GOOD' : null;
    if (recType) {
      await this.prisma.interaction
        .create({ data: { userId, listingId, type: recType, weight: rating >= 5 ? 5 : 4 } })
        .catch(() => {});
    }
    await this.recompute(listingId);
    return review;
  }

  /** Link an item to a venue and ALL branches of its chain (shared menu). */
  private async linkChain(userId: string, itemId: string, venueId: string, price?: number) {
    const venue = await this.prisma.listing.findUnique({
      where: { id: venueId },
      select: { groupKey: true, name: true },
    });
    if (!venue) return;
    const where = venue.groupKey
      ? { groupKey: venue.groupKey, type: 'RESTAURANT' as const }
      : { name: { equals: venue.name ?? '', mode: 'insensitive' as const }, type: 'RESTAURANT' as const };
    const branchIds = (await this.prisma.listing.findMany({ where, select: { id: true } })).map(
      (b) => b.id,
    );
    if (!branchIds.includes(venueId)) branchIds.push(venueId);
    for (const vid of branchIds) {
      await this.prisma.menuLink.upsert({
        where: { venueId_itemId: { venueId: vid, itemId } },
        // price only on the branch it was actually tasted at
        create: {
          venueId: vid,
          itemId,
          status: 'APPROVED',
          addedByUserId: userId,
          ...(vid === venueId && price != null ? { price: Number(price) } : {}),
        },
        update: vid === venueId && price != null ? { price: Number(price) } : {},
      });
    }
  }

  /** Delete the user's own review and recompute the listing rating. */
  async remove(userId: string, reviewId: string) {
    const r = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!r || r.userId !== userId) return { ok: false };
    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recompute(r.listingId);
    return { ok: true };
  }

  /** Keep denormalized avgRating/reviewCount on the listing in sync (approved only). */
  private async recompute(listingId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { listingId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    });
  }

  async myReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });
    const ids = reviews.map((r) => r.id);
    const grouped = ids.length
      ? await this.prisma.reviewVote.groupBy({
          by: ['reviewId', 'type'],
          where: { reviewId: { in: ids } },
          _count: true,
        })
      : [];
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    const out = reviews.map((r) => ({
      ...r,
      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
    })) as any[];
    // attach the venue for dish/drink reviews
    const itemIds = out
      .filter((r) => r.listing && r.listing.type !== 'RESTAURANT')
      .map((r) => r.listing.id);
    if (itemIds.length) {
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
      for (const r of out) if (r.listing && venueByItem.has(r.listing.id)) r.venue = venueByItem.get(r.listing.id);
    }
    return out;
  }

  /** Toggle a useful/funny/cool vote on a review, return fresh counts + mine. */
  async vote(userId: string, reviewId: string, type: VoteType) {
    const where = { reviewId_userId_type: { reviewId, userId, type } };
    const existing = await this.prisma.reviewVote.findUnique({ where });
    if (existing) {
      await this.prisma.reviewVote.delete({ where });
    } else {
      await this.prisma.reviewVote.create({ data: { reviewId, userId, type } });
    }
    return this.voteState(reviewId, userId);
  }

  async voteState(reviewId: string, userId: string) {
    const votes = await this.prisma.reviewVote.findMany({
      where: { reviewId },
      select: { type: true, userId: true },
    });
    const counts: Record<string, number> = { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
    const mine: string[] = [];
    for (const v of votes) {
      counts[v.type]++;
      if (v.userId === userId) mine.push(v.type);
    }
    return { counts, mine };
  }
}
