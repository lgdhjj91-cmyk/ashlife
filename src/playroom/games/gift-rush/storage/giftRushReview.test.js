import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlayroomProgress, normalizePlayroomProgress } from '../../../storage/playroomStorage.js';
import { applyGiftRushResult, confirmGiftRushClaim, prepareGiftRushClaim, normalizeGiftRushProgress, getGiftRushRewardStatus } from './giftRushProgress.js';

const dateKey = '2026-10-03';
const result = (sessionId, maxCombo = 4) => ({ sessionId, mode: 'daily', dateKey, stats: { maxCombo, score: 100, servedOrders: 4 } });
const base = () => normalizePlayroomProgress({ coins: 88 });
test('each wallet can earn after another wallet credits or leaves its reward pending', () => {
  const a = applyGiftRushResult(base(), result('a'), { ownerUid: 'wallet-a' });
  const credited = confirmGiftRushClaim(a.nextProgress, { claimId: a.claimId, ownerUid: 'wallet-a' });
  assert.equal(getGiftRushRewardStatus(credited.giftRush, dateKey, 'wallet-a'), 'credited');
  assert.equal(getGiftRushRewardStatus(credited.giftRush, dateKey, 'wallet-b'), 'incomplete');
  const b = applyGiftRushResult(credited, result('b'), { ownerUid: 'wallet-b' });
  assert.equal(b.claimId, a.claimId);
  const pendingB = applyGiftRushResult(a.nextProgress, result('b'), { ownerUid: 'wallet-b' });
  assert.equal(pendingB.claimId, a.claimId);
  assert.deepEqual(Object.values(pendingB.nextProgress.giftRush.pendingRewardClaims).map(c => c.ownerUid).sort(), ['wallet-a', 'wallet-b']);
  assert.equal(prepareGiftRushClaim(credited, { dateKey, ownerUid: 'wallet-b' }).claimId, null, 'another wallet must earn its own qualification');
});
test('durable unbound reward can explicitly bind after daily history is pruned', () => {
  const earned = applyGiftRushResult(base(), result('a'), { ownerUid: null }).nextProgress;
  const dailyByDate = Object.fromEntries(Array.from({ length: 31 }, (_, index) => ['2026-11-' + String(index + 1).padStart(2, '0'), { completed: true }]));
  earned.giftRush.dailyByDate = dailyByDate;
  earned.giftRush = normalizeGiftRushProgress(earned.giftRush);
  assert.equal(earned.giftRush.dailyByDate[dateKey], undefined);
  const bound = prepareGiftRushClaim(earned, { dateKey, ownerUid: 'wallet-a' });
  assert.equal(bound.claimId, 'gift-rush-daily:' + dateKey);
  assert.equal(Object.values(bound.nextProgress.giftRush.pendingRewardClaims)[0].ownerUid, 'wallet-a');
});
test('unsuccessful replay cannot automatically bind a previously unbound reward', () => {
  const earned = applyGiftRushResult(base(), result('a'), { ownerUid: null }).nextProgress;
  const replay = applyGiftRushResult(earned, result('b', 0), { ownerUid: 'wallet-b' });
  assert.equal(replay.claimId, null);
  assert.equal(Object.values(replay.nextProgress.giftRush.pendingRewardClaims)[0].ownerUid, null);
});
test('malformed Gift Rush numbers preserve other Playroom progress through the loader', () => {
  const saved = { coins: 88, unlockedStickers: ['bunny-plush'], records: { normal: { bestScore: 35 } }, giftRush: { bestScore: { toString: 0 }, bestCombo: [], totalOrdersServed: {} } };
  const previous = globalThis.window;
  globalThis.window = { localStorage: { getItem: () => JSON.stringify(saved) } };
  try {
    const loaded = loadPlayroomProgress();
    assert.equal(loaded.coins, 88);
    assert.deepEqual(loaded.unlockedStickers, saved.unlockedStickers);
    assert.equal(loaded.records.normal.bestScore, 35);
    assert.equal(loaded.giftRush.bestScore, 0);
  } finally { globalThis.window = previous; }
});
