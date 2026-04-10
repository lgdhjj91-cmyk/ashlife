import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
      setMainImage(found.image);
    }
  }, [id, products]);

  if (!product) {
    return (
      <div className="page container text-center mt-4">
        <h2>Product not found</h2>
        <button className="btn btn-primary mt-2" onClick={() => navigate('/shop')}>
          Return to Shop
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    // Optional feedback like a toast could go here
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
        Back to Shop
      </Link>

      <div className="detail-layout">
        <div className="detail-image-section">
          <div className="main-image-wrapper">
            <img src={mainImage} alt={product.name} />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-gallery">
              {product.images.map((imgUrl, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${mainImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setMainImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${product.name} view ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info-section">
          <span className="product-category-badge">{product.category}</span>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price-large">RM {product.price.toFixed(2)}</div>
          
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
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
              Add to Cart - RM {(product.price * quantity).toFixed(2)}
            </button>
          </div>
          
          <div className="delivery-info">
            <p>🛍️ <strong>Fast dispatch</strong> - Your order will be confirmed manually via WhatsApp.</p>
            <p>💖 <strong>Cute Packaging</strong> - Every item is packed with care.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
