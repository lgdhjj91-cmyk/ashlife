import React from 'react';
import { Facebook, MapPin, MessageCircle, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const logoSrc = `${import.meta.env.BASE_URL}brand/ashlife-logo.webp`;
const shopeeUrl = import.meta.env.VITE_SHOPEE_URL || 'https://shopee.com.my/ashleylife';
const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';

const Footer = () => {
  const { t } = useLanguage();
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t('footer_whatsapp_message'))}`;

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <img src={logoSrc} alt="ASHLIFE Solutions" className="footer-logo" />
          <p>{t('footer_description')}</p>
          <div className="footer-area">
            <MapPin size={16} />
            <span>{t('footer_location')}</span>
          </div>
        </div>
        <div className="footer-socials">
          <h4>{t('footer_connect')}</h4>
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
        <p>&copy; {new Date().getFullYear()} ASHLIFE. {t('footer_rights')}</p>
      </div>
    </footer>
  );
};

export default Footer;
