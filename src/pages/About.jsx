import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, PackageSearch, ShoppingBag, Sparkles, Wrench } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './About.css';

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const storyCopy = {
  en: {
    activeLabel: 'Active direction',
    archiveLabel: 'Creative roots',
    activeTitle: 'Shopee essentials',
    archiveTitle: 'Stationery, toys and DIY craft memories',
    activeText:
      'Today ASHLIFE focuses on useful everyday items: hook-and-loop tapes, cable organizers, adhesive helpers, kitchen shortcuts, cleaning aids and work-from-home essentials.',
    archiveText:
      'The earlier shop focused on stationery, dolls, nano blocks, stickers, small gifts and resin craft items. It is no longer actively selling, but it still shapes the brand personality.',
    promiseTitle: 'What customers can expect',
    promiseOne: 'Practical products chosen for real home, work and DIY use.',
    promiseTwo: 'Stock and order details confirmed before payment.',
    promiseThree: 'A brand that can grow beyond one marketplace.',
    browse: 'Browse Products',
    bridgeTitle: 'One brand, two useful moods',
    bridgeText:
      'ASHLIFE is not only a product list. It is a small-shop direction: tidy practical tools for adults, and a soft creative side for stationery, gifts and DIY browsing.',
    stepOne: 'Find the item type',
    stepTwo: 'Check current availability',
    stepThree: 'Order through Shopee or WhatsApp',
  },
  zh: {
    activeLabel: '当前方向',
    archiveLabel: '创意根源',
    activeTitle: 'Shopee 实用系列',
    archiveTitle: '文具、玩具与 DIY 手作记忆',
    activeText:
      'ASHLIFE 现在主要专注实用日常用品：魔术贴、电线收纳、粘贴工具、厨房小工具、清洁用品和居家办公小物。',
    archiveText:
      '以前的小店主打文具、公仔、微型积木、贴纸、小礼品和儿童 DIY 树脂材料。虽然不再主动销售，但它依然塑造 ASHLIFE 的品牌个性。',
    promiseTitle: '顾客可以期待什么',
    promiseOne: '为真实家居、办公和 DIY 用途挑选的实用商品。',
    promiseTwo: '付款前先确认库存和订单细节。',
    promiseThree: '让品牌可以超越单一平台继续成长。',
    browse: '浏览商品',
    bridgeTitle: '一个品牌，两个实用方向',
    bridgeText:
      'ASHLIFE 不只是商品列表。它是一个小店方向：给大人的整理实用工具，也保留文具、礼品和 DIY 的柔软创意感。',
    stepOne: '找到商品类型',
    stepTwo: '确认当前库存',
    stepThree: '通过 Shopee 或 WhatsApp 下单',
  },
};

const About = () => {
  const { t, language } = useLanguage();
  const text = storyCopy[language] || storyCopy.en;
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hello ASHLIFE, I would like to know more about your products.'
  )}`;

  return (
    <div className="page animate-fade-in about-page">
      <section className="about-hero">
        <div className="container about-hero-inner">
          <div className="about-hero-copy">
            <p className="section-kicker">ASHLIFE</p>
            <h1>{t('about_title')}</h1>
            <p>{t('about_subtitle')}</p>
          </div>
          <img src={asset('/brand/ashlife-about-story.jpg')} alt="ASHLIFE practical and creative product story" />
        </div>
      </section>

      <section className="container about-bridge">
        <div>
          <span className="story-label">{text.activeLabel}</span>
          <h2>{text.bridgeTitle}</h2>
          <br></br>
        </div>
        <p>{text.bridgeText}</p>
      </section>

      <section className="container about-story-grid">
        <article className="about-story">
          <Wrench size={28} />
          <span className="story-label">{text.activeLabel}</span>
          <h2>{text.activeTitle}</h2>
          <p>{text.activeText}</p>
        </article>

        <article className="about-story creative-story">
          <Sparkles size={28} />

          <span className="story-label archive">{text.archiveLabel}</span>
          <h2>{text.archiveTitle}</h2>
          <p>{text.archiveText}</p>
        </article>
      </section>
      <br></br>
      <section className="container about-copy-section">
        <div className="about-long-copy">
          <h2>{t('about_welcome')}</h2>
          <p>{t('about_p1')}</p>
          <p>{t('about_p2')}</p>
          <p>{t('about_p3')}</p>
        </div>
        <div className="promise-panel">
          <PackageSearch size={28} />
          <h3>{text.promiseTitle}</h3>
          <ul>
            <li><CheckCircle2 size={18} />{text.promiseOne}</li>
            <li><CheckCircle2 size={18} />{text.promiseTwo}</li>
            <li><CheckCircle2 size={18} />{text.promiseThree}</li>
          </ul>
        </div>
      </section>

      <section className="about-flow">
        <div className="container about-flow-grid">
          {[text.stepOne, text.stepTwo, text.stepThree].map((item, index) => (
            <div className="flow-item" key={item}>
              <ShoppingBag size={22} />
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section">
        <div className="container contact-inner">
          <div>
            <h3>{t('contact_title')}</h3>
            <p>{t('contact_sub')}</p>
          </div>
          <div className="contact-actions">
            <Link to="/shop" className="btn btn-secondary">{text.browse}</Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <MessageCircle size={18} />
              {t('contact_btn')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
