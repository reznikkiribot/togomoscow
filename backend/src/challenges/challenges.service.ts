import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateChallengeDto {
  title: string;
  category?: string;
  target: number;
  days?: number; // duration; default 7
}

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active challenges with the user's live progress (reviews in the window). */
  async list(userId: string) {
    const now = new Date();
    const challenges = await this.prisma.challenge.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
    });
    if (challenges.length === 0) return [];
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      select: { createdAt: true, listing: { select: { category: true, name: true } } },
    });
    return challenges.map((ch) => {
      const kw = (ch.category ?? '').toLowerCase();
      const progress = reviews.filter((r) => {
        if (r.createdAt < ch.startsAt || r.createdAt > ch.endsAt) return false;
        if (!kw) return true;
        const c = (r.listing?.category ?? '').toLowerCase();
        const n = (r.listing?.name ?? '').toLowerCase();
        return c.includes(kw) || n.includes(kw);
      }).length;
      return {
        id: ch.id,
        title: ch.title,
        target: ch.target,
        endsAt: ch.endsAt,
        progress: Math.min(progress, ch.target),
        done: progress >= ch.target,
      };
    });
  }

  // ---- admin ----
  private async requireAdmin(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (u?.role !== Role.ADMIN) throw new ForbiddenException('Admins only');
  }

  async adminList(userId: string) {
    await this.requireAdmin(userId);
    return this.prisma.challenge.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, dto: CreateChallengeDto) {
    await this.requireAdmin(userId);
    const days = Number(dto.days) > 0 ? Number(dto.days) : 7;
    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        category: dto.category?.trim() || null,
        target: Math.max(1, Number(dto.target) || 1),
        endsAt: new Date(Date.now() + days * 86400000),
      },
    });
  }

  async deactivate(userId: string, id: string) {
    await this.requireAdmin(userId);
    return this.prisma.challenge.update({ where: { id }, data: { active: false } });
  }
}
