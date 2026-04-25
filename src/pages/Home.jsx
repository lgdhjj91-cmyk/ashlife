import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Cable,
  Home as HomeIcon,
  MessageCircle,
  PackageCheck,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const SHOPEE_HIGHLIGHTS = [
  {
    title: 'Hook & Loop Cable Tie Roll',
    tag: 'Cable Management',
    image: '/brand/shopee/cable-tie.jpg',
  },
  {
    title: 'Self-Adhesive Hook & Loop Tape',
    tag: 'DIY Fastening',
    image: '/brand/shopee/hook-loop-tape.jpg',
  },
  {
    title: 'Silicone Garlic Peeler Set',
    tag: 'Kitchen Shortcut',
    image: '/brand/shopee/kitchen-tool.jpg',
  },
  {
    title: 'Webcam Privacy Cover',
    tag: 'Work Essentials',
    image: '/brand/shopee/webcam-cover.jpg',
  },
];

const CREATIVE_HIGHLIGHTS = [
  '/brand/shop-product-2-optimized.jpg',
  '/brand/craft-feature-1-optimized.jpg',
  '/brand/craft-feature-2-optimized.jpg',
];

const copy = {
  en: {
    shopeeStatus: 'Active on Shopee',
    shopStatus: 'Archive and inspiration',
    linesTitle: 'Two ASHLIFE sides, one useful little shop',
    linesIntro:
      'The current Shopee range handles practical daily needs. The old shop collection keeps ASHLIFE playful with stationery, gifts, mini toys and resin craft ideas.',
    shopeeTitle: 'Shopee essentials',
    shopeeText:
      'Cable ties, hook-and-loop tapes, adhesive helpers, kitchen tools, home organization and work-desk fixes that are still part of the active selling direction.',
    shopTitle: 'Creative shop roots',
    shopText:
      'Stationery, dolls, nano blocks, stickers and DIY resin pieces are no longer the main active shop, but they still tell customers what ASHLIFE feels like.',
    activeTitle: 'Current focus products',
    activeIntro:
      'A quick look at the kinds of items customers can expect from the active ASHLIFE Shopee range.',
    archiveTitle: 'Cute and creative corner',
    archiveIntro:
      'The older shop visuals stay on the site as a brand story and inspiration area, instead of being shown as a live inventory promise.',
    shopNow: 'Browse catalogue',
    chat: 'Ask availability',
    featuredTitle: 'Browse the website catalogue',
    featuredIntro:
      'These products come from the current site catalogue. Stock and ordering are confirmed through WhatsApp.',
    howTitle: 'How ASHLIFE helps',
    howOne: 'Find the right small tool for home, office, cable, kitchen or craft needs.',
    howTwo: 'Confirm whether the item is active on Shopee or better handled through WhatsApp.',
    howThree: 'Keep both practical essentials and cute creative items under one ASHLIFE brand.',
  },
  zh: {
    shopeeStatus: 'Shopee 现售',
    shopStatus: '旧店故事与灵感',
    linesTitle: 'ASHLIFE 的两个方向，合成一个实用小店',
    linesIntro:
      '现在 Shopee 主打日常实用小物；旧店系列保留文具、礼品、迷你玩具与树脂手作的可爱感。',
    shopeeTitle: 'Shopee 实用系列',
    shopeeText:
      '电线收纳、魔术贴、粘贴工具、厨房用品、家居整理和办公桌小物，是目前仍在发展的现售方向。',
    shopTitle: '创意小店根源',
    shopText:
      '文具、公仔、微型积木、贴纸与 DIY 树脂材料不再是主要现售店，但它们继续代表 ASHLIFE 的可爱与创意。',
    activeTitle: '当前主打商品',
    activeIntro: '快速了解 ASHLIFE Shopee 现售系列会出现的商品类型。',
    archiveTitle: '可爱创意角落',
    archiveIntro:
      '旧店素材会以品牌故事和灵感形式保留，不会让顾客误会全部都是实时库存。',
    shopNow: '浏览商品',
    chat: '询问库存',
    featuredTitle: '网站商品目录',
    featuredIntro: '这些商品来自当前网站目录，库存与下单会通过 WhatsApp 确认。',
    howTitle: 'ASHLIFE 可以怎样帮你',
    howOne: '帮你找到家居、办公、电线、厨房或手作用途的小工具。',
    howTwo: '确认商品适合到 Shopee 购买，还是通过 WhatsApp 人工处理。',
    howThree: '把实用小物和可爱创意用品统一在 ASHLIFE 品牌下。',
  },
};

const Home = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { t, language } = useLanguage();
  const text = copy[language] || copy.en;
  const featuredProducts = products.slice(0, 4);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hello ASHLIFE, I would like to ask about product availability.'
  )}`;

  return (
    <div className="page animate-fade-in home-page">
      <section className="hero-shop">
        <div className="container hero-shop-content">
          <div className="hero-text-stack">
            <p className="eyebrow">{t('hero_eyebrow')}</p>
            <h1>{t('hero_title')}</h1>
            <p className="hero-copy">{t('hero_subtitle')}</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/shop')}>
                {t('hero_btn')}
                <ArrowRight size={18} />
              </button>
              <a className="btn btn-secondary hero-whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                {t('hero_secondary')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container home-intro-band">
        <div>
          <span className="status-pill">{text.shopeeStatus}</span>
          <h2>{text.linesTitle}</h2>
        </div>
        <p>{text.linesIntro}</p>
      </section>

      <section className="container storefront-grid">
        <article className="storefront-panel essentials-panel">
          <div className="panel-icon"><Store size={22} /></div>
          <span className="status-pill">{text.shopeeStatus}</span>
          <h3>{text.shopeeTitle}</h3>
          <p>{text.shopeeText}</p>
          <div className="mini-category-row">
            <Link to="/shop?category=Home%20Gadgets"><Cable size={16} />{t('cat_cable')}</Link>
            <Link to="/shop?category=Cleaning%20Tools"><Utensils size={16} />{t('cat_home_kitchen')}</Link>
            <Link to="/shop?category=Lifestyle%20Items"><HomeIcon size={16} />{t('cat_work')}</Link>
          </div>
        </article>

        <article className="storefront-panel creative-panel">
          <div className="panel-icon"><Sparkles size={22} /></div>
          <span className="status-pill muted">{text.shopStatus}</span>
          <h3>{text.shopTitle}</h3>
          <p>{text.shopText}</p>
          <div className="creative-thumb-row">
            {CREATIVE_HIGHLIGHTS.map((src) => (
              <img key={src} src={src} alt="" loading="lazy" />
            ))}
          </div>
        </article>
      </section>

      <section className="container home-section">
        <div className="section-header">
          <div>
            <p className="section-kicker">{text.shopeeStatus}</p>
            <h2>{text.activeTitle}</h2>
            <p>{text.activeIntro}</p>
          </div>
          <Link to="/shop" className="view-all">{text.shopNow}</Link>
        </div>
        <div className="highlight-product-grid">
          {SHOPEE_HIGHLIGHTS.map((item) => (
            <article className="highlight-product" key={item.title}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <div>
                <span>{item.tag}</span>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="archive-band">
        <div className="container archive-layout">
          <div className="archive-copy">
            <p className="section-kicker">{text.shopStatus}</p>
            <h2>{text.archiveTitle}</h2>
            <p>{text.archiveIntro}</p>
            <a className="btn btn-secondary" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              {text.chat}
            </a>
          </div>
          <div className="archive-gallery">
            <img className="poster-image" src="/brand/shop-poster-optimized.jpg" alt="ASHLIFE creative shop promotion" loading="lazy" />
            <img src="/brand/shop-product-2-optimized.jpg" alt="Creative mini figures and cute shop items" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="container help-section">
        <div className="section-header compact">
          <div>
            <p className="section-kicker">ASHLIFE</p>
            <h2>{text.howTitle}</h2>
          </div>
        </div>
        <div className="help-grid">
          {[text.howOne, text.howTwo, text.howThree].map((item, index) => (
            <div className="help-item" key={item}>
              <PackageCheck size={22} />
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="container home-section">
          <div className="section-header">
            <div>
              <p className="section-kicker">{t('section_featured')}</p>
              <h2>{text.featuredTitle}</h2>
              <p>{text.featuredIntro}</p>
            </div>
            <Link to="/shop" className="view-all">{t('view_all')}</Link>
          </div>
          <div className="grid-mobile-1 grid-sm-2 grid-md-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
