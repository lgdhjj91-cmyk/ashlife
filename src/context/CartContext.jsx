import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCartItemKey, normalizeVariants } from '../utils/productVariants';
import { useProducts } from './ProductContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { products } = useProducts();
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('ashlife-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ashlife-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const getAvailableStock = (productId, variantId) => {
    const masterProduct = products.find(p => p.id === productId);
    if (!masterProduct) return 0;
    if (variantId) {
      const variants = normalizeVariants(masterProduct);
      const variant = variants.find(v => v.id === variantId);
      return variant ? (variant.stock ?? 0) : 0;
    }
    return masterProduct.stock ?? 0;
  };

  const addToCart = (product, quantity = 1) => {
    const availableStock = getAvailableStock(product.id, product.variantId);
    setCartItems(prev => {
      const productKey = getCartItemKey(product);
      const existing = prev.find(item => getCartItemKey(item) === productKey);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, availableStock);
        return prev.map(item => 
          getCartItemKey(item) === productKey ? { ...item, quantity: newQty } : item
        );
      }
      const finalQty = Math.min(quantity, availableStock);
      if (finalQty <= 0) return prev;
      return [...prev, { ...product, cartKey: productKey, quantity: finalQty }];
    });
  };

  const removeFromCart = (cartKey) => {
    setCartItems(prev => prev.filter(item => getCartItemKey(item) !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return removeFromCart(cartKey);
    const [productId, variantIdRaw] = cartKey.split('::');
    const variantId = variantIdRaw === 'base' ? '' : variantIdRaw;
    const availableStock = getAvailableStock(productId, variantId);
    const finalQty = Math.min(quantity, availableStock);

    setCartItems(prev => prev.map(item => 
      getCartItemKey(item) === cartKey ? { ...item, quantity: finalQty } : item
    ));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      getAvailableStock
    }}>
      {children}
    </CartContext.Provider>
  );
};
