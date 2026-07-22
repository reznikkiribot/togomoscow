import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RatingRecalculationService } from './rating-recalculation.service';
import { TrustConfigService } from './trust-config.service';
import { TrustService } from './trust.service';

const ACTIONS = [
  'confirm',
  'leave_unchanged',
  'lower_weight',
  'exclude',
  'hide',
  'restore',
  'mark_violation',
  'recalculate',
] as const;

@Injectable()
export class TrustAdminService {
  private readonly log = new Logger(TrustAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configs: TrustConfigService,
    private readonly trust: TrustService,
    private readonly ratings: RatingRecalculationService,
  ) {}

  async config() {
    return this.configs.get();
  }

  async updateConfig(adminId: string, body: { config: unknown; formulaVersion?: string; recalculate?: boolean }) {
    const updated = await this.configs.update(adminId, body.config, body.formulaVersion);
    const job = body.recalculate === false ? null : await this.trust.startMassRecalculation(adminId);
    return { ...updated, job };
  }

  async queue() {
    return this.prisma.reviewTrust.findMany({
      where: {
        OR: [
          { verificationStatus: { in: ['under_review', 'excluded_from_rating'] } },
          { review: { fraudFlags: { some: { reviewStatus: 'open' } } } },
        ],
      },
      include: {
        review: {
          include: {
            user: { select: { id: true, firstName: true, username: true, photoUrl: true, createdAt: true, trustProfile: true } },
            listing: { select: { id: true, name: true, type: true, photoUrl: true } },
            fraudFlags: { where: { reviewStatus: 'open' }, orderBy: { detectedAt: 'desc' } },
            revisions: { orderBy: { replacedAt: 'desc' }, take: 10 },
            moderationActions: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
      },
      orderBy: [{ trustScore: 'asc' }, { updatedAt: 'desc' }],
      take: 300,
    });
  }

  async action(
    adminId: string,
    reviewId: string,
    body: { action: (typeof ACTIONS)[number]; weight?: number; note?: string },
  ) {
    if (!ACTIONS.includes(body.action)) throw new BadRequestException('Unknown moderation action');
    const existing = await this.prisma.reviewTrust.findUnique({ where: { reviewId }, include: { review: true } });
    if (!existing) throw new NotFoundException('Дегустация не найдена');
    const previousState = this.json(existing);
    const note = body.note?.trim().slice(0, 1000) || null;

    if (body.action === 'confirm') {
      await this.setManualFactors(reviewId, true);
      await this.prisma.reviewTrust.update({ where: { reviewId }, data: { verificationStatus: 'trusted' } });
    } else if (body.action === 'lower_weight') {
      const weight = Number(body.weight);
      if (!Number.isFinite(weight) || weight < 0 || weight > 1 || weight > existing.ratingWeight) {
        throw new BadRequestException('Weight must be between 0 and the current weight');
      }
      await this.setManualFactors(reviewId, true);
      await this.prisma.reviewTrust.update({ where: { reviewId }, data: { manualWeight: weight, ratingWeight: weight } });
    } else if (body.action === 'exclude') {
      await this.setManualFactors(reviewId, true);
      await this.prisma.reviewTrust.update({ where: { reviewId }, data: { manualWeight: 0, ratingWeight: 0, verificationStatus: 'excluded_from_rating' } });
    } else if (body.action === 'hide') {
      await this.prisma.reviewTrust.update({ where: { reviewId }, data: { hiddenAt: new Date() } });
    } else if (body.action === 'restore') {
      await this.setManualFactors(reviewId, false);
      await this.prisma.reviewTrust.update({ where: { reviewId }, data: { hiddenAt: null, manualWeight: null } });
      await this.prisma.fraudFlag.updateMany({ where: { reviewId, type: 'manual_violation', reviewStatus: 'open' }, data: { reviewStatus: 'resolved', resolvedAt: new Date() } });
      await this.trust.calculate(reviewId, true);
    } else if (body.action === 'mark_violation') {
      const flag = await this.prisma.fraudFlag.findFirst({ where: { reviewId, type: 'manual_violation', reviewStatus: 'open' } });
      if (!flag) await this.prisma.fraudFlag.create({ data: { reviewId, type: 'manual_violation', severity: 'critical', source: 'manual', details: { note } } });
      await this.trust.calculate(reviewId, true);
    } else if (body.action === 'recalculate') {
      await this.setManualFactors(reviewId, false);
      await this.prisma.reviewTrust.update({ where: { reviewId }, data: { manualWeight: null } });
      await this.trust.calculate(reviewId, true);
    }

    const next = await this.prisma.reviewTrust.findUniqueOrThrow({ where: { reviewId } });
    await this.prisma.trustModerationAction.create({
      data: {
        reviewId,
        adminId,
        action: body.action,
        previousState: previousState as Prisma.InputJsonValue,
        nextState: this.json(next) as Prisma.InputJsonValue,
        note,
      },
    });
    await this.ratings.recalculateForListing(existing.review.listingId);
    await this.trust.updateUserTrust(existing.review.userId);
    this.log.log(JSON.stringify({ event: 'moderation_action_completed', adminId, reviewId, action: body.action }));
    return next;
  }

  async metrics() {
    const [total, geoAvailable, confirmed, camera, gallery, duplicates, zeroWeight, moderation] = await Promise.all([
      this.prisma.reviewTrust.count(),
      this.prisma.reviewTrust.count({ where: { locationStatus: { not: 'unavailable' } } }),
      this.prisma.reviewTrust.count({ where: { locationStatus: 'confirmed' } }),
      this.prisma.reviewTrust.count({ where: { photoSource: 'camera' } }),
      this.prisma.reviewTrust.count({ where: { photoSource: 'gallery' } }),
      this.prisma.fraudFlag.count({ where: { type: { in: ['duplicate_photo', 'reused_photo_across_accounts', 'similar_photo'] }, reviewStatus: 'open' } }),
      this.prisma.reviewTrust.count({ where: { ratingWeight: 0 } }),
      this.prisma.reviewTrust.count({ where: { verificationStatus: 'under_review' } }),
    ]);
    const ratio = (value: number) => (total ? value / total : 0);
    return {
      total,
      locationAvailableRatio: ratio(geoAvailable),
      locationConfirmedRatio: ratio(confirmed),
      cameraPhotoRatio: ratio(camera),
      galleryPhotoRatio: ratio(gallery),
      duplicateRatio: ratio(duplicates),
      zeroWeightRatio: ratio(zeroWeight),
      moderationCount: moderation,
    };
  }

  jobs() {
    return this.prisma.trustRecalculationJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  }

  private async setManualFactors(reviewId: string, value: boolean) {
    const trust = await this.prisma.reviewTrust.findUniqueOrThrow({ where: { reviewId }, select: { trustFactors: true } });
    await this.prisma.reviewTrust.update({
      where: { reviewId },
      data: { trustFactors: { ...((trust.trustFactors as any) ?? {}), manualOverride: value } },
    });
  }

  private json(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
