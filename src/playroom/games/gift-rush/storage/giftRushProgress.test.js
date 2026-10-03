import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePlayroomProgress } from '../../../storage/playroomStorage.js';
import { normalizeGiftRushProgress, applyGiftRushResult, prepareGiftRushClaim, confirmGiftRushClaim } from './giftRushProgress.js';

const result = (overrides = {}) => ({ sessionId: 'session-a', mode: 'daily', dateKey: '2026-10-03', challengeId: 'combo-four', stats: { score: 900, servedOrders: 6, perfectOrders: 5, maxCombo: 4 }, ...overrides });
const original = () => normalizePlayroomProgress({ coins: 88, custom: { keep: true }, records: { normal: { bestScore: 30 } }, clawMachine: { wonPrizeIds: ['bunny-plush'] }, mergeJoy: { highestScore: 123 } });
test('old saves retain other games and malformed Gift Rush fields recover safely', () => {
  const progress = original();
  assert.equal(progress.giftRush.bestScore, 0);
  assert.equal(progress.coins, 88);
  assert.equal(progress.records.normal.bestScore, 30);
  assert.equal(progress.mergeJoy.highestScore, 123);
  assert.deepEqual(progress.clawMachine.wonPrizeIds, ['bunny-plush']);
  assert.deepEqual(progress.custom, { keep: true });
  const malformed = normalizeGiftRushProgress({ selectedMode: 'bad', bestScore: Infinity, bestCombo: -1, dailyByDate: { '2026-02-31': {}, '2026-10-03': { coinsClaimed: 999 } }, pendingRewardClaims: [] });
  assert.equal(malformed.bestScore, 0);
  assert.equal(malformed.bestCombo, 0);
  assert.equal(malformed.selectedMode, 'practice');
  assert.equal(malformed.dailyByDate['2026-02-31'], undefined);
  assert.equal(malformed.dailyByDate['2026-10-03'].coinsClaimed, 0);
  assert.deepEqual(malformed.pendingRewardClaims, {});
});
test('completed daily rounds prepare one fixed reward without optimistic coins or duplicate totals', () => {
  const first = applyGiftRushResult(original(), result(), { ownerUid: 'guest-1' });
  assert.equal(first.nextProgress.coins, 88);
  assert.equal(first.claimId, 'gift-rush-daily:2026-10-03');
  assert.deepEqual(first.nextProgress.giftRush.pendingRewardClaims[first.claimId], { dateKey: '2026-10-03', amount: 20, ownerUid: 'guest-1' });
  assert.deepEqual(first.stickerIds, ['gift-rush-happy-parcel']);
  const repeated = applyGiftRushResult(first.nextProgress, result(), { ownerUid: 'guest-1' });
  assert.deepEqual(repeated.nextProgress, first.nextProgress);
  assert.equal(repeated.nextProgress.giftRush.totalOrdersServed, 6);
  const confirmed = confirmGiftRushClaim(first.nextProgress, { claimId: first.claimId, ownerUid: 'guest-1' });
  assert.equal(confirmed.coins, 88);
  assert.equal(confirmed.giftRush.dailyByDate['2026-10-03'].coinsClaimed, 20);
  assert.deepEqual(confirmed.giftRush.pendingRewardClaims, {});
  assert.equal(applyGiftRushResult(confirmed, result({ sessionId: 'session-b' }), { ownerUid: 'guest-1' }).claimId, null);
});
test('practice and incomplete daily games never prepare coins', () => {
  assert.equal(applyGiftRushResult(original(), result({ mode: 'practice' }), { ownerUid: 'guest-1' }).claimId, null);
  assert.equal(applyGiftRushResult(original(), result({ stats: { maxCombo: 3 } }), { ownerUid: 'guest-1' }).claimId, null);
});
test('unbound rewards require binding and bound rewards cannot move between wallets', () => {
  const first = applyGiftRushResult(original(), result(), { ownerUid: null });
  const bound = prepareGiftRushClaim(first.nextProgress, { dateKey: '2026-10-03', ownerUid: 'guest-1' });
  assert.equal(bound.nextProgress.giftRush.pendingRewardClaims[first.claimId].ownerUid, 'guest-1');
  assert.equal(prepareGiftRushClaim(bound.nextProgress, { dateKey: '2026-10-03', ownerUid: 'guest-2' }).claimId, null);
  assert.deepEqual(confirmGiftRushClaim(bound.nextProgress, { claimId: first.claimId, ownerUid: 'guest-2' }), bound.nextProgress);
});
test('daily history prunes to 30 real dates without losing an older pending claim', () => {
  const dailyByDate = Object.fromEntries(Array.from({ length: 31 }, (_, index) => ['2026-10-' + String(index + 1).padStart(2, '0'), { completed: true }]));
  const pendingRewardClaims = { 'gift-rush-daily:2026-09-30': { dateKey: '2026-09-30', amount: 20, ownerUid: 'guest-1' } };
  const normalized = normalizeGiftRushProgress({ dailyByDate, pendingRewardClaims });
  assert.equal(Object.keys(normalized.dailyByDate).length, 30);
  assert.equal(normalized.dailyByDate['2026-10-01'], undefined);
  assert.ok(normalized.pendingRewardClaims['gift-rush-daily:2026-09-30']);
  const confirmed = confirmGiftRushClaim({ ...original(), giftRush: normalized }, { claimId: 'gift-rush-daily:2026-09-30', ownerUid: 'guest-1' });
  assert.equal(confirmed.giftRush.dailyByDate['2026-10-31'].completed, true);
  assert.deepEqual(confirmed.giftRush.pendingRewardClaims, {});
});
