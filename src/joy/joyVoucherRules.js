export const JOY_VOUCHER_TIERS = Object.freeze([
  Object.freeze({ id: 'rm1', coinCost: 100, valueSen: 100, minSubtotalSen: 1000 }),
  Object.freeze({ id: 'rm2', coinCost: 200, valueSen: 200, minSubtotalSen: 1500 }),
  Object.freeze({ id: 'rm5', coinCost: 500, valueSen: 500, minSubtotalSen: 2000 }),
]);

export const JOY_GIFT_TIERS = Object.freeze([
  Object.freeze({ id: 'nanotoy', coinCost: 500, valueSen: 0, minSubtotalSen: 0 }),
  Object.freeze({ id: 'keychain', coinCost: 500, valueSen: 0, minSubtotalSen: 0 }),
]);
export const JOY_REWARD_TIERS = Object.freeze([...JOY_VOUCHER_TIERS, ...JOY_GIFT_TIERS]);
// Fulfilment categories are separate from the rewards purchasable with Joy Coins.
export const GIFT_TIERS = Object.freeze([...JOY_GIFT_TIERS, Object.freeze({ id: 'plushie', gardenExclusive: true })]);
export const isGiftReward = (reward) => GIFT_TIERS.some((tier) => tier.id === reward?.tierId);
export const isGardenReward = (reward) => reward?.source === 'garden' || String(reward?.code || '').startsWith('CG-');
export const rewardName = (reward, language = 'en') => {
  const id = reward?.tierId || reward?.id;
  if (id === 'nanotoy') return language === 'zh' ? '迷你积木玩具' : 'Nano block toy';
  if (id === 'keychain') return language === 'zh' ? '卡通钥匙扣' : 'Cartoon keychain';
  if (id === 'plushie') return language === 'zh' ? '小毛绒玩具' : 'Small plushie';
  return `RM${(Number(reward?.valueSen || 0) / 100).toFixed(0)}`;
};

const toSen = (value) => Math.max(0, Math.round(Number(value) || 0));

export const normalizeVoucherCode = (value) => {
  const tokens = String(value || '')
    .toUpperCase()
    .trim()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  if (tokens.length >= 3 && ((tokens[0] === 'JOY' && /^(RM\d+|NANOTOY|KEYCHAIN)$/.test(tokens[1])) || (tokens[0] === 'CG' && /^(NANOTOY|KEYCHAIN|PLUSHIE)$/.test(tokens[1])))) {
    return `${tokens[0]}-${tokens[1]}-${tokens.slice(2).join('')}`;
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

  if (isGiftReward(voucher) && toSen(subtotalSen) === 0) {
    return { eligible: false, reason: 'purchase' };
  }

  if (toSen(subtotalSen) < toSen(voucher.minSubtotalSen)) {
    return { eligible: false, reason: 'minimum' };
  }

  return { eligible: true, reason: '' };
};

export const selectBestVoucher = (vouchers, subtotalSen) => {
  const eligible = (Array.isArray(vouchers) ? vouchers : [])
    .filter((voucher) => !isGiftReward(voucher) && getVoucherEligibility(voucher, subtotalSen).eligible)
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
