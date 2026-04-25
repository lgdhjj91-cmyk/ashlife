import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cable, Home, Paintbrush, Search, Sparkles } from 'lucide-react';
import ProductList from '../components/ProductList';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import './Shop.css';

// Internal EN keys used for filtering (must match JSON category field)
const CATEGORY_MAP = [
  { en: 'All',              key: 'cat_all' },
  { en: 'Home Gadgets',     key: 'cat_cable' },
  { en: 'Cleaning Tools',   key: 'cat_home_kitchen' },
  { en: 'Lifestyle Items',  key: 'cat_work' },
  { en: 'Stationery',      key: 'cat_stationery' },
  { en: 'DIY Crafts',      key: 'cat_diy' },
  { en: 'Cute Accessories',key: 'cat_accessories' },
  { en: 'Festival Items',  key: 'cat_festival' },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const activeCategory = initialCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading } = useProducts();
  const { t, language } = useLanguage();
  const rangeCards = [
    { to: '/shop?category=Home%20Gadgets', icon: <Cable size={20} />, label: t('cat_cable'), text: language === 'zh' ? '魔术贴、电线收纳、桌面整理' : 'Hook-and-loop, cable care and desk tidy tools' },
    { to: '/shop?category=Cleaning%20Tools', icon: <Home size={20} />, label: t('cat_home_kitchen'), text: language === 'zh' ? '厨房、清洁、居家小工具' : 'Kitchen, cleaning and home helper items' },
    { to: '/shop?category=DIY%20Crafts', icon: <Paintbrush size={20} />, label: t('cat_diy'), text: language === 'zh' ? '树脂、手作、儿童创意材料' : 'Resin, craft and kids creative supplies' },
    { to: '/shop?category=Stationery', icon: <Sparkles size={20} />, label: t('cat_stationery'), text: language === 'zh' ? '便签、笔类、学习与办公用品' : 'Memo pads, pens, study and office supplies' },
  ];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => {
        const nameEn = p.name?.toLowerCase() || '';
        const nameZh = p.name_zh?.toLowerCase() || '';
        const descEn = p.description?.toLowerCase() || '';
        const descZh = p.description_zh?.toLowerCase() || '';
        return (
          nameEn.includes(lowerQuery) ||
          nameZh.includes(lowerQuery) ||
          descEn.includes(lowerQuery) ||
          descZh.includes(lowerQuery)
        );
      });
    }

    return result;
  }, [activeCategory, searchQuery, products]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    if (category === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <div className="page container animate-fade-in shop-page">
      <div className="shop-header">
        <div className="shop-title-copy">
          <p className="section-kicker">ASHLIFE</p>
          <h1>{t('shop_title')}</h1>
          <p>{t('shop_intro')}</p>
        </div>

        <div className="shop-filters">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="input-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-dropdown">
            <select
              value={activeCategory}
              onChange={handleCategoryChange}
              className="input-base category-select"
              aria-label="Filter by category"
            >
              {CATEGORY_MAP.map(({ en, key }) => (
                <option key={en} value={en}>
                  {t(key)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="shop-range-cards">
        {rangeCards.map(({ to, icon, label, text }) => (
          <Link to={to} className="shop-range-card" key={label}>
            {icon}
            <span>{label}</span>
            <p>{text}</p>
          </Link>
        ))}
      </div>

      <div className="shop-layout">
        <main className="shop-content full-width">
          {loading ? (
            <div className="loading-state">
              <p>{t('loading')}</p>
            </div>
          ) : (
            <>
              <div className="shop-results-info">
                <p>{t('showing')} {filteredProducts.length} {t('products')}</p>
                {filteredProducts.length === 0 && (
                  <button className="btn btn-primary ml-2" onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}>
                    {t('clear_filters')}
                  </button>
                )}
              </div>
              <ProductList key={`${activeCategory}-${searchQuery}`} products={filteredProducts} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
