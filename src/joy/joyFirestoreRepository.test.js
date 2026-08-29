import test from 'node:test';
import assert from 'node:assert/strict';
import { createJoyRepository } from './joyFirestoreRepository.js';

const clone = (value) => (value === undefined ? undefined : structuredClone(value));

const createMemoryJoyStore = (seed = {}) => {
  let documents = new Map(
    Object.entries(seed).map(([path, value]) => [path, clone(value)])
  );
  let timestampCounter = 0;

  return {
    async transact(operation) {
      const draft = new Map(Array.from(documents, ([path, value]) => [path, clone(value)]));
      const transaction = {
        async get(path) {
          return clone(draft.get(path));
        },
        set(path, value) {
          draft.set(path, clone(value));
        },
      };
      const result = await operation(transaction);
      documents = draft;
      return result;
    },
    async get(path) {
      return clone(documents.get(path));
    },
    timestamp() {
      timestampCounter += 1;
      return `2026-08-28T00:00:${String(timestampCounter).padStart(2, '0')}.000Z`;
    },
    dump(path) {
      return clone(documents.get(path));
    },
  };
};

test('reward claims add coins once for a repeated claim ID', async () => {
  const store = createMemoryJoyStore({
    'joyWallets/guest-1': { coins: 88, legacyMigrated: true },
  });
  const repository = createJoyRepository(store);

  assert.deepEqual(await repository.awardJoyCoins('guest-1', 12, 'claim-1'), { coins: 100 });
  assert.deepEqual(await repository.awardJoyCoins('guest-1', 12, 'claim-1'), { coins: 100 });
  assert.equal(store.dump('joyWallets/guest-1').coins, 100);
  assert.equal(store.dump('joyWallets/guest-1/claims/claim-1').amount, 12);
});

test('redemption commits the wallet deduction, request record, and voucher together', async () => {
  const store = createMemoryJoyStore({
    'joyWallets/guest-1': { coins: 188, legacyMigrated: true },
  });
  const repository = createJoyRepository(store, {
    createCode: () => 'JOY-RM1-ABCDEFGHJK',
  });

  const result = await repository.redeemJoyVoucher('guest-1', 'rm1', 'redeem-1');

  assert.equal(result.coins, 88);
  assert.equal(result.voucher.code, 'JOY-RM1-ABCDEFGHJK');
  assert.equal(store.dump('joyWallets/guest-1').coins, 88);
  assert.equal(store.dump('joyVouchers/JOY-RM1-ABCDEFGHJK').status, 'available');
  assert.deepEqual(store.dump('joyWallets/guest-1/redemptions/redeem-1'), {
    code: 'JOY-RM1-ABCDEFGHJK',
    tierId: 'rm1',
    createdAt: '2026-08-28T00:00:01.000Z',
  });
});

test('redemption request IDs are idempotent after a lost response', async () => {
  const store = createMemoryJoyStore({
    'joyWallets/guest-1': { coins: 188, legacyMigrated: true },
  });
  let generated = 0;
  const repository = createJoyRepository(store, {
    createCode: () => `JOY-RM1-ABCDEFGH${generated++ ? 'JM' : 'JK'}`,
  });

  const first = await repository.redeemJoyVoucher('guest-1', 'rm1', 'redeem-1');
  const repeated = await repository.redeemJoyVoucher('guest-1', 'rm1', 'redeem-1');

  assert.equal(repeated.voucher.code, first.voucher.code);
  assert.equal(repeated.coins, 88);
  assert.equal(store.dump('joyWallets/guest-1').coins, 88);
});

test('voucher code collisions generate another candidate without deducting twice', async () => {
  const store = createMemoryJoyStore({
    'joyWallets/guest-1': { coins: 188, legacyMigrated: true },
    'joyVouchers/JOY-RM1-AAAAAAAAAA': {
      code: 'JOY-RM1-AAAAAAAAAA',
      status: 'used',
      ownerUid: 'someone-else',
    },
  });
  const candidates = ['JOY-RM1-AAAAAAAAAA', 'JOY-RM1-BBBBBBBBBB'];
  const repository = createJoyRepository(store, {
    createCode: () => candidates.shift(),
  });

  const result = await repository.redeemJoyVoucher('guest-1', 'rm1', 'redeem-1');

  assert.equal(result.voucher.code, 'JOY-RM1-BBBBBBBBBB');
  assert.equal(store.dump('joyWallets/guest-1').coins, 88);
});

test('reservation rejects reuse and cancelled settlement restores the voucher', async () => {
  const voucher = {
    code: 'JOY-RM1-ABCDEFGHJK',
    tierId: 'rm1',
    coinCost: 100,
    valueSen: 100,
    minSubtotalSen: 1000,
    ownerUid: 'guest-1',
    status: 'available',
    createdAt: '2026-08-28T00:00:00.000Z',
    updatedAt: '2026-08-28T00:00:00.000Z',
  };
  const store = createMemoryJoyStore({
    'joyVouchers/JOY-RM1-ABCDEFGHJK': voucher,
  });
  const repository = createJoyRepository(store);

  const reserved = await repository.reserveJoyVoucher('buyer-1', {
    code: voucher.code,
    orderId: 'ASH-20260828-1001',
    subtotalSen: 1000,
  });
  await assert.rejects(
    repository.reserveJoyVoucher('buyer-2', {
      code: voucher.code,
      orderId: 'ASH-20260828-1002',
      subtotalSen: 1000,
    }),
    { code: 'failed-precondition' }
  );
  const restored = await repository.settleJoyVoucher({
    code: voucher.code,
    orderId: 'ASH-20260828-1001',
    orderStatus: 'cancelled',
  });

  assert.equal(reserved.voucher.status, 'reserved');
  assert.equal(restored.voucher.status, 'available');
  assert.equal(store.dump('joyVouchers/JOY-RM1-ABCDEFGHJK').reservedOrderId, undefined);
  assert.equal((await repository.releaseJoyVoucher('buyer-1', {
    code: voucher.code,
    orderId: 'ASH-20260828-1001',
  })).voucher.status, 'available');
});

test('preview reads the stored value and rejects fabricated or ineligible codes', async () => {
  const store = createMemoryJoyStore({
    'joyVouchers/JOY-RM2-ABCDEFGHJK': {
      code: 'JOY-RM2-ABCDEFGHJK',
      tierId: 'rm2',
      coinCost: 200,
      valueSen: 200,
      minSubtotalSen: 1500,
      ownerUid: 'guest-1',
      status: 'available',
    },
  });
  const repository = createJoyRepository(store);

  assert.deepEqual(await repository.previewJoyVoucher('JOY-RM2-FAKEFAKEFA', 2000), {
    valid: false,
    reason: 'invalid',
    voucher: null,
  });
  assert.equal((await repository.previewJoyVoucher('joy rm2 abcdefghjk', 1400)).reason, 'minimum');
  assert.equal((await repository.previewJoyVoucher('joy rm2 abcdefghjk', 1500)).valid, true);
});
