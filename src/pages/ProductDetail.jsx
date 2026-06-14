import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Minus, Plus, MessageCircle, PackageCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveAssetUrl } from '../utils/assets';
import { buildCartProduct, getProductImages, getVariantLabel, normalizeVariants } from '../utils/productVariants';
import './ProductDetail.css';

// Helper: calculate final price and discount info
const getDiscountInfo = (product) => {
  const { price, discountType, discountValue } = product;
  if (!discountType || discountType === 'none' || !discountValue) {
    return { hasDiscount: false, finalPrice: price, badge: null, savingsText: null };
  }
  if (discountType === 'percentage') {
    const pct = Math.min(Math.max(parseFloat(discountValue) || 0, 0), 100);
    const finalPrice = Math.max(0, price - price * pct / 100);
    const savings = (price - finalPrice).toFixed(2);
    return { hasDiscount: pct > 0, finalPrice, badge: `${pct}% OFF`, savingsText: `You save RM ${savings}` };
  }
  if (discountType === 'amount') {
    const amt = Math.max(parseFloat(discountValue) || 0, 0);
    const finalPrice = Math.max(0, price - amt);
    const pct = price > 0 ? Math.round((amt / price) * 100) : 0;
    return { hasDiscount: amt > 0, finalPrice, badge: `${pct}% OFF`, savingsText: `You save RM ${amt.toFixed(2)}` };
  }
  return { hasDiscount: false, finalPrice: price, badge: null, savingsText: null };
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const product = useMemo(() => products.find(p => p.id === id), [id, products]);
  const variants = useMemo(() => normalizeVariants(product), [product]);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0] || null;
  const productImages = getProductImages(product, selectedVariant);
  const mainImage = productImages.includes(selectedImage) ? selectedImage : productImages[0] || product?.image;

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
  const { hasDiscount, finalPrice, badge, savingsText } = getDiscountInfo(product);

  const handleAddToCart = () => {
    addToCart(buildCartProduct(product, selectedVariant, finalPrice), quantity);
  };

  const handleQuantityChange = (type) => {
    if (type === 'dec' && quantity > 1) {
      setQuantity(q => q - 1);
    } else if (type === 'inc') {
      setQuantity(q => q + 1);
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
                  <span className="product-price-large sale-price-large">RM {finalPrice.toFixed(2)}</span>
                  <span className="product-price-large-original">RM {product.price.toFixed(2)}</span>
                </div>
                {savingsText && <p className="savings-text">{savingsText}</p>}
              </>
            ) : (
              <div className="product-price-large">RM {product.price.toFixed(2)}</div>
            )}
          </div>

          <div className="product-description">
            <h3>{t('description')}</h3>
            <p>{displayDesc}</p>
          </div>

          {variants.length > 0 && (
            <div className="variant-selector-block">
              <h3>Variation</h3>
              <div className="variant-options">
                {variants.map((variant) => {
                  const variantLabel = getVariantLabel(variant, language) || `Option ${variants.indexOf(variant) + 1}`;
                  return (
                    <button
                      type="button"
                      key={variant.id}
                      className={`variant-option ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedImage('');
                        setSelectedVariantId(variant.id);
                      }}
                    >
                      {variant.image && (
                        <img src={resolveAssetUrl(variant.image)} alt={variantLabel} loading="lazy" />
                      )}
                      <span>{variantLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="purchase-actions">
            <div className="quantity-selector">
              <button
                type="button"
                className="qty-btn"
                onClick={() => handleQuantityChange('dec')}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => handleQuantityChange('inc')}
              >
                <Plus size={16} />
              </button>
            </div>

            <button className="btn btn-primary w-full add-btn-large" onClick={handleAddToCart}>
              <ShoppingBag size={20} />
              {t('add_to_cart')} - RM {(finalPrice * quantity).toFixed(2)}
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
