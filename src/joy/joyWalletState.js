import { getVoucherEligibility, selectBestVoucher } from './joyVoucherRules.js';

const normalizeTimestamp = (value) => {
  if (!value) return value;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
};

const normalizeVoucherTimestamps = (voucher) => {
  const normalized = { ...voucher };
  for (const field of ['createdAt', 'updatedAt', 'reservedAt', 'usedAt', 'restoredAt']) {
    if (field in normalized) normalized[field] = normalizeTimestamp(normalized[field]);
  }
  return normalized;
};

export const normalizeJoyWallet = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  const voucherSource = source.vouchers && typeof source.vouchers === 'object' ? source.vouchers : {};
  const vouchers = Object.entries(voucherSource)
    .map(([code, voucher]) => normalizeVoucherTimestamps({
      ...(voucher && typeof voucher === 'object' ? voucher : {}),
      code: voucher?.code || code,
    }))
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));

  return {
    coins: Math.max(0, Math.round(Number(source.coins) || 0)),
    vouchers,
    legacyMigrated: Boolean(source.legacyMigrated),
    updatedAt: normalizeTimestamp(source.updatedAt),
  };
};

export const resolveVoucherSelection = ({
  vouchers,
  subtotalSen,
  current = null,
  suppressed = false,
}) => {
  if (suppressed) return null;
  if (current && getVoucherEligibility(current, subtotalSen).eligible) return current;
  return selectBestVoucher(vouchers, subtotalSen);
};

export const createJoyRequestId = (prefix = 'joy') => {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
};
