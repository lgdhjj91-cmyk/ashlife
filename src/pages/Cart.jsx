import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveAssetUrl } from '../utils/assets';
import { getCartItemKey, getVariantLabel } from '../utils/productVariants';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart, getAvailableStock } = useCart();
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const isCartValid = cartItems.every(item => {
    const availableStock = getAvailableStock(item.productId || item.id, item.variantId);
    return availableStock > 0 && item.quantity <= availableStock;
  });

  const generateWhatsAppMessage = () => {
    let message = `${t('wa_greeting')}\n\n`;
    message += `${t('wa_name')}: ${name}\n`;
    message += `${t('wa_phone')}: ${phone}\n\n`;
    message += `${t('wa_order_list')}:\n`;

    cartItems.forEach(item => {
      const itemName = language === 'zh' && item.name_zh ? item.name_zh : item.name;
      const variantName = getVariantLabel(item.selectedVariant, language) || (language === 'zh' && item.variantName_zh ? item.variantName_zh : item.variantName);
      message += `${itemName}${variantName ? ` (${variantName})` : ''} x ${item.quantity}\n`;
    });

    message += `\n${t('wa_total')}: RM ${cartTotal.toFixed(2)}\n\n`;
    message += t('wa_closing');
    return message;
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    const shopWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER || '60123456789';
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
          {cartItems.map(item => {
            const availableStock = getAvailableStock(item.productId || item.id, item.variantId);
            return (
              <div key={getCartItemKey(item)} className="cart-item">
                <div className="cart-item-image">
                  <img src={resolveAssetUrl(item.image)} alt={item.name} loading="lazy" />
                </div>

                <div className="cart-item-details">
                  <Link to={`/product/${item.id}`} className="cart-item-name">
                    {language === 'zh' && item.name_zh ? item.name_zh : item.name}
                  </Link>
                  {(item.variantName || item.variantName_zh || item.selectedVariant) && (
                    <div className="cart-item-variant">
                      Variation: {getVariantLabel(item.selectedVariant, language) || (language === 'zh' && item.variantName_zh ? item.variantName_zh : item.variantName)}
                    </div>
                  )}
                  <div className="cart-item-price">RM {item.price.toFixed(2)}</div>

                  <div className="cart-item-actions">
                    <div className="quantity-selector small">
                      <button
                        type="button"
                        onClick={() => updateQuantity(getCartItemKey(item), item.quantity - 1)}
                        className="qty-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(getCartItemKey(item), item.quantity + 1)}
                        className="qty-btn"
                        disabled={item.quantity >= availableStock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(getCartItemKey(item))}
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
            );
          })}

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

            <div className="checkout-options-box">
              {!isCartValid && (
                <div className="cart-stock-warning">
                  {language === 'zh'
                    ? '您的购物车中有商品已售罄或超出库存。请在结账前进行调整。'
                    : 'Some items in your cart are out of stock or exceed available quantity. Please adjust before checking out.'}
                </div>
              )}

              <div className="checkout-option">
                <Link
                  to={isCartValid ? "/checkout" : "#"}
                  className={`btn btn-primary w-full pay-online-btn ${!isCartValid ? 'disabled' : ''}`}
                  onClick={(e) => {
                    if (!isCartValid) {
                      e.preventDefault();
                    }
                  }}
                >
                  💳 {t('pay_online')}
                </Link>
                <p className="checkout-note">
                  {language === 'zh' ? '使用 MAE/TNG 二维码在线安全付款' : 'Pay securely online using MAE/TNG QR code'}
                </p>
              </div>

              <div className="checkout-divider">
                <span>{language === 'zh' ? '或' : 'OR'}</span>
              </div>

              <form onSubmit={handleCheckout} className="checkout-form">
                <p className="checkout-form-title">
                  {language === 'zh' ? '通过 WhatsApp 下单' : 'Order via WhatsApp'}
                </p>
                <div className="form-group">
                  <input
                    type="text"
                    id="name"
                    className="input-base"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('name_placeholder')}
                    aria-label={t('your_name')}
                    disabled={!isCartValid}
                  />
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    id="phone"
                    className="input-base"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('phone_placeholder')}
                    aria-label={t('phone_number')}
                    disabled={!isCartValid}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full confirm-order-btn" disabled={!isCartValid}>
                  💬 {t('confirm_order')}
                </button>

                <p className="checkout-note">
                  {t('checkout_note')}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
