import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header">
      <div className="container header-container">
        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="logo" onClick={closeMenu}>
          ASHLIFE
        </Link>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/shop" onClick={closeMenu}>Shop</Link>
          <Link to="/about" onClick={closeMenu}>About Us</Link>
          <Link to="/admin" onClick={closeMenu}>Admin</Link>
        </nav>

        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/shop')} aria-label="Search">
            <Search size={22} />
          </button>
          <Link to="/cart" className="header-cart" onClick={closeMenu}>
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
      
      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
    </header>
  );
};

export default Header;
