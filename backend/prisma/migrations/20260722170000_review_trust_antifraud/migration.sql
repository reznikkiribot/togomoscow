-- Review trust and anti-fraud foundation.
-- Existing reviews are backfilled as legacy/weight=1 to preserve every current rating.

ALTER TABLE "listings"
ADD COLUMN "rating_weight_sum" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "reviews"
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "reviews"
ADD COLUMN "verification_badge" TEXT NOT NULL DEFAULT 'Обычная дегустация';

CREATE TABLE "review_trust" (
    "review_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 35,
    "rating_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "trust_factors" JSONB NOT NULL DEFAULT '{}',
    "trust_score_version" TEXT NOT NULL DEFAULT 'trust-v1',
    "photo_source" TEXT NOT NULL DEFAULT 'unknown',
    "distance_to_venue_meters" DOUBLE PRECISION,
    "location_status" TEXT NOT NULL DEFAULT 'unavailable',
    "location_accuracy_bucket" TEXT,
    "location_checked_at" TIMESTAMP(3),
    "location_signal_used" BOOLEAN NOT NULL DEFAULT false,
    "manual_weight" DOUBLE PRECISION,
    "hidden_at" TIMESTAMP(3),
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_trust_pkey" PRIMARY KEY ("review_id")
);

CREATE TABLE "fraud_flags" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "review_status" TEXT NOT NULL DEFAULT 'open',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_photo_fingerprints" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "exact_hash" TEXT NOT NULL,
    "perceptual_hash" TEXT,
    "clip_embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_photo_fingerprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "uploaded_assets" (
    "key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "content_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uploaded_assets_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "review_raw_locations" (
    "review_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy_meters" DOUBLE PRECISION NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_raw_locations_pkey" PRIMARY KEY ("review_id")
);

CREATE TABLE "location_consents" (
    "user_id" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "text_version" TEXT NOT NULL,
    "system_permission" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "location_consents_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "user_trust_profiles" (
    "user_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 50,
    "factors" JSONB NOT NULL DEFAULT '{}',
    "formula_version" TEXT NOT NULL DEFAULT 'trust-v1',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_trust_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "review_revisions" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "text" TEXT,
    "attributes" JSONB,
    "photo_urls" TEXT[],
    "video_urls" TEXT[],
    "replaced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_config" (
    "id" TEXT NOT NULL DEFAULT 'active',
    "formula_version" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_config_audit" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "previous_config" JSONB NOT NULL,
    "next_config" JSONB NOT NULL,
    "formula_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_config_audit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_moderation_actions" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_state" JSONB NOT NULL,
    "next_state" JSONB NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_moderation_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trust_recalculation_jobs" (
    "id" TEXT NOT NULL,
    "formula_version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "requested_by_id" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_recalculation_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_trust_verification_status_idx" ON "review_trust"("verification_status");
CREATE INDEX "review_trust_trust_score_idx" ON "review_trust"("trust_score");
CREATE INDEX "review_trust_rating_weight_idx" ON "review_trust"("rating_weight");
CREATE INDEX "fraud_flags_review_id_review_status_idx" ON "fraud_flags"("review_id", "review_status");
CREATE INDEX "fraud_flags_type_detected_at_idx" ON "fraud_flags"("type", "detected_at");
CREATE UNIQUE INDEX "review_photo_fingerprints_review_id_photo_url_key" ON "review_photo_fingerprints"("review_id", "photo_url");
CREATE INDEX "review_photo_fingerprints_exact_hash_idx" ON "review_photo_fingerprints"("exact_hash");
CREATE INDEX "review_photo_fingerprints_user_id_idx" ON "review_photo_fingerprints"("user_id");
CREATE INDEX "uploaded_assets_user_id_created_at_idx" ON "uploaded_assets"("user_id", "created_at");
CREATE INDEX "review_raw_locations_expires_at_idx" ON "review_raw_locations"("expires_at");
CREATE INDEX "review_revisions_review_id_replaced_at_idx" ON "review_revisions"("review_id", "replaced_at");
CREATE INDEX "trust_config_audit_created_at_idx" ON "trust_config_audit"("created_at");
CREATE INDEX "trust_moderation_actions_review_id_created_at_idx" ON "trust_moderation_actions"("review_id", "created_at");
CREATE INDEX "trust_recalculation_jobs_status_created_at_idx" ON "trust_recalculation_jobs"("status", "created_at");

ALTER TABLE "review_trust" ADD CONSTRAINT "review_trust_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fraud_flags" ADD CONSTRAINT "fraud_flags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_photo_fingerprints" ADD CONSTRAINT "review_photo_fingerprints_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "uploaded_assets" ADD CONSTRAINT "uploaded_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_raw_locations" ADD CONSTRAINT "review_raw_locations_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_consents" ADD CONSTRAINT "location_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_trust_profiles" ADD CONSTRAINT "user_trust_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trust_config_audit" ADD CONSTRAINT "trust_config_audit_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trust_moderation_actions" ADD CONSTRAINT "trust_moderation_actions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trust_moderation_actions" ADD CONSTRAINT "trust_moderation_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "trust_config" ("id", "formula_version", "config", "updated_at") VALUES (
  'active',
  'trust-v1',
  '{
    "baseScore":35,
    "scores":{"locationConfirmed":25,"locationProbable":10,"cameraPhoto":15,"galleryPhoto":3,"uniquePhoto":10,"aiContentMatch":5,"accountHistoryMax":10,"locationTooFar":-15,"duplicatePhoto":-40,"similarPhoto":-20,"reusedAcrossAccounts":-30,"excessiveVelocity":-20,"impossibleTravel":-40,"linkedAccounts":-25,"repeatedRatings":-10,"similarText":-10,"manualViolationMax":-30,"aiContentMismatch":-5,"outsideHours":0},
    "location":{"confirmedRadiusMeters":150,"probableRadiusMeters":500,"maximumLocationAgeSeconds":300,"maximumAcceptableAccuracyMeters":150,"rawLocationRetentionHours":1},
    "ratingWeights":[{"min":0,"max":19,"weight":0},{"min":20,"max":39,"weight":0.25},{"min":40,"max":59,"weight":0.5},{"min":60,"max":79,"weight":0.75},{"min":80,"max":100,"weight":1}],
    "status":{"trustedScore":80,"moderationScore":40,"exclusionScore":20,"severeFlagCount":1},
    "velocity":{"periodSeconds":3600,"maximumReviews":6},
    "travel":{"maximumSpeedKmh":350,"minimumDistanceKm":10},
    "photos":{"perceptualHashDistance":8,"clipSimilarityThreshold":0.92,"aiContentMatchThreshold":0.55,"maximumComparisonRecords":5000},
    "text":{"similarityThreshold":0.9,"lookbackReviews":20},
    "patterns":{"identicalRatingsCount":5,"ratingLookbackReviews":8},
    "userTrust":{"baseScore":50,"confirmedLocationMax":15,"uniquePhotoMax":15,"venueDiversityMax":10,"accountAgeMax":10,"duplicatePenaltyMax":20,"excludedPenaltyMax":25,"impossibleTravelPenaltyMax":25,"moderationPenaltyMax":20},
    "signals":{"location":true,"photoSource":true,"exactDuplicate":true,"similarPhoto":true,"clipSimilarity":true,"aiContent":true,"velocity":true,"impossibleTravel":true,"repeatedRatings":true,"similarText":true,"userHistory":true,"openingHours":true},
    "consentTextVersion":"geo-trust-v1"
  }'::jsonb,
  CURRENT_TIMESTAMP
);

-- Compatibility-first legacy backfill: no missing-location flag and full weight.
INSERT INTO "review_trust" (
  "review_id", "trust_score", "rating_weight", "verification_status",
  "trust_factors", "trust_score_version", "photo_source", "location_status",
  "location_signal_used", "last_calculated_at", "created_at", "updated_at"
)
SELECT
  r."id", 100, 1, 'legacy',
  '{"legacy":true,"locationGrandfathered":true}'::jsonb, 'legacy-v1',
  CASE WHEN cardinality(r."photo_urls") > 0 THEN 'unknown' ELSE 'none' END,
  'unavailable', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "reviews" r
ON CONFLICT ("review_id") DO NOTHING;

UPDATE "listings" SET "rating_weight_sum" = "review_count"::double precision;
