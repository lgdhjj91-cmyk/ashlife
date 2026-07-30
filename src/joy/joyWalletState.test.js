import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeJoyWallet, resolveVoucherSelection } from './joyWalletState.js';

test('wallet snapshots become a stable newest-first voucher list', () => {
  const wallet = normalizeJoyWallet({
    coins: '288',
    vouchers: {
      'JOY-RM1-OLD': {
        code: 'JOY-RM1-OLD',
        valueSen: 100,
        minSubtotalSen: 1000,
        status: 'available',
        createdAt: '2026-07-29T00:00:00.000Z',
      },
      'JOY-RM2-NEW': {
        code: 'JOY-RM2-NEW',
        valueSen: 200,
        minSubtotalSen: 1500,
        status: 'available',
        createdAt: '2026-07-30T00:00:00.000Z',
      },
    },
  });

  assert.equal(wallet.coins, 288);
  assert.deepEqual(wallet.vouchers.map((voucher) => voucher.code), ['JOY-RM2-NEW', 'JOY-RM1-OLD']);
});

test('selection keeps a valid manual choice and otherwise auto-applies the best wallet voucher', () => {
  const vouchers = [
    { code: 'JOY-RM1-AAAA', valueSen: 100, minSubtotalSen: 1000, status: 'available' },
    { code: 'JOY-RM5-BBBB', valueSen: 500, minSubtotalSen: 2000, status: 'available' },
  ];

  assert.equal(
    resolveVoucherSelection({ vouchers, subtotalSen: 2500, current: vouchers[0], suppressed: false }).code,
    'JOY-RM1-AAAA'
  );
  assert.equal(
    resolveVoucherSelection({ vouchers, subtotalSen: 2500, current: null, suppressed: false }).code,
    'JOY-RM5-BBBB'
  );
  assert.equal(
    resolveVoucherSelection({ vouchers, subtotalSen: 2500, current: null, suppressed: true }),
    null
  );
});

test('selection drops a voucher that no longer meets the cart minimum', () => {
  const voucher = { code: 'JOY-RM5-BBBB', valueSen: 500, minSubtotalSen: 2000, status: 'available' };
  assert.equal(
    resolveVoucherSelection({ vouchers: [voucher], subtotalSen: 1999, current: voucher, suppressed: false }),
    null
  );
});
