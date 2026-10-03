import test from 'node:test';
import assert from 'node:assert/strict';
import { getGiftRushDailyChallenge, evaluateGiftRushChallenge } from './dailyChallenges.js';
test('daily goals rotate deterministically and require the exact one-round threshold', () => {
  const challenge = getGiftRushDailyChallenge('2026-10-03');
  assert.equal(challenge.id, 'combo-four');
  assert.equal(challenge.coins, 20);
  assert.deepEqual(evaluateGiftRushChallenge(challenge, { maxCombo: 3 }), { complete: false, progress: 3, target: 4 });
  assert.equal(evaluateGiftRushChallenge(challenge, { maxCombo: 4 }).complete, true);
  for (const [id, metric, target] of [['perfect-five', 'perfectOrders', 5], ['serve-ten', 'servedOrders', 10]]) {
    assert.equal(evaluateGiftRushChallenge({ id, metric, target }, { [metric]: target - 1 }).complete, false);
    assert.equal(evaluateGiftRushChallenge({ id, metric, target }, { [metric]: target }).complete, true);
  }
});
