import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderGiftSnapshots, selectOrderGifts } from './joyRewardSelection.js';
import { normalizeJoyWallet } from './joyWalletState.js';

test('orders include at most one of each gift and never a spent code or empty purchase', () => {
  const rewards = [
    { code: 'nano', tierId: 'nanotoy', coinCost: 500, status: 'available', minSubtotalSen: 0 },
    { code: 'nano2', tierId: 'nanotoy', coinCost: 500, status: 'available', minSubtotalSen: 0 },
    { code: 'key-used', tierId: 'keychain', status: 'used', minSubtotalSen: 0 },
    { code: 'key', tierId: 'keychain', coinCost: 500, status: 'available', minSubtotalSen: 0 },
    { code: 'cash', tierId: 'rm1', status: 'available', minSubtotalSen: 0 },
  ];
  assert.deepEqual(selectOrderGifts(rewards, 0), []);
  assert.deepEqual(buildOrderGiftSnapshots(rewards, 1).map((gift) => [gift.code, gift.quantity, gift.status]), [['nano', 1, 'reserved'], ['key', 1, 'reserved']]);
});

test('coin history combines old earning claims and gift redemption records newest first', () => {
  const wallet = normalizeJoyWallet({
    coins: 30,
    claims: [{ id: 'game1', amount: 20, createdAt: '2026-10-01T00:00:00Z' }],
    redemptions: [{ id: 'gift1', tierId: 'nanotoy', code: 'nano', createdAt: { toDate: () => new Date('2026-10-03T00:00:00Z') } }],
  });
  assert.deepEqual(wallet.history.map((entry) => [entry.type, entry.amount]), [['redeemed', -500], ['earned', 20]]);
  assert.equal(wallet.history[0].createdAt, '2026-10-03T00:00:00.000Z');
});
