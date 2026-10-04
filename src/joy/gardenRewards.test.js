import test from 'node:test';
import assert from 'node:assert/strict';
import { getVoucherEligibility, isGiftReward, JOY_REWARD_TIERS, normalizeVoucherCode, rewardName, selectBestVoucher } from './joyVoucherRules.js';
import { buildOrderGiftSnapshots } from './joyRewardSelection.js';
import { applyRedemption } from './joyVoucherLifecycle.js';

const plushie = { code: 'CG-PLUSHIE-AAAAAAAAAA', tierId: 'plushie', source: 'garden', currency: 'garden', coinCost: 5000, valueSen: 0, minSubtotalSen: 0, status: 'available' };

test('Garden plushies are physical gifts and cannot be purchased with Joy Coins', () => {
  assert.equal(isGiftReward(plushie), true);
  assert.equal(rewardName(plushie), 'Small plushie');
  assert.equal(rewardName(plushie, 'zh'), '小毛绒玩具');
  assert.equal(JOY_REWARD_TIERS.some(tier => tier.id === 'plushie'), false);
  assert.throws(() => applyRedemption({ coins: 99999 }, 'plushie', plushie.code, { mutationId: 'x', ownerUid: 'guest', at: 'now' }));
  assert.equal(selectBestVoucher([plushie], 1000), null);
  assert.equal(getVoucherEligibility(plushie, 0).reason, 'purchase');
  assert.equal(getVoucherEligibility(plushie, 100).eligible, true);
});

test('Garden codes normalize pasted spaces and gift snapshots keep their source', () => {
  assert.equal(normalizeVoucherCode(' cg plushie AAA AA AAAAA '), plushie.code);
  const joyKey = { ...plushie, code: 'JOY-KEYCHAIN-BBBBBBBBBB', tierId: 'keychain', source: 'joy', currency: 'joy', coinCost: 500 };
  const gardenKey = { ...plushie, code: 'CG-KEYCHAIN-CCCCCCCCCC', tierId: 'keychain' };
  const gifts = buildOrderGiftSnapshots([joyKey, gardenKey, plushie], 100);
  assert.equal(gifts.length, 2);
  assert.equal(gifts[1].source, 'garden');
  assert.equal(gifts[1].quantity, 1);
});
