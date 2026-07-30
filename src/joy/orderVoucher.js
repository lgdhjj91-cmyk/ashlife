import { getVoucherEligibility, normalizeVoucherCode } from './joyVoucherRules.js';

export const buildOrderVoucherSnapshot = (voucher, subtotalSen) => {
  if (!getVoucherEligibility(voucher, subtotalSen).eligible) return null;
  const safeSubtotal = Math.max(0, Math.round(Number(subtotalSen) || 0));
  const valueSen = Math.max(0, Math.round(Number(voucher.valueSen) || 0));

  return {
    code: normalizeVoucherCode(voucher.code),
    valueSen,
    minSubtotalSen: Math.max(0, Math.round(Number(voucher.minSubtotalSen) || 0)),
    coinCost: Math.max(0, Math.round(Number(voucher.coinCost) || 0)),
    discountSen: Math.min(safeSubtotal, valueSen),
    status: 'reserved',
  };
};

export const createCheckoutOrderId = (
  date = new Date(),
  randomSource = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    }
    return Math.random().toString(36).slice(2, 10);
  }
) => {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = String(randomSource()).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase().padEnd(8, '0');
  return `ASH-${datePart}-${suffix}`;
};
