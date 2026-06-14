import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCartItemKey } from '../utils/productVariants';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('ashlife-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ashlife-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const productKey = getCartItemKey(product);
      const existing = prev.find(item => getCartItemKey(item) === productKey);
      if (existing) {
        return prev.map(item => 
          getCartItemKey(item) === productKey ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, cartKey: productKey, quantity }];
    });
  };

  const removeFromCart = (cartKey) => {
    setCartItems(prev => prev.filter(item => getCartItemKey(item) !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return removeFromCart(cartKey);
    setCartItems(prev => prev.map(item => 
      getCartItemKey(item) === cartKey ? { ...item, quantity } : item
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
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
