import {
  collection,
  doc,
  getDoc,
  onSnapshot,
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
import { getVoucherEligibility, normalizeVoucherCode } from './joyVoucherRules.js';

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
    return {
      valid: eligibility.eligible,
      reason: eligibility.reason,
      voucher: voucher || null,
    };
  };

  const reserveJoyVoucher = async (uidValue, reservation = {}) => {
    const uid = requireText(uidValue, 'Customer');
    const code = normalizeVoucherCode(reservation.code);
    const orderId = requireText(reservation.orderId, 'Order ID');
    if (!code) throw createError('invalid-argument', 'Voucher code is required.');
    return store.transact(async (transaction) => {
      const current = await transaction.get(voucherPath(code));
      const voucher = reserveVoucherRecord(current, {
        uid,
        orderId,
        subtotalSen: reservation.subtotalSen,
        at: store.timestamp(),
      });
      transaction.set(voucherPath(code), voucher);
      return { voucher };
    });
  };

  const releaseJoyVoucher = async (uidValue, reservation = {}) => {
    const uid = requireText(uidValue, 'Customer');
    const code = normalizeVoucherCode(reservation.code);
    const orderId = requireText(reservation.orderId, 'Order ID');
    if (!code) throw createError('invalid-argument', 'Voucher code is required.');
    return store.transact(async (transaction) => {
      const current = await transaction.get(voucherPath(code));
      if (current?.status === 'available') return { voucher: current };
      if (current?.reservedByUid !== uid) {
        throw createError('permission-denied', 'This voucher reservation belongs to another customer.');
      }
      const voucher = settleVoucherRecord(current, {
        orderId,
        orderStatus: 'cancelled',
        at: store.timestamp(),
      });
      transaction.set(voucherPath(code), voucher);
      return { voucher };
    });
  };

  const settleJoyVoucher = async (settlement = {}) => {
    const code = normalizeVoucherCode(settlement.code);
    const orderId = requireText(settlement.orderId, 'Order ID');
    if (!code) throw createError('invalid-argument', 'Voucher code is required.');
    return store.transact(async (transaction) => {
      const current = await transaction.get(voucherPath(code));
      const voucher = settleVoucherRecord(current, {
        orderId,
        orderStatus: settlement.orderStatus,
        at: store.timestamp(),
      });
      transaction.set(voucherPath(code), voucher);
      return { voucher };
    });
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

  return {
    migrateLegacyJoyCoins,
    awardJoyCoins,
    resetJoyCoins,
    redeemJoyVoucher,
    previewJoyVoucher,
    reserveJoyVoucher,
    releaseJoyVoucher,
    settleJoyVoucher,
    subscribeJoyWallet,
  };
};
