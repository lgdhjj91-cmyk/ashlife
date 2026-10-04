import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverAbandonedGiftReservation } from './abandonedGiftReservation.js';

const now = Date.parse('2026-10-04T12:00:00Z');
const voucher = { code: 'CG-KEYCHAIN-AAAAAAAAAA', tierId: 'keychain', status: 'reserved', reservedOrderId: 'old-order', reservedAt: new Date(now - 25 * 3600000) };
const setup = (overrides = {}) => {
  const calls = [];
  return { calls, services: { now: () => now, readVoucher: async () => voucher, orderExists: async () => false, settle: async (value) => { calls.push(value); }, ...overrides } };
};
test('recovery returns an abandoned gift through normal atomic settlement', async () => {
  const { services, calls } = setup();
  await recoverAbandonedGiftReservation(voucher.code, services);
  assert.deepEqual(calls, [{ codes: [voucher.code], orderId: 'old-order', orderStatus: 'cancelled' }]);
});
test('recovery never releases an existing order, recent reservation, or used gift', async () => {
  for (const overrides of [
    { orderExists: async () => true },
    { readVoucher: async () => ({ ...voucher, reservedAt: new Date(now) }) },
    { readVoucher: async () => ({ ...voucher, status: 'used' }) },
    { orderExists: async () => { throw new Error('offline'); } },
  ]) {
    const { services, calls } = setup(overrides);
    await assert.rejects(recoverAbandonedGiftReservation(voucher.code, services));
    assert.equal(calls.length, 0);
  }
});
