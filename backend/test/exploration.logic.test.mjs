import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EXPLORATION_CONFIG,
  bayesianRating,
  explorationShare,
  explorationSlotCount,
  interleaveExploration,
  selectExploration,
} from '../dist/common/exploration.js';

const cfg = DEFAULT_EXPLORATION_CONFIG;
const row = (id, category, avgRating, reviewCount) => ({
  it: { id, category, avgRating, reviewCount },
});

test('adaptive shares preserve a non-zero mature exploration budget', () => {
  assert.equal(explorationShare(0, cfg), 0.3);
  assert.equal(explorationShare(4, cfg), 0.3);
  assert.equal(explorationShare(5, cfg), 0.15);
  assert.equal(explorationShare(24, cfg), 0.15);
  assert.equal(explorationShare(25, cfg), 0.08);
  assert.equal(explorationSlotCount(6, 0.08, 20), 1);
});

test('negative and positive known categories are both excluded from exploration', () => {
  const candidates = [
    row('negative', 'Супы', 5, 50),
    row('positive', 'Кофе', 5, 50),
    row('unknown-a', 'Рамен', 4.5, 20),
    row('unknown-b', 'Десерты', 4.4, 15),
  ];
  const picked = selectExploration(candidates, new Set(['супы', 'кофе']), 2, cfg);
  assert.deepEqual(picked.map((item) => item.it.id), ['unknown-a', 'unknown-b']);
});

test('Bayesian quality beats a single perfect rating and diversity wins ties', () => {
  const candidates = [
    row('one-vote', 'Рамен', 5, 1),
    row('trusted', 'Рамен', 4.7, 100),
    row('other-category', 'Десерты', 4.6, 80),
  ];
  assert.ok(bayesianRating(candidates[1].it, cfg) > bayesianRating(candidates[0].it, cfg));
  const picked = selectExploration(candidates, new Set(), 2, cfg);
  assert.deepEqual(new Set(picked.map((item) => item.it.category)), new Set(['Рамен', 'Десерты']));
});

test('exploration cards are spread through the result rather than grouped', () => {
  const mixed = interleaveExploration(['a', 'b', 'c', 'd'], ['x', 'y'], 6);
  assert.equal(mixed.length, 6);
  assert.ok(Math.abs(mixed.indexOf('x') - mixed.indexOf('y')) > 1);
});
