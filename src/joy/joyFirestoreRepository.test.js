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

test('multiple order rewards reserve atomically and reject duplicate gift types', async () => {
  const nano = { code: 'nano', tierId: 'nanotoy', valueSen: 0, minSubtotalSen: 0, status: 'available' };
  const key = { code: 'key', tierId: 'keychain', valueSen: 0, minSubtotalSen: 0, status: 'available' };
  const cash = { code: 'cash', tierId: 'rm1', valueSen: 100, minSubtotalSen: 1000, status: 'available' };
  const store = createMemoryJoyStore({ 'joyVouchers/NANO': nano, 'joyVouchers/KEY': key, 'joyVouchers/CASH': cash });
  const repo = createJoyRepository(store);
  await assert.rejects(repo.reserveJoyRewards('buyer', { codes: ['nano', 'key', 'cash'], orderId: 'o', subtotalSen: 500 }));
  assert.equal(store.dump('joyVouchers/NANO').status, 'available');
  const result = await repo.reserveJoyRewards('buyer', { codes: ['nano', 'key', 'cash'], orderId: 'o', subtotalSen: 1000 });
  assert.equal(result.rewards.length, 3);
  assert.equal(store.dump('joyVouchers/KEY').reservedOrderId, 'o');
  await repo.releaseJoyRewards('buyer', { codes: ['nano', 'key', 'cash'], orderId: 'o' });
  assert.equal(store.dump('joyVouchers/NANO').status, 'available');
  await assert.rejects(repo.reserveJoyRewards('buyer', { codes: ['nano', 'nano'], orderId: 'o', subtotalSen: 1000 }));
  const sameType = createMemoryJoyStore({ 'joyVouchers/NANO': nano, 'joyVouchers/NANO2': { ...nano, code: 'nano2' } });
  await assert.rejects(createJoyRepository(sameType).reserveJoyRewards('buyer', { codes: ['nano', 'nano2'], orderId: 'o', subtotalSen: 1000 }));
});

test('Garden and Joy gifts share stock, reserve with cash, and release only once', async () => {
  const gift = (code, tierId, source = 'garden') => ({ code, tierId, source, currency: source, valueSen: 0, minSubtotalSen: 0, status: 'available' });
  const store = createMemoryJoyStore({
    'joyVouchers/CG-PLUSHIE-AAAAAAAAAA': gift('CG-PLUSHIE-AAAAAAAAAA', 'plushie'),
    'joyVouchers/CG-KEYCHAIN-AAAAAAAAAA': gift('CG-KEYCHAIN-AAAAAAAAAA', 'keychain'),
    'joyVouchers/JOY-NANOTOY-AAAAAAAAAA': gift('JOY-NANOTOY-AAAAAAAAAA', 'nanotoy', 'joy'),
    'joyVouchers/CASH': { code: 'CASH', tierId: 'rm1', valueSen: 100, minSubtotalSen: 1000, status: 'available' },
    'giftStock/plushie': { available: 1 }, 'giftStock/keychain': { available: 1 }, 'giftStock/nanotoy': { available: 1 },
  });
  const repo = createJoyRepository(store);
  const codes = ['CG-PLUSHIE-AAAAAAAAAA', 'CG-KEYCHAIN-AAAAAAAAAA', 'JOY-NANOTOY-AAAAAAAAAA', 'CASH'];
  await repo.reserveJoyRewards('shop-guest', { codes, orderId: 'order', subtotalSen: 1000 });
  assert.equal(store.dump('giftStock/plushie').available, 0);
  assert.equal(store.dump('giftStock/nanotoy').available, 0);
  await repo.reserveJoyRewards('shop-guest', { codes, orderId: 'order', subtotalSen: 1000 });
  assert.equal(store.dump('giftStock/plushie').available, 0);
  await repo.releaseJoyRewards('shop-guest', { codes, orderId: 'order' });
  await repo.releaseJoyRewards('shop-guest', { codes, orderId: 'order' });
  assert.equal(store.dump('giftStock/plushie').available, 1);
  await repo.reserveJoyRewards('shop-guest', { codes, orderId: 'order', subtotalSen: 1000 });
  await repo.settleJoyRewards({ codes, orderId: 'order', orderStatus: 'confirmed' });
  await repo.settleJoyRewards({ codes, orderId: 'order', orderStatus: 'cancelled' });
  assert.equal(store.dump('giftStock/plushie').available, 0);
  assert.equal(store.dump('joyVouchers/CG-PLUSHIE-AAAAAAAAAA').status, 'used');
});

test('sold-out or unconfigured Garden gift cannot reserve, even using single voucher API', async () => {
  const code = 'CG-KEYCHAIN-AAAAAAAAAA';
  const gift = { code, tierId: 'keychain', source: 'garden', valueSen: 0, minSubtotalSen: 0, status: 'available' };
  for (const seed of [{}, { 'giftStock/keychain': { available: 0 } }]) {
    const store = createMemoryJoyStore({ ...seed, [`joyVouchers/${code}`]: gift });
    const repo = createJoyRepository(store);
    assert.equal((await repo.previewJoyVoucher(code, 100)).valid, false);
    await assert.rejects(repo.reserveJoyVoucher('guest', { code, orderId: 'order', subtotalSen: 100 }));
    assert.equal(store.dump(`joyVouchers/${code}`).status, 'available');
  }
});

test('one sold-out gift rolls back the entire reward bundle', async () => {
  const gift = tierId => ({ code: tierId.toUpperCase(), tierId, source: 'garden', valueSen: 0, minSubtotalSen: 0, status: 'available' });
  const store = createMemoryJoyStore({ 'joyVouchers/KEYCHAIN': gift('keychain'), 'joyVouchers/PLUSHIE': gift('plushie'), 'giftStock/keychain': { available: 1 }, 'giftStock/plushie': { available: 0 } });
  await assert.rejects(createJoyRepository(store).reserveJoyRewards('guest', { codes: ['KEYCHAIN', 'PLUSHIE'], orderId: 'order', subtotalSen: 100 }));
  assert.equal(store.dump('giftStock/keychain').available, 1);
  assert.equal(store.dump('joyVouchers/KEYCHAIN').status, 'available');
});

test('gift redemption deduplicates retries and consumes or restores with its order', async () => {
  const store = createMemoryJoyStore({ 'joyWallets/buyer': { coins: 1000, legacyMigrated: true } });
  const repo = createJoyRepository(store, { createCode: () => 'JOY-NANOTOY-AAAAAAAAAA' });
  const first = await repo.redeemJoyVoucher('buyer', 'nanotoy', 'gift1');
  await repo.redeemJoyVoucher('buyer', 'nanotoy', 'gift1');
  assert.equal(store.dump('joyWallets/buyer').coins, 500);
  await repo.reserveJoyRewards('buyer', { codes: [first.voucher.code], subtotalSen: 1, orderId: 'o' });
  await repo.settleJoyRewards({ codes: [first.voucher.code], orderId: 'o', orderStatus: 'confirmed' });
  assert.equal(store.dump(`joyVouchers/${first.voucher.code}`).status, 'used');
  await assert.rejects(repo.reserveJoyRewards('buyer', { codes: [first.voucher.code], subtotalSen: 1, orderId: 'o2' }));
  await repo.settleJoyRewards({ codes: [first.voucher.code], orderId: 'o', orderStatus: 'cancelled' });
  assert.equal(store.dump(`joyVouchers/${first.voucher.code}`).status, 'used');
});

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

test('Gift Rush fixed date claims survive retries after a lost response', async () => {
  const store = createMemoryJoyStore({ 'joyWallets/guest-1': { coins: 88, legacyMigrated: true } });
  await createJoyRepository(store).awardJoyCoins('guest-1', 20, 'gift-rush-daily:2026-10-03');
  const retried = await createJoyRepository(store).awardJoyCoins('guest-1', 20, 'gift-rush-daily:2026-10-03');
  assert.equal(retried.coins, 108);
  assert.equal(store.dump('joyWallets/guest-1/claims/gift-rush-daily:2026-10-03').amount, 20);
});

test('Gift Rush score tiers top up independently and deduplicate after repository recreation', async () => {
  const store = createMemoryJoyStore({ 'joyWallets/guest-1': { coins: 88, legacyMigrated: true }, 'joyWallets/guest-2': { coins: 88, legacyMigrated: true } });
  await createJoyRepository(store).awardJoyCoins('guest-1', 20, 'gift-rush-daily:2026-10-03');
  await createJoyRepository(store).awardJoyCoins('guest-1', 5, 'gift-rush-score-1500:2026-10-03');
  assert.equal(store.dump('joyWallets/guest-1').coins, 113);
  for (const [amount, id] of [[20, 'daily'], [5, 'score-1500'], [5, 'score-2000'], [5, 'score-2000']]) {
    await createJoyRepository(store).awardJoyCoins('guest-1', amount, 'gift-rush-' + id + ':2026-10-03');
  }
  assert.equal(store.dump('joyWallets/guest-1').coins, 118);
  assert.equal((await createJoyRepository(store).awardJoyCoins('guest-2', 5, 'gift-rush-score-2000:2026-10-03')).coins, 93);
  assert.equal(store.dump('joyWallets/guest-1').coins, 118);
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
