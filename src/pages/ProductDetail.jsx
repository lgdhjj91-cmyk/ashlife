import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Minus, Plus, MessageCircle, PackageCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useLanguage } from '../context/LanguageContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');

  const product = useMemo(() => products.find(p => p.id === id), [id, products]);
  const productImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const mainImage = productImages.includes(selectedImage) ? selectedImage : product?.image;

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

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleQuantityChange = (type) => {
    if (type === 'dec' && quantity > 1) {
      setQuantity(q => q - 1);
    } else if (type === 'inc') {
      setQuantity(q => q + 1);
    }
  };

  const displayName = language === 'zh' && product.name_zh ? product.name_zh : product.name;
  const displayDesc = language === 'zh' && product.description_zh ? product.description_zh : product.description;
  const displayCategory = language === 'zh' && product.category_zh ? product.category_zh : product.category;

  return (
    <div className="page container animate-fade-in product-detail-page">
      <Link to="/shop" className="back-link">
        <ArrowLeft size={20} />
        {t('back_to_shop')}
      </Link>

      <div className="detail-layout">
        <div className="detail-image-section">
          <div className="main-image-wrapper">
            <img src={mainImage} alt={displayName} loading="lazy" />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-gallery">
              {product.images.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`thumbnail ${mainImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setSelectedImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${displayName} view ${index + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info-section">
          <span className="product-category-badge">{displayCategory}</span>
          <h1 className="product-title">{displayName}</h1>
          <div className="product-price-large">RM {product.price.toFixed(2)}</div>

          <div className="product-description">
            <h3>{t('description')}</h3>
            <p>{displayDesc}</p>
          </div>

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
              {t('add_to_cart')} - RM {(product.price * quantity).toFixed(2)}
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
