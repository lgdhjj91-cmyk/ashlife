import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDailyChallenge, getDailyMergeChallenge } from './dailyChallenges.js';

test('one local date selects one deterministic challenge', () => {
  const challenge = getDailyMergeChallenge(new Date(2026, 7, 29, 12));
  assert.equal(challenge.dateKey, '2026-08-29');
  assert.equal(challenge.id, 'score-sprint');
  assert.equal(getDailyMergeChallenge(new Date(2026, 7, 29, 23)).id, challenge.id);
});

test('each challenge evaluates its own thresholds from Bronze through Perfect', () => {
  const challenge = getDailyMergeChallenge(new Date(2026, 7, 29, 12));
  assert.equal(challenge.title, 'Reach 10,000 points.');
  assert.deepEqual(evaluateDailyChallenge(challenge, { score: 9_999 }), {
    complete: false,
    medal: null,
    coins: 0,
    value: 9_999,
  });
  assert.equal(evaluateDailyChallenge(challenge, { score: 10_000 }).medal, 'bronze');
  assert.equal(evaluateDailyChallenge(challenge, { score: 10_000 }).coins, 15);
  assert.equal(evaluateDailyChallenge(challenge, { score: 20_000 }).medal, 'silver');
  assert.equal(evaluateDailyChallenge(challenge, { score: 20_000 }).coins, 30);
  assert.equal(evaluateDailyChallenge(challenge, { score: 30_000 }).medal, 'gold');
  assert.equal(evaluateDailyChallenge(challenge, { score: 30_000 }).coins, 50);
  assert.equal(evaluateDailyChallenge(challenge, { score: 80_000 }).medal, 'perfect');
  assert.equal(evaluateDailyChallenge(challenge, { score: 80_000 }).coins, 80);
});

test('high score still awards coins even when another daily challenge is active', () => {
  const challenge = { id: 'notebook-maker', title: 'Create 1 Bunny Notebook.', metric: 'tier:6', thresholds: [1, 2, 3, 4] };
  const result = evaluateDailyChallenge(challenge, { score: 30_000, createdByTier: {} });
  assert.equal(result.complete, true);
  assert.equal(result.medal, 'gold');
  assert.equal(result.coins, 50);
});

