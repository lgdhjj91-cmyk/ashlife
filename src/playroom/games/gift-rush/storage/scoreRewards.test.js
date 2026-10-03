import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayroomProgress } from '../../../storage/playroomStorage.js';
import { applyGiftRushResult, confirmGiftRushClaim, prepareGiftRushClaim, normalizeGiftRushProgress, giftRushClaimId, giftRushClaimKey, getGiftRushRewardStatus } from './giftRushProgress.js';
import { createGiftRushClaimRunner } from '../systems/rewardClaims.js';

const dateKey = '2026-10-03';
const round = (score, sessionId = String(score), mode = 'daily') => ({ dateKey, sessionId, mode, stats: { score, maxCombo: 4, servedOrders: 9, perfectOrders: 9 } });
const fresh = () => normalizePlayroomProgress({ coins: 88 });
const finish = (progress, score, sessionId, ownerUid = 'a', mode) => applyGiftRushResult(progress, round(score, sessionId, mode), { ownerUid }).nextProgress;
const confirmAll = (progress, ownerUid = 'a') => Object.values(progress.giftRush.pendingRewardClaims).reduce((current, claim) => confirmGiftRushClaim(current, { claimId: giftRushClaimId(claim.dateKey, claim.rewardId), ownerUid }), progress);

test('Daily score boundaries award two separate five-coin tiers; Practice awards none', () => {
  for (const [score, amounts] of [[1499, [20]], [1500, [20, 5]], [1999, [20, 5]], [2000, [20, 5, 5]]]) {
    const progress = finish(fresh(), score);
    assert.deepEqual(Object.values(progress.giftRush.pendingRewardClaims).map(c => c.amount), amounts);
    assert.equal(progress.coins, 88);
  }
  assert.deepEqual(finish(fresh(), 3000, 'practice', 'a', 'practice').giftRush.pendingRewardClaims, {});
});

test('a higher replay tops up once, and scores and claims stay with their wallet', () => {
  let progress = confirmAll(finish(fresh(), 1500));
  progress = finish(progress, 2000, 'higher');
  assert.deepEqual(Object.values(progress.giftRush.pendingRewardClaims).map(c => c.rewardId), ['score-2000']);
  progress = confirmAll(progress);
  assert.deepEqual(finish(progress, 2500, 'repeat').giftRush.pendingRewardClaims, {});
  assert.equal(getGiftRushRewardStatus(progress.giftRush, dateKey, 'a', 'score-2000'), 'credited');
  assert.equal(getGiftRushRewardStatus(progress.giftRush, dateKey, 'b', 'score-2000'), 'incomplete');
  assert.equal(prepareGiftRushClaim(progress, { dateKey, ownerUid: 'b', rewardId: 'score-2000' }).claimId, null);
  const other = finish(progress, 1500, 'wallet-b', 'b');
  assert.equal(Object.values(other.giftRush.pendingRewardClaims).filter(c => c.ownerUid === 'b').length, 2);
});

test('bonus qualification is independent of the mission; legacy scores do not grant another wallet coins', () => {
  const progress = applyGiftRushResult(fresh(), { ...round(2000), stats: { score: 2000, maxCombo: 3 } }, { ownerUid: 'a' }).nextProgress;
  assert.deepEqual(Object.values(progress.giftRush.pendingRewardClaims).map(c => c.amount), [5, 5]);
  assert.equal(progress.giftRush.dailyByDate[dateKey].completed, false);
  const legacy = normalizeGiftRushProgress({ dailyByDate: { [dateKey]: { bestScore: 2018, completed: true, completedOwnerUids: ['a'], claimedOwnerUids: ['a'] } } });
  assert.equal(getGiftRushRewardStatus(legacy, dateKey, 'a', 'score-1500'), 'incomplete');
});

test('unbound bonus claims survive reload and history pruning and bind only explicitly', () => {
  let progress = finish(fresh(), 2000, 'unbound', null);
  progress = { ...progress, giftRush: normalizeGiftRushProgress(progress.giftRush) };
  progress = finish(progress, 2000, 'signed-in', 'a');
  assert.equal(Object.values(progress.giftRush.pendingRewardClaims).every(c => c.ownerUid === null), true);
  progress.giftRush.dailyByDate = {};
  const bound = prepareGiftRushClaim(progress, { dateKey, ownerUid: 'a', rewardId: 'score-2000' });
  assert.equal(bound.claimId, 'gift-rush-score-2000:' + dateKey);
  assert.equal(prepareGiftRushClaim(bound.nextProgress, { dateKey, ownerUid: 'b', rewardId: 'score-2000' }).claimId, null);
  const confirmed = confirmGiftRushClaim(bound.nextProgress, { claimId: bound.claimId, ownerUid: 'a' });
  assert.equal(getGiftRushRewardStatus(confirmed.giftRush, dateKey, 'a', 'score-2000'), 'credited');
  assert.equal(confirmed.giftRush.dailyByDate[dateKey].completed, false);
  assert.equal(confirmed.giftRush.pendingRewardClaims[giftRushClaimKey(dateKey, null, 'score-1500')].amount, 5);
});

test('tier claims retry with a fixed id and cannot transport a forged amount or tier', async () => {
  const calls = [];
  const runner = createGiftRushClaimRunner({ getCurrentUid: () => 'a', awardCoins: async (...args) => { calls.push(args); return { success: calls.length > 1 }; } });
  const claim = { dateKey, ownerUid: 'a', rewardId: 'score-2000', amount: 5 };
  const id = giftRushClaimId(dateKey, claim.rewardId);
  assert.equal((await runner.attempt(id, claim)).status, 'pending');
  assert.equal((await runner.attempt(id, claim)).status, 'credited');
  assert.deepEqual(calls, [[5, id, 'a'], [5, id, 'a']]);
  assert.equal((await runner.attempt(id, { ...claim, amount: 50 })).status, 'pending');
  assert.equal((await runner.attempt(id, { ...claim, rewardId: 'score-999' })).status, 'pending');
  assert.equal(calls.length, 2);
});
