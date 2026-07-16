import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Notification center + bot push (owner spec 16.07.2026):
// events — vote on my review, comment on my review, new follower, new post by
// someone I follow. Every event lands in the bell center; the BOT PUSH is capped
// at ONE per user per day — extra events that day are push-cleared (in-app only).
@Injectable()
export class NotificationsService {
  private readonly log = new Logger('Notifications');
  constructor(private readonly prisma: PrismaService) {}

  async add(opts: {
    userId: string;
    kind: 'vote' | 'comment' | 'follow' | 'friend_post';
    text: string;
    actorId?: string | null;
    actorName?: string | null;
    reviewId?: string | null;
  }) {
    const { userId, kind, text, actorId, actorName, reviewId } = opts;
    if (!userId || (actorId && actorId === userId)) return; // never notify about yourself
    try {
      // near-duplicate guard: the same actor+kind+review within an hour is one event
      const dupe = await this.prisma.notification.findFirst({
        where: {
          userId, kind, actorId: actorId ?? undefined, reviewId: reviewId ?? undefined,
          createdAt: { gte: new Date(Date.now() - 3_600_000) },
        },
      });
      if (dupe) return;
      const created = await this.prisma.notification.create({
        data: { userId, kind, text, actorId, actorName, reviewId },
      });
      // keep the center tidy — last 50 per user
      const excess = await this.prisma.notification.findMany({
        where: { userId }, orderBy: { createdAt: 'desc' }, skip: 50, select: { id: true },
      });
      if (excess.length) await this.prisma.notification.deleteMany({ where: { id: { in: excess.map((e) => e.id) } } });
      await this.maybePush(userId, created.id, text);
    } catch (e) {
      this.log.warn(`add failed: ${(e as Error).message}`);
    }
  }

  /** Bot push, HARD-capped at 1 per user per day. Beyond that — bell-only. */
  private async maybePush(userId: string, notificationId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const pushedToday = await this.prisma.notification.count({
      where: { userId, pushed: true, createdAt: { gte: dayStart } },
    });
    if (pushedToday >= 1) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { telegramId: true } });
    if (!user?.telegramId) return;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(user.telegramId), text: `🔔 ${text}\n\nОткройте приложение — в колокольчике всё новое.` }),
        signal: AbortSignal.timeout(10_000),
      });
      if (r.ok) await this.prisma.notification.update({ where: { id: notificationId }, data: { pushed: true } });
    } catch { /* user may have blocked the bot — fine */ }
  }

  async list(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    // tap → the source review's card: attach the listing behind each review
    const reviewIds = [...new Set(items.map((n) => n.reviewId).filter(Boolean))] as string[];
    const reviews = reviewIds.length
      ? await this.prisma.review.findMany({
          where: { id: { in: reviewIds } },
          select: { id: true, listingId: true, listing: { select: { name: true } } },
        })
      : [];
    const byReview = new Map(reviews.map((r) => [r.id, r]));
    const enriched = items.map((n) => ({
      ...n,
      listingId: n.reviewId ? byReview.get(n.reviewId)?.listingId ?? null : null,
      listingName: n.reviewId ? byReview.get(n.reviewId)?.listing?.name ?? null : null,
    }));
    const unread = items.filter((n) => !n.readAt).length;
    return { items: enriched, unread };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }
}
