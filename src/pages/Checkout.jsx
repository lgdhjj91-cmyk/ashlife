import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useOrders } from '../context/OrderContext';
import { AlertCircle, CheckCircle, Upload, ArrowLeft, Loader, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assets';
import { getCartItemKey, getVariantLabel } from '../utils/productVariants';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { createOrder, paymentSettings } = useOrders();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [submittedOrder, setSubmittedOrder] = useState({ items: [], total: 0 });

  // Form State
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    deliveryMethod: 'pickup', // 'pickup' | 'delivery'
    address: '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: 'mae', // 'mae' | 'tng'
    screenshotFile: null,
    screenshotPreview: null,
  });

  const selectedQrUrl = paymentInfo.method === 'mae'
    ? paymentSettings.mae_qr_url
    : paymentSettings.tng_qr_url;
  const hasSelectedQr = Boolean(selectedQrUrl);

  useEffect(() => {
    if (cartItems.length === 0 && step !== 4) {
      navigate('/cart');
    }
  }, [cartItems, navigate, step]);

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentInfo((prev) => ({
        ...prev,
        screenshotFile: file,
        screenshotPreview: URL.createObjectURL(file),
      }));
    }
  };

  const calculateTotal = () => {
    if (customerInfo.deliveryMethod === 'delivery') {
      return cartTotal + (paymentSettings.delivery_fee || 8);
    }
    return cartTotal;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmitOrder = async () => {
    if (!hasSelectedQr) {
      alert('Online payment QR is not available right now. Please order via WhatsApp from the cart.');
      return;
    }

    if (!paymentInfo.screenshotFile) {
      alert('Please upload a payment screenshot.');
      return;
    }

    setLoading(true);

    const orderItems = cartItems.map((item) => ({
      id: item.id,
      productId: item.productId || item.id,
      cartKey: getCartItemKey(item),
      name: item.name,
      name_zh: item.name_zh || '',
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      variantId: item.variantId || '',
      variantName: item.variantName || '',
      variantName_zh: item.variantName_zh || '',
    }));
    const orderTotal = calculateTotal();

    const orderData = {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      deliveryMethod: customerInfo.deliveryMethod,
      address: customerInfo.deliveryMethod === 'delivery' ? customerInfo.address : '',
      items: orderItems,
      subtotal: cartTotal,
      deliveryFee: customerInfo.deliveryMethod === 'delivery' ? (paymentSettings.delivery_fee || 8) : 0,
      total: orderTotal,
      paymentMethod: paymentInfo.method,
    };

    const result = await createOrder(orderData, paymentInfo.screenshotFile);
    setLoading(false);

    if (result.success) {
      setCreatedOrderId(result.orderId);
      setSubmittedOrder({ items: orderItems, total: orderTotal });
      clearCart();
      setStep(4);
      window.scrollTo(0, 0);
    } else {
      alert(`Error creating order: ${result.error}`);
    }
  };

  const sendWhatsAppReceipt = () => {
    const shopWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';
    let message = `Hello! I have placed an online order.\n\n`;
    message += `*Order ID:* ${createdOrderId}\n`;
    message += `*Name:* ${customerInfo.name}\n`;
    message += `*Phone:* ${customerInfo.phone}\n`;
    message += `*Delivery:* ${customerInfo.deliveryMethod === 'delivery' ? 'Delivery' : 'Store Pickup'}\n\n`;
    
    if (customerInfo.deliveryMethod === 'delivery') {
      message += `*Address:*\n${customerInfo.address}\n\n`;
    }

    message += `*Order Items:*\n`;
    const receiptItems = submittedOrder.items.length ? submittedOrder.items : cartItems;
    receiptItems.forEach(item => {
      const itemName = language === 'zh' && item.name_zh ? item.name_zh : item.name;
      const variantName = language === 'zh' && item.variantName_zh ? item.variantName_zh : item.variantName;
      message += `- ${itemName}${variantName ? ` (${variantName})` : ''} x ${item.quantity}\n`;
    });

    message += `\n*Total:* RM ${(submittedOrder.total || calculateTotal()).toFixed(2)}\n`;
    message += `*Payment:* ${paymentInfo.method.toUpperCase()} (Screenshot uploaded via website)\n\n`;
    message += `Please confirm my order. Thank you!`;

    window.open(`https://wa.me/${shopWhatsApp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const renderStepIndicator = () => (
    <div className="checkout-stepper">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className={`step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}>
          <div className="step-circle">{s < step ? <CheckCircle size={16} /> : s}</div>
          <div className="step-label">
            {s === 1 && t('checkout_step_details')}
            {s === 2 && t('checkout_step_review')}
            {s === 3 && t('checkout_step_payment')}
            {s === 4 && t('checkout_step_confirm')}
          </div>
          {s < 4 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="page container animate-fade-in checkout-page">
      <button onClick={() => navigate('/cart')} className="btn-back">
        <ArrowLeft size={18} /> {t('back_to_shop')}
      </button>

      {renderStepIndicator()}

      <div className="checkout-content">
        {step === 1 && (
          <div className="checkout-panel">
            <h2>{t('checkout_details_title')}</h2>
            <form onSubmit={handleNextStep}>
              <div className="form-group">
                <label>{t('your_name')} *</label>
                <input
                  type="text"
                  name="name"
                  className="input-base"
                  required
                  value={customerInfo.name}
                  onChange={handleInfoChange}
                  placeholder={t('name_placeholder')}
                />
              </div>

              <div className="form-group">
                <label>{t('phone_number')} *</label>
                <input
                  type="tel"
                  name="phone"
                  className="input-base"
                  required
                  value={customerInfo.phone}
                  onChange={handleInfoChange}
                  placeholder="01X-XXXXXXX"
                />
                <span className="form-hint">{t('checkout_phone_note')}</span>
              </div>

              <div className="form-group">
                <label>{t('checkout_delivery_method')}</label>
                <div className="delivery-method-selector">
                  <label className={`delivery-card ${customerInfo.deliveryMethod === 'pickup' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={customerInfo.deliveryMethod === 'pickup'}
                      onChange={handleInfoChange}
                    />
                    <div className="delivery-card-content">
                      <span className="delivery-card-title">{t('checkout_pickup')}</span>
                      <span className="delivery-card-price">Free</span>
                    </div>
                  </label>
                  <label className={`delivery-card ${customerInfo.deliveryMethod === 'delivery' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="delivery"
                      checked={customerInfo.deliveryMethod === 'delivery'}
                      onChange={handleInfoChange}
                    />
                    <div className="delivery-card-content">
                      <span className="delivery-card-title">{t('checkout_delivery')}</span>
                      <span className="delivery-card-price">RM {paymentSettings.delivery_fee?.toFixed(2) || '8.00'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {customerInfo.deliveryMethod === 'pickup' && (
                <div className="pickup-note">
                  {t('checkout_pickup_note')}
                </div>
              )}

              {customerInfo.deliveryMethod === 'delivery' && (
                <div className="form-group">
                  <label>{t('checkout_delivery_address')} *</label>
                  <textarea
                    name="address"
                    className="input-base address-input"
                    required
                    value={customerInfo.address}
                    onChange={handleInfoChange}
                    placeholder={t('checkout_delivery_address_placeholder')}
                    rows="3"
                  />
                  <span className="form-hint">
                    {language === 'zh' ? paymentSettings.delivery_note_zh : paymentSettings.delivery_note_en}
                  </span>
                </div>
              )}

              <div className="checkout-actions">
                <button type="submit" className="btn btn-primary">
                  {t('checkout_next_review')}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="checkout-panel">
            <h2>{t('checkout_review_title')}</h2>
            
            <div className="review-order-list">
              {cartItems.map((item) => (
                <div key={getCartItemKey(item)} className="review-item">
                  <div className="review-item-image">
                    <img src={resolveAssetUrl(item.image)} alt={item.name} />
                  </div>
                  <div className="review-item-info">
                    <span className="review-item-name">
                      {language === 'zh' && item.name_zh ? item.name_zh : item.name}
                    </span>
                    {(item.variantName || item.variantName_zh || item.selectedVariant) && (
                      <span className="review-item-variant">
                        Variation: {getVariantLabel(item.selectedVariant, language) || (language === 'zh' && item.variantName_zh ? item.variantName_zh : item.variantName)}
                      </span>
                    )}
                    <span className="review-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <div className="review-item-price">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="review-summary">
              <div className="review-summary-row">
                <span>{t('subtotal')}</span>
                <span>RM {cartTotal.toFixed(2)}</span>
              </div>
              <div className="review-summary-row">
                <span>{customerInfo.deliveryMethod === 'delivery' ? t('checkout_delivery') : t('checkout_pickup')}</span>
                <span>
                  {customerInfo.deliveryMethod === 'delivery' 
                    ? `RM ${(paymentSettings.delivery_fee || 8).toFixed(2)}` 
                    : 'Free'}
                </span>
              </div>
              <div className="review-summary-total">
                <span>{t('checkout_total')}</span>
                <span>RM {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="checkout-actions space-between">
              <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>
                Go Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                {t('checkout_next_payment')}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="checkout-panel">
            <h2>{t('checkout_payment_title')}</h2>
            
            <div className="payment-method-selector">
              <p className="payment-label">{t('checkout_payment_method')}</p>
              <div className="payment-cards">
                <label className={`payment-card ${paymentInfo.method === 'mae' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="method"
                    value="mae"
                    checked={paymentInfo.method === 'mae'}
                    onChange={(e) => setPaymentInfo(prev => ({...prev, method: e.target.value}))}
                  />
                  <span className="payment-card-title">MAE / Maybank</span>
                </label>
                <label className={`payment-card ${paymentInfo.method === 'tng' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="method"
                    value="tng"
                    checked={paymentInfo.method === 'tng'}
                    onChange={(e) => setPaymentInfo(prev => ({...prev, method: e.target.value}))}
                  />
                  <span className="payment-card-title">Touch 'n Go eWallet</span>
                </label>
              </div>
            </div>

            <div className="qr-code-section">
              <p className="qr-instruction">{t('checkout_scan_qr')}</p>
              <div className="qr-image-container">
                {hasSelectedQr ? (
                  <img
                    src={selectedQrUrl}
                    alt={paymentInfo.method === 'mae' ? 'MAE QR Code' : 'TNG QR Code'}
                    className="qr-code"
                  />
                ) : (
                  <div className="qr-missing-panel">
                    <AlertCircle size={28} />
                    <strong>Online payment is not ready for this method.</strong>
                    <span>Please return to cart and reserve through WhatsApp, or choose another payment method if available.</span>
                    <Link to="/cart" className="btn btn-secondary">
                      Back to cart
                    </Link>
                  </div>
                )}
              </div>
              <p className="qr-amount">{t('checkout_amount_to_pay')} <span className="highlight-amount">RM {calculateTotal().toFixed(2)}</span></p>
            </div>

            <div className={`receipt-upload-section ${!hasSelectedQr ? 'is-disabled' : ''}`}>
              <label>{t('checkout_upload_receipt')} *</label>
              <div className="upload-dropzone">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  id="receipt-upload" 
                  className="file-input-hidden"
                  disabled={!hasSelectedQr}
                />
                <label htmlFor="receipt-upload" className="upload-label">
                  {paymentInfo.screenshotPreview ? (
                    <div className="upload-preview">
                      <img src={paymentInfo.screenshotPreview} alt="Receipt Preview" />
                      <div className="upload-change-overlay">
                        <Upload size={24} />
                        <span>Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <ImageIcon size={32} />
                      <span>{t('checkout_upload_placeholder')}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="checkout-actions space-between">
              <button type="button" className="btn btn-secondary" onClick={handlePrevStep} disabled={loading}>
                Go Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmitOrder} disabled={loading || !paymentInfo.screenshotFile || !hasSelectedQr}>
                {loading ? <Loader className="spin" size={18} /> : null}
                {loading ? 'Processing...' : t('checkout_submit_order')}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="checkout-panel success-panel">
            <div className="success-icon-container">
              <CheckCircle size={64} className="success-icon" />
            </div>
            <h2>{t('checkout_confirm_title')}</h2>
            
            <div className="order-result-box">
              <p className="order-id-label">{t('checkout_order_id')}</p>
              <p className="order-id-value">{createdOrderId}</p>
              <div className="order-status-badge pending">
                {t('checkout_status')}
              </div>
            </div>

            <p className="success-note">{t('checkout_confirm_note')}</p>

            <div className="success-actions">
              <button className="btn btn-primary w-full wa-btn" onClick={sendWhatsAppReceipt}>
                <MessageCircle size={18} /> {t('checkout_send_wa')}
              </button>
              <Link to="/" className="btn btn-secondary w-full">
                {t('checkout_back_home')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
