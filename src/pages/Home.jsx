import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  
  // Get specific categories for sections
  const featuredProducts = products.slice(0, 4);
  const newArrivals = products.slice(4, 8);
  const diyProducts = products.filter(p => p.category === 'DIY Crafts').slice(0, 4);
  const studentPicks = products.filter(p => p.category === 'Stationery').slice(0, 4);

  return (
    <div className="page animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1>Welcome to ASHLIFE</h1>
          <p>Cute Stationery & Smart Life Tools</p>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>
            Shop Now
          </button>
        </div>
      </section>

      {/* Categories Banner */}
      <section className="categories-banner">
        <div className="container">
          <div className="category-pills">
            {['Stationery', 'DIY Crafts', 'Cute Accessories', 'Home Gadgets', 'Cleaning Tools', 'Lifestyle Items', 'Festival Items'].map(cat => (
              <Link to={`/shop?category=${encodeURIComponent(cat)}`} key={cat} className="category-pill">
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container sections-wrapper">
        {/* Featured Products */}
        <section className="home-section">
          <div className="section-header">
            <h2>Featured Products</h2>
            <Link to="/shop" className="view-all">View All</Link>
          </div>
          <div className="grid-mobile-1 grid-sm-2 grid-md-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="home-section bg-pastel-yellow section-padded">
          <div className="section-header">
            <h2>New Arrivals</h2>
            <Link to="/shop" className="view-all">View All</Link>
          </div>
          <div className="grid-mobile-1 grid-sm-2 grid-md-4">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* DIY Craft Corner */}
        {diyProducts.length > 0 && (
          <section className="home-section">
            <div className="section-header">
              <h2>DIY Craft Corner</h2>
              <Link to={`/shop?category=DIY Crafts`} className="view-all">View All</Link>
            </div>
            <div className="grid-mobile-1 grid-sm-2 grid-md-4">
              {diyProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Student Stationery Picks */}
        {studentPicks.length > 0 && (
          <section className="home-section bg-pastel-blue section-padded">
            <div className="section-header">
              <h2>Student Stationery Picks</h2>
              <Link to={`/shop?category=Stationery`} className="view-all">View All</Link>
            </div>
            <div className="grid-mobile-1 grid-sm-2 grid-md-4">
              {studentPicks.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
