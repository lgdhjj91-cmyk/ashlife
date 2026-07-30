import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JOY_VOUCHER_TIERS,
  calculateVoucherTotals,
  getVoucherEligibility,
  normalizeVoucherCode,
  selectBestVoucher,
} from './joyVoucherRules.js';

test('voucher tiers enforce the exact coin, discount, and item-subtotal rules', () => {
  assert.deepEqual(JOY_VOUCHER_TIERS, [
    { id: 'rm1', coinCost: 100, valueSen: 100, minSubtotalSen: 1000 },
    { id: 'rm2', coinCost: 200, valueSen: 200, minSubtotalSen: 1500 },
    { id: 'rm5', coinCost: 500, valueSen: 500, minSubtotalSen: 2000 },
  ]);

  assert.equal(getVoucherEligibility({ status: 'available', minSubtotalSen: 1000 }, 999).reason, 'minimum');
  assert.equal(getVoucherEligibility({ status: 'available', minSubtotalSen: 1000 }, 1000).eligible, true);
  assert.equal(getVoucherEligibility({ status: 'reserved', minSubtotalSen: 1000 }, 2000).reason, 'reserved');
  assert.equal(getVoucherEligibility({ status: 'used', minSubtotalSen: 1000 }, 2000).reason, 'used');
});

test('automatic selection chooses the largest eligible available voucher', () => {
  const vouchers = [
    { code: 'JOY-RM1-AAAA', valueSen: 100, minSubtotalSen: 1000, status: 'available' },
    { code: 'JOY-RM5-BBBB', valueSen: 500, minSubtotalSen: 2000, status: 'available' },
    { code: 'JOY-RM2-CCCC', valueSen: 200, minSubtotalSen: 1500, status: 'available' },
  ];

  assert.equal(selectBestVoucher(vouchers, 1200).code, 'JOY-RM1-AAAA');
  assert.equal(selectBestVoucher(vouchers, 1600).code, 'JOY-RM2-CCCC');
  assert.equal(selectBestVoucher(vouchers, 2500).code, 'JOY-RM5-BBBB');
  assert.equal(selectBestVoucher(vouchers, 900), null);
});

test('voucher totals discount items but never reduce delivery fees', () => {
  assert.deepEqual(
    calculateVoucherTotals({
      subtotalSen: 1600,
      deliveryFeeSen: 800,
      voucher: { valueSen: 100, minSubtotalSen: 1000, status: 'available' },
    }),
    {
      subtotalSen: 1600,
      discountSen: 100,
      deliveryFeeSen: 800,
      totalSen: 2300,
    }
  );

  assert.deepEqual(
    calculateVoucherTotals({
      subtotalSen: 900,
      deliveryFeeSen: 800,
      voucher: { valueSen: 100, minSubtotalSen: 1000, status: 'available' },
    }),
    {
      subtotalSen: 900,
      discountSen: 0,
      deliveryFeeSen: 800,
      totalSen: 1700,
    }
  );
});

test('manual voucher codes normalize for safe lookup', () => {
  assert.equal(normalizeVoucherCode(' joy rm5-ab12 cd34 '), 'JOY-RM5-AB12CD34');
  assert.equal(normalizeVoucherCode('JOY_@@RM1__A1B2'), 'JOY-RM1-A1B2');
});
