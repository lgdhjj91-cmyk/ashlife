import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { resolveAssetUrl } from '../utils/assets';
import { buildCartProduct, getDiscountInfo, getProductPriceRange, normalizeVariants } from '../utils/productVariants';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const variants = normalizeVariants(product);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (variants.length > 0) {
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart(buildCartProduct(product, null, finalPrice));
  };

  const displayName = language === 'zh' && product.name_zh ? product.name_zh : product.name;
  const displayCategory = language === 'zh' && product.category_zh ? product.category_zh : product.category;
  const priceRange = getProductPriceRange(product);
  const hasPriceRange = priceRange.min !== priceRange.max;
  const { hasDiscount, finalPrice, badge } = getDiscountInfo(product, priceRange.min);

  return (
    <Link to={`/product/${product.id}`} className="card product-card">
      <div className="product-image-wrapper">
        <img src={resolveAssetUrl(product.image)} alt={displayName} className="product-image" loading="lazy" />
        {hasDiscount && badge && (
          <span className="discount-badge">{badge}</span>
        )}
        {variants.length > 0 && (
          <span className="variant-badge">{variants.length} options</span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{displayCategory}</span>
        <h3 className="product-name">{displayName}</h3>
        <div className="product-footer">
          <div className="product-price-block">
            {hasDiscount ? (
              <>
                <span className="product-price sale-price">{hasPriceRange ? 'From ' : ''}RM {finalPrice.toFixed(2)}</span>
                <span className="product-price-original">RM {priceRange.min.toFixed(2)}</span>
              </>
            ) : (
              <span className="product-price">{hasPriceRange ? 'From ' : ''}RM {priceRange.min.toFixed(2)}</span>
            )}
          </div>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            aria-label={variants.length > 0 ? 'Choose variation' : 'Add to cart'}
          >
            {variants.length > 0 ? <ListChecks size={18} /> : <ShoppingBag size={18} />}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
