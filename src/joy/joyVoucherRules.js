export const JOY_VOUCHER_TIERS = Object.freeze([
  Object.freeze({ id: 'rm1', coinCost: 100, valueSen: 100, minSubtotalSen: 1000 }),
  Object.freeze({ id: 'rm2', coinCost: 200, valueSen: 200, minSubtotalSen: 1500 }),
  Object.freeze({ id: 'rm5', coinCost: 500, valueSen: 500, minSubtotalSen: 2000 }),
]);

const toSen = (value) => Math.max(0, Math.round(Number(value) || 0));

export const normalizeVoucherCode = (value) => {
  const tokens = String(value || '')
    .toUpperCase()
    .trim()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  if (tokens.length >= 3 && tokens[0] === 'JOY' && /^RM\d+$/.test(tokens[1])) {
    return `JOY-${tokens[1]}-${tokens.slice(2).join('')}`;
  }

  return tokens.join('-');
};

export const getVoucherEligibility = (voucher, subtotalSen) => {
  if (!voucher || typeof voucher !== 'object') {
    return { eligible: false, reason: 'invalid' };
  }

  const status = voucher.status || 'available';
  if (status !== 'available') {
    return { eligible: false, reason: status === 'reserved' ? 'reserved' : status === 'used' ? 'used' : 'invalid' };
  }

  if (toSen(subtotalSen) < toSen(voucher.minSubtotalSen)) {
    return { eligible: false, reason: 'minimum' };
  }

  return { eligible: true, reason: '' };
};

export const selectBestVoucher = (vouchers, subtotalSen) => {
  const eligible = (Array.isArray(vouchers) ? vouchers : [])
    .filter((voucher) => getVoucherEligibility(voucher, subtotalSen).eligible)
    .sort((left, right) => {
      const valueDifference = toSen(right.valueSen) - toSen(left.valueSen);
      if (valueDifference !== 0) return valueDifference;
      return String(left.code || '').localeCompare(String(right.code || ''));
    });

  return eligible[0] || null;
};

export const calculateVoucherTotals = ({ subtotalSen, deliveryFeeSen = 0, voucher = null }) => {
  const safeSubtotal = toSen(subtotalSen);
  const safeDeliveryFee = toSen(deliveryFeeSen);
  const eligible = getVoucherEligibility(voucher, safeSubtotal).eligible;
  const discountSen = eligible ? Math.min(safeSubtotal, toSen(voucher.valueSen)) : 0;

  return {
    subtotalSen: safeSubtotal,
    discountSen,
    deliveryFeeSen: safeDeliveryFee,
    totalSen: safeSubtotal - discountSen + safeDeliveryFee,
  };
};

export const rmToSen = (value) => toSen(Number(value) * 100);

export const senToRm = (value) => toSen(value) / 100;
