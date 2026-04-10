import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigating to detail page when clicking button
    addToCart(product);
  };

  return (
    <Link to={`/product/${product.id}`} className="card product-card">
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-footer">
          <span className="product-price">RM {product.price.toFixed(2)}</span>
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
