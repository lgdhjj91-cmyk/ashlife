import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import './Shop.css';

const categories = [
  'All',
  'Stationery',
  'DIY Crafts',
  'Cute Accessories',
  'Home Gadgets',
  'Cleaning Tools',
  'Lifestyle Items',
  'Festival Items'
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const { products } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  useEffect(() => {
    let result = products;

    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.description.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredProducts(result);
  }, [activeCategory, searchQuery, products]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    if (category === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  return (
    <div className="page container animate-fade-in shop-page">
      <div className="shop-header">
        <h1>Shop All Products</h1>
        
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search for cute items..." 
            className="input-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="shop-layout">
        {/* Sidebar Filter for Desktop / Scroller for Mobile */}
        <aside className="shop-sidebar">
          <h3>Categories</h3>
          <div className="category-list">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        <main className="shop-content">
          <div className="shop-results-info">
            <p>Showing {filteredProducts.length} products</p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid-mobile-1 grid-sm-2 grid-md-3">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No products found matching your criteria. Try a different search!</p>
              <button className="btn btn-primary mt-2" onClick={() => {
                setSearchQuery('');
                handleCategoryChange('All');
              }}>
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
