import test from 'node:test';
import assert from 'node:assert/strict';
import { createRedeemedVoucherNotice } from './joyRedeemNotice.js';

test('redeemed voucher notice exposes the code, discount and minimum spend', () => {
  assert.deepEqual(
    createRedeemedVoucherNotice({
      code: 'JOY-RM1-ABCDEFGHJK',
      valueSen: 100,
      minSubtotalSen: 1000,
    }),
    {
      code: 'JOY-RM1-ABCDEFGHJK',
      discountLabel: 'RM1',
      minimumLabel: 'RM10',
    }
  );
});

test('redeemed voucher notice rejects incomplete voucher data', () => {
  assert.throws(() => createRedeemedVoucherNotice({ valueSen: 100 }), {
    code: 'invalid-argument',
  });
});
