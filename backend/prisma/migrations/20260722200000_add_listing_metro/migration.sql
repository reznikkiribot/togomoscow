-- Idempotent: the columns may already exist from an earlier `db push` on prod.
-- Without IF NOT EXISTS, `migrate deploy` aborts on "column already exists" and
-- the whole deploy fails at preDeploy (this blocked the goals/bootstrap release).
ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "metro" TEXT,
ADD COLUMN IF NOT EXISTS "metro_distance" INTEGER;
