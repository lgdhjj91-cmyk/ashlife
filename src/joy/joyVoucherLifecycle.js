import { JOY_REWARD_TIERS, isGiftReward } from './joyVoucherRules.js';

const createError = (code, message) => Object.assign(new Error(message), { code });

const asInteger = (value, maximum = Number.MAX_SAFE_INTEGER) =>
  Math.min(maximum, Math.max(0, Math.round(Number(value) || 0)));

const requireMutation = (mutation) => {
  const mutationId = String(mutation?.mutationId || '').trim();
  if (!mutationId || !mutation?.at) {
    throw createError('invalid-argument', 'Mutation ID and timestamp are required.');
  }
  return { mutationId, at: mutation.at };
};

export const createWalletSnapshot = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...source,
    coins: asInteger(source.coins),
    legacyMigrated: Boolean(source.legacyMigrated),
  };
};

export const applyLegacyMigration = (wallet, coins, mutation) => {
  if (wallet?.legacyMigrated) return wallet;
  const current = createWalletSnapshot(wallet);
  const { mutationId, at } = requireMutation(mutation);
  return {
    ...current,
    coins: current.coins + asInteger(coins, 1_000_000),
    legacyMigrated: true,
    legacyMigratedAt: at,
    updatedAt: at,
    lastMutationId: mutationId,
    lastMutationType: 'migrate',
  };
};

export const applyCoinClaim = (wallet, amount, mutation) => {
  const current = createWalletSnapshot(wallet);
  const safeAmount = asInteger(amount, 500);
  if (!safeAmount) throw createError('invalid-argument', 'Reward amount must be at least one coin.');
  const { mutationId, at } = requireMutation(mutation);
  return {
    ...current,
    coins: current.coins + safeAmount,
    updatedAt: at,
    lastMutationId: mutationId,
    lastMutationType: 'award',
  };
};

export const applyRedemption = (wallet, tierId, code, mutation) => {
  const tier = JOY_REWARD_TIERS.find((candidate) => candidate.id === tierId);
  if (!tier) throw createError('invalid-argument', 'Unknown Joy voucher tier.');
  const current = createWalletSnapshot(wallet);
  if (current.coins < tier.coinCost) {
    throw createError('failed-precondition', 'Not enough Joy Coins for this voucher.');
  }
  const normalizedCode = String(code || '').trim().toUpperCase();
  const ownerUid = String(mutation?.ownerUid || '').trim();
  const { mutationId, at } = requireMutation(mutation);
  if (!normalizedCode || !ownerUid) {
    throw createError('invalid-argument', 'Voucher code and owner are required.');
  }

  return {
    wallet: {
      ...current,
      coins: current.coins - tier.coinCost,
      updatedAt: at,
      lastMutationId: mutationId,
      lastMutationType: 'redeem',
      lastVoucherCode: normalizedCode,
    },
    voucher: {
      code: normalizedCode,
      tierId: tier.id,
      coinCost: tier.coinCost,
      valueSen: tier.valueSen,
      minSubtotalSen: tier.minSubtotalSen,
      ownerUid,
      status: 'available',
      createdAt: at,
      updatedAt: at,
    },
  };
};

export const reserveVoucherRecord = (voucher, reservation) => {
  if (!voucher || typeof voucher !== 'object') {
    throw createError('not-found', 'Voucher was not found.');
  }
  const uid = String(reservation?.uid || '').trim();
  const orderId = String(reservation?.orderId || '').trim();
  if (!uid || !orderId || !reservation?.at) {
    throw createError('invalid-argument', 'Customer, order ID, and timestamp are required.');
  }
  if (
    voucher.status === 'reserved' &&
    voucher.reservedByUid === uid &&
    voucher.reservedOrderId === orderId
  ) {
    return voucher;
  }
  if (voucher.status !== 'available') {
    throw createError('failed-precondition', 'Voucher is unavailable.');
  }
  if (asInteger(reservation.subtotalSen) < asInteger(voucher.minSubtotalSen)) {
    throw createError('failed-precondition', 'The order does not meet the voucher minimum spend.');
  }
  if (isGiftReward(voucher) && asInteger(reservation.subtotalSen) === 0) {
    throw createError('failed-precondition', 'Add a purchased item to receive this gift.');
  }

  return {
    ...voucher,
    status: 'reserved',
    reservedByUid: uid,
    reservedOrderId: orderId,
    reservedSubtotalSen: asInteger(reservation.subtotalSen),
    reservedAt: reservation.at,
    updatedAt: reservation.at,
  };
};

export const settleVoucherRecord = (voucher, settlement) => {
  if (!voucher || typeof voucher !== 'object') {
    throw createError('not-found', 'Voucher was not found.');
  }
  const orderId = String(settlement?.orderId || '').trim();
  const orderStatus = String(settlement?.orderStatus || '').trim();
  if (!orderId || !settlement?.at) {
    throw createError('invalid-argument', 'Order ID and timestamp are required.');
  }
  if (!['confirmed', 'completed', 'rejected', 'cancelled'].includes(orderStatus)) {
    return voucher;
  }
  if (voucher.status === 'available' && ['rejected', 'cancelled'].includes(orderStatus)) return voucher;
  if (!['reserved', 'used'].includes(voucher.status) || voucher.reservedOrderId !== orderId) {
    throw createError('permission-denied', 'This voucher belongs to another order.');
  }
  // Consumed rewards are never reopened by a later order status change.
  if (voucher.status === 'used') return voucher;

  if (['confirmed', 'completed'].includes(orderStatus)) {
    return {
      ...voucher,
      status: 'used',
      usedAt: voucher.usedAt || settlement.at,
      updatedAt: settlement.at,
    };
  }

  const restored = {
    ...voucher,
    status: 'available',
    restoredAt: settlement.at,
    updatedAt: settlement.at,
  };
  delete restored.reservedByUid;
  delete restored.reservedOrderId;
  delete restored.reservedSubtotalSen;
  delete restored.reservedAt;
  delete restored.usedAt;
  return restored;
};
