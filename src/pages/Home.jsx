import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Store,
  Truck,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteContent } from '../context/SiteContentContext';
import {
  HOME_CATEGORIES,
  getHomeCopy,
  selectHomepageProducts,
} from './homeContent.js';
import './Home.css';

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const ORDERING_ICONS = [CheckCircle2, MapPin, Truck, MessageCircle];

const Home = () => {
  const { products } = useProducts();
  const { language } = useLanguage();
  const { siteContent } = useSiteContent();
  const text = getHomeCopy(language);
  const popularProducts = selectHomepageProducts(
    products,
    siteContent.homeFocusProductIds,
    4
  );
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '601133046104';
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hello ASHLIFE, I would like to ask about product availability.'
  )}`;
  const shopeeUrl = import.meta.env.VITE_SHOPEE_URL || 'https://shopee.com.my/ashleylife';

  return (
    <div className="page animate-fade-in home-page">
      <section
        className="home-hero"
        style={{
          '--home-hero-image': `url(${asset('/brand/ashlife-hero-wide-v2.webp')})`,
        }}
      >
        <div className="container home-hero-overlay">
          <div
            className="home-hero-copy"
            lang={language === 'zh' ? 'zh-CN' : 'en'}
          >
            <p className="home-eyebrow">{text.hero.eyebrow}</p>
            <h1>{text.hero.title}</h1>
            <p className="home-hero-subtitle">{text.hero.subtitle}</p>
            <div className="home-actions">
              <Link className="btn btn-primary" to="/shop">
                {text.hero.primaryAction}
                <ArrowRight size={18} />
              </Link>
              <a
                className="btn btn-secondary"
                href={shopeeUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Store size={18} />
                {text.hero.secondaryAction}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        className="container home-categories"
        aria-labelledby="home-categories-title"
      >
        <h2 id="home-categories-title">{text.categories.title}</h2>
        <div className="home-category-grid">
          {HOME_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                className="home-category-link"
                to={category.to}
                key={category.key}
              >
                <Icon size={22} strokeWidth={1.8} />
                <span>{language === 'zh' ? category.labelZh : category.labelEn}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="container home-products"
        aria-labelledby="home-products-title"
      >
        <div className="home-section-heading">
          <div>
            <h2 id="home-products-title">{text.products.title}</h2>
            <p>{text.products.description}</p>
          </div>
          <Link className="home-text-link" to="/shop">
            {text.products.action}
            <ArrowRight size={17} />
          </Link>
        </div>

        {popularProducts.length > 0 ? (
          <div className="home-product-grid">
            {popularProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="home-products-empty">
            <PackageCheck size={24} />
            <p>{text.products.empty}</p>
            <Link to="/shop">{text.products.action}</Link>
          </div>
        )}
      </section>

      <section
        className="home-ordering"
        aria-labelledby="home-ordering-title"
      >
        <div className="container home-ordering-grid">
          <div className="home-ordering-copy">
            <h2 id="home-ordering-title">{text.ordering.title}</h2>
            <p>{text.ordering.description}</p>
          </div>
          <div className="home-ordering-points">
            {text.ordering.points.map((point, index) => {
              const Icon = ORDERING_ICONS[index];
              return (
                <div className="home-ordering-point" key={point}>
                  <Icon size={20} strokeWidth={1.8} />
                  <span>{point}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="container home-playroom"
        aria-labelledby="home-playroom-title"
      >
        <img
          className="home-playroom-mascot"
          src={asset('/assets/game/playroom-mascot.webp')}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <div className="home-playroom-copy">
          <p className="home-eyebrow">{text.playroom.eyebrow}</p>
          <h2 id="home-playroom-title">{text.playroom.title}</h2>
          <p>{text.playroom.description}</p>
        </div>
        <Link className="btn home-playroom-action" to="/play/">
          <Gamepad2 size={18} />
          {text.playroom.action}
        </Link>
      </section>

      <section
        className="home-closing"
        aria-labelledby="home-closing-title"
      >
        <div className="container home-closing-inner">
          <h2 id="home-closing-title">{text.closing.title}</h2>
          <div className="home-actions">
            <Link className="btn home-closing-primary" to="/shop">
              {text.closing.primaryAction}
              <ArrowRight size={18} />
            </Link>
            <a
              className="btn home-closing-secondary"
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              {text.closing.secondaryAction}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
