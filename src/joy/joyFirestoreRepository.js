import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { createJoyVoucherCode } from './joyVoucherCode.js';
import {
  applyCoinClaim,
  applyLegacyMigration,
  applyRedemption,
  createWalletSnapshot,
  reserveVoucherRecord,
  settleVoucherRecord,
} from './joyVoucherLifecycle.js';
import { GIFT_TIERS, getVoucherEligibility, isGardenReward, isGiftReward, normalizeVoucherCode } from './joyVoucherRules.js';

const createError = (code, message) => Object.assign(new Error(message), { code });

const requireText = (value, label) => {
  const text = String(value || '').trim();
  if (!text) throw createError('invalid-argument', `${label} is required.`);
  return text;
};

const walletPath = (uid) => `joyWallets/${uid}`;
const claimPath = (uid, claimId) => `${walletPath(uid)}/claims/${claimId}`;
const redemptionPath = (uid, requestId) => `${walletPath(uid)}/redemptions/${requestId}`;
const voucherPath = (code) => `joyVouchers/${code}`;
const stockPath = (tierId) => `giftStock/${tierId}`;
const hasGiftStock = (stock) => Number.isSafeInteger(stock?.available) && stock.available > 0;

export const createFirestoreJoyStore = (firestore) => ({
  transact(operation) {
    return runTransaction(firestore, (firestoreTransaction) =>
      operation({
        async get(path) {
          const snapshot = await firestoreTransaction.get(doc(firestore, path));
          return snapshot.exists() ? snapshot.data() : undefined;
        },
        set(path, value) {
          firestoreTransaction.set(doc(firestore, path), value);
        },
      })
    );
  },
  async get(path) {
    const snapshot = await getDoc(doc(firestore, path));
    return snapshot.exists() ? snapshot.data() : undefined;
  },
  timestamp: serverTimestamp,
  listen(path, onValue, onError) {
    return onSnapshot(
      doc(firestore, path),
      (snapshot) => onValue(snapshot.exists() ? snapshot.data() : undefined),
      onError
    );
  },
  listenOwnedVouchers(uid, onValue, onError) {
    const ownedVouchers = query(
      collection(firestore, 'joyVouchers'),
      where('ownerUid', '==', uid)
    );
    return onSnapshot(
      ownedVouchers,
      (snapshot) => onValue(snapshot.docs.map((voucher) => voucher.data())),
      onError
    );
  },
  listenHistory(uid, kind, onValue, onError) {
    return onSnapshot(
      query(collection(firestore, `${walletPath(uid)}/${kind}`), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => onValue(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }))),
      onError
    );
  },
});

export const createJoyRepository = (store, { createCode = createJoyVoucherCode } = {}) => {
  if (!store?.transact || !store?.get || !store?.timestamp) {
    throw createError('invalid-argument', 'A Joy voucher store is required.');
  }

  const migrateLegacyJoyCoins = async (uidValue, coins, migrationId = 'legacy-v1') => {
    const uid = requireText(uidValue, 'Customer');
    const mutationId = requireText(migrationId, 'Migration ID');
    return store.transact(async (transaction) => {
      const current = await transaction.get(walletPath(uid));
      if (current?.legacyMigrated) return { coins: createWalletSnapshot(current).coins };
      const at = store.timestamp();
      const wallet = applyLegacyMigration(current, coins, { mutationId, at });
      transaction.set(walletPath(uid), wallet);
      return { coins: wallet.coins };
    });
  };

  const awardJoyCoins = async (uidValue, amount, claimIdValue) => {
    const uid = requireText(uidValue, 'Customer');
    const claimId = requireText(claimIdValue, 'Claim ID');
    return store.transact(async (transaction) => {
      const [claim, current] = await Promise.all([
        transaction.get(claimPath(uid, claimId)),
        transaction.get(walletPath(uid)),
      ]);
      if (claim) return { coins: createWalletSnapshot(current).coins };

      const at = store.timestamp();
      const wallet = applyCoinClaim(current, amount, { mutationId: claimId, at });
      transaction.set(walletPath(uid), wallet);
      transaction.set(claimPath(uid, claimId), { amount: wallet.coins - createWalletSnapshot(current).coins, createdAt: at });
      return { coins: wallet.coins };
    });
  };

  const resetJoyCoins = async (uidValue) => {
    const uid = requireText(uidValue, 'Customer');
    return store.transact(async (transaction) => {
      const current = createWalletSnapshot(await transaction.get(walletPath(uid)));
      const at = store.timestamp();
      const wallet = {
        ...current,
        coins: 0,
        updatedAt: at,
        lastMutationId: `reset-${String(at)}`,
        lastMutationType: 'reset',
      };
      transaction.set(walletPath(uid), wallet);
      return { coins: 0 };
    });
  };

  const redeemJoyVoucher = async (uidValue, tierIdValue, requestIdValue) => {
    const uid = requireText(uidValue, 'Customer');
    const tierId = requireText(tierIdValue, 'Voucher tier');
    const requestId = requireText(requestIdValue, 'Redemption request ID');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = createCode(tierId);
      try {
        return await store.transact(async (transaction) => {
          const request = await transaction.get(redemptionPath(uid, requestId));
          const current = await transaction.get(walletPath(uid));
          if (request) {
            const voucher = await transaction.get(voucherPath(request.code));
            if (!voucher) throw createError('data-loss', 'The redeemed voucher could not be found.');
            return { coins: createWalletSnapshot(current).coins, voucher };
          }

          if (await transaction.get(voucherPath(code))) {
            throw createError('joy-code-collision', 'Voucher code collision.');
          }

          if (GIFT_TIERS.some((tier) => tier.id === tierId)) {
            const stock = await transaction.get(stockPath(tierId));
            if (stock && !hasGiftStock(stock)) throw createError('out-of-stock', 'This gift is currently out of stock. Your coins have not been spent.');
          }

          const at = store.timestamp();
          const result = applyRedemption(current, tierId, code, {
            mutationId: requestId,
            ownerUid: uid,
            at,
          });
          transaction.set(walletPath(uid), result.wallet);
          transaction.set(voucherPath(code), result.voucher);
          transaction.set(redemptionPath(uid, requestId), { code, tierId, createdAt: at });
          return { coins: result.wallet.coins, voucher: result.voucher };
        });
      } catch (error) {
        if (error?.code !== 'joy-code-collision' || attempt === 4) throw error;
      }
    }
    throw createError('aborted', 'Could not generate a unique voucher code.');
  };

  const previewJoyVoucher = async (codeValue, subtotalSen) => {
    const code = normalizeVoucherCode(codeValue);
    if (!code) return { valid: false, reason: 'invalid', voucher: null };
    const voucher = await store.get(voucherPath(code));
    const eligibility = getVoucherEligibility(voucher, subtotalSen);
    if (eligibility.eligible && isGiftReward(voucher)) {
      const stock = await store.get(stockPath(voucher.tierId));
      if ((stock || isGardenReward(voucher)) && !hasGiftStock(stock)) {
        return { valid: false, reason: 'stock', voucher };
      }
    }
    return {
      valid: eligibility.eligible,
      reason: eligibility.reason,
      voucher: voucher || null,
    };
  };

  const reserveJoyVoucher = async (uidValue, reservation = {}) => {
    const result = await reserveJoyRewards(uidValue, { ...reservation, codes: [reservation.code] });
    return { voucher: result.rewards[0] };
  };

  const releaseJoyVoucher = async (uidValue, reservation = {}) => {
    const result = await releaseJoyRewards(uidValue, { ...reservation, codes: [reservation.code] });
    return { voucher: result.rewards[0] };
  };

  const settleJoyVoucher = async (settlement = {}) => {
    const result = await settleJoyRewards({ ...settlement, codes: [settlement.code] });
    return { voucher: result.rewards[0] };
  };

  const mutateRewards = async (codesValue, operation) => {
    const codes = (Array.isArray(codesValue) ? codesValue : []).map(normalizeVoucherCode);
    if (codes.length > GIFT_TIERS.length + 1 || codes.some((code) => !code) || new Set(codes).size !== codes.length) {
      throw createError('invalid-argument', 'Use one cash voucher and one of each gift per order.');
    }
    if (!codes.length) return { rewards: [] };
    return store.transact(async (transaction) => {
      const records = await Promise.all(codes.map((code) => transaction.get(voucherPath(code))));
      const groups = records.map((record) => isGiftReward(record) ? record.tierId : 'cash');
      if (new Set(groups).size !== groups.length) {
        throw createError('failed-precondition', 'Only one reward of each type can be used per order.');
      }
      const at = store.timestamp();
      const rewards = records.map((record) => operation(record, at));
      // All reads precede writes; a sold-out gift aborts the entire voucher bundle.
      const stocks = await Promise.all(records.map((record) => isGiftReward(record) ? transaction.get(stockPath(record.tierId)) : undefined));
      records.forEach((before, index) => {
        if (!isGiftReward(before)) return;
        const after = rewards[index];
        const stock = stocks[index];
        if (before.status === 'available' && after.status === 'reserved') {
          // Preserve existing Joy-only deployments until gift allocation is configured.
          if (!stock && !isGardenReward(before)) return;
          if (!hasGiftStock(stock)) throw createError('out-of-stock', 'This gift is currently unavailable. Remove its code to continue, or try again after a restock.');
          after.stockReserved = true;
          transaction.set(stockPath(before.tierId), { ...stock, available: stock.available - 1, lastVoucherCode: codes[index], updatedAt: at });
        } else if (before.status === 'reserved' && after.status === 'available' && before.stockReserved) {
          if (!Number.isSafeInteger(stock?.available) || stock.available < 0) throw createError('failed-precondition', 'Gift stock needs attention before this reservation can be released.');
          delete after.stockReserved;
          transaction.set(stockPath(before.tierId), { ...stock, available: stock.available + 1, lastVoucherCode: codes[index], updatedAt: at });
        }
      });
      rewards.forEach((record, index) => transaction.set(voucherPath(codes[index]), record));
      return { rewards };
    });
  };

  const reserveJoyRewards = async (uidValue, reservation = {}) => {
    const uid = requireText(uidValue, 'Customer');
    const orderId = requireText(reservation.orderId, 'Order ID');
    return mutateRewards(reservation.codes, (record, at) => reserveVoucherRecord(record, {
      uid, orderId, subtotalSen: reservation.subtotalSen, at,
    }));
  };

  const releaseJoyRewards = async (uidValue, reservation = {}) => {
    const uid = requireText(uidValue, 'Customer');
    const orderId = requireText(reservation.orderId, 'Order ID');
    return mutateRewards(reservation.codes, (record, at) => {
      if (record?.status === 'available') return record;
      if (record?.status !== 'reserved' || record?.reservedByUid !== uid) throw createError('permission-denied', 'This reservation cannot be released by this customer.');
      return settleVoucherRecord(record, { orderId, orderStatus: 'cancelled', at });
    });
  };

  const settleJoyRewards = async (settlement = {}) => {
    const orderId = requireText(settlement.orderId, 'Order ID');
    return mutateRewards(settlement.codes, (record, at) => settleVoucherRecord(record, {
      orderId, orderStatus: settlement.orderStatus, at,
    }));
  };

  const subscribeJoyWallet = (uidValue, handlers = {}) => {
    const uid = requireText(uidValue, 'Customer');
    if (!store.listen || !store.listenOwnedVouchers) {
      throw createError('unimplemented', 'This store does not support live wallet updates.');
    }
    let wallet;
    let vouchers = [];
    const emit = () => {
      const voucherMap = Object.fromEntries(vouchers.map((voucher) => [voucher.code, voucher]));
      handlers.onValue?.({ ...(wallet || {}), vouchers: voucherMap });
    };
    const onError = (error) => handlers.onError?.(error);
    const stopWallet = store.listen(walletPath(uid), (value) => {
      wallet = value;
      emit();
    }, onError);
    const stopVouchers = store.listenOwnedVouchers(uid, (value) => {
      vouchers = value;
      emit();
    }, onError);
    return () => {
      stopWallet();
      stopVouchers();
    };
  };

  const subscribeJoyHistory = (uidValue, handlers = {}) => {
    const uid = requireText(uidValue, 'Customer');
    const values = { claims: [], redemptions: [] };
    const loaded = new Set();
    const historyStops = ['claims', 'redemptions'].map((kind) =>
      store.listenHistory(uid, kind, (entries) => {
        values[kind] = entries;
        loaded.add(kind);
        if (loaded.size === 2) handlers.onValue?.({ ...values });
      }, handlers.onError)
    );
    return () => historyStops.forEach((stop) => stop());
  };

  return {
    migrateLegacyJoyCoins,
    awardJoyCoins,
    resetJoyCoins,
    redeemJoyVoucher,
    previewJoyVoucher,
    reserveJoyVoucher,
    releaseJoyVoucher,
    settleJoyVoucher,
    reserveJoyRewards,
    releaseJoyRewards,
    settleJoyRewards,
    subscribeJoyWallet,
    subscribeJoyHistory,
  };
};
