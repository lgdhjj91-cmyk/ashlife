import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { LanguageProvider } from './context/LanguageContext';
import { OrderProvider } from './context/OrderContext';
import { SiteContentProvider } from './context/SiteContentContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import About from './pages/About';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DIY from './pages/DIY';
import Checkout from './pages/Checkout';

function App() {
  const basename = import.meta.env.BASE_URL;
  return (
    <LanguageProvider>
      <ProductProvider>
        <SiteContentProvider>
          <OrderProvider>
            <CartProvider>
              <BrowserRouter basename={basename}>
                <div className="app">
                  <Header />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/index.html" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/diy" element={<DIY />} />
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  </Routes>
                  <Footer />
                </div>
              </BrowserRouter>
            </CartProvider>
          </OrderProvider>
        </SiteContentProvider>
      </ProductProvider>
    </LanguageProvider>
  );
}

export default App;
