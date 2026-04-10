import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="page container animate-fade-in about-page">
      <div className="about-header text-center">
        <h1>About ASHLIFE / 关于我们</h1>
        <p className="subtitle">Your favorite little shop for cute & smart things!</p>
      </div>

      <div className="about-content grid-mobile-1 grid-sm-2">
        <div className="about-card english-section">
          <h2>Welcome to ASHLIFE!</h2>
          <div className="content-body">
            <p>
              We sell boutique stationery, DIY craft accessories, useful lifestyle gadgets, and festival gifts.
            </p>
            <p>
              Whether you are looking for cute stationery, practical tools, or unique gifts, we have something for everyone.
            </p>
            <p>
              Explore our products and make life more convenient and colorful!
            </p>
          </div>
          <div className="store-features">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>Curated cute items</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>Fast local delivery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Easy WhatsApp ordering</span>
            </div>
          </div>
        </div>

        <div className="about-card chinese-section">
          <h2>欢迎来到小卖部！</h2>
          <div className="content-body">
            <p>
              我们售卖各类精美文具、DIY饰品、生活小妙招工具、打印服务和节日礼品！
            </p>
            <p>
              无论是为学业增添色彩，还是寻找实用的生活工具，或者挑选特别的节日礼物，我们都能满足您的需求。
            </p>
            <p>
              欢迎浏览我们的商品，让生活更加便利和多彩！
            </p>
          </div>
          <div className="store-features">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span>精选可爱好物</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>快速本地送货</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>便捷WhatsApp下单</span>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section mt-4 text-center">
        <h3>Contact Us</h3>
        <p>Have any questions? Don't hesitate to reach out to us!</p>
        <a 
          href="https://wa.me/60123456789?text=Hello%20ASHLIFE%21%20I%20have%20an%20enquiry." 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary mt-2"
        >
          Chat with us on WhatsApp
        </a>
      </div>
    </div>
  );
};

export default About;
