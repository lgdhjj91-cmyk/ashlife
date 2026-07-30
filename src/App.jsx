import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { LanguageProvider } from './context/LanguageContext';
import { OrderProvider } from './context/OrderContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { JoyWalletProvider } from './context/JoyWalletContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import About from './pages/About';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DIY from './pages/DIY';
import Checkout from './pages/Checkout';

const PlayroomPage = lazy(() => import('./playroom/pages/PlayroomPage'));
const AshlifeClawMachinePage = lazy(() => import('./playroom/games/claw-machine/AshlifeClawMachinePage'));
const BadgeStudioPage = lazy(() => import('./playroom/games/badge-studio/BadgeStudioPage'));

function App() {
  const basename = import.meta.env.BASE_URL;
  return (
    <LanguageProvider>
      <ProductProvider>
        <SiteContentProvider>
          <AdminAuthProvider>
            <JoyWalletProvider>
              <OrderProvider>
                <CartProvider>
                <BrowserRouter basename={basename}>
                  <div className="app">
                    <ScrollToTop />
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
                      <Route
                        path="/play/badge-studio/"
                        element={
                          <Suspense fallback={<div className="page container">Opening Badge Studio...</div>}>
                            <BadgeStudioPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/play/badge-studio"
                        element={
                          <Suspense fallback={<div className="page container">Opening Badge Studio...</div>}>
                            <BadgeStudioPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/play/claw-machine/"
                        element={
                          <Suspense fallback={<div className="page container">Loading Ashlife Swing & Win...</div>}>
                            <AshlifeClawMachinePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/play/claw-machine"
                        element={
                          <Suspense fallback={<div className="page container">Loading Ashlife Swing & Win...</div>}>
                            <AshlifeClawMachinePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/play/"
                        element={
                          <Suspense fallback={<div className="page container">Loading Ashlife Playroom...</div>}>
                            <PlayroomPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path="/play"
                        element={
                          <Suspense fallback={<div className="page container">Loading Ashlife Playroom...</div>}>
                            <PlayroomPage />
                          </Suspense>
                        }
                      />
                      <Route path="/admin" element={<AdminLogin />} />
                      <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    </Routes>
                    <Footer />
                  </div>
                </BrowserRouter>
                </CartProvider>
              </OrderProvider>
            </JoyWalletProvider>
          </AdminAuthProvider>
        </SiteContentProvider>
      </ProductProvider>
    </LanguageProvider>
  );
}

export default App;
