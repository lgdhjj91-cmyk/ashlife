import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCheckoutRewardCode, checkoutCodeCopy } from './checkoutRewardCode.js';

test('a copied Garden gift is selected separately from a cash discount', async () => {
  const gift = { code: 'CG-KEYCHAIN-AAAAAAAAAA', tierId: 'keychain', source: 'garden', ownerUid: 'garden-guest', status: 'available' };
  const chosen = [];
  const result = await applyCheckoutRewardCode({ code: 'cg keychain aaaaaaaaaa', subtotalSen: 100, preview: async (code, subtotal) => { assert.equal(code, gift.code); assert.equal(subtotal, 100); return { success: true, valid: true, voucher: gift }; }, chooseGift: value => chosen.push(value), chooseVoucher: () => assert.fail('A gift must not replace the cash voucher') });
  assert.deepEqual(chosen, [gift]);
  assert.equal(result.kind, 'gift');
  assert.equal(result.code, gift.code);
});
test('cash vouchers retain their selection and unavailable codes select nothing', async () => {
  const cash = { code: 'JOY-RM1-AAAAAAAAAA', tierId: 'rm1', valueSen: 100 };
  let selected;
  assert.equal((await applyCheckoutRewardCode({ code: cash.code, subtotalSen: 1000, preview: async () => ({ success: true, valid: true, voucher: cash }), chooseVoucher: value => { selected = value; }, chooseGift: () => assert.fail() })).kind, 'cash');
  assert.equal(selected, cash);
  const failed = await applyCheckoutRewardCode({ code: 'CG-KEYCHAIN-AAAAAAAAAA', subtotalSen: 100, preview: async () => ({ success: true, valid: false, reason: 'used' }), chooseVoucher: () => assert.fail(), chooseGift: () => assert.fail() });
  assert.equal(failed.reason, 'used');
});
test('connectivity errors do not select a reward and the form can show a retry', async () => {
  const result = await applyCheckoutRewardCode({ code: 'CG-KEYCHAIN-AAAAAAAAAA', subtotalSen: 100, preview: async () => { throw Error('offline'); }, chooseVoucher: () => assert.fail(), chooseGift: () => assert.fail() });
  assert.equal(result.success, false);
  assert.equal(result.reason, 'connection');
});
test('checkout explains how to paste a Garden code in both languages', () => {
  assert.match(checkoutCodeCopy.en.help, /Cozy Garden/);
  assert.match(checkoutCodeCopy.en.placeholder, /CG-/);
  assert.match(checkoutCodeCopy.zh.help, /Cozy Garden/);
});
