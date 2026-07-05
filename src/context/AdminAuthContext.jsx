import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setLoadingAdmin(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      adminUser,
      loadingAdmin,
      signInAdmin: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signOutAdmin: () => signOut(auth),
    }),
    [adminUser, loadingAdmin]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
