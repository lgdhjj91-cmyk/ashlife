import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Coins, Gamepad2, ShoppingBag, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useProducts } from '../context/ProductContext';
import { resolveAssetUrl } from '../utils/assets';
import { getCartItemKey, getVariantLabel } from '../utils/productVariants';
import './Header.css';

const logoSrc = `${import.meta.env.BASE_URL}brand/ashlife-logo.webp`;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);
  const cartMenuRef = useRef(null);
  const { cartItems, cartCount, cartTotal } = useCart();
  const { products } = useProducts();
  const { t, toggleLanguage, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const playNavLabel = language === 'zh' ? '🎮 玩游戏赢奖励' : '🎮 Play & Win';

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsCartPreviewOpen(false);
    setIsMenuOpen(false);
  }

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsCartPreviewOpen(false);
  };
  const closeMenu = () => setIsMenuOpen(false);

  const toggleCartPreview = () => {
    setIsCartPreviewOpen((prev) => !prev);
    setIsMenuOpen(false);
    setIsSearchFocused(false);
  };

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsCartPreviewOpen(false);
    setIsSearchFocused(false);
  };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (isMenuOpen) {
        const isClickInsideNav = navRef.current && navRef.current.contains(event.target);
        const isClickOnMenuBtn = mobileMenuBtnRef.current && mobileMenuBtnRef.current.contains(event.target);
        if (!isClickInsideNav && !isClickOnMenuBtn) {
          setIsMenuOpen(false);
        }
      }

      if (isCartPreviewOpen) {
        if (cartMenuRef.current && !cartMenuRef.current.contains(event.target)) {
          setIsCartPreviewOpen(false);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsCartPreviewOpen(false);
      }
    };

    if (isMenuOpen || isCartPreviewOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('touchstart', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, isCartPreviewOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const trimmedSearch = searchQuery.trim();
  const searchSuggestions = trimmedSearch
    ? products
      .filter((product) => {
        const haystack = [
          product.name,
          product.name_zh,
          product.description,
          product.description_zh,
          product.category,
          product.category_zh,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(trimmedSearch.toLowerCase());
      })
      .slice(0, 5)
    : [];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!trimmedSearch) {
      navigate('/shop');
      return;
    }
    navigate(`/shop?search=${encodeURIComponent(trimmedSearch)}`);
    setIsSearchFocused(false);
    closeAll();
  };

  const handleSuggestionClick = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    closeAll();
  };

  return (
    <header className="header">
      <div className="container header-container">
        <button
          ref={mobileMenuBtnRef}
          className="mobile-menu-btn"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="logo" onClick={closeAll}>
          <img src={logoSrc} alt="ASHLIFE Solutions" className="logo-mark" />
        </Link>

        <form className="global-search-form" onSubmit={handleSearchSubmit} role="search">
          <Search size={18} className="global-search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => {
              setIsSearchFocused(true);
              setIsCartPreviewOpen(false);
            }}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t('global_search_placeholder')}
            aria-label={t('global_search_label')}
          />
          <button type="submit">{t('global_search_button')}</button>

          {isSearchFocused && trimmedSearch && (
            <div className="search-suggestions">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((product) => {
                  const displayName = language === 'zh' && product.name_zh ? product.name_zh : product.name;
                  const displayCategory = language === 'zh' && product.category_zh ? product.category_zh : product.category;

                  return (
                    <Link
                      to={`/product/${product.id}`}
                      className="search-suggestion-item"
                      key={product.id}
                      onMouseDown={handleSuggestionClick}
                    >
                      <img src={resolveAssetUrl(product.image)} alt={displayName} />
                      <span>
                        <strong>{displayName}</strong>
                        <small>{displayCategory} · RM {Number(product.price || 0).toFixed(2)}</small>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <Link
                  to={`/shop?search=${encodeURIComponent(trimmedSearch)}`}
                  className="search-suggestion-empty"
                  onMouseDown={handleSuggestionClick}
                >
                  {t('global_search_no_results')} "{trimmedSearch}"
                </Link>
              )}
            </div>
          )}
        </form>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`} ref={navRef}>
          <Link to="/" onClick={closeAll}>{t('nav_home')}</Link>
          <Link to="/shop" onClick={closeAll}>{t('nav_shop')}</Link>
          <Link to="/diy" onClick={closeAll}>{t('nav_diy')}</Link>
          <Link to="/play/" className="play-nav-link" onClick={closeAll}>
            <Gamepad2 size={17} />
            <span>{playNavLabel}</span>
          </Link>
          <Link to="/about" onClick={closeAll}>{t('nav_about')}</Link>
          <Link to="/joy-coins" className="joy-header-link" onClick={closeAll}><Coins size={17} /> Joy Coins</Link>
        </nav>

        <div className="header-actions">
          <button
            className="lang-toggle-btn"
            onClick={toggleLanguage}
            aria-label="Toggle language"
            title="Switch language / 切换语言"
          >
            {t('lang_toggle')}
          </button>
          <div className={`cart-menu-wrapper ${isCartPreviewOpen ? 'is-open' : ''}`} ref={cartMenuRef}>
            <button
              type="button"
              className={`header-cart ${isCartPreviewOpen ? 'active' : ''}`}
              onClick={toggleCartPreview}
              aria-label={t('cart_title')}
              aria-expanded={isCartPreviewOpen}
              aria-controls="cart-preview-panel"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            <div
              id="cart-preview-panel"
              className={`cart-preview-panel ${isCartPreviewOpen ? 'open' : ''}`}
              aria-hidden={!isCartPreviewOpen}
            >
              <div className="cart-preview-header">
                <strong>{t('cart_preview_title')}</strong>
                <span>RM {cartTotal.toFixed(2)}</span>
              </div>

              {cartItems.length > 0 ? (
                <div className="cart-preview-list">
                  {cartItems.slice(0, 5).map((item) => {
                    const itemName = language === 'zh' && item.name_zh ? item.name_zh : item.name;
                    const variantName =
                      getVariantLabel(item.selectedVariant, language) ||
                      (language === 'zh' && item.variantName_zh ? item.variantName_zh : item.variantName);

                    return (
                      <Link
                        to="/cart"
                        className="cart-preview-item"
                        key={getCartItemKey(item)}
                        onClick={closeAll}
                      >
                        <img src={resolveAssetUrl(item.image)} alt={itemName} />
                        <span>
                          <strong>{itemName}</strong>
                          {variantName && <small>{variantName}</small>}
                          <small>x{item.quantity} · RM {(item.price * item.quantity).toFixed(2)}</small>
                        </span>
                      </Link>
                    );
                  })}
                  {cartItems.length > 5 && (
                    <p className="cart-preview-more">
                      {t('cart_preview_more').replace('{count}', cartItems.length - 5)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="cart-preview-empty">{t('cart_preview_empty')}</p>
              )}

              <Link to="/cart" className="btn btn-primary cart-preview-button" onClick={closeAll}>
                {t('view_shopping_cart')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="menu-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;
