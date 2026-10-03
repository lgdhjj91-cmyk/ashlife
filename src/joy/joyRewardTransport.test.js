import test from 'node:test';
import assert from 'node:assert/strict';
import { awardJoyCoinsForCurrentUser } from './joyRewardTransport.js';
import { createGiftRushClaimRunner } from '../playroom/games/gift-rush/systems/rewardClaims.js';
test('stale context cannot transport a bound reward to the newly authenticated wallet', async () => {
  const writes = [];
  const auth = { currentUser: { uid: 'wallet-b' } };
  const repository = { awardJoyCoins: async (...args) => { writes.push(args); return { coins: 108 }; } };
  const runner = createGiftRushClaimRunner({ getCurrentUid: () => 'wallet-a',
    awardCoins: async (...args) => { await awardJoyCoinsForCurrentUser(auth, repository, ...args); return { success: true }; } });
  const result = await runner.attempt('gift-rush-daily:2026-10-03', { dateKey: '2026-10-03', amount: 20, ownerUid: 'wallet-a' });
  assert.equal(result.status, 'pending');
  assert.deepEqual(writes, []);
  auth.currentUser.uid = 'wallet-a';
  assert.equal((await runner.attempt('gift-rush-daily:2026-10-03', { dateKey: '2026-10-03', amount: 20, ownerUid: 'wallet-a' })).status, 'credited');
  assert.deepEqual(writes, [['wallet-a', 20, 'gift-rush-daily:2026-10-03']]);
});
