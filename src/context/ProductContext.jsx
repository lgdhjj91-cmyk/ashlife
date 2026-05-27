import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';

const ProductContext = createContext();

export const useProducts = () => {
  return useContext(ProductContext);
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);

  const fetchLocalProducts = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/products.json`);
      if (!response.ok) {
        throw new Error(`Local catalogue returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load local products:', error);
      return [];
    }
  }, []);

  const loadLocalProducts = useCallback(async () => {
    try {
      const fallbackProducts = await fetchLocalProducts();
      if (!fallbackProducts.length) {
        return false;
      }
      setProducts(fallbackProducts);
      localStorage.setItem('ashlife_products', JSON.stringify(fallbackProducts));
      return true;
    } catch (error) {
      console.error('Failed to load local products:', error);
      return false;
    }
  }, [fetchLocalProducts]);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    const productsRef = ref(database, 'products');

    const unsubscribe = onValue(
      productsRef,
      async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert Firebase object { key1: {...}, key2: {...} } to array
          const productsArray = Object.entries(data).map(([key, value]) => ({
            ...value,
            id: key, // Use the Firebase key as the product id
          }));
          const localProducts = await fetchLocalProducts();
          const remoteIds = new Set(productsArray.map((product) => product.id));
          const mergedProducts = [
            ...productsArray,
            ...localProducts.filter((product) => !remoteIds.has(product.id)),
          ];
          setProducts(mergedProducts);
          // Cache to localStorage for offline fallback
          localStorage.setItem('ashlife_products', JSON.stringify(mergedProducts));
          setDbConnected(true);
          setLoading(false);
        } else {
          setDbConnected(false);
          loadLocalProducts().finally(() => setLoading(false));
        }
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
          setLoading(false);
        } else {
          loadLocalProducts().finally(() => setLoading(false));
        }
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [fetchLocalProducts, loadLocalProducts]);

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
