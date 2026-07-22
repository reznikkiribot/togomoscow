import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import OpeningHours from 'opening_hours';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { ClipService } from '../vision/clip.service';
import { RatingRecalculationService } from './rating-recalculation.service';
import {
  FraudFlagType,
  LocationStatus,
  PhotoSource,
  ReviewLocationInput,
  TrustConfigShape,
} from './trust.types';
import { TrustConfigService } from './trust-config.service';
import { calculateTrust, weightForScore } from './trust.logic';

type TrustFactors = {
  legacy?: boolean;
  location?: { status: LocationStatus; ageSeconds?: number; accurate?: boolean; venueOpen?: boolean | null };
  photo?: { source?: PhotoSource; unique?: boolean; aiContentMatch?: boolean; aiConfidence?: number };
  accountHistoryScore?: number;
  manualOverride?: boolean;
};

const AUTO_FLAG_SOURCES = ['trust_fast', 'trust_photo'];

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function jaccardText(a: string, b: string) {
  const tokens = (value: string) => new Set(value.toLowerCase().match(/[a-zа-яё0-9]{3,}/gi) ?? []);
  const aa = tokens(a);
  const bb = tokens(b);
  if (!aa.size || !bb.size) return 0;
  const intersection = [...aa].filter((token) => bb.has(token)).length;
  return intersection / (aa.size + bb.size - intersection);
}

export function hammingHex(a: string, b: string) {
  if (!a || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) {
    let value = Number.parseInt(a[index], 16) ^ Number.parseInt(b[index], 16);
    while (value) {
      distance += value & 1;
      value >>= 1;
    }
  }
  return distance;
}

@Injectable()
export class TrustService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(TrustService.name);
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configs: TrustConfigService,
    private readonly ratings: RatingRecalculationService,
    private readonly uploads: UploadsService,
    private readonly clip: ClipService,
  ) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => void this.purgeExpiredRawLocations(), 60 * 60 * 1000);
    this.cleanupTimer.unref?.();
    void this.purgeExpiredRawLocations();
    void this.resumePendingJobs();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async validatePhotoUrls(userId: string, urls: string[] | undefined): Promise<string[]> {
    const requested = [...new Set((urls ?? []).filter((url) => typeof url === 'string'))].slice(0, 6);
    if (!requested.length) return [];
    const keys = requested.map((url) => url.match(/^\/api\/files\/([a-zA-Z0-9._-]+)$/)?.[1]).filter(Boolean) as string[];
    const owned = await this.prisma.uploadedAsset.findMany({ where: { key: { in: keys }, userId }, select: { key: true } });
    const allowed = new Set(owned.map((asset) => `/api/files/${asset.key}`));
    return requested.filter((url) => allowed.has(url));
  }

  async recordConsent(userId: string, body: { consented: boolean; textVersion: string; systemPermission: string }) {
    const { config } = await this.configs.get();
    if (body.textVersion !== config.consentTextVersion) throw new BadRequestException('Consent text version is outdated');
    const systemPermission = ['granted', 'denied', 'prompt', 'unavailable', 'unknown'].includes(body.systemPermission)
      ? body.systemPermission
      : 'unknown';
    return this.prisma.locationConsent.upsert({
      where: { userId },
      create: {
        userId,
        consented: Boolean(body.consented),
        textVersion: body.textVersion,
        systemPermission,
        consentedAt: new Date(),
        revokedAt: body.consented ? null : new Date(),
      },
      update: {
        consented: Boolean(body.consented),
        textVersion: body.textVersion,
        systemPermission,
        consentedAt: new Date(),
        revokedAt: body.consented ? null : new Date(),
      },
    });
  }

  async consent(userId: string) {
    const [{ config }, consent] = await Promise.all([
      this.configs.get(),
      this.prisma.locationConsent.findUnique({ where: { userId } }),
    ]);
    return { consent, textVersion: config.consentTextVersion };
  }

  async revokeConsent(userId: string) {
    await this.prisma.locationConsent.updateMany({
      where: { userId },
      data: { consented: false, revokedAt: new Date(), systemPermission: 'denied' },
    });
    await this.prisma.reviewRawLocation.deleteMany({ where: { review: { userId } } });
    return { ok: true };
  }

  async initializeReview(
    reviewId: string,
    userId: string,
    input: { location?: ReviewLocationInput; photoUrls: string[] },
  ) {
    const { config, formulaVersion } = await this.configs.get();
    const photoSource = await this.photoSource(userId, input.photoUrls);
    await this.prisma.reviewTrust.upsert({
      where: { reviewId },
      create: {
        reviewId,
        trustScore: config.baseScore,
        ratingWeight: weightForScore(config.baseScore, config),
        trustScoreVersion: formulaVersion,
        photoSource,
        trustFactors: { photo: { source: photoSource } },
      },
      update: {
        trustScoreVersion: formulaVersion,
        photoSource,
        trustFactors: { photo: { source: photoSource } },
        manualWeight: null,
      },
    });
    await this.prisma.reviewPhotoFingerprint.deleteMany({
      where: { reviewId, ...(input.photoUrls.length ? { photoUrl: { notIn: input.photoUrls } } : {}) },
    });
    await this.prisma.fraudFlag.updateMany({
      where: { reviewId, source: { in: AUTO_FLAG_SOURCES }, reviewStatus: 'open' },
      data: { reviewStatus: 'resolved', resolvedAt: new Date() },
    });
    await this.applyLocation(reviewId, userId, input.location, config);
    await this.applyBehaviourFlags(reviewId, userId, config);
    await this.calculate(reviewId);
    if (input.photoUrls[0]) {
      await this.processExactPhoto(reviewId, userId, input.photoUrls[0]);
      setImmediate(() => void this.processHeavyPhoto(reviewId, input.photoUrls[0]));
    }
    await this.updateUserTrust(userId);
    await this.calculate(reviewId);
    return this.publicStatus(reviewId);
  }

  async publicStatus(reviewId: string) {
    const trust = await this.prisma.reviewTrust.findUnique({ where: { reviewId }, select: { verificationStatus: true } });
    return this.publicBadge(trust?.verificationStatus ?? 'unverified');
  }

  publicBadge(status: string) {
    if (status === 'trusted') return 'Проверенная дегустация';
    if (status === 'location_confirmed') return 'Посещение подтверждено';
    return 'Обычная дегустация';
  }

  private async photoSource(userId: string, urls: string[]): Promise<PhotoSource> {
    if (!urls.length) return 'none';
    const key = urls[0].match(/^\/api\/files\/([a-zA-Z0-9._-]+)$/)?.[1];
    if (!key) return 'unknown';
    const asset = await this.prisma.uploadedAsset.findFirst({ where: { key, userId }, select: { source: true } });
    return asset && ['camera', 'gallery'].includes(asset.source) ? (asset.source as PhotoSource) : 'unknown';
  }

  private validLocation(input: ReviewLocationInput | undefined) {
    if (!input) return null;
    const capturedAt = new Date(input.capturedAt);
    if (
      !Number.isFinite(input.lat) ||
      !Number.isFinite(input.lng) ||
      !Number.isFinite(input.accuracy) ||
      input.lat < -90 ||
      input.lat > 90 ||
      input.lng < -180 ||
      input.lng > 180 ||
      input.accuracy < 0 ||
      input.accuracy > 100_000 ||
      !Number.isFinite(capturedAt.getTime()) ||
      capturedAt.getTime() > Date.now() + 60_000
    ) return null;
    return { ...input, capturedAt };
  }

  private async applyLocation(reviewId: string, userId: string, raw: ReviewLocationInput | undefined, config: TrustConfigShape) {
    const input = this.validLocation(raw);
    const consent = await this.prisma.locationConsent.findUnique({ where: { userId } });
    if (!config.signals.location || !input || !consent?.consented || consent.revokedAt) {
      await this.flag(reviewId, 'location_missing', 'low', 'trust_fast', { reason: !consent?.consented ? 'no_consent' : 'unavailable' });
      await this.mergeFactors(reviewId, { location: { status: 'unavailable' } });
      this.log.warn(JSON.stringify({ event: 'location_check_failed', reviewId, reason: !consent?.consented ? 'no_consent' : 'invalid_or_missing' }));
      return;
    }
    const review = await this.prisma.review.findUnique({ where: { id: reviewId }, select: { listingId: true, attributes: true } });
    if (!review) return;
    const venueId = String((review.attributes as any)?.venueId || review.listingId);
    const venue = await this.prisma.listing.findUnique({
      where: { id: venueId },
      select: { id: true, type: true, lat: true, lng: true, hours: true },
    });
    if (!venue || venue.type !== 'RESTAURANT' || venue.lat == null || venue.lng == null) {
      await this.flag(reviewId, 'location_missing', 'low', 'trust_fast', { reason: 'venue_coordinates_unavailable' });
      await this.mergeFactors(reviewId, { location: { status: 'unavailable' } });
      return;
    }
    const ageSeconds = Math.max(0, (Date.now() - input.capturedAt.getTime()) / 1000);
    const accurate = input.accuracy <= config.location.maximumAcceptableAccuracyMeters;
    const fresh = ageSeconds <= config.location.maximumLocationAgeSeconds;
    const distance = haversineMeters(input.lat, input.lng, venue.lat, venue.lng);
    let status: LocationStatus = 'unavailable';
    if (accurate && fresh && distance <= config.location.confirmedRadiusMeters) status = 'confirmed';
    else if (accurate && fresh && distance <= config.location.probableRadiusMeters) status = 'probable';
    else if (accurate && fresh) status = 'not_confirmed';
    if (!accurate) await this.flag(reviewId, 'low_location_accuracy', 'low', 'trust_fast', { accuracyBucket: this.accuracyBucket(input.accuracy, config) });
    if (status === 'not_confirmed') await this.flag(reviewId, 'location_too_far', 'medium', 'trust_fast', { distanceBucket: this.distanceBucket(distance, config) });
    let venueOpen: boolean | null = null;
    if (config.signals.openingHours && venue.hours) {
      try { venueOpen = new (OpeningHours as any)(venue.hours).getState(input.capturedAt); } catch { venueOpen = null; }
    }
    const expiresAt = new Date(Date.now() + config.location.rawLocationRetentionHours * 60 * 60 * 1000);
    await this.prisma.$transaction([
      this.prisma.reviewRawLocation.upsert({
        where: { reviewId },
        create: { reviewId, lat: input.lat, lng: input.lng, accuracyMeters: input.accuracy, capturedAt: input.capturedAt, expiresAt },
        update: { lat: input.lat, lng: input.lng, accuracyMeters: input.accuracy, capturedAt: input.capturedAt, expiresAt },
      }),
      this.prisma.reviewTrust.update({
        where: { reviewId },
        data: {
          distanceToVenueMeters: distance,
          locationStatus: status,
          locationAccuracyBucket: this.accuracyBucket(input.accuracy, config),
          locationCheckedAt: new Date(),
          locationSignalUsed: status === 'confirmed' || status === 'probable' || status === 'not_confirmed',
        },
      }),
    ]);
    await this.mergeFactors(reviewId, { location: { status, ageSeconds: Math.round(ageSeconds), accurate, venueOpen } });
    await this.detectImpossibleTravel(reviewId, userId, venue.id, input.capturedAt, config);
    this.log.log(JSON.stringify({ event: 'location_check_completed', reviewId, status, accuracyBucket: this.accuracyBucket(input.accuracy, config), distanceBucket: this.distanceBucket(distance, config) }));
  }

  private async applyBehaviourFlags(reviewId: string, userId: string, config: TrustConfigShape) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId }, select: { rating: true, text: true, updatedAt: true } });
    if (!review) return;
    if (config.signals.velocity) {
      const since = new Date(Date.now() - config.velocity.periodSeconds * 1000);
      const count = await this.prisma.review.count({ where: { userId, updatedAt: { gte: since }, id: { not: reviewId } } });
      if (count >= config.velocity.maximumReviews) await this.flag(reviewId, 'excessive_review_velocity', 'high', 'trust_fast', { periodSeconds: config.velocity.periodSeconds, count: count + 1 });
    }
    const recent = await this.prisma.review.findMany({
      where: { userId, id: { not: reviewId } },
      select: { rating: true, text: true },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(config.patterns.ratingLookbackReviews, config.text.lookbackReviews),
    });
    if (config.signals.repeatedRatings) {
      const same = recent.slice(0, config.patterns.ratingLookbackReviews).filter((row) => row.rating === review.rating).length + 1;
      if (same >= config.patterns.identicalRatingsCount) await this.flag(reviewId, 'repeated_identical_ratings', 'medium', 'trust_fast', { sameRatings: same });
    }
    if (config.signals.similarText && review.text?.trim()) {
      const similarity = Math.max(0, ...recent.map((row) => row.text ? jaccardText(review.text!, row.text) : 0));
      if (similarity >= config.text.similarityThreshold) await this.flag(reviewId, 'similar_review_text', 'medium', 'trust_fast', { similarity: Number(similarity.toFixed(3)) });
    }
  }

  private async detectImpossibleTravel(reviewId: string, userId: string, venueId: string, capturedAt: Date, config: TrustConfigShape) {
    if (!config.signals.impossibleTravel) return;
    const previous = await this.prisma.review.findFirst({
      where: {
        userId,
        id: { not: reviewId },
        trust: { is: { locationStatus: { in: ['confirmed', 'probable'] }, locationCheckedAt: { not: null } } },
      },
      select: { attributes: true, listingId: true, trust: { select: { locationCheckedAt: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!previous?.trust?.locationCheckedAt) return;
    const previousVenueId = String((previous.attributes as any)?.venueId || previous.listingId);
    if (previousVenueId === venueId) return;
    const venues = await this.prisma.listing.findMany({ where: { id: { in: [previousVenueId, venueId] } }, select: { id: true, lat: true, lng: true } });
    const a = venues.find((row) => row.id === previousVenueId);
    const b = venues.find((row) => row.id === venueId);
    if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return;
    const distanceKm = haversineMeters(a.lat, a.lng, b.lat, b.lng) / 1000;
    const hours = Math.abs(capturedAt.getTime() - previous.trust.locationCheckedAt.getTime()) / 3_600_000;
    const speedKmh = hours > 0 ? distanceKm / hours : Number.POSITIVE_INFINITY;
    if (distanceKm >= config.travel.minimumDistanceKm && speedKmh > config.travel.maximumSpeedKmh) {
      await this.flag(reviewId, 'impossible_travel', 'critical', 'trust_fast', { distanceKm: Math.round(distanceKm), speedKmh: Math.round(speedKmh) });
    }
  }

  private async processExactPhoto(reviewId: string, userId: string, url: string) {
    try {
      const buffer = await this.photoBuffer(url);
      await sharp(buffer).metadata();
      const exactHash = createHash('sha256').update(buffer).digest('hex');
      const duplicates = await this.prisma.reviewPhotoFingerprint.findMany({
        where: { exactHash, reviewId: { not: reviewId } },
        select: { userId: true, reviewId: true },
        take: 20,
      });
      await this.prisma.reviewPhotoFingerprint.upsert({
        where: { reviewId_photoUrl: { reviewId, photoUrl: url } },
        create: { reviewId, userId, photoUrl: url, exactHash },
        update: { userId, exactHash },
      });
      const sameUser = duplicates.some((row) => row.userId === userId);
      const otherUser = duplicates.some((row) => row.userId !== userId);
      if (sameUser) await this.flag(reviewId, 'duplicate_photo', 'high', 'trust_photo', { matchCount: duplicates.length });
      if (otherUser) await this.flag(reviewId, 'reused_photo_across_accounts', 'critical', 'trust_photo', { accountCount: new Set(duplicates.map((row) => row.userId)).size });
      await this.mergeFactors(reviewId, { photo: { unique: duplicates.length === 0 } });
      await this.calculate(reviewId);
    } catch (error: any) {
      await this.flag(reviewId, 'ai_content_mismatch', 'medium', 'trust_photo', { reason: 'invalid_image' });
      this.log.warn(JSON.stringify({ event: 'fraud_flag_created', reviewId, type: 'ai_content_mismatch', reason: 'invalid_image', error: error?.message }));
      await this.calculate(reviewId);
    }
  }

  private async processHeavyPhoto(reviewId: string, url: string) {
    try {
      const [{ config }, buffer, review] = await Promise.all([
        this.configs.get(),
        this.photoBuffer(url),
        this.prisma.review.findUnique({ where: { id: reviewId }, select: { listing: { select: { name: true, category: true } } } }),
      ]);
      const [pixels, embedding] = await Promise.all([
        sharp(buffer).rotate().resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer(),
        config.signals.clipSimilarity || config.signals.aiContent ? this.clip.embedImage(buffer) : Promise.resolve([]),
      ]);
      let bits = '';
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) bits += pixels[row * 9 + col] > pixels[row * 9 + col + 1] ? '1' : '0';
      }
      const perceptualHash = BigInt(`0b${bits}`).toString(16).padStart(16, '0');
      const current = await this.prisma.reviewPhotoFingerprint.findUnique({ where: { reviewId_photoUrl: { reviewId, photoUrl: url } } });
      if (!current) return;
      const candidates = await this.prisma.reviewPhotoFingerprint.findMany({
        where: { reviewId: { not: reviewId }, perceptualHash: { not: null } },
        take: config.photos.maximumComparisonRecords,
        orderBy: { createdAt: 'desc' },
      });
      let similar = candidates.some((candidate) => hammingHex(perceptualHash, candidate.perceptualHash!) <= config.photos.perceptualHashDistance);
      if (!similar && config.signals.clipSimilarity && embedding.length) {
        similar = candidates.some((candidate) => candidate.clipEmbedding.length === embedding.length && this.cosine(embedding, candidate.clipEmbedding) >= config.photos.clipSimilarityThreshold);
      }
      if (similar) await this.flag(reviewId, 'similar_photo', 'high', 'trust_photo', { method: 'perceptual_or_clip' });
      let aiContentMatch: boolean | undefined;
      let aiConfidence: number | undefined;
      if (config.signals.aiContent && embedding.length && review?.listing) {
        const labels = [
          `a real photo of ${review.listing.name}, food or a non-alcoholic drink`,
          'an unrelated object, screenshot, document, person or scenery',
        ];
        const probabilities = await this.clip.classifyVec(embedding, labels);
        if (probabilities) {
          aiConfidence = probabilities[0];
          aiContentMatch = aiConfidence >= config.photos.aiContentMatchThreshold;
          if (!aiContentMatch) await this.flag(reviewId, 'ai_content_mismatch', 'medium', 'trust_photo', { confidence: Number(aiConfidence.toFixed(3)) });
        }
      }
      await this.prisma.reviewPhotoFingerprint.update({
        where: { reviewId_photoUrl: { reviewId, photoUrl: url } },
        data: { perceptualHash, clipEmbedding: embedding },
      });
      await this.mergeFactors(reviewId, { photo: { aiContentMatch, aiConfidence } });
      await this.calculate(reviewId);
      const owner = await this.prisma.review.findUnique({ where: { id: reviewId }, select: { userId: true } });
      if (owner) await this.updateUserTrust(owner.userId);
    } catch (error: any) {
      this.log.warn(`heavy photo trust check failed review=${reviewId}: ${error?.message ?? error}`);
    }
  }

  async calculate(reviewId: string, force = false, recalculateCard = true) {
    const [{ config, formulaVersion }, trust, flags] = await Promise.all([
      this.configs.get(),
      this.prisma.reviewTrust.findUnique({ where: { reviewId } }),
      this.prisma.fraudFlag.findMany({ where: { reviewId, reviewStatus: 'open' } }),
    ]);
    if (!trust) return null;
    const factors = (trust.trustFactors ?? {}) as TrustFactors;
    if (factors.legacy && !force) return trust;
    const result = calculateTrust(
      {
        locationStatus: factors.location?.status,
        venueOpen: factors.location?.venueOpen,
        photoSource: factors.photo?.source,
        photoUnique: factors.photo?.unique,
        aiContentMatch: factors.photo?.aiContentMatch,
        accountHistoryScore: factors.accountHistoryScore,
        flags,
        manualOverride: factors.manualOverride,
        currentStatus: trust.verificationStatus,
        manualWeight: trust.manualWeight,
      },
      config,
    );
    const { score, status, ratingWeight } = result;
    const oldScore = trust.trustScore;
    const oldWeight = trust.ratingWeight;
    const updated = await this.prisma.reviewTrust.update({
      where: { reviewId },
      data: { trustScore: score, ratingWeight, verificationStatus: status, trustScoreVersion: formulaVersion, lastCalculatedAt: new Date() },
    });
    await this.prisma.review.update({ where: { id: reviewId }, data: { verificationBadge: this.publicBadge(status) } });
    if (oldScore !== score) this.log.log(JSON.stringify({ event: 'trust_score_changed', reviewId, oldScore, score, formulaVersion }));
    this.log.log(JSON.stringify({ event: 'trust_score_calculated', reviewId, score, status, formulaVersion }));
    if (oldWeight !== ratingWeight) this.log.log(JSON.stringify({ event: 'rating_weight_changed', reviewId, oldWeight, ratingWeight }));
    const review = await this.prisma.review.findUnique({ where: { id: reviewId }, select: { listingId: true } });
    if (review && recalculateCard) await this.ratings.recalculateForListing(review.listingId);
    return updated;
  }

  async updateUserTrust(userId: string) {
    const { config, formulaVersion } = await this.configs.get();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      select: { attributes: true, listingId: true, trust: true, fraudFlags: { where: { reviewStatus: 'open' }, select: { type: true } } },
    });
    const total = reviews.length || 1;
    const confirmed = reviews.filter((row) => row.trust?.locationStatus === 'confirmed').length;
    const unique = reviews.filter((row) => (row.trust?.trustFactors as TrustFactors | null)?.photo?.unique).length;
    const excluded = reviews.filter((row) => row.trust?.verificationStatus === 'excluded_from_rating').length;
    const duplicate = reviews.filter((row) => row.fraudFlags.some((flag) => ['duplicate_photo', 'reused_photo_across_accounts'].includes(flag.type))).length;
    const impossible = reviews.filter((row) => row.fraudFlags.some((flag) => flag.type === 'impossible_travel')).length;
    const moderated = reviews.filter((row) => row.trust?.verificationStatus === 'under_review').length;
    const venues = new Set(reviews.map((row) => String((row.attributes as any)?.venueId || row.listingId))).size;
    const ageDays = user ? (Date.now() - user.createdAt.getTime()) / 86_400_000 : 0;
    const positive =
      (confirmed / total) * config.userTrust.confirmedLocationMax +
      (unique / total) * config.userTrust.uniquePhotoMax +
      Math.min(1, venues / total) * config.userTrust.venueDiversityMax +
      Math.min(1, ageDays / 365) * config.userTrust.accountAgeMax;
    const negative =
      (duplicate / total) * config.userTrust.duplicatePenaltyMax +
      (excluded / total) * config.userTrust.excludedPenaltyMax +
      (impossible / total) * config.userTrust.impossibleTravelPenaltyMax +
      (moderated / total) * config.userTrust.moderationPenaltyMax;
    const trustScore = Math.max(0, Math.min(100, Math.round(config.userTrust.baseScore + positive - negative)));
    const factors = { total: reviews.length, confirmed, unique, excluded, duplicate, impossible, moderated, venueDiversity: venues, accountAgeDays: Math.round(ageDays) };
    await this.prisma.userTrustProfile.upsert({
      where: { userId },
      create: { userId, trustScore, factors, formulaVersion, calculatedAt: new Date() },
      update: { trustScore, factors, formulaVersion, calculatedAt: new Date() },
    });
    const historyBonus = (trustScore / 100) * config.scores.accountHistoryMax;
    const candidates = await this.prisma.reviewTrust.findMany({ where: { review: { userId } }, select: { reviewId: true, trustFactors: true } });
    for (const row of candidates) {
      const prior = (row.trustFactors ?? {}) as TrustFactors;
      await this.prisma.reviewTrust.update({ where: { reviewId: row.reviewId }, data: { trustFactors: { ...prior, accountHistoryScore: historyBonus } as Prisma.InputJsonValue } });
    }
    return { trustScore, factors };
  }

  private async mergeFactors(reviewId: string, patch: TrustFactors) {
    const trust = await this.prisma.reviewTrust.findUnique({ where: { reviewId }, select: { trustFactors: true } });
    const current = (trust?.trustFactors ?? {}) as TrustFactors;
    const next: TrustFactors = {
      ...current,
      ...patch,
      location: patch.location ? { ...(current.location ?? { status: 'unavailable' }), ...patch.location } : current.location,
      photo: patch.photo ? { ...(current.photo ?? { source: 'unknown' }), ...patch.photo } : current.photo,
    };
    await this.prisma.reviewTrust.update({ where: { reviewId }, data: { trustFactors: next as Prisma.InputJsonValue } });
  }

  private async flag(reviewId: string, type: FraudFlagType, severity: string, source: string, details: Record<string, unknown>) {
    const existing = await this.prisma.fraudFlag.findFirst({ where: { reviewId, type, source, reviewStatus: 'open' } });
    if (existing) return existing;
    const flag = await this.prisma.fraudFlag.create({ data: { reviewId, type, severity, source, details: details as Prisma.InputJsonValue } });
    this.log.warn(JSON.stringify({ event: 'fraud_flag_created', reviewId, type, severity, source }));
    return flag;
  }

  private async photoBuffer(url: string) {
    const key = url.match(/^\/api\/files\/([a-zA-Z0-9._-]+)$/)?.[1];
    if (!key) throw new BadRequestException('Untrusted photo URL');
    const object = await this.uploads.get(key);
    const chunks: Buffer[] = [];
    for await (const chunk of object.body) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  private cosine(a: number[], b: number[]) {
    let dot = 0;
    let aa = 0;
    let bb = 0;
    for (let index = 0; index < a.length; index += 1) { dot += a[index] * b[index]; aa += a[index] ** 2; bb += b[index] ** 2; }
    return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
  }

  private accuracyBucket(accuracy: number, config: TrustConfigShape) {
    const maximum = config.location.maximumAcceptableAccuracyMeters;
    if (accuracy <= maximum / 6) return 'excellent';
    if (accuracy <= maximum / 2) return 'good';
    if (accuracy <= maximum) return 'acceptable';
    if (accuracy <= maximum * 3) return 'low';
    return 'very_low';
  }

  private distanceBucket(distance: number, config: TrustConfigShape) {
    if (distance <= config.location.confirmedRadiusMeters) return 'near';
    if (distance <= config.location.probableRadiusMeters) return 'walking_distance';
    if (distance <= config.location.probableRadiusMeters * 4) return 'far';
    return 'very_far';
  }

  async purgeExpiredRawLocations() {
    return this.prisma.reviewRawLocation.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  }

  async startMassRecalculation(adminId: string) {
    const { formulaVersion } = await this.configs.get();
    const total = await this.prisma.review.count();
    const job = await this.prisma.trustRecalculationJob.create({ data: { formulaVersion, requestedById: adminId, total } });
    setImmediate(() => void this.runJob(job.id));
    return job;
  }

  private async resumePendingJobs() {
    await this.prisma.trustRecalculationJob.updateMany({ where: { status: 'running' }, data: { status: 'pending' } });
    const jobs = await this.prisma.trustRecalculationJob.findMany({ where: { status: { in: ['pending', 'running'] } }, orderBy: { createdAt: 'asc' } });
    for (const job of jobs) setImmediate(() => void this.runJob(job.id));
  }

  private async runJob(jobId: string) {
    const claimed = await this.prisma.trustRecalculationJob.updateMany({ where: { id: jobId, status: 'pending' }, data: { status: 'running', startedAt: new Date() } });
    if (!claimed.count) return;
    let cursor: string | undefined;
    let processed = 0;
    let failed = 0;
    const usersUpdated = new Set<string>();
    const listingIds = new Set<string>();
    while (true) {
      const batch = await this.prisma.review.findMany({ select: { id: true, userId: true, listingId: true }, orderBy: { id: 'asc' }, take: 100, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
      if (!batch.length) break;
      for (const review of batch) {
        try {
          if (!usersUpdated.has(review.userId)) {
            await this.updateUserTrust(review.userId);
            usersUpdated.add(review.userId);
          }
          await this.calculate(review.id, true, false);
          listingIds.add(review.listingId);
          processed += 1;
        } catch { failed += 1; }
      }
      cursor = batch[batch.length - 1].id;
      await this.prisma.trustRecalculationJob.update({ where: { id: jobId }, data: { processed, failed } });
      await new Promise((resolve) => setImmediate(resolve));
    }
    for (const listingId of listingIds) await this.ratings.recalculateForListing(listingId).catch(() => { failed += 1; });
    await this.prisma.trustRecalculationJob.update({ where: { id: jobId }, data: { status: failed ? 'completed_with_errors' : 'completed', processed, failed, finishedAt: new Date() } });
  }
}
