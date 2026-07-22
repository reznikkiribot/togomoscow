import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { calculateTrust, latestPerUser, weightedRating } from '../dist/trust/trust.logic.js';
import { DEFAULT_TRUST_CONFIG } from '../dist/trust/trust.types.js';

const score = (patch = {}, config = DEFAULT_TRUST_CONFIG) => calculateTrust({ flags: [], ...patch }, config);

test('near venue + camera + unique matching photo is trusted', () => {
  assert.deepEqual(score({ locationStatus: 'confirmed', photoSource: 'camera', photoUnique: true, aiContentMatch: true }), {
    score: 90,
    status: 'trusted',
    ratingWeight: 1,
  });
});

test('near venue + gallery has lower weight than camera', () => {
  const result = score({ locationStatus: 'confirmed', photoSource: 'gallery', photoUnique: true, aiContentMatch: true });
  assert.equal(result.score, 78);
  assert.equal(result.ratingWeight, 0.75);
  assert.equal(result.status, 'location_confirmed');
});

test('missing or denied location does not block and only misses the bonus', () => {
  assert.deepEqual(score({ locationStatus: 'unavailable', photoSource: 'none' }), {
    score: 35,
    status: 'under_review',
    ratingWeight: 0.25,
  });
});

test('far location applies the configured penalty', () => {
  const result = score({ locationStatus: 'not_confirmed', flags: [{ type: 'location_too_far', severity: 'medium' }] });
  assert.equal(result.score, 20);
  assert.equal(result.ratingWeight, 0.25);
});

test('exact duplicate and cross-account reuse can exclude without deleting', () => {
  const exact = score({ photoSource: 'gallery', flags: [{ type: 'duplicate_photo', severity: 'high' }] });
  const cross = score({ photoSource: 'gallery', flags: [{ type: 'reused_photo_across_accounts', severity: 'critical' }] });
  assert.equal(exact.status, 'excluded_from_rating');
  assert.equal(exact.ratingWeight, 0);
  assert.equal(cross.status, 'excluded_from_rating');
});

test('impossible travel excludes a weak tasting', () => {
  const result = score({ locationStatus: 'probable', flags: [{ type: 'impossible_travel', severity: 'critical' }] });
  assert.equal(result.score, 5);
  assert.equal(result.status, 'excluded_from_rating');
});

test('similar photo, velocity, repeated ratings and similar text reduce trust', () => {
  const result = score({
    locationStatus: 'confirmed',
    photoSource: 'gallery',
    flags: [
      { type: 'similar_photo', severity: 'high' },
      { type: 'excessive_review_velocity', severity: 'high' },
      { type: 'repeated_identical_ratings', severity: 'medium' },
      { type: 'similar_review_text', severity: 'medium' },
    ],
  });
  assert.equal(result.score, 3);
  assert.equal(result.ratingWeight, 0);
  assert.equal(result.status, 'excluded_from_rating');
});

test('weighted card rating uses rating_weight in numerator and denominator', () => {
  const result = weightedRating([{ rating: 5, weight: 1 }, { rating: 1, weight: 0.25 }, { rating: 3, weight: 0 }]);
  assert.equal(result.weightSum, 1.25);
  assert.equal(result.avgRating, 4.2);
});

test('zero-weight tasting is excluded from aggregate', () => {
  assert.deepEqual(weightedRating([{ rating: 5, weight: 0 }]), { avgRating: 0, weightSum: 0 });
});

test('repeat/branch rating keeps only the latest current vote per user', () => {
  const rows = latestPerUser([
    { userId: 'u1', rating: 2 },
    { userId: 'u1', rating: 5 },
    { userId: 'u2', rating: 4 },
  ]);
  assert.deepEqual(rows, [{ userId: 'u1', rating: 2 }, { userId: 'u2', rating: 4 }]);
});

test('administrator formula change takes effect without code changes', () => {
  const config = structuredClone(DEFAULT_TRUST_CONFIG);
  config.baseScore = 50;
  config.scores.cameraPhoto = 20;
  assert.equal(score({ photoSource: 'camera' }, config).score, 70);
});

test('manual lower weight and exclusion override automatic mapping', () => {
  assert.equal(score({ manualWeight: 0.1 }).ratingWeight, 0.1);
  const excluded = score({ manualOverride: true, currentStatus: 'excluded_from_rating', manualWeight: 0 });
  assert.equal(excluded.status, 'excluded_from_rating');
  assert.equal(excluded.ratingWeight, 0);
});

test('mass recalculation formula is idempotent', () => {
  const input = { locationStatus: 'confirmed', photoSource: 'camera', photoUnique: true, flags: [] };
  assert.deepEqual(calculateTrust(input, DEFAULT_TRUST_CONFIG), calculateTrust(input, DEFAULT_TRUST_CONFIG));
});

test('migration preserves legacy weight and includes an explicit rollback', async () => {
  const migration = await readFile(new URL('../prisma/migrations/20260722170000_review_trust_antifraud/migration.sql', import.meta.url), 'utf8');
  const rollback = await readFile(new URL('../prisma/migrations/20260722170000_review_trust_antifraud/rollback.sql', import.meta.url), 'utf8');
  assert.match(migration, /100, 1, 'legacy'/);
  assert.match(migration, /locationGrandfathered/);
  assert.match(rollback, /DROP TABLE IF EXISTS "review_trust"/);
});
