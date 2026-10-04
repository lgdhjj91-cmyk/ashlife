import { isGiftReward, normalizeVoucherCode } from './joyVoucherRules.js';

// Manual support action: do not expire reservations automatically after someone may have paid.
export const recoverAbandonedGiftReservation = async (input, { readVoucher, orderExists, settle, now = Date.now }) => {
  const code = normalizeVoucherCode(input);
  const voucher = await readVoucher(code);
  if (!isGiftReward(voucher) || voucher.status !== 'reserved' || !voucher.reservedOrderId) {
    throw new Error('This code has no reserved gift to recover.');
  }
  const reservedAt = voucher.reservedAt?.toMillis?.() ?? new Date(voucher.reservedAt).getTime();
  if (!Number.isFinite(reservedAt) || now() - reservedAt < 24 * 60 * 60 * 1000) {
    throw new Error('Wait at least 24 hours before recovering an abandoned checkout.');
  }
  if (await orderExists(voucher.reservedOrderId)) {
    throw new Error('An order exists for this gift. Manage its status in Orders instead.');
  }
  await settle({ codes: [code], orderId: voucher.reservedOrderId, orderStatus: 'cancelled' });
};
