export type PhotoSource = 'camera' | 'gallery' | 'none' | 'unknown';
export type LocationStatus = 'confirmed' | 'probable' | 'not_confirmed' | 'unavailable';
export type VerificationStatus =
  | 'legacy'
  | 'unverified'
  | 'location_probable'
  | 'location_confirmed'
  | 'trusted'
  | 'under_review'
  | 'excluded_from_rating';

export type FraudFlagType =
  | 'duplicate_photo'
  | 'reused_photo_across_accounts'
  | 'similar_photo'
  | 'location_missing'
  | 'location_too_far'
  | 'low_location_accuracy'
  | 'impossible_travel'
  | 'excessive_review_velocity'
  | 'repeated_identical_ratings'
  | 'similar_review_text'
  | 'linked_accounts'
  | 'suspicious_device'
  | 'manual_violation'
  | 'ai_content_mismatch';

export interface TrustConfigShape {
  baseScore: number;
  scores: {
    locationConfirmed: number;
    locationProbable: number;
    cameraPhoto: number;
    galleryPhoto: number;
    uniquePhoto: number;
    aiContentMatch: number;
    accountHistoryMax: number;
    locationTooFar: number;
    duplicatePhoto: number;
    similarPhoto: number;
    reusedAcrossAccounts: number;
    excessiveVelocity: number;
    impossibleTravel: number;
    linkedAccounts: number;
    repeatedRatings: number;
    similarText: number;
    manualViolationMax: number;
    aiContentMismatch: number;
    outsideHours: number;
  };
  location: {
    confirmedRadiusMeters: number;
    probableRadiusMeters: number;
    maximumLocationAgeSeconds: number;
    maximumAcceptableAccuracyMeters: number;
    rawLocationRetentionHours: number;
  };
  ratingWeights: { min: number; max: number; weight: number }[];
  status: {
    trustedScore: number;
    moderationScore: number;
    exclusionScore: number;
    severeFlagCount: number;
  };
  velocity: { periodSeconds: number; maximumReviews: number };
  travel: { maximumSpeedKmh: number; minimumDistanceKm: number };
  photos: {
    perceptualHashDistance: number;
    clipSimilarityThreshold: number;
    aiContentMatchThreshold: number;
    maximumComparisonRecords: number;
  };
  text: { similarityThreshold: number; lookbackReviews: number };
  patterns: { identicalRatingsCount: number; ratingLookbackReviews: number };
  userTrust: {
    baseScore: number;
    confirmedLocationMax: number;
    uniquePhotoMax: number;
    venueDiversityMax: number;
    accountAgeMax: number;
    duplicatePenaltyMax: number;
    excludedPenaltyMax: number;
    impossibleTravelPenaltyMax: number;
    moderationPenaltyMax: number;
  };
  signals: Record<
    | 'location'
    | 'photoSource'
    | 'exactDuplicate'
    | 'similarPhoto'
    | 'clipSimilarity'
    | 'aiContent'
    | 'velocity'
    | 'impossibleTravel'
    | 'repeatedRatings'
    | 'similarText'
    | 'userHistory'
    | 'openingHours',
    boolean
  >;
  consentTextVersion: string;
}

export interface ReviewLocationInput {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: string | number;
}

export const DEFAULT_TRUST_CONFIG: TrustConfigShape = {
  baseScore: 35,
  scores: {
    locationConfirmed: 25,
    locationProbable: 10,
    cameraPhoto: 15,
    galleryPhoto: 3,
    uniquePhoto: 10,
    aiContentMatch: 5,
    accountHistoryMax: 10,
    locationTooFar: -15,
    duplicatePhoto: -40,
    similarPhoto: -20,
    reusedAcrossAccounts: -30,
    excessiveVelocity: -20,
    impossibleTravel: -40,
    linkedAccounts: -25,
    repeatedRatings: -10,
    similarText: -10,
    manualViolationMax: -30,
    aiContentMismatch: -5,
    outsideHours: 0,
  },
  location: {
    confirmedRadiusMeters: 150,
    probableRadiusMeters: 500,
    maximumLocationAgeSeconds: 300,
    maximumAcceptableAccuracyMeters: 150,
    rawLocationRetentionHours: 1,
  },
  ratingWeights: [
    { min: 0, max: 19, weight: 0 },
    { min: 20, max: 39, weight: 0.25 },
    { min: 40, max: 59, weight: 0.5 },
    { min: 60, max: 79, weight: 0.75 },
    { min: 80, max: 100, weight: 1 },
  ],
  status: { trustedScore: 80, moderationScore: 40, exclusionScore: 20, severeFlagCount: 1 },
  velocity: { periodSeconds: 3600, maximumReviews: 6 },
  travel: { maximumSpeedKmh: 350, minimumDistanceKm: 10 },
  photos: {
    perceptualHashDistance: 8,
    clipSimilarityThreshold: 0.92,
    aiContentMatchThreshold: 0.55,
    maximumComparisonRecords: 5000,
  },
  text: { similarityThreshold: 0.9, lookbackReviews: 20 },
  patterns: { identicalRatingsCount: 5, ratingLookbackReviews: 8 },
  userTrust: {
    baseScore: 50,
    confirmedLocationMax: 15,
    uniquePhotoMax: 15,
    venueDiversityMax: 10,
    accountAgeMax: 10,
    duplicatePenaltyMax: 20,
    excludedPenaltyMax: 25,
    impossibleTravelPenaltyMax: 25,
    moderationPenaltyMax: 20,
  },
  signals: {
    location: true,
    photoSource: true,
    exactDuplicate: true,
    similarPhoto: true,
    clipSimilarity: true,
    aiContent: true,
    velocity: true,
    impossibleTravel: true,
    repeatedRatings: true,
    similarText: true,
    userHistory: true,
    openingHours: true,
  },
  consentTextVersion: 'geo-trust-v1',
};
