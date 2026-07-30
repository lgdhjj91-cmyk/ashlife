import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { hasAdminClaim } from './adminAuthRules';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminUser(null);
        setLoadingAdmin(false);
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        setAdminUser(hasAdminClaim(tokenResult) ? user : null);
      } catch (error) {
        console.error('Admin claim check failed:', error);
        setAdminUser(null);
      } finally {
        setLoadingAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  const signInAdmin = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const tokenResult = await credential.user.getIdTokenResult(true);
    if (!hasAdminClaim(tokenResult)) {
      await signOut(auth);
      throw new Error('This account does not have admin access.');
    }
    setAdminUser(credential.user);
    return credential;
  }, []);

  const value = useMemo(
    () => ({
      adminUser,
      loadingAdmin,
      signInAdmin,
      signOutAdmin: () => signOut(auth),
    }),
    [adminUser, loadingAdmin, signInAdmin]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
