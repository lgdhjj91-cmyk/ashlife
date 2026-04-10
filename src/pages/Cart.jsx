import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const generateWhatsAppMessage = () => {
    let message = "Hello! I would like to place an order.\n\n";
    message += `Name: ${name}\n`;
    message += `Phone Number: ${phone}\n\n`;
    message += "Order List:\n";

    cartItems.forEach(item => {
      message += `${item.name} x ${item.quantity}\n`;
    });

    message += `\nTotal Amount: RM ${cartTotal.toFixed(2)}\n\n`;
    message += "Please confirm availability. Thank you!";
    return message;
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    // The shop owners WhatsApp number
    const shopWhatsApp = "60123456789"; 
    const message = encodeURIComponent(generateWhatsAppMessage());
    
    // Open WhatsApp
    window.open(`https://wa.me/${shopWhatsApp}?text=${message}`, '_blank');
  };

  if (cartItems.length === 0) {
    return (
      <div className="page container text-center cart-empty">
        <div className="empty-cart-icon">
          <ShoppingBag size={64} />
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any cute items yet.</p>
        <Link to="/shop" className="btn btn-primary mt-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in cart-page">
      <h1>Your Shopping Cart</h1>
      
      <div className="cart-layout">
        <div className="cart-items-section">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img src={item.image} alt={item.name} />
              </div>
              
              <div className="cart-item-details">
                <Link to={`/product/${item.id}`} className="cart-item-name">
                  {item.name}
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
            Clear Cart
          </button>
        </div>

        <div className="cart-summary-section">
          <div className="summary-card">
            <h3>Order Summary</h3>
            
            <div className="summary-row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>RM {cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Calculated on WhatsApp</span>
            </div>
            
            <div className="summary-total">
              <span>Total Estim.</span>
              <span>RM {cartTotal.toFixed(2)}</span>
            </div>

            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="input-base" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Ashley"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  className="input-base" 
                  required 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 0123456789"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full confirm-order-btn">
                Confirm Order (WhatsApp)
              </button>
              
              <p className="checkout-note">
                This will open WhatsApp with your order details pre-filled. No payment is required until confirmed with us!
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
