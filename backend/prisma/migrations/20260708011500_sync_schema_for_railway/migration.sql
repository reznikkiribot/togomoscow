DO $$ BEGIN
  CREATE TYPE "VoteType" AS ENUM ('USEFUL', 'FUNNY', 'COOL', 'OHNO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MenuItemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "onboarded_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "preferences" JSONB;

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "aliases" TEXT,
  ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
  ADD COLUMN IF NOT EXISTS "embedding_model" TEXT,
  ADD COLUMN IF NOT EXISTS "image_embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
  ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT,
  ADD COLUMN IF NOT EXISTS "external_id" TEXT,
  ADD COLUMN IF NOT EXISTS "brand" TEXT,
  ADD COLUMN IF NOT EXISTS "hours" TEXT,
  ADD COLUMN IF NOT EXISTS "cuisine" TEXT,
  ADD COLUMN IF NOT EXISTS "group_key" TEXT,
  ADD COLUMN IF NOT EXISTS "amenities" JSONB,
  ADD COLUMN IF NOT EXISTS "delivery_yandex" TEXT,
  ADD COLUMN IF NOT EXISTS "delivery_samokat" TEXT,
  ADD COLUMN IF NOT EXISTS "delivery_vk" TEXT,
  ADD COLUMN IF NOT EXISTS "owner_id" TEXT,
  ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "owner_reply" TEXT,
  ADD COLUMN IF NOT EXISTS "video_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "reviews" ALTER COLUMN "photo_urls" SET DEFAULT ARRAY[]::TEXT[];
UPDATE "reviews" SET "photo_urls" = ARRAY[]::TEXT[] WHERE "photo_urls" IS NULL;
ALTER TABLE "reviews" ALTER COLUMN "photo_urls" SET NOT NULL;

ALTER TABLE "menu_links"
  ADD COLUMN IF NOT EXISTS "status" "MenuItemStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS "price" INTEGER,
  ADD COLUMN IF NOT EXISTS "added_by_user_id" TEXT;

CREATE TABLE IF NOT EXISTS "comments" (
  "id" TEXT NOT NULL,
  "review_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "dislikes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "category" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dislikes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "comparisons" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "category" TEXT,
  "winner_id" TEXT NOT NULL,
  "loser_id" TEXT NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "review_votes" (
  "review_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "VoteType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_votes_pkey" PRIMARY KEY ("review_id","user_id","type")
);

CREATE TABLE IF NOT EXISTS "ownership_claims" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ownership_claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "business_submissions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "relationship" TEXT NOT NULL DEFAULT 'customer',
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "phone" TEXT,
  "website" TEXT,
  "notes" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Россия',
  "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "business_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "corrections" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "corrections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "challenges" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT,
  "target" INTEGER NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_messages" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "checkins" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "photo_url" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "answers" (
  "id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_sources" (
  "id" TEXT NOT NULL,
  "venue_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "handle" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "last_fetched" TIMESTAMP(3),
  "last_post_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "venue_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_events" (
  "id" TEXT NOT NULL,
  "venue_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT,
  "text" TEXT,
  "price" INTEGER,
  "photo_url" TEXT,
  "ai_processed" BOOLEAN NOT NULL DEFAULT false,
  "url" TEXT,
  "source" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "published_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "venue_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "interactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recognition_feedback" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "photo_url" TEXT,
  "caption" TEXT,
  "mode" TEXT NOT NULL DEFAULT 'dish',
  "predicted_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "top_confidence" DOUBLE PRECISION,
  "chosen_id" TEXT,
  "was_top" BOOLEAN,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recognition_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "listings_source_external_id_key" ON "listings"("source", "external_id");
CREATE INDEX IF NOT EXISTS "listings_group_key_idx" ON "listings"("group_key");
CREATE UNIQUE INDEX IF NOT EXISTS "dislikes_user_id_item_id_key" ON "dislikes"("user_id", "item_id");
CREATE INDEX IF NOT EXISTS "comments_review_id_idx" ON "comments"("review_id");
CREATE UNIQUE INDEX IF NOT EXISTS "ownership_claims_listing_id_user_id_key" ON "ownership_claims"("listing_id", "user_id");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "checkins_listing_id_idx" ON "checkins"("listing_id");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_sources_venue_id_type_key" ON "venue_sources"("venue_id", "type");
CREATE INDEX IF NOT EXISTS "venue_sources_type_status_idx" ON "venue_sources"("type", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_events_venue_id_external_id_key" ON "venue_events"("venue_id", "external_id");
CREATE INDEX IF NOT EXISTS "venue_events_venue_id_published_at_idx" ON "venue_events"("venue_id", "published_at");
CREATE INDEX IF NOT EXISTS "venue_events_published_at_idx" ON "venue_events"("published_at");
CREATE INDEX IF NOT EXISTS "interactions_user_id_created_at_idx" ON "interactions"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "interactions_listing_id_idx" ON "interactions"("listing_id");
CREATE INDEX IF NOT EXISTS "interactions_type_idx" ON "interactions"("type");
CREATE INDEX IF NOT EXISTS "recognition_feedback_user_id_created_at_idx" ON "recognition_feedback"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "recognition_feedback_chosen_id_idx" ON "recognition_feedback"("chosen_id");

DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "menu_links" ADD CONSTRAINT "menu_links_added_by_user_id_fkey" FOREIGN KEY ("added_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "dislikes" ADD CONSTRAINT "dislikes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ownership_claims" ADD CONSTRAINT "ownership_claims_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ownership_claims" ADD CONSTRAINT "ownership_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "business_submissions" ADD CONSTRAINT "business_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "corrections" ADD CONSTRAINT "corrections_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "corrections" ADD CONSTRAINT "corrections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "checkins" ADD CONSTRAINT "checkins_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "questions" ADD CONSTRAINT "questions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "venue_sources" ADD CONSTRAINT "venue_sources_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "venue_events" ADD CONSTRAINT "venue_events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "interactions" ADD CONSTRAINT "interactions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "recognition_feedback" ADD CONSTRAINT "recognition_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
