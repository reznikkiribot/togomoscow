import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { latestPerUser, weightedRating } from './trust.logic';

@Injectable()
export class RatingRecalculationService {
  private readonly log = new Logger(RatingRecalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recalculateForListing(listingId: string) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const listing = await tx.listing.findUnique({
              where: { id: listingId },
              select: { id: true, type: true, groupKey: true, name: true },
            });
            if (!listing) return null;
            const targetIds =
              listing.type === 'RESTAURANT'
                ? (
                    await tx.listing.findMany({
                      where: listing.groupKey
                        ? { type: 'RESTAURANT', groupKey: listing.groupKey }
                        : { type: 'RESTAURANT', groupKey: null, name: { equals: listing.name, mode: 'insensitive' } },
                      select: { id: true },
                    })
                  ).map((row) => row.id)
                : [listing.id];

            const reviews = await tx.review.findMany({
              where: {
                listingId: { in: targetIds },
                status: 'APPROVED',
                trust: {
                  is: {
                    ratingWeight: { gt: 0 },
                    hiddenAt: null,
                    verificationStatus: { not: 'excluded_from_rating' },
                  },
                },
              },
              select: {
                userId: true,
                rating: true,
                updatedAt: true,
                trust: { select: { ratingWeight: true } },
              },
              orderBy: { updatedAt: 'desc' },
            });

            // A chain is one rating entity: if somebody rated two branches, only
            // that person's latest current tasting participates in the network score.
            const eligible = latestPerUser(reviews).map((review) => ({
              rating: review.rating,
              weight: review.trust?.ratingWeight ?? 0,
            }));
            const result = weightedRating(eligible);
            await tx.listing.updateMany({
              where: { id: { in: targetIds } },
              data: {
                avgRating: result.avgRating,
                reviewCount: eligible.length,
                ratingWeightSum: result.weightSum,
              },
            });
            this.log.log(
              JSON.stringify({
                event: 'card_rating_recalculated',
                listingId,
                targetCount: targetIds.length,
                reviewCount: eligible.length,
                ratingWeightSum: result.weightSum,
                avgRating: result.avgRating,
              }),
            );
            return { ...result, reviewCount: eligible.length, targetIds };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: any) {
        if (error?.code === 'P2034' && attempt < 2) continue;
        throw error;
      }
    }
    return null;
  }
}
