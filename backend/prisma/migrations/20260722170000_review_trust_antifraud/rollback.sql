-- Manual rollback scenario. Take a backup first. This intentionally leaves
-- reviews/listing ratings intact and removes only trust-system artifacts.
ALTER TABLE "listings" DROP COLUMN IF EXISTS "rating_weight_sum";
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "verification_badge";
DROP TABLE IF EXISTS "trust_recalculation_jobs";
DROP TABLE IF EXISTS "trust_moderation_actions";
DROP TABLE IF EXISTS "trust_config_audit";
DROP TABLE IF EXISTS "trust_config";
DROP TABLE IF EXISTS "review_revisions";
DROP TABLE IF EXISTS "user_trust_profiles";
DROP TABLE IF EXISTS "location_consents";
DROP TABLE IF EXISTS "review_raw_locations";
DROP TABLE IF EXISTS "review_photo_fingerprints";
DROP TABLE IF EXISTS "uploaded_assets";
DROP TABLE IF EXISTS "fraud_flags";
DROP TABLE IF EXISTS "review_trust";
