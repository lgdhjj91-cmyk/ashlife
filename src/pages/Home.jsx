import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import './Home.css';

const CATEGORY_KEYS = [
  { en: 'Stationery',      key: 'cat_stationery' },
  { en: 'DIY Crafts',      key: 'cat_diy' },
  { en: 'Cute Accessories',key: 'cat_accessories' },
  { en: 'Home Gadgets',    key: 'cat_gadgets' },
  { en: 'Cleaning Tools',  key: 'cat_cleaning' },
  { en: 'Lifestyle Items', key: 'cat_lifestyle' },
  { en: 'Festival Items',  key: 'cat_festival' },
];

const Home = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { t } = useLanguage();

  const featuredProducts = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);
  const diyProducts = products.filter(p => p.category === 'DIY Crafts').slice(0, 4);
  const studentPicks = products.filter(p => p.category === 'Stationery').slice(0, 4);

  return (
    <div className="page animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1>{t('hero_title')}</h1>
          <p>{t('hero_subtitle')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>
            {t('hero_btn')}
          </button>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="categories-banner">
        <div className="container">
          <div className="category-pills">
            {CATEGORY_KEYS.map(({ en, key }) => (
              <Link to={`/shop?category=${encodeURIComponent(en)}`} key={en} className="category-pill">
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container sections-wrapper">
        {/* Featured Products */}
        <section className="home-section">
          <div className="section-header">
            <h2>{t('section_featured')}</h2>
            <Link to="/shop" className="view-all">{t('view_all')}</Link>
          </div>
          <div className="grid-mobile-1 grid-sm-2 grid-md-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="home-section bg-pastel-yellow section-padded">
          <div className="section-header">
            <h2>{t('section_new_arrivals')}</h2>
            <Link to="/shop" className="view-all">{t('view_all')}</Link>
          </div>
          <div className="grid-mobile-1 grid-sm-2 grid-md-4">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* DIY Craft Corner */}
        {diyProducts.length > 0 && (
          <section className="home-section">
            <div className="section-header">
              <h2>{t('section_diy')}</h2>
              <Link to="/shop?category=DIY Crafts" className="view-all">{t('view_all')}</Link>
            </div>
            <div className="grid-mobile-1 grid-sm-2 grid-md-4">
              {diyProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Student Stationery Picks */}
        {studentPicks.length > 0 && (
          <section className="home-section bg-pastel-blue section-padded">
            <div className="section-header">
              <h2>{t('section_student')}</h2>
              <Link to="/shop?category=Stationery" className="view-all">{t('view_all')}</Link>
            </div>
            <div className="grid-mobile-1 grid-sm-2 grid-md-4">
              {studentPicks.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
