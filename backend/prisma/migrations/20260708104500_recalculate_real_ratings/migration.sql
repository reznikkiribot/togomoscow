-- Remove seeded/display-only ratings. From now on denormalized listing ratings
-- mirror real approved user reviews only.

UPDATE "listings" AS l
SET
  "avg_rating" = COALESCE(r."avg_rating", 0),
  "review_count" = COALESCE(r."review_count", 0)
FROM (
  SELECT
    "listing_id",
    AVG("rating")::double precision AS "avg_rating",
    COUNT(*)::integer AS "review_count"
  FROM "reviews"
  WHERE "status" = 'APPROVED'
  GROUP BY "listing_id"
) AS r
WHERE l."id" = r."listing_id";

UPDATE "listings" AS l
SET
  "avg_rating" = 0,
  "review_count" = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM "reviews" AS r
  WHERE r."listing_id" = l."id"
    AND r."status" = 'APPROVED'
);
