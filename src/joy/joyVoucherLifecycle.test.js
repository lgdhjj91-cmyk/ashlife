import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCoinClaim,
  applyLegacyMigration,
  applyRedemption,
  createWalletSnapshot,
  reserveVoucherRecord,
  settleVoucherRecord,
} from './joyVoucherLifecycle.js';

const AVAILABLE_VOUCHER = Object.freeze({
  code: 'JOY-RM1-ABCDEFGHJK',
  tierId: 'rm1',
  coinCost: 100,
  valueSen: 100,
  minSubtotalSen: 1000,
  ownerUid: 'owner-1',
  status: 'available',
  createdAt: '2026-08-28T00:00:00.000Z',
  updatedAt: '2026-08-28T00:00:00.000Z',
});

test('legacy migration happens once and normalizes the wallet', () => {
  const migrated = applyLegacyMigration(null, 188, {
    mutationId: 'migration-1',
    at: '2026-08-28T01:00:00.000Z',
  });

  assert.deepEqual(migrated, {
    coins: 188,
    legacyMigrated: true,
    legacyMigratedAt: '2026-08-28T01:00:00.000Z',
    updatedAt: '2026-08-28T01:00:00.000Z',
    lastMutationId: 'migration-1',
    lastMutationType: 'migrate',
  });
  assert.strictEqual(
    applyLegacyMigration(migrated, 999, {
      mutationId: 'migration-2',
      at: '2026-08-28T02:00:00.000Z',
    }),
    migrated
  );
});

test('coin claims add a bounded positive integer reward', () => {
  const wallet = createWalletSnapshot({ coins: 88, legacyMigrated: true });
  const result = applyCoinClaim(wallet, 12.4, {
    mutationId: 'claim-1',
    at: '2026-08-28T03:00:00.000Z',
  });

  assert.equal(result.coins, 100);
  assert.equal(result.lastMutationType, 'award');
  assert.throws(
    () => applyCoinClaim(wallet, 0, { mutationId: 'claim-2', at: '2026-08-28T03:00:00.000Z' }),
    { code: 'invalid-argument' }
  );
});

test('redemption deducts the exact tier cost and creates an available voucher', () => {
  const result = applyRedemption(
    { coins: 188, legacyMigrated: true },
    'rm1',
    'JOY-RM1-ABCDEFGHJK',
    {
      ownerUid: 'owner-1',
      mutationId: 'redeem-1',
      at: '2026-08-28T04:00:00.000Z',
    }
  );

  assert.equal(result.wallet.coins, 88);
  assert.equal(result.wallet.lastMutationType, 'redeem');
  assert.equal(result.wallet.lastVoucherCode, 'JOY-RM1-ABCDEFGHJK');
  assert.deepEqual(result.voucher, {
    code: 'JOY-RM1-ABCDEFGHJK',
    tierId: 'rm1',
    coinCost: 100,
    valueSen: 100,
    minSubtotalSen: 1000,
    ownerUid: 'owner-1',
    status: 'available',
    createdAt: '2026-08-28T04:00:00.000Z',
    updatedAt: '2026-08-28T04:00:00.000Z',
  });
});

test('redemption rejects an unknown tier and insufficient coins without mutating the wallet', () => {
  const wallet = { coins: 99, legacyMigrated: true };
  assert.throws(
    () =>
      applyRedemption(wallet, 'rm1', 'JOY-RM1-ABCDEFGHJK', {
        ownerUid: 'owner-1',
        mutationId: 'redeem-1',
        at: '2026-08-28T04:00:00.000Z',
      }),
    { code: 'failed-precondition' }
  );
  assert.throws(
    () =>
      applyRedemption(wallet, 'rm3', 'JOY-RM3-ABCDEFGHJK', {
        ownerUid: 'owner-1',
        mutationId: 'redeem-2',
        at: '2026-08-28T04:00:00.000Z',
      }),
    { code: 'invalid-argument' }
  );
  assert.deepEqual(wallet, { coins: 99, legacyMigrated: true });
});

test('reservation is idempotent for one order and rejects a second order', () => {
  const reserved = reserveVoucherRecord(AVAILABLE_VOUCHER, {
    uid: 'buyer-1',
    orderId: 'ASH-20260828-1001',
    subtotalSen: 1000,
    at: '2026-08-28T05:00:00.000Z',
  });

  assert.equal(reserved.status, 'reserved');
  assert.equal(reserved.reservedByUid, 'buyer-1');
  assert.equal(
    reserveVoucherRecord(reserved, {
      uid: 'buyer-1',
      orderId: 'ASH-20260828-1001',
      subtotalSen: 1000,
      at: '2026-08-28T06:00:00.000Z',
    }),
    reserved
  );
  assert.throws(
    () =>
      reserveVoucherRecord(reserved, {
        uid: 'buyer-2',
        orderId: 'ASH-20260828-1002',
        subtotalSen: 1000,
        at: '2026-08-28T06:00:00.000Z',
      }),
    { code: 'failed-precondition' }
  );
});

test('confirmed orders consume vouchers while rejected and cancelled orders restore them', () => {
  const reserved = reserveVoucherRecord(AVAILABLE_VOUCHER, {
    uid: 'buyer-1',
    orderId: 'ASH-20260828-1001',
    subtotalSen: 1000,
    at: '2026-08-28T05:00:00.000Z',
  });
  const used = settleVoucherRecord(reserved, {
    orderId: 'ASH-20260828-1001',
    orderStatus: 'confirmed',
    at: '2026-08-28T07:00:00.000Z',
  });
  const restored = settleVoucherRecord(reserved, {
    orderId: 'ASH-20260828-1001',
    orderStatus: 'cancelled',
    at: '2026-08-28T08:00:00.000Z',
  });

  assert.equal(used.status, 'used');
  assert.equal(used.usedAt, '2026-08-28T07:00:00.000Z');
  assert.equal(restored.status, 'available');
  assert.equal(restored.restoredAt, '2026-08-28T08:00:00.000Z');
  assert.equal('reservedOrderId' in restored, false);
  assert.equal('reservedByUid' in restored, false);
});
