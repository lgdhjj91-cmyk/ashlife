import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Minus, Plus, MessageCircle, PackageCheck, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveAssetUrl } from '../utils/assets';
import { buildCartProduct, getDiscountInfo, getProductImages, getProductPrice, getProductPriceRange, getVariantLabel, normalizeVariants, usesIndividualVariantPrices } from '../utils/productVariants';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [showError, setShowError] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const [showAllVariants, setShowAllVariants] = useState(false);

  const product = useMemo(() => products.find(p => p.id === id), [id, products]);
  const variants = useMemo(() => normalizeVariants(product), [product]);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || null;
  const productImages = getProductImages(product, selectedVariant);
  const mainImage = productImages.includes(selectedImage) ? selectedImage : productImages[0] || product?.image;
  const variantSearchTerm = variantSearch.trim().toLowerCase();
  const hasManyVariants = variants.length > 10;
  const matchingVariants = useMemo(() => {
    if (!variantSearchTerm) return variants;
    return variants.filter((variant) =>
      [variant.name, variant.name_zh]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(variantSearchTerm)
    );
  }, [variantSearchTerm, variants]);
  const visibleVariants = hasManyVariants && !variantSearchTerm && !showAllVariants
    ? matchingVariants.slice(0, 12)
    : matchingVariants;

  if (!product) {
    return (
      <div className="page container text-center mt-4">
        <h2>{t('product_not_found')}</h2>
        <button className="btn btn-primary mt-2" onClick={() => navigate('/shop')}>
          {t('return_to_shop')}
        </button>
      </div>
    );
  }

  const displayName = language === 'zh' && product.name_zh ? product.name_zh : product.name;
  const displayDesc = language === 'zh' && product.description_zh ? product.description_zh : product.description;
  const displayCategory = language === 'zh' && product.category_zh ? product.category_zh : product.category;
  const awaitingPricedVariant = usesIndividualVariantPrices(product) && variants.length > 0 && !selectedVariant;
  const activePrice = awaitingPricedVariant ? getProductPriceRange(product).min : getProductPrice(product, selectedVariant);
  const { hasDiscount, finalPrice, badge, savings } = getDiscountInfo(product, activePrice);

  const isOutOfStock = variants.length > 0
    ? (selectedVariant ? (selectedVariant.stock ?? 0) <= 0 : false)
    : (product.stock ?? 0) <= 0;
  const quantityLimit = selectedVariant
    ? (selectedVariant.stock ?? 0)
    : variants.length === 0
      ? (product.stock ?? 0)
      : Infinity;
  const selectedQuantity = Number.isFinite(quantityLimit) && quantityLimit > 0
    ? Math.min(quantity, quantityLimit)
    : quantity;

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      setShowError(true);
      return;
    }
    if (isOutOfStock) return;
    addToCart(buildCartProduct(product, selectedVariant, finalPrice), selectedQuantity);
  };

  const handleQuantityChange = (type) => {
    const limit = selectedVariant
      ? (selectedVariant.stock ?? 0)
      : (product?.stock ?? 0);

    if (type === 'dec' && quantity > 1) {
      setQuantity(q => q - 1);
    } else if (type === 'inc') {
      if (selectedVariant || variants.length === 0) {
        if (quantity < limit) {
          setQuantity(q => q + 1);
        }
      } else {
        setQuantity(q => q + 1);
      }
    }
  };

  return (
    <div className="page container animate-fade-in product-detail-page">
      <Link to="/shop" className="back-link">
        <ArrowLeft size={20} />
        {t('back_to_shop')}
      </Link>

      <div className="detail-layout">
        <div className="detail-image-section">
          <div className="main-image-wrapper">
            <img src={resolveAssetUrl(mainImage)} alt={displayName} loading="lazy" />
          </div>
          {productImages.length > 1 && (
            <div className="thumbnail-gallery">
              {productImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`thumbnail ${mainImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setSelectedImage(imgUrl)}
                >
                  <img src={resolveAssetUrl(imgUrl)} alt={`${displayName} view ${index + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info-section">
          <span className="product-category-badge">{displayCategory}</span>
          <h1 className="product-title">{displayName}</h1>

          <div className="product-price-detail-block">
            {hasDiscount ? (
              <>
                {badge && <span className="detail-discount-badge">{badge}</span>}
                <div className="detail-price-row">
                  <span className="product-price-large sale-price-large">{awaitingPricedVariant ? 'From ' : ''}RM {finalPrice.toFixed(2)}</span>
                  <span className="product-price-large-original">RM {activePrice.toFixed(2)}</span>
                </div>
                {savings > 0 && <p className="savings-text">You save RM {savings.toFixed(2)}</p>}
              </>
            ) : (
              <div className="product-price-large">
                {awaitingPricedVariant ? 'From ' : ''}RM {activePrice.toFixed(2)}
              </div>
            )}
          </div>

          <div className="stock-status-block">
            <span className="stock-status-label">{t('stock')}:</span>
            {variants.length > 0 ? (
              selectedVariant ? (
                selectedVariant.stock > 0 ? (
                  selectedVariant.stock <= 5 ? (
                    <span className="stock-status-value low-stock">
                      {t('only_left')}{selectedVariant.stock}{t('left')}
                    </span>
                  ) : (
                    <span className="stock-status-value in-stock">
                      {selectedVariant.stock} {t('units')} {t('available')}
                    </span>
                  )
                ) : (
                  <span className="stock-status-value out-of-stock">{t('out_of_stock')}</span>
                )
              ) : (
                <span className="stock-status-value select-variant">{t('select_variation_for_stock')}</span>
              )
            ) : (
              (product.stock ?? 0) > 0 ? (
                (product.stock ?? 0) <= 5 ? (
                  <span className="stock-status-value low-stock">
                    {t('only_left')}{product.stock}{t('left')}
                  </span>
                ) : (
                  <span className="stock-status-value in-stock">
                    {product.stock} {t('units')} {t('available')}
                  </span>
                )
              ) : (
                <span className="stock-status-value out-of-stock">{t('out_of_stock')}</span>
              )
            )}
          </div>

          <div className="product-description">
            <h3>{t('description')}</h3>
            <p>{displayDesc}</p>
          </div>

          {variants.length > 0 && (
            <div className={`variant-selector-block ${hasManyVariants ? 'many-variants' : ''}`}>
              <div className="variant-heading-row">
                <h3>Variation</h3>
                {hasManyVariants && (
                  <span>{variants.length} options</span>
                )}
              </div>
              {hasManyVariants && (
                <div className="variant-tools">
                  <div className="variant-search">
                    <Search size={16} />
                    <input
                      type="search"
                      value={variantSearch}
                      onChange={(event) => {
                        setVariantSearch(event.target.value);
                        setShowAllVariants(true);
                      }}
                      placeholder="Search variations"
                      aria-label="Search product variations"
                    />
                  </div>
                  {!variantSearchTerm && variants.length > visibleVariants.length && (
                    <button
                      type="button"
                      className="variant-show-all"
                      onClick={() => setShowAllVariants(true)}
                    >
                      Show all
                    </button>
                  )}
                </div>
              )}
              <div className="variant-options">
                {visibleVariants.map((variant) => {
                  const variantLabel = getVariantLabel(variant, language) || `Option ${variants.indexOf(variant) + 1}`;
                  return (
                    <button
                      type="button"
                      key={variant.id}
                      className={`variant-option ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedImage('');
                        setSelectedVariantId(variant.id);
                        setShowError(false);
                      }}
                    >
                      {variant.image && (
                        <img src={resolveAssetUrl(variant.image)} alt={variantLabel} loading="lazy" />
                      )}
                      <span>{variantLabel}</span>
                      {usesIndividualVariantPrices(product) && (
                        <small>RM {getDiscountInfo(product, getProductPrice(product, variant)).finalPrice.toFixed(2)}</small>
                      )}
                    </button>
                  );
                })}
              </div>
              {hasManyVariants && matchingVariants.length === 0 && (
                <p className="variant-empty">No variation matches that search.</p>
              )}
              {hasManyVariants && !variantSearchTerm && showAllVariants && (
                <button
                  type="button"
                  className="variant-show-less"
                  onClick={() => setShowAllVariants(false)}
                >
                  Show fewer options
                </button>
              )}
              {showError && (
                <div className="variant-error-message mt-2">
                  {t('please_select_variation')}
                </div>
              )}
            </div>
          )}

          <div className="purchase-actions">
            <div className="quantity-selector">
              <button
                type="button"
                className="qty-btn"
                onClick={() => handleQuantityChange('dec')}
                disabled={quantity <= 1 || isOutOfStock}
              >
                <Minus size={16} />
              </button>
              <span className="qty-value">{selectedQuantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => handleQuantityChange('inc')}
                disabled={isOutOfStock}
              >
                <Plus size={16} />
              </button>
            </div>

            <button 
              className="btn btn-primary w-full add-btn-large" 
              onClick={handleAddToCart}
              disabled={isOutOfStock || (variants.length > 0 && !selectedVariant)}
            >
              <ShoppingBag size={20} />
              {isOutOfStock 
                ? t('out_of_stock') 
                : (variants.length > 0 && !selectedVariant)
                  ? t('please_select_variation')
                  : `${t('add_to_cart')}${awaitingPricedVariant ? '' : ` - RM ${(finalPrice * selectedQuantity).toFixed(2)}`}`
              }
            </button>
          </div>

          <div className="delivery-info">
            <p><MessageCircle size={18} /><strong>{t('delivery_fast')}</strong> - {t('delivery_fast_note')}</p>
            <p><PackageCheck size={18} /><strong>{t('delivery_pack')}</strong> - {t('delivery_pack_note')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
