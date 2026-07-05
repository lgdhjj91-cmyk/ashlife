import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Baby,
  BriefcaseBusiness,
  Cable,
  CookingPot,
  Gift,
  Home,
  PackageOpen,
  Paintbrush,
  PlugZap,
  Search,
  Sparkles,
  Tags,
  Wrench,
} from 'lucide-react';
import ProductList from '../components/ProductList';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteContent } from '../context/SiteContentContext';
import { getProductPriceRange, normalizeVariants } from '../utils/productVariants';
import './Shop.css';

const iconMap = {
  baby: Baby,
  briefcase: BriefcaseBusiness,
  cable: Cable,
  cooking: CookingPot,
  gift: Gift,
  home: Home,
  package: PackageOpen,
  paintbrush: Paintbrush,
  plug: PlugZap,
  sparkles: Sparkles,
  tags: Tags,
  wrench: Wrench,
};

const hasReadyStock = (product) => {
  const variants = normalizeVariants(product);
  if (variants.length > 0) {
    return variants.some((variant) => Number(variant.stock) > 0);
  }
  return Number(product.stock) > 0;
};

const productDateValue = (product) => {
  const value = product.createdAt || product.updatedAt || product.dateAdded || '';
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const urlSearchQuery = searchParams.get('search') || '';
  const stockFilter = searchParams.get('stock') || 'all';
  const sortMode = searchParams.get('sort') || 'newest';

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
    let result = [...products];

    if (activeCategory !== 'All') {
      result = result.filter((product) => product.category === activeCategory);
    }

    if (stockFilter === 'ready') {
      result = result.filter(hasReadyStock);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((product) => {
        const variants = normalizeVariants(product)
          .map((variant) => [variant.id, variant.name, variant.name_zh].filter(Boolean).join(' '))
          .join(' ');
        const haystack = [
          product.id,
          product.sku,
          product.name,
          product.name_zh,
          product.description,
          product.description_zh,
          product.category,
          product.category_zh,
          variants,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(lowerQuery);
      });
    }

    result.sort((a, b) => {
      if (sortMode === 'price-asc') {
        return getProductPriceRange(a).min - getProductPriceRange(b).min;
      }
      if (sortMode === 'price-desc') {
        return getProductPriceRange(b).min - getProductPriceRange(a).min;
      }
      return productDateValue(b) - productDateValue(a);
    });

    return result;
  }, [activeCategory, searchQuery, products, stockFilter, sortMode]);

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
    if (stockFilter === 'ready') {
      nextParams.stock = 'ready';
    }
    if (sortMode !== 'newest') {
      nextParams.sort = sortMode;
    }

    if (Object.keys(nextParams).length === 0) {
      setSearchParams({});
    } else {
      setSearchParams(nextParams);
    }
  };

  const updateParams = (nextValues) => {
    const nextParams = {
      ...(activeCategory !== 'All' ? { category: activeCategory } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      ...(stockFilter === 'ready' ? { stock: 'ready' } : {}),
      ...(sortMode !== 'newest' ? { sort: sortMode } : {}),
      ...nextValues,
    };

    Object.keys(nextParams).forEach((key) => {
      if (!nextParams[key] || nextParams[key] === 'All' || nextParams[key] === 'all' || nextParams[key] === 'newest') {
        delete nextParams[key];
      }
    });
    setSearchParams(nextParams);
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
                if (stockFilter === 'ready') {
                  nextParams.stock = 'ready';
                }
                if (sortMode !== 'newest') {
                  nextParams.sort = sortMode;
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

          <label className="ready-stock-filter">
            <input
              type="checkbox"
              checked={stockFilter === 'ready'}
              onChange={(event) => updateParams({ stock: event.target.checked ? 'ready' : 'all' })}
            />
            <span>{language === 'zh' ? '只看现货' : 'Ready stock'}</span>
          </label>

          <div className="category-dropdown sort-dropdown">
            <select
              value={sortMode}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="input-base category-select"
              aria-label="Sort products"
            >
              <option value="newest">{language === 'zh' ? '最新' : 'Newest'}</option>
              <option value="price-asc">{language === 'zh' ? '价格低到高' : 'Price low to high'}</option>
              <option value="price-desc">{language === 'zh' ? '价格高到低' : 'Price high to low'}</option>
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
              <ProductList key={`${activeCategory}-${searchQuery}-${stockFilter}-${sortMode}`} products={filteredProducts} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
