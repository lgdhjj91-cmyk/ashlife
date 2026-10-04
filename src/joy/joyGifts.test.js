import test from 'node:test';
import assert from 'node:assert/strict';
import { createJoyVoucherCode, isJoyVoucherCode } from './joyVoucherCode.js';
import { applyRedemption, reserveVoucherRecord } from './joyVoucherLifecycle.js';
import { getVoucherEligibility, selectBestVoucher } from './joyVoucherRules.js';

test('500 coins redeem a nano toy or keychain with a distinct gift code', () => {
  for (const [id, prefix] of [['nanotoy', 'NANOTOY'], ['keychain', 'KEYCHAIN']]) {
    const code = createJoyVoucherCode(id, new Uint8Array(10));
    assert.equal(code, `JOY-${prefix}-AAAAAAAAAA`);
    assert.equal(isJoyVoucherCode(code.toLowerCase()), true);
    const result = applyRedemption({ coins: 700 }, id, code, { mutationId: 'r1', ownerUid: 'guest', at: 'now' });
    assert.equal(result.wallet.coins, 200);
    assert.equal(result.voucher.valueSen, 0);
    assert.equal(result.voucher.minSubtotalSen, 0);
    assert.equal(getVoucherEligibility(result.voucher, 1).eligible, true);
    assert.equal(getVoucherEligibility(result.voucher, 0).eligible, false);
    assert.throws(() => reserveVoucherRecord(result.voucher, { uid: 'guest', orderId: 'o1', subtotalSen: 0, at: 'now' }));
    assert.equal(reserveVoucherRecord(result.voucher, { uid: 'guest', orderId: 'o1', subtotalSen: 1, at: 'now' }).status, 'reserved');
  }
});

test('a gift never replaces the automatic cash voucher', () => {
  const gift = { tierId: 'nanotoy', code: 'JOY-NANOTOY-AAAAAAAAAA', valueSen: 0, minSubtotalSen: 0, status: 'available' };
  assert.equal(selectBestVoucher([gift], 2000), null);
  assert.equal(selectBestVoucher([gift, { code: 'cash', valueSen: 100, minSubtotalSen: 1000 }], 2000).code, 'cash');
});
