const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onValueUpdated, onValueWritten } = require('firebase-functions/v2/database');
const {
  JOY_VOUCHER_TIERS,
  awardCoins,
  migrateLegacyCoins,
  normalizeWallet,
  redeemVoucher,
  reserveVoucher,
  settleVoucher,
} = require('./lib/joyVoucherCore');

initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

const getDb = () => getDatabase();

const requireUid = (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'A guest or customer session is required.');
  }
  return request.auth.uid;
};

const asHttpsError = (error) => {
  if (error instanceof HttpsError) return error;
  const allowedCodes = new Set([
    'invalid-argument',
    'failed-precondition',
    'not-found',
    'permission-denied',
    'already-exists',
  ]);
  return new HttpsError(allowedCodes.has(error?.code) ? error.code : 'internal', error?.message || 'Joy Rewards request failed.');
};

const normalizeVoucherCode = (value) => {
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

const createVoucherCode = (tier) =>
  `JOY-RM${tier.valueSen / 100}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

const publicVoucher = (voucher) => {
  if (!voucher) return null;
  return {
    code: voucher.code,
    valueSen: voucher.valueSen,
    minSubtotalSen: voucher.minSubtotalSen,
    coinCost: voucher.coinCost,
    status: voucher.status,
    reservedOrderId: voucher.reservedOrderId || '',
    createdAt: voucher.createdAt || '',
    updatedAt: voucher.updatedAt || '',
  };
};

exports.migrateLegacyJoyCoins = onCall(async (request) => {
  try {
    const uid = requireUid(request);
    const amount = Math.min(1_000_000, Math.max(0, Math.round(Number(request.data?.coins) || 0)));
    const walletRef = getDb().ref(`joyWallets/${uid}`);
    const result = await walletRef.transaction((current) =>
      migrateLegacyCoins(current, amount, new Date().toISOString())
    );
    return { coins: normalizeWallet(result.snapshot.val()).coins };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.awardJoyCoins = onCall(async (request) => {
  try {
    const uid = requireUid(request);
    const { amount, claimId } = request.data || {};
    const walletRef = getDb().ref(`joyWallets/${uid}`);
    const result = await walletRef.transaction((current) =>
      awardCoins(current, amount, claimId, new Date().toISOString())
    );
    return { coins: normalizeWallet(result.snapshot.val()).coins };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.resetJoyCoins = onCall(async (request) => {
  try {
    const uid = requireUid(request);
    const now = new Date().toISOString();
    const walletRef = getDb().ref(`joyWallets/${uid}`);
    const result = await walletRef.transaction((current) => ({
      ...normalizeWallet(current),
      coins: 0,
      resetAt: now,
      updatedAt: now,
    }));
    return { coins: normalizeWallet(result.snapshot.val()).coins };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.redeemJoyVoucher = onCall(async (request) => {
  try {
    const uid = requireUid(request);
    const tier = JOY_VOUCHER_TIERS[request.data?.tierId];
    if (!tier) throw Object.assign(new Error('Unknown Joy voucher tier.'), { code: 'invalid-argument' });

    const requestId = String(request.data?.requestId || '').trim();
    if (!requestId) throw Object.assign(new Error('A redemption request ID is required.'), { code: 'invalid-argument' });

    const candidateCode = createVoucherCode(tier);
    const walletRef = getDb().ref(`joyWallets/${uid}`);
    const walletResult = await walletRef.transaction((current) =>
      redeemVoucher(current, tier.id, requestId, candidateCode, new Date().toISOString()).wallet
    );
    const wallet = normalizeWallet(walletResult.snapshot.val());
    const code = wallet.redemptions[requestId]?.code;
    const voucher = wallet.vouchers[code];
    if (!code || !voucher) throw new Error('Voucher redemption could not be completed.');

    const voucherRef = getDb().ref(`joyVouchers/${code}`);
    const registryResult = await voucherRef.transaction((current) => {
      if (!current) return { ...voucher, ownerUid: uid };
      if (current.ownerUid === uid && current.code === code) return current;
      return undefined;
    });
    if (!registryResult.committed) {
      throw Object.assign(new Error('Voucher code collision. Please retry with a new request.'), { code: 'already-exists' });
    }

    return { coins: wallet.coins, voucher: publicVoucher(registryResult.snapshot.val()) };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.previewJoyVoucher = onCall(async (request) => {
  try {
    requireUid(request);
    const code = normalizeVoucherCode(request.data?.code);
    if (!code) throw Object.assign(new Error('Enter a voucher code.'), { code: 'invalid-argument' });

    const snapshot = await getDb().ref(`joyVouchers/${code}`).get();
    if (!snapshot.exists()) return { valid: false, reason: 'invalid', voucher: null };

    const voucher = snapshot.val();
    const subtotalSen = Math.max(0, Math.round(Number(request.data?.subtotalSen) || 0));
    const reason =
      voucher.status !== 'available'
        ? voucher.status
        : subtotalSen < Number(voucher.minSubtotalSen || 0)
          ? 'minimum'
          : '';

    return { valid: !reason, reason, voucher: publicVoucher(voucher) };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.reserveJoyVoucher = onCall(async (request) => {
  try {
    const uid = requireUid(request);
    const code = normalizeVoucherCode(request.data?.code);
    const orderId = String(request.data?.orderId || '').trim();
    const subtotalSen = Math.max(0, Math.round(Number(request.data?.subtotalSen) || 0));
    if (!code || !orderId) {
      throw Object.assign(new Error('Voucher code and order ID are required.'), { code: 'invalid-argument' });
    }

    const voucherRef = getDb().ref(`joyVouchers/${code}`);
    const result = await voucherRef.transaction((current) =>
      reserveVoucher(current, { uid, orderId, subtotalSen, now: new Date().toISOString() })
    );
    if (!result.committed) throw Object.assign(new Error('Voucher is unavailable.'), { code: 'failed-precondition' });
    return { voucher: publicVoucher(result.snapshot.val()) };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.releaseJoyVoucher = onCall(async (request) => {
  try {
    const uid = requireUid(request);
    const code = normalizeVoucherCode(request.data?.code);
    const orderId = String(request.data?.orderId || '').trim();
    if (!code || !orderId) {
      throw Object.assign(new Error('Voucher code and order ID are required.'), { code: 'invalid-argument' });
    }

    const orderSnapshot = await getDb().ref(`orders/${orderId}`).get();
    if (orderSnapshot.exists()) return { released: false, reason: 'order-exists' };

    const voucherRef = getDb().ref(`joyVouchers/${code}`);
    const result = await voucherRef.transaction((current) => {
      if (!current) return undefined;
      if (current.status === 'available') return current;
      if (current.status !== 'reserved' || current.reservedByUid !== uid || current.reservedOrderId !== orderId) {
        throw Object.assign(new Error('This reservation belongs to another checkout.'), { code: 'permission-denied' });
      }
      return settleVoucher(current, 'cancelled', new Date().toISOString());
    });
    return { released: result.committed, voucher: publicVoucher(result.snapshot.val()) };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.mirrorJoyVoucherToWallet = onValueWritten('/joyVouchers/{code}', async (event) => {
  const before = event.data.before.val();
  const after = event.data.after.val();
  const ownerUid = after?.ownerUid || before?.ownerUid;
  if (!ownerUid) return null;

  const walletVoucherRef = getDb().ref(`joyWallets/${ownerUid}/vouchers/${event.params.code}`);
  if (!after) return walletVoucherRef.remove();
  return walletVoucherRef.set(publicVoucher(after));
});

exports.settleOrderJoyVoucher = onValueUpdated('/orders/{orderId}/status', async (event) => {
  const orderStatus = event.data.after.val();
  if (!['confirmed', 'completed', 'rejected', 'cancelled'].includes(orderStatus)) return null;

  const orderId = event.params.orderId;
  const orderRef = getDb().ref(`orders/${orderId}`);
  const orderSnapshot = await orderRef.get();
  const order = orderSnapshot.val();
  const code = normalizeVoucherCode(order?.voucher?.code);
  if (!code) return null;

  const voucherRef = getDb().ref(`joyVouchers/${code}`);
  const result = await voucherRef.transaction((current) => {
    if (!current) return undefined;
    const belongsToOrder = current.reservedOrderId === orderId || order?.voucher?.code === current.code;
    if (!belongsToOrder) return undefined;
    return settleVoucher(current, orderStatus, new Date().toISOString());
  });

  if (result.committed) {
    await orderRef.child('voucher/status').set(result.snapshot.val().status);
  }
  return null;
});
