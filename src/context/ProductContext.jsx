import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';

const ProductContext = createContext();

export const useProducts = () => {
  return useContext(ProductContext);
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    const productsRef = ref(database, 'products');

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert Firebase object { key1: {...}, key2: {...} } to array
          const productsArray = Object.entries(data).map(([key, value]) => ({
            ...value,
            id: key, // Use the Firebase key as the product id
          }));
          setProducts(productsArray);
          // Cache to localStorage for offline fallback
          localStorage.setItem('ashlife_products', JSON.stringify(productsArray));
        } else {
          setProducts([]);
        }
        setDbConnected(true);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase read error:', error);
        setDbConnected(false);
        // Fallback to localStorage cache
        const cached = localStorage.getItem('ashlife_products');
        if (cached) {
          try {
            setProducts(JSON.parse(cached));
          } catch (e) {
            console.error('Failed to parse cached products', e);
          }
        }
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const addProduct = useCallback(async (newProduct) => {
    try {
      const productsRef = ref(database, 'products');
      await push(productsRef, newProduct);
      return { success: true };
    } catch (error) {
      console.error('Failed to add product:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const updateProduct = useCallback(async (id, updatedProduct) => {
    try {
      const productRef = ref(database, `products/${id}`);
      await update(productRef, updatedProduct);
      return { success: true };
    } catch (error) {
      console.error('Failed to update product:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      const productRef = ref(database, `products/${id}`);
      await remove(productRef);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete product:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, loading, dbConnected }}>
      {children}
    </ProductContext.Provider>
  );
};
