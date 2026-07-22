import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_GOAL_TEMPLATES,
  pickTemplate,
  renderTemplate,
} from '../dist/goals/goal-templates.js';

// The owner rule these tests defend: «Запрещено придумывать … прогресс,
// количество шагов до цели, вес мнения» — a template that needs a number we
// cannot compute must produce nothing at all rather than a half-filled promise.

test('placeholders are filled from real values', () => {
  const out = renderTemplate('Осталось {remaining} {plural:дегустация}', { remaining: 2 });
  assert.equal(out, 'Осталось 2 дегустации');
});

test('russian plural agrees with the number', () => {
  const one = renderTemplate('{remaining} {plural:дегустация}', { remaining: 1 });
  const few = renderTemplate('{remaining} {plural:дегустация}', { remaining: 3 });
  const many = renderTemplate('{remaining} {plural:дегустация}', { remaining: 11 });
  assert.equal(one, '1 дегустация');
  assert.equal(few, '3 дегустации');
  assert.equal(many, '11 дегустаций');
});

test('a missing value drops the whole variant instead of inventing one', () => {
  assert.equal(renderTemplate('Звание «{name}» почти ваше', { name: null }), null);
  assert.equal(renderTemplate('Осталось {remaining}', {}), null);
});

test('near-goal copy differs from far-goal copy (goal gradient)', () => {
  const near = pickTemplate(DEFAULT_GOAL_TEMPLATES, 'specialization', 1, 0);
  const far = pickTemplate(DEFAULT_GOAL_TEMPLATES, 'specialization', 8, 0);
  assert.ok(near, 'a one-step-away template must exist');
  assert.ok(far, 'a distant template must exist');
  assert.notEqual(near.title, far.title);
});

test('template choice varies with the session seed (no identical wording forever)', () => {
  const variants = new Set(
    [0, 1, 2, 3, 4, 5].map((seed) => pickTemplate(DEFAULT_GOAL_TEMPLATES, 'discovery', 1, seed)?.title),
  );
  assert.ok(variants.size > 1, 'discovery must have more than one phrasing');
});

test('no template uses altruistic framing', () => {
  const banned = /помог|обучите|улучшат алгоритм|станет лучше|другим пользователям/i;
  for (const t of DEFAULT_GOAL_TEMPLATES) {
    assert.ok(!banned.test(t.title), `banned framing in title: ${t.title}`);
    assert.ok(!banned.test(t.subtitle), `banned framing in subtitle: ${t.subtitle}`);
  }
});

test('every template resolves with a full variable set', () => {
  const vars = { remaining: 2, current: 8, target: 10, name: 'Кофе', level: 'Гурман' };
  for (const t of DEFAULT_GOAL_TEMPLATES) {
    assert.ok(renderTemplate(t.title, vars), `unresolved title: ${t.title}`);
    assert.ok(renderTemplate(t.subtitle, vars), `unresolved subtitle: ${t.subtitle}`);
  }
});

test('an unknown goal type yields no template rather than a wrong one', () => {
  assert.equal(pickTemplate(DEFAULT_GOAL_TEMPLATES, 'no_such_type', 1, 0), null);
});
