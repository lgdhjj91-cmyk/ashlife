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
  assert.deepEqual(evaluateDailyChallenge(challenge, { score: 2_999 }), {
    complete: false,
    medal: null,
    coins: 0,
    value: 2_999,
  });
  assert.equal(evaluateDailyChallenge(challenge, { score: 4_500 }).medal, 'silver');
  assert.equal(evaluateDailyChallenge(challenge, { score: 8_000 }).medal, 'perfect');
  assert.equal(evaluateDailyChallenge(challenge, { score: 8_000 }).coins, 30);
});
