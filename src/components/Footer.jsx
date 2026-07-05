import React from 'react';
import { Facebook, MapPin, MessageCircle, ShoppingBag } from 'lucide-react';
import './Footer.css';

const logoSrc = `${import.meta.env.BASE_URL}brand/ashlife-logo.webp`;
const shopeeUrl = import.meta.env.VITE_SHOPEE_URL || 'https://shopee.com.my/ashleylife';
const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello ASHLIFE, I would like to ask about your products.')}`;

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <img src={logoSrc} alt="ASHLIFE Solutions" className="footer-logo" />
          <p>Ready-stock practical daily needs and creative corners for Malaysia customers.</p>
          <div className="footer-area">
            <MapPin size={16} />
            <span>Malaysia / Seri Kembangan / Serdang</span>
          </div>
        </div>
        <div className="footer-socials">
          <h4>Connect with us</h4>
          <div className="social-links">
            <a href="https://www.facebook.com/ashlife205" target="_blank" rel="noopener noreferrer" className="social-link facebook-link">
              <Facebook size={20} />
              <span>Facebook</span>
            </a>
            <a href={shopeeUrl} target="_blank" rel="noopener noreferrer" className="social-link shopee-link">
              <ShoppingBag size={20} />
              <span>Shopee</span>
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="social-link whatsapp-link">
              <MessageCircle size={20} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ASHLIFE. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
