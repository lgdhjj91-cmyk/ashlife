import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderVoucherSnapshot, createCheckoutOrderId } from './orderVoucher.js';

test('order voucher snapshot contains the centrally verifiable discount fields', () => {
  assert.deepEqual(
    buildOrderVoucherSnapshot(
      {
        code: 'joy rm2-ab12 cd34',
        valueSen: 200,
        minSubtotalSen: 1500,
        coinCost: 200,
        status: 'available',
      },
      1600
    ),
    {
      code: 'JOY-RM2-AB12CD34',
      valueSen: 200,
      minSubtotalSen: 1500,
      coinCost: 200,
      discountSen: 200,
      status: 'reserved',
    }
  );
});

test('ineligible voucher does not create an order discount snapshot', () => {
  assert.equal(
    buildOrderVoucherSnapshot(
      { code: 'JOY-RM5-AAAA', valueSen: 500, minSubtotalSen: 2000, status: 'available' },
      1999
    ),
    null
  );
});

test('checkout order IDs use the local date and a collision-resistant uppercase suffix', () => {
  const id = createCheckoutOrderId(new Date('2026-07-30T12:00:00+08:00'), () => 'ab12cd34');
  assert.equal(id, 'ASH-20260730-AB12CD34');
});
