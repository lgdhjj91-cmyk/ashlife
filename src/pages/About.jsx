import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, PackageSearch, Store, Wrench } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './About.css';

const storyCopy = {
  en: {
    activeLabel: 'Active direction',
    archiveLabel: 'Original shop roots',
    activeTitle: 'Shopee essentials',
    archiveTitle: 'Stationery, toys and DIY craft memories',
    activeText:
      'The active side of ASHLIFE focuses on useful everyday items: hook-and-loop tapes, cable organizers, adhesive tools, kitchen shortcuts, cleaning aids and small work-from-home essentials.',
    archiveText:
      'The previous shop focused on stationery, dolls, nano blocks, stickers, small gifts and resin craft items for children and hobby customers. It is no longer actively selling, but it still belongs in the ASHLIFE story.',
    promiseTitle: 'What customers can expect',
    promiseOne: 'Practical products chosen for real home, work and DIY use.',
    promiseTwo: 'Clear stock checking before payment or confirmation.',
    promiseThree: 'A product range that can grow beyond one marketplace.',
    browse: 'Browse Products',
  },
  zh: {
    activeLabel: '当前方向',
    archiveLabel: '旧店根源',
    activeTitle: 'Shopee 实用系列',
    archiveTitle: '文具、玩具与 DIY 手作记忆',
    activeText:
      'ASHLIFE 现在主要专注实用日常用品：魔术贴、电线收纳、粘贴工具、厨房小工具、清洁用品和居家办公小物。',
    archiveText:
      '以前的小店主打文具、公仔、微型积木、贴纸、小礼品和儿童 DIY 树脂材料。虽然不再主动销售，但它依然是 ASHLIFE 故事的一部分。',
    promiseTitle: '顾客可以期待什么',
    promiseOne: '为真实家居、办公和 DIY 用途挑选的实用商品。',
    promiseTwo: '付款或确认前会先人工检查库存。',
    promiseThree: '让商品线可以超越单一平台继续成长。',
    browse: '浏览商品',
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
          <p className="section-kicker">ASHLIFE</p>
          <h1>{t('about_title')}</h1>
          <p>{t('about_subtitle')}</p>
        </div>
      </section>

      <section className="container about-story-grid">
        <article className="about-story">
          <span className="story-label">{text.activeLabel}</span>
          <Wrench size={28} />
          <h2>{text.activeTitle}</h2>
          <p>{text.activeText}</p>
          <img src="/brand/shopee/cable-tie.jpg" alt="ASHLIFE hook and loop cable tie roll" loading="lazy" />
        </article>

        <article className="about-story">
          <span className="story-label archive">{text.archiveLabel}</span>
          <Store size={28} />
          <h2>{text.archiveTitle}</h2>
          <p>{text.archiveText}</p>
          <img src="/brand/shop-product-2-optimized.jpg" alt="ASHLIFE older creative shop product display" loading="lazy" />
        </article>
      </section>

      <section className="container about-copy-section">
        <div>
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
