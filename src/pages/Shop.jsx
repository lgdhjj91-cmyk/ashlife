import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Cable, Home, Paintbrush, Search, Sparkles } from 'lucide-react';
import ProductList from '../components/ProductList';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteContent } from '../context/SiteContentContext';
import './Shop.css';

const iconMap = {
  cable: Cable,
  home: Home,
  paintbrush: Paintbrush,
  sparkles: Sparkles,
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const urlSearchQuery = searchParams.get('search') || '';

  const activeCategory = initialCategory;
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const { products, loading } = useProducts();
  const { t, language } = useLanguage();
  const { siteContent } = useSiteContent();
  const categories = siteContent.categories || [];
  const categoryOptions = [{ en: 'All', zh: t('cat_all') }, ...categories];
  const rangeCards = categories
    .filter((category) => category.showInRange)
    .map((category) => {
      const Icon = iconMap[category.icon] || Sparkles;
      return {
        to: `/shop?category=${encodeURIComponent(category.en)}`,
        icon: <Icon size={20} />,
        label: language === 'zh' ? category.zh || category.en : category.en,
        text:
          language === 'zh'
            ? category.description_zh || category.description_en || ''
            : category.description_en || '',
      };
    });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;

    if (activeCategory !== 'All') {
      result = result.filter((product) => product.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((product) => {
        const nameEn = product.name?.toLowerCase() || '';
        const nameZh = product.name_zh?.toLowerCase() || '';
        const descEn = product.description?.toLowerCase() || '';
        const descZh = product.description_zh?.toLowerCase() || '';
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

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const nextParams = {};
    if (category !== 'All') {
      nextParams.category = category;
    }
    if (searchQuery.trim()) {
      nextParams.search = searchQuery.trim();
    }

    if (Object.keys(nextParams).length === 0) {
      setSearchParams({});
    } else {
      setSearchParams(nextParams);
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
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                const nextParams = {};
                if (activeCategory !== 'All') {
                  nextParams.category = activeCategory;
                }
                if (value.trim()) {
                  nextParams.search = value.trim();
                }
                setSearchParams(nextParams);
              }}
            />
          </div>

          <div className="category-dropdown">
            <select
              value={activeCategory}
              onChange={handleCategoryChange}
              className="input-base category-select"
              aria-label="Filter by category"
            >
              {categoryOptions.map((category) => (
                <option key={category.en} value={category.en}>
                  {language === 'zh' ? category.zh || category.en : category.en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {rangeCards.length > 0 && (
        <div className="shop-range-cards">
          {rangeCards.map(({ to, icon, label, text }) => (
            <Link to={to} className="shop-range-card" key={label}>
              {icon}
              <span>{label}</span>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="shop-layout">
        <main className="shop-content full-width">
          {loading ? (
            <div className="loading-state">
              <p>{t('loading')}</p>
            </div>
          ) : (
            <>
              <div className="shop-results-info">
                <p>
                  {t('showing')} {filteredProducts.length} {t('products')}
                </p>
                {filteredProducts.length === 0 && (
                  <button
                    className="btn btn-primary ml-2"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchParams({});
                    }}
                  >
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
