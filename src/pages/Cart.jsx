import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const generateWhatsAppMessage = () => {
    let message = `${t('wa_greeting')}\n\n`;
    message += `${t('wa_name')}: ${name}\n`;
    message += `${t('wa_phone')}: ${phone}\n\n`;
    message += `${t('wa_order_list')}:\n`;

    cartItems.forEach(item => {
      const itemName = language === 'zh' && item.name_zh ? item.name_zh : item.name;
      message += `${itemName} x ${item.quantity}\n`;
    });

    message += `\n${t('wa_total')}: RM ${cartTotal.toFixed(2)}\n\n`;
    message += t('wa_closing');
    return message;
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    const shopWhatsApp = '60123456789';
    const message = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://wa.me/${shopWhatsApp}?text=${message}`, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div className="page container text-center cart-empty">
        <div className="empty-cart-icon">
          <ShoppingBag size={64} />
        </div>
        <h2>{t('empty_cart_title')}</h2>
        <p>{t('empty_cart_sub')}</p>
        <Link to="/shop" className="btn btn-primary mt-2">
          {t('start_shopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in cart-page">
      <h1>{t('cart_title')}</h1>

      <div className="cart-layout">
        <div className="cart-items-section">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>

              <div className="cart-item-details">
                <Link to={`/product/${item.id}`} className="cart-item-name">
                  {language === 'zh' && item.name_zh ? item.name_zh : item.name}
                </Link>
                <div className="cart-item-price">RM {item.price.toFixed(2)}</div>

                <div className="cart-item-actions">
                  <div className="quantity-selector small">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="cart-item-subtotal">
                RM {(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}

          <button className="clear-cart-btn" onClick={clearCart}>
            {t('clear_cart')}
          </button>
        </div>

        <div className="cart-summary-section">
          <div className="summary-card">
            <h3>{t('order_summary')}</h3>

            <div className="summary-row">
              <span>{t('subtotal')} ({cartItems.length} {t('items')})</span>
              <span>RM {cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{t('shipping')}</span>
              <span>{t('shipping_note')}</span>
            </div>

            <div className="summary-total">
              <span>{t('total_estim')}</span>
              <span>RM {cartTotal.toFixed(2)}</span>
            </div>

            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-group">
                <label htmlFor="name">{t('your_name')}</label>
                <input
                  type="text"
                  id="name"
                  className="input-base"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('name_placeholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('phone_number')}</label>
                <input
                  type="tel"
                  id="phone"
                  className="input-base"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t('phone_placeholder')}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full confirm-order-btn">
                {t('confirm_order')}
              </button>

              <p className="checkout-note">
                {t('checkout_note')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
