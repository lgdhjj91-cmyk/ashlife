import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { handleImageFallback, resolveAssetUrl } from '../utils/assets';
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
  const tracksStock = variants.length > 0 || product.stock != null;
  const availableStock = variants.length > 0
    ? variants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0)
    : product.stock == null ? Infinity : Number(product.stock) || 0;
  const hasStock = availableStock > 0;
  const productText = language === 'zh'
    ? {
      viewOptions: '查看选项',
      add: '加入',
      options: '个选项',
      optionsAvailable: '个选项可选',
      inStock: '现货',
      outOfStock: '缺货',
      stockToConfirm: '库存待确认',
      from: '从 ',
      chooseVariation: '选择规格',
      addToCart: '加入购物车',
    }
    : {
      viewOptions: 'View options',
      add: 'Add',
      options: 'options',
      optionsAvailable: 'options available',
      inStock: 'In stock',
      outOfStock: 'Out of stock',
      stockToConfirm: 'Stock to confirm',
      from: 'From ',
      chooseVariation: 'Choose variation',
      addToCart: 'Add to cart',
    };
  const actionLabel = variants.length > 0 ? productText.viewOptions : productText.add;

  return (
    <Link to={`/product/${product.id}`} className="card product-card">
      <div className="product-image-wrapper">
        <img
          src={resolveAssetUrl(product.image)}
          alt={displayName}
          className="product-image"
          loading="lazy"
          onError={handleImageFallback}
        />
        {hasDiscount && badge && (
          <span className="discount-badge">{badge}</span>
        )}
        {variants.length > 0 && (
          <span className="variant-badge">
            {language === 'zh' ? `${variants.length}${productText.options}` : `${variants.length} ${productText.options}`}
          </span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{displayCategory}</span>
        <h3 className="product-name">{displayName}</h3>
        <div className="product-card-meta">
          {variants.length > 0 ? (
            <span>
              {language === 'zh'
                ? `${variants.length}${productText.optionsAvailable}`
                : `${variants.length} ${productText.optionsAvailable}`}
            </span>
          ) : (
            <span>{tracksStock ? (hasStock ? productText.inStock : productText.outOfStock) : productText.stockToConfirm}</span>
          )}
        </div>
        <div className="product-footer">
          <div className="product-price-block">
            {hasDiscount ? (
              <>
                <span className="product-price sale-price">{hasPriceRange ? productText.from : ''}RM {finalPrice.toFixed(2)}</span>
                <span className="product-price-original">RM {priceRange.min.toFixed(2)}</span>
              </>
            ) : (
              <span className="product-price">{hasPriceRange ? productText.from : ''}RM {priceRange.min.toFixed(2)}</span>
            )}
          </div>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            aria-label={variants.length > 0 ? productText.chooseVariation : productText.addToCart}
            disabled={tracksStock && !hasStock}
          >
            {variants.length > 0 ? <ListChecks size={18} /> : <ShoppingBag size={18} />}
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
