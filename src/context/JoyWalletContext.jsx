import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { loadPlayroomProgress, savePlayroomProgress } from '../playroom/storage/playroomStorage';
import { createJoyRequestId, normalizeJoyWallet } from '../joy/joyWalletState';
import { awardJoyCoinsForCurrentUser } from '../joy/joyRewardTransport.js';
import {
  createFirestoreJoyStore,
  createJoyRepository,
} from '../joy/joyFirestoreRepository';

const JoyWalletContext = createContext(null);

const emptyWallet = normalizeJoyWallet(null);
const joyRepository = createJoyRepository(createFirestoreJoyStore(firestore));

const getErrorMessage = (error) => {
  const code = String(error?.code || '');
  if (code.includes('email-already-in-use')) return 'This email already has an account. Please sign in instead.';
  if (code.includes('invalid-credential')) return 'The email or password is incorrect.';
  if (code.includes('weak-password')) return 'Use a password with at least 6 characters.';
  if (code.includes('network-request-failed')) return 'The network is unavailable. Please try again.';
  if (code.includes('admin-restricted-operation')) {
    return 'Joy Rewards guest access is not enabled yet. The shop is still available without vouchers.';
  }
  if (code.includes('permission-denied')) return 'Joy Rewards access was denied. Please refresh and try again.';
  if (code.includes('failed-precondition')) return error?.message || 'This Joy Rewards action is not available.';
  return error?.message || 'Joy Rewards is temporarily unavailable.';
};

export const useJoyWallet = () => {
  const value = useContext(JoyWalletContext);
  if (!value) throw new Error('useJoyWallet must be used inside JoyWalletProvider.');
  return value;
};

export const JoyWalletProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(emptyWallet);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState('');
  const [historyRequested, setHistoryRequested] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const loadHistory = useCallback(() => setHistoryRequested(true), []);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedGifts, setSelectedGifts] = useState([]);
  const [autoApplySuppressed, setAutoApplySuppressed] = useState(false);
  const anonymousSignInPending = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setSelectedVoucher(null);
        setSelectedGifts([]);
        setUser(null);
        setWallet(emptyWallet);
        if (!anonymousSignInPending.current) {
          anonymousSignInPending.current = true;
          try {
            await signInAnonymously(auth);
            setServiceError('');
          } catch (error) {
            setServiceError(getErrorMessage(error));
            const localProgress = loadPlayroomProgress();
            setWallet(normalizeJoyWallet({ coins: localProgress.coins }));
            setLoading(false);
          } finally {
            anonymousSignInPending.current = false;
          }
        }
        return;
      }

      setLoading(true);
      setWallet(emptyWallet);
      setSelectedVoucher(null);
      setSelectedGifts([]);
      try {
        const localCoins = loadPlayroomProgress().coins;
        await joyRepository.migrateLegacyJoyCoins(nextUser.uid, localCoins);
        setUser(nextUser);
        setServiceError('');
      } catch (error) {
        setUser(nextUser);
        setServiceError(getErrorMessage(error));
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsubscribe = joyRepository.subscribeJoyWallet(user.uid, {
      onValue: (snapshot) => {
        const nextWallet = normalizeJoyWallet(snapshot);
        setWallet(nextWallet);
        const localProgress = loadPlayroomProgress();
        if (localProgress.coins !== nextWallet.coins) {
          savePlayroomProgress({ ...localProgress, coins: nextWallet.coins });
        }
        setLoading(false);
      },
      onError: (error) => {
        setServiceError(getErrorMessage(error));
        setLoading(false);
      },
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    setHistory([]);
    setHistoryError('');
    if (!historyRequested || !user?.uid) return undefined;
    setHistoryLoading(true);
    return joyRepository.subscribeJoyHistory(user.uid, {
      onValue: (records) => {
        setHistory(normalizeJoyWallet(records).history);
        setHistoryLoading(false);
        setHistoryError('');
      },
      onError: (error) => { setHistoryError(getErrorMessage(error)); setHistoryLoading(false); },
    });
  }, [historyRequested, user?.uid]);

  const awardCoins = useCallback(
    async (amount, claimId = createJoyRequestId('reward'), expectedOwnerUid = null) => {
      try {
        const result = await awardJoyCoinsForCurrentUser(auth, joyRepository, amount, claimId, expectedOwnerUid);
        setServiceError('');
        return { success: true, coins: result.coins };
      } catch (error) {
        const message = getErrorMessage(error);
        setServiceError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const resetCoins = useCallback(async () => {
    try {
      if (!auth.currentUser?.uid) throw new Error('Guest session is still loading.');
      const result = await joyRepository.resetJoyCoins(auth.currentUser.uid);
      setServiceError('');
      return { success: true, coins: result.coins };
    } catch (error) {
      const message = getErrorMessage(error);
      setServiceError(message);
      return { success: false, error: message };
    }
  }, []);

  const redeemVoucher = useCallback(
    async (tierId) => {
      try {
        if (!auth.currentUser?.uid) throw new Error('Guest session is still loading.');
        const result = await joyRepository.redeemJoyVoucher(
          auth.currentUser.uid,
          tierId,
          createJoyRequestId('redeem')
        );
        setServiceError('');
        return { success: true, ...result };
      } catch (error) {
        const message = getErrorMessage(error);
        setServiceError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const previewVoucher = useCallback(
    async (code, subtotalSen) => {
      try {
        const result = await joyRepository.previewJoyVoucher(code, subtotalSen);
        setServiceError('');
        return { success: true, ...result };
      } catch (error) {
        const message = getErrorMessage(error);
        return { success: false, valid: false, error: message };
      }
    },
    []
  );

  const reserveVoucher = useCallback(
    async ({ code, orderId, subtotalSen }) => {
      try {
        if (!auth.currentUser?.uid) throw new Error('Guest session is still loading.');
        const result = await joyRepository.reserveJoyVoucher(auth.currentUser.uid, {
          code,
          orderId,
          subtotalSen,
        });
        setServiceError('');
        return { success: true, ...result };
      } catch (error) {
        const message = getErrorMessage(error);
        return { success: false, error: message };
      }
    },
    []
  );

  const releaseVoucher = useCallback(
    async ({ code, orderId }) => {
      try {
        if (!auth.currentUser?.uid) throw new Error('Guest session is still loading.');
        const result = await joyRepository.releaseJoyVoucher(auth.currentUser.uid, { code, orderId });
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: getErrorMessage(error) };
      }
    },
    []
  );

  const settleVoucher = useCallback(async ({ code, orderId, orderStatus }) => {
    try {
      const result = await joyRepository.settleJoyVoucher({ code, orderId, orderStatus });
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, []);

  const reserveRewards = useCallback(async (reservation) => {
    try {
      if (!auth.currentUser?.uid) throw new Error('Guest session is still loading.');
      return { success: true, ...await joyRepository.reserveJoyRewards(auth.currentUser.uid, reservation) };
    } catch (error) { return { success: false, error: getErrorMessage(error) }; }
  }, []);

  const releaseRewards = useCallback(async (reservation) => {
    try {
      if (!auth.currentUser?.uid) throw new Error('Guest session is still loading.');
      return { success: true, ...await joyRepository.releaseJoyRewards(auth.currentUser.uid, reservation) };
    } catch (error) { return { success: false, error: getErrorMessage(error) }; }
  }, []);

  const settleRewards = useCallback(async (settlement) => {
    try { return { success: true, ...await joyRepository.settleJoyRewards(settlement) }; }
    catch (error) { return { success: false, error: getErrorMessage(error) }; }
  }, []);

  const chooseGift = useCallback((gift) => {
    setSelectedGifts((current) => [...current.filter((item) => item.tierId !== gift.tierId), gift]);
  }, []);
  const removeGift = useCallback((code) => {
    setSelectedGifts((current) => current.filter((item) => item.code !== code));
  }, []);

  const createAccount = useCallback(async (email, password) => {
    if (!auth.currentUser) throw new Error('Guest session is still loading.');
    if (!auth.currentUser.isAnonymous) throw new Error('You are already signed in.');
    const credential = EmailAuthProvider.credential(email.trim(), password);
    try {
      const result = await linkWithCredential(auth.currentUser, credential);
      setServiceError('');
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, []);

  const signInCustomer = useCallback(async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      setServiceError('');
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }, []);

  const signOutCustomer = useCallback(async () => {
    await signOut(auth);
  }, []);

  const chooseVoucher = useCallback((voucher) => {
    setSelectedVoucher(voucher || null);
    setAutoApplySuppressed(false);
  }, []);

  const keepVoucherForLater = useCallback(() => {
    setSelectedVoucher(null);
    setAutoApplySuppressed(true);
  }, []);

  const enableAutoApply = useCallback(() => {
    setAutoApplySuppressed(false);
  }, []);

  const clearVoucherSelection = useCallback(() => {
    setSelectedVoucher(null);
    setAutoApplySuppressed(false);
    setSelectedGifts([]);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAnonymous: user?.isAnonymous !== false,
      isCustomer: Boolean(user && !user.isAnonymous),
      wallet: { ...wallet, history },
      loadHistory,
      historyLoading,
      historyError,
      loading,
      serviceError,
      selectedVoucher,
      selectedGifts,
      chooseGift,
      removeGift,
      reserveRewards,
      releaseRewards,
      settleRewards,
      autoApplySuppressed,
      awardCoins,
      resetCoins,
      redeemVoucher,
      previewVoucher,
      reserveVoucher,
      releaseVoucher,
      settleVoucher,
      createAccount,
      signInCustomer,
      signOutCustomer,
      chooseVoucher,
      keepVoucherForLater,
      enableAutoApply,
      clearVoucherSelection,
    }),
    [
      user,
      wallet,
      history,
      loadHistory,
      historyLoading,
      historyError,
      loading,
      serviceError,
      selectedVoucher,
      selectedGifts,
      chooseGift,
      removeGift,
      reserveRewards,
      releaseRewards,
      settleRewards,
      autoApplySuppressed,
      awardCoins,
      resetCoins,
      redeemVoucher,
      previewVoucher,
      reserveVoucher,
      releaseVoucher,
      settleVoucher,
      createAccount,
      signInCustomer,
      signOutCustomer,
      chooseVoucher,
      keepVoucherForLater,
      enableAutoApply,
      clearVoucherSelection,
    ]
  );

  return <JoyWalletContext.Provider value={value}>{children}</JoyWalletContext.Provider>;
};
