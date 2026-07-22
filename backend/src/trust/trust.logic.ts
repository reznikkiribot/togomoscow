import type { FraudFlagType, LocationStatus, PhotoSource, TrustConfigShape, VerificationStatus } from './trust.types';

export interface TrustCalculationInput {
  locationStatus?: LocationStatus;
  venueOpen?: boolean | null;
  photoSource?: PhotoSource;
  photoUnique?: boolean;
  aiContentMatch?: boolean;
  accountHistoryScore?: number;
  flags: { type: string; severity: string }[];
  manualOverride?: boolean;
  currentStatus?: string;
  manualWeight?: number | null;
}

export function weightForScore(score: number, config: TrustConfigShape) {
  return config.ratingWeights.find((band) => score >= band.min && score <= band.max)?.weight ?? 0;
}

export function calculateTrust(input: TrustCalculationInput, config: TrustConfigShape) {
  let score = config.baseScore;
  if (config.signals.location) {
    if (input.locationStatus === 'confirmed') score += config.scores.locationConfirmed;
    if (input.locationStatus === 'probable') score += config.scores.locationProbable;
    if (input.venueOpen === false) score += config.scores.outsideHours;
  }
  if (config.signals.photoSource) {
    if (input.photoSource === 'camera') score += config.scores.cameraPhoto;
    if (input.photoSource === 'gallery') score += config.scores.galleryPhoto;
  }
  if (input.photoUnique) score += config.scores.uniquePhoto;
  if (input.aiContentMatch) score += config.scores.aiContentMatch;
  if (config.signals.userHistory) score += Math.min(config.scores.accountHistoryMax, Math.max(0, input.accountHistoryScore ?? 0));
  const penalty: Partial<Record<FraudFlagType, number>> = {
    location_too_far: config.scores.locationTooFar,
    duplicate_photo: config.scores.duplicatePhoto,
    similar_photo: config.scores.similarPhoto,
    reused_photo_across_accounts: config.scores.reusedAcrossAccounts,
    excessive_review_velocity: config.scores.excessiveVelocity,
    impossible_travel: config.scores.impossibleTravel,
    linked_accounts: config.scores.linkedAccounts,
    repeated_identical_ratings: config.scores.repeatedRatings,
    similar_review_text: config.scores.similarText,
    manual_violation: config.scores.manualViolationMax,
    ai_content_mismatch: config.scores.aiContentMismatch,
  };
  for (const flag of input.flags) score += penalty[flag.type as FraudFlagType] ?? 0;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const severeCount = input.flags.filter((flag) => flag.severity === 'critical' || flag.severity === 'high').length;
  let status: VerificationStatus = 'unverified';
  if (input.manualOverride && input.currentStatus === 'excluded_from_rating') status = 'excluded_from_rating';
  else if (score < config.status.exclusionScore) status = 'excluded_from_rating';
  else if (score < config.status.moderationScore || severeCount >= config.status.severeFlagCount) status = 'under_review';
  else if (score >= config.status.trustedScore) status = 'trusted';
  else if (input.locationStatus === 'confirmed') status = 'location_confirmed';
  else if (input.locationStatus === 'probable') status = 'location_probable';
  const automaticWeight = status === 'excluded_from_rating' ? 0 : weightForScore(score, config);
  return { score, status, ratingWeight: input.manualWeight ?? automaticWeight };
}

export function weightedRating(rows: { rating: number; weight: number }[]) {
  const weightSum = rows.reduce((sum, row) => sum + row.weight, 0);
  const ratingSum = rows.reduce((sum, row) => sum + row.rating * row.weight, 0);
  return { avgRating: weightSum > 0 ? ratingSum / weightSum : 0, weightSum };
}

export function latestPerUser<T extends { userId: string }>(rowsNewestFirst: T[]) {
  const latest = new Map<string, T>();
  for (const row of rowsNewestFirst) if (!latest.has(row.userId)) latest.set(row.userId, row);
  return [...latest.values()];
}
