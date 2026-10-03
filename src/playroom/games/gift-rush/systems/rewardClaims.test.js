import test from 'node:test';
import assert from 'node:assert/strict';
import { createGiftRushClaimRunner } from './rewardClaims.js';

const claimId = 'gift-rush-daily:2026-10-03';
const claim = { dateKey: '2026-10-03', amount: 20, ownerUid: 'guest-1' };
test('repeated claim clicks share one result and errors stay retryable', async () => {
  let release;
  let calls = 0;
  const runner = createGiftRushClaimRunner({ getCurrentUid: () => 'guest-1', awardCoins: async (amount, id) => {
    assert.equal(amount, 20); assert.equal(id, claimId); calls++;
    return new Promise(resolve => { release = resolve; });
  } });
  const first = runner.attempt(claimId, claim);
  const duplicate = runner.attempt(claimId, claim);
  assert.equal(first, duplicate);
  await Promise.resolve();
  release({ success: false, error: 'Offline' });
  assert.equal((await first).status, 'pending');
  const retry = runner.attempt(claimId, claim);
  await Promise.resolve();
  release({ success: true, coins: 108 });
  assert.equal((await retry).status, 'credited');
  assert.equal(calls, 2);
});
test('unbound and other-wallet claims cannot be transported', async () => {
  const runner = createGiftRushClaimRunner({ getCurrentUid: () => 'guest-2', awardCoins: () => { throw new Error('must not call'); } });
  assert.equal((await runner.attempt(claimId, claim)).status, 'wallet-changed');
  assert.equal((await runner.attempt(claimId, { ...claim, ownerUid: null })).status, 'unbound');
});
test('wallet switches during transport and thrown network errors do not confirm local claims', async () => {
  let uid = 'guest-1';
  let release;
  const runner = createGiftRushClaimRunner({ getCurrentUid: () => uid, awardCoins: () => new Promise(resolve => { release = resolve; }) });
  const pending = runner.attempt(claimId, claim);
  await Promise.resolve();
  uid = 'guest-2'; release({ success: true, coins: 108 });
  assert.equal((await pending).status, 'wallet-changed');
  const offline = createGiftRushClaimRunner({ getCurrentUid: () => 'guest-1', awardCoins: async () => { throw new Error('Offline'); } });
  assert.equal((await offline.attempt(claimId, claim)).status, 'pending');
});
