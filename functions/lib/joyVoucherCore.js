const JOY_VOUCHER_TIERS = Object.freeze({
  rm1: Object.freeze({ id: 'rm1', coinCost: 100, valueSen: 100, minSubtotalSen: 1000 }),
  rm2: Object.freeze({ id: 'rm2', coinCost: 200, valueSen: 200, minSubtotalSen: 1500 }),
  rm5: Object.freeze({ id: 'rm5', coinCost: 500, valueSen: 500, minSubtotalSen: 2000 }),
});

const asInteger = (value, maximum = Number.MAX_SAFE_INTEGER) =>
  Math.min(maximum, Math.max(0, Math.round(Number(value) || 0)));

const createError = (code, message) => Object.assign(new Error(message), { code });

const normalizeWallet = (wallet) => ({
  ...(wallet && typeof wallet === 'object' ? wallet : {}),
  coins: asInteger(wallet?.coins),
  vouchers: wallet?.vouchers && typeof wallet.vouchers === 'object' ? wallet.vouchers : {},
  claims: wallet?.claims && typeof wallet.claims === 'object' ? wallet.claims : {},
  redemptions: wallet?.redemptions && typeof wallet.redemptions === 'object' ? wallet.redemptions : {},
});

const migrateLegacyCoins = (wallet, amount, now = new Date().toISOString()) => {
  const next = normalizeWallet(wallet);
  if (next.legacyMigrated) return next;

  return {
    ...next,
    coins: next.coins + asInteger(amount, 1_000_000),
    legacyMigrated: true,
    legacyMigratedAt: now,
    updatedAt: now,
  };
};

const awardCoins = (wallet, amount, claimId, now = new Date().toISOString()) => {
  const next = normalizeWallet(wallet);
  const normalizedClaimId = String(claimId || '').trim();
  const safeAmount = asInteger(amount, 500);
  if (!normalizedClaimId) throw createError('invalid-argument', 'A reward claim ID is required.');
  if (!safeAmount) throw createError('invalid-argument', 'Reward amount must be at least one coin.');
  if (next.claims[normalizedClaimId]) return next;

  return {
    ...next,
    coins: next.coins + safeAmount,
    claims: {
      ...next.claims,
      [normalizedClaimId]: { amount: safeAmount, createdAt: now },
    },
    updatedAt: now,
  };
};

const redeemVoucher = (wallet, tierId, requestId, code, now = new Date().toISOString()) => {
  const next = normalizeWallet(wallet);
  const tier = JOY_VOUCHER_TIERS[tierId];
  const normalizedRequestId = String(requestId || '').trim();
  const normalizedCode = String(code || '').trim().toUpperCase();

  if (!tier) throw createError('invalid-argument', 'Unknown Joy voucher tier.');
  if (!normalizedRequestId || !normalizedCode) {
    throw createError('invalid-argument', 'Redemption request and voucher code are required.');
  }

  const previousCode = next.redemptions[normalizedRequestId]?.code;
  if (previousCode) {
    return {
      wallet: next,
      voucher: next.vouchers[previousCode],
    };
  }

  if (next.coins < tier.coinCost) {
    throw createError('failed-precondition', 'Not enough Joy Coins for this voucher.');
  }

  const voucher = {
    code: normalizedCode,
    ...tier,
    status: 'available',
    createdAt: now,
    updatedAt: now,
  };
  const updatedWallet = {
    ...next,
    coins: next.coins - tier.coinCost,
    vouchers: {
      ...next.vouchers,
      [normalizedCode]: voucher,
    },
    redemptions: {
      ...next.redemptions,
      [normalizedRequestId]: { code: normalizedCode, tierId, createdAt: now },
    },
    updatedAt: now,
  };

  return { wallet: updatedWallet, voucher };
};

const reserveVoucher = (
  voucher,
  { uid, orderId, subtotalSen, now = new Date().toISOString() }
) => {
  if (!voucher || typeof voucher !== 'object') {
    throw createError('not-found', 'Voucher was not found.');
  }
  if (voucher.status === 'reserved' && voucher.reservedByUid === uid && voucher.reservedOrderId === orderId) {
    return voucher;
  }
  if (voucher.status !== 'available') {
    throw createError('failed-precondition', 'Voucher is unavailable.');
  }
  if (asInteger(subtotalSen) < asInteger(voucher.minSubtotalSen)) {
    throw createError('failed-precondition', 'The order does not meet the voucher minimum spend.');
  }
  if (!uid || !orderId) {
    throw createError('invalid-argument', 'A customer and order ID are required.');
  }

  return {
    ...voucher,
    status: 'reserved',
    reservedByUid: uid,
    reservedOrderId: orderId,
    reservedAt: now,
    updatedAt: now,
  };
};

const settleVoucher = (voucher, orderStatus, now = new Date().toISOString()) => {
  if (!voucher || typeof voucher !== 'object') return voucher;
  if (!['confirmed', 'completed', 'rejected', 'cancelled'].includes(orderStatus)) return voucher;

  if (['confirmed', 'completed'].includes(orderStatus)) {
    return {
      ...voucher,
      status: 'used',
      usedAt: voucher.usedAt || now,
      updatedAt: now,
    };
  }

  const restored = {
    ...voucher,
    status: 'available',
    restoredAt: now,
    updatedAt: now,
  };
  delete restored.reservedByUid;
  delete restored.reservedOrderId;
  delete restored.reservedAt;
  delete restored.usedAt;
  return restored;
};

module.exports = {
  JOY_VOUCHER_TIERS,
  awardCoins,
  migrateLegacyCoins,
  normalizeWallet,
  redeemVoucher,
  reserveVoucher,
  settleVoucher,
};
