import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductList from '../components/ProductList';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import './Shop.css';

// Internal EN keys used for filtering (must match JSON category field)
const CATEGORY_MAP = [
  { en: 'All',              key: 'cat_all' },
  { en: 'Stationery',      key: 'cat_stationery' },
  { en: 'DIY Crafts',      key: 'cat_diy' },
  { en: 'Cute Accessories',key: 'cat_accessories' },
  { en: 'Home Gadgets',    key: 'cat_gadgets' },
  { en: 'Cleaning Tools',  key: 'cat_cleaning' },
  { en: 'Lifestyle Items', key: 'cat_lifestyle' },
  { en: 'Festival Items',  key: 'cat_festival' },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  useEffect(() => {
    if (!products) return;
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

    setFilteredProducts(result);
  }, [activeCategory, searchQuery, products]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setActiveCategory(category);
    if (category === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <div className="page container animate-fade-in shop-page">
      <div className="shop-header">
        <h1>{t('shop_title')}</h1>

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
                    setActiveCategory('All');
                    setSearchParams({});
                  }}>
                    {t('clear_filters')}
                  </button>
                )}
              </div>
              <ProductList products={filteredProducts} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
