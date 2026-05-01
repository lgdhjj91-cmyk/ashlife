import React from 'react';
import { Facebook, ShoppingBag } from 'lucide-react';
import './Footer.css';

const logoSrc = `${import.meta.env.BASE_URL}brand/ashlife-logo.png`;

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <img src={logoSrc} alt="ASHLIFE Solutions" className="footer-logo" />
          <p>Practical daily needs and creative corners.</p>
        </div>
        <div className="footer-socials">
          <h4>Connect with us</h4>
          <div className="social-links">
            <a href="https://www.facebook.com/ashlife205" target="_blank" rel="noopener noreferrer" className="social-link facebook-link">
              <Facebook size={20} />
              <span>Facebook</span>
            </a>
            <a href="https://shopee.com.my/ashleylife" target="_blank" rel="noopener noreferrer" className="social-link shopee-link">
              <ShoppingBag size={20} />
              <span>Shopee</span>
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
