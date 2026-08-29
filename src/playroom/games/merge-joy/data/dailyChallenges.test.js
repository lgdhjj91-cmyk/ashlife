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
  assert.equal(challenge.title, 'Reach 30,000 points.');
  assert.deepEqual(evaluateDailyChallenge(challenge, { score: 29_999 }), {
    complete: false,
    medal: null,
    coins: 0,
    value: 29_999,
  });
  assert.equal(evaluateDailyChallenge(challenge, { score: 30_000 }).medal, 'bronze');
  assert.equal(evaluateDailyChallenge(challenge, { score: 75_000 }).medal, 'silver');
  assert.equal(evaluateDailyChallenge(challenge, { score: 150_000 }).medal, 'perfect');
  assert.equal(evaluateDailyChallenge(challenge, { score: 150_000 }).coins, 30);
});
