const test = require('node:test');
const assert = require('node:assert/strict');
const {
  JOY_VOUCHER_TIERS,
  awardCoins,
  migrateLegacyCoins,
  redeemVoucher,
  reserveVoucher,
  settleVoucher,
} = require('./joyVoucherCore');

test('legacy migration and reward claims add coins only once', () => {
  const migrated = migrateLegacyCoins({}, 188, '2026-07-30T00:00:00.000Z');
  assert.equal(migrated.coins, 188);
  assert.equal(migrateLegacyCoins(migrated, 999, '2026-07-30T00:01:00.000Z').coins, 188);

  const rewarded = awardCoins(migrated, 32, 'claw-session-1', '2026-07-30T00:02:00.000Z');
  assert.equal(rewarded.coins, 220);
  assert.equal(awardCoins(rewarded, 32, 'claw-session-1', '2026-07-30T00:03:00.000Z').coins, 220);
});

test('redemption deducts the fixed tier cost once and records an available voucher', () => {
  assert.deepEqual(JOY_VOUCHER_TIERS.rm5, {
    id: 'rm5',
    coinCost: 500,
    valueSen: 500,
    minSubtotalSen: 2000,
  });

  const wallet = migrateLegacyCoins({}, 700, '2026-07-30T00:00:00.000Z');
  const first = redeemVoucher(
    wallet,
    'rm5',
    'redeem-request-1',
    'JOY-RM5-AB12CD34',
    '2026-07-30T00:05:00.000Z'
  );
  assert.equal(first.wallet.coins, 200);
  assert.equal(first.voucher.status, 'available');
  assert.equal(first.voucher.valueSen, 500);

  const duplicate = redeemVoucher(
    first.wallet,
    'rm5',
    'redeem-request-1',
    'JOY-RM5-DIFFERENT',
    '2026-07-30T00:06:00.000Z'
  );
  assert.equal(duplicate.wallet.coins, 200);
  assert.equal(duplicate.voucher.code, 'JOY-RM5-AB12CD34');
});

test('a voucher can be reserved by only one order and respects minimum item subtotal', () => {
  const voucher = {
    code: 'JOY-RM2-AB12CD34',
    status: 'available',
    valueSen: 200,
    minSubtotalSen: 1500,
  };

  assert.throws(
    () => reserveVoucher(voucher, { uid: 'guest-a', orderId: 'ASH-1', subtotalSen: 1499 }),
    /minimum/i
  );

  const reserved = reserveVoucher(voucher, {
    uid: 'guest-a',
    orderId: 'ASH-1',
    subtotalSen: 1500,
    now: '2026-07-30T00:10:00.000Z',
  });
  assert.equal(reserved.status, 'reserved');
  assert.equal(reserved.reservedOrderId, 'ASH-1');

  assert.equal(
    reserveVoucher(reserved, { uid: 'guest-a', orderId: 'ASH-1', subtotalSen: 1500 }),
    reserved
  );
  assert.throws(
    () => reserveVoucher(reserved, { uid: 'guest-b', orderId: 'ASH-2', subtotalSen: 1500 }),
    /unavailable/i
  );
});

test('order settlement consumes confirmed vouchers and restores rejected or cancelled vouchers', () => {
  const reserved = {
    code: 'JOY-RM1-AB12CD34',
    status: 'reserved',
    reservedByUid: 'guest-a',
    reservedOrderId: 'ASH-1',
  };

  assert.equal(settleVoucher(reserved, 'pending_verification').status, 'reserved');
  assert.equal(settleVoucher(reserved, 'confirmed').status, 'used');
  assert.equal(settleVoucher(reserved, 'completed').status, 'used');

  for (const status of ['rejected', 'cancelled']) {
    const restored = settleVoucher(reserved, status, '2026-07-30T00:15:00.000Z');
    assert.equal(restored.status, 'available');
    assert.equal(restored.reservedByUid, undefined);
    assert.equal(restored.reservedOrderId, undefined);
  }
});
