import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { canAccessAdmin } from './adminAuthRules';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(canAccessAdmin(user) ? user : null);
      setLoadingAdmin(false);
    });
    return unsubscribe;
  }, []);

  const signInAdmin = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
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
