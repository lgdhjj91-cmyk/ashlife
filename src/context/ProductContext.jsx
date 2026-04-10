import React, { createContext, useContext, useState, useEffect } from 'react';
import initialProducts from '../data/products.json';

const ProductContext = createContext();

export const useProducts = () => {
  return useContext(ProductContext);
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  // Load products on mount
  useEffect(() => {
    const storedProducts = localStorage.getItem('ashlife_products');
    if (storedProducts) {
      try {
        setProducts(JSON.parse(storedProducts));
      } catch (e) {
        console.error("Failed to parse products from local storage", e);
        setProducts(initialProducts);
      }
    } else {
      setProducts(initialProducts);
      localStorage.setItem('ashlife_products', JSON.stringify(initialProducts));
    }
  }, []);

  // Save to local storage whenever products change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('ashlife_products', JSON.stringify(products));
    }
  }, [products]);

  const addProduct = (newProduct) => {
    const id = Date.now().toString(); // simple ID generation
    const productWithId = { ...newProduct, id };
    setProducts((prev) => [...prev, productWithId]);
  };

  const updateProduct = (id, updatedProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...updatedProduct, id } : p)));
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
