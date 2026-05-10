import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import './ProductCard.css';

// Helper: calculate final price and discount label
const getDiscountInfo = (product) => {
  const { price, discountType, discountValue } = product;
  if (!discountType || discountType === 'none' || !discountValue) {
    return { hasDiscount: false, finalPrice: price, badge: null };
  }
  if (discountType === 'percentage') {
    const pct = Math.min(Math.max(parseFloat(discountValue) || 0, 0), 100);
    const finalPrice = Math.max(0, price - price * pct / 100);
    return { hasDiscount: pct > 0, finalPrice, badge: `${pct}% OFF` };
  }
  if (discountType === 'amount') {
    const amt = Math.max(parseFloat(discountValue) || 0, 0);
    const finalPrice = Math.max(0, price - amt);
    const pct = price > 0 ? Math.round((amt / price) * 100) : 0;
    return { hasDiscount: amt > 0, finalPrice, badge: `${pct}% OFF` };
  }
  return { hasDiscount: false, finalPrice: price, badge: null };
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { language } = useLanguage();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
  };

  const displayName = language === 'zh' && product.name_zh ? product.name_zh : product.name;
  const displayCategory = language === 'zh' && product.category_zh ? product.category_zh : product.category;
  const { hasDiscount, finalPrice, badge } = getDiscountInfo(product);

  return (
    <Link to={`/product/${product.id}`} className="card product-card">
      <div className="product-image-wrapper">
        <img src={product.image} alt={displayName} className="product-image" loading="lazy" />
        {hasDiscount && badge && (
          <span className="discount-badge">{badge}</span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{displayCategory}</span>
        <h3 className="product-name">{displayName}</h3>
        <div className="product-footer">
          <div className="product-price-block">
            {hasDiscount ? (
              <>
                <span className="product-price sale-price">RM {finalPrice.toFixed(2)}</span>
                <span className="product-price-original">RM {product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="product-price">RM {product.price.toFixed(2)}</span>
            )}
          </div>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            aria-label="Add to cart"
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
