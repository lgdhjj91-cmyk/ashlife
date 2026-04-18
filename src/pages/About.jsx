import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './About.css';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="page container animate-fade-in about-page">
      <div className="about-header text-center">
        <h1>{t('about_title')}</h1>
        <p className="subtitle">{t('about_subtitle')}</p>
      </div>

      <div className="about-content about-single-col">
        <div className="about-card">
          <h2>{t('about_welcome')}</h2>
          <div className="content-body">
            <p>{t('about_p1')}</p>
            <p>{t('about_p2')}</p>
            <p>{t('about_p3')}</p>
          </div>
          <div className="store-features">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>{t('feature_curated')}</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>{t('feature_delivery')}</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>{t('feature_whatsapp')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section mt-4 text-center">
        <h3>{t('contact_title')}</h3>
        <p>{t('contact_sub')}</p>
        <a
          href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '60123456789'}?text=Hello%20ASHLIFE%21%20I%20have%20an%20enquiry.`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-2"
        >
          {t('contact_btn')}
        </a>
      </div>
    </div>
  );
};

export default About;
