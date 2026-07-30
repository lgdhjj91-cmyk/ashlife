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
import { onValue, ref } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { auth, database, functions } from '../firebase';
import { loadPlayroomProgress, savePlayroomProgress } from '../playroom/storage/playroomStorage';
import { createJoyRequestId, normalizeJoyWallet } from '../joy/joyWalletState';

const JoyWalletContext = createContext(null);

const emptyWallet = normalizeJoyWallet(null);

const getErrorMessage = (error) => {
  const code = String(error?.code || '');
  if (code.includes('email-already-in-use')) return 'This email already has an account. Please sign in instead.';
  if (code.includes('invalid-credential')) return 'The email or password is incorrect.';
  if (code.includes('weak-password')) return 'Use a password with at least 6 characters.';
  if (code.includes('network-request-failed')) return 'The network is unavailable. Please try again.';
  if (code.includes('admin-restricted-operation')) {
    return 'Joy Rewards guest access is not enabled yet. The shop is still available without vouchers.';
  }
  if (code.includes('functions/not-found')) {
    return 'Joy Rewards is awaiting its Firebase backend deployment.';
  }
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
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [autoApplySuppressed, setAutoApplySuppressed] = useState(false);
  const anonymousSignInPending = useRef(false);

  const callFunction = useCallback(async (name, data = {}) => {
    const callable = httpsCallable(functions, name);
    const result = await callable(data);
    return result.data;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
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

      setUser(nextUser);
      setLoading(true);
      try {
        const localCoins = loadPlayroomProgress().coins;
        await callFunction('migrateLegacyJoyCoins', { coins: localCoins });
        setServiceError('');
      } catch (error) {
        setServiceError(getErrorMessage(error));
      }
    });

    return unsubscribe;
  }, [callFunction]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const walletRef = ref(database, `joyWallets/${user.uid}`);
    const unsubscribe = onValue(
      walletRef,
      (snapshot) => {
        const nextWallet = normalizeJoyWallet(snapshot.val());
        setWallet(nextWallet);
        const localProgress = loadPlayroomProgress();
        if (localProgress.coins !== nextWallet.coins) {
          savePlayroomProgress({ ...localProgress, coins: nextWallet.coins });
        }
        setLoading(false);
      },
      (error) => {
        setServiceError(getErrorMessage(error));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user?.uid]);

  const awardCoins = useCallback(
    async (amount, claimId = createJoyRequestId('reward')) => {
      try {
        const result = await callFunction('awardJoyCoins', { amount, claimId });
        setServiceError('');
        return { success: true, coins: result.coins };
      } catch (error) {
        const message = getErrorMessage(error);
        setServiceError(message);
        return { success: false, error: message };
      }
    },
    [callFunction]
  );

  const resetCoins = useCallback(async () => {
    try {
      const result = await callFunction('resetJoyCoins');
      setServiceError('');
      return { success: true, coins: result.coins };
    } catch (error) {
      const message = getErrorMessage(error);
      setServiceError(message);
      return { success: false, error: message };
    }
  }, [callFunction]);

  const redeemVoucher = useCallback(
    async (tierId) => {
      try {
        const result = await callFunction('redeemJoyVoucher', {
          tierId,
          requestId: createJoyRequestId('redeem'),
        });
        setServiceError('');
        return { success: true, ...result };
      } catch (error) {
        const message = getErrorMessage(error);
        setServiceError(message);
        return { success: false, error: message };
      }
    },
    [callFunction]
  );

  const previewVoucher = useCallback(
    async (code, subtotalSen) => {
      try {
        const result = await callFunction('previewJoyVoucher', { code, subtotalSen });
        setServiceError('');
        return { success: true, ...result };
      } catch (error) {
        const message = getErrorMessage(error);
        return { success: false, valid: false, error: message };
      }
    },
    [callFunction]
  );

  const reserveVoucher = useCallback(
    async ({ code, orderId, subtotalSen }) => {
      try {
        const result = await callFunction('reserveJoyVoucher', { code, orderId, subtotalSen });
        setServiceError('');
        return { success: true, ...result };
      } catch (error) {
        const message = getErrorMessage(error);
        return { success: false, error: message };
      }
    },
    [callFunction]
  );

  const releaseVoucher = useCallback(
    async ({ code, orderId }) => {
      try {
        const result = await callFunction('releaseJoyVoucher', { code, orderId });
        return { success: true, ...result };
      } catch (error) {
        return { success: false, error: getErrorMessage(error) };
      }
    },
    [callFunction]
  );

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
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAnonymous: user?.isAnonymous !== false,
      isCustomer: Boolean(user && !user.isAnonymous),
      wallet,
      loading,
      serviceError,
      selectedVoucher,
      autoApplySuppressed,
      awardCoins,
      resetCoins,
      redeemVoucher,
      previewVoucher,
      reserveVoucher,
      releaseVoucher,
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
      loading,
      serviceError,
      selectedVoucher,
      autoApplySuppressed,
      awardCoins,
      resetCoins,
      redeemVoucher,
      previewVoucher,
      reserveVoucher,
      releaseVoucher,
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
