import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import GlobalConfirmModal from './components/GlobalConfirmModal';
import MarketingConsent from './components/MarketingConsent';
import AnalyticsTracker from './components/AnalyticsTracker';

import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import AdminApp from './admin/AdminApp';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './components/ResetPassword';
import TrackOrder from './pages/TrackOrder';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import PoliticaDevolucao from './pages/PoliticaDevolucao';
import TermosCondicoes from './pages/TermosCondicoes';

// Lazy-load Stripe-dependent pages so stripe.js is not fetched on every page
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const CheckoutFail = lazy(() => import('./pages/CheckoutFail'));

// import About from './pages/About';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <FavoritesProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <AnalyticsTracker />
              <GlobalConfirmModal />
              <MarketingConsent />

              <Routes>
                {/* Admin Routes */}
                <Route path="/admin/*" element={<AdminApp />} />

                {/* Public Routes */}
                <Route path="/*" element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/loja" element={<Shop />} />
                        <Route path="/loja/:categorySlug" element={<Shop />} />
                        <Route path="/produto/:id" element={<Product />} />
                        <Route path="/carrinho" element={<Cart />} />
                        <Route path="/finalizar-compra" element={
                          <Suspense fallback={null}>
                            <Checkout />
                          </Suspense>
                        } />
                        <Route path="/checkout/success" element={
                          <Suspense fallback={null}>
                            <CheckoutSuccess />
                          </Suspense>
                        } />
                        <Route path="/checkout/fail" element={
                          <Suspense fallback={null}>
                            <CheckoutFail />
                          </Suspense>
                        } />
                        <Route path="/contacto" element={<Contact />} />
                        <Route path="/perfil" element={<Profile />} />
                        <Route path="/encomendas" element={<Orders />} />
                        <Route path="/favoritos" element={<Favorites />} />
                        <Route path="/verificar-email" element={<VerifyEmail />} />
                        <Route path="/redefinir-senha" element={<ResetPassword />} />
                        <Route path="/track-order/:token" element={<TrackOrder />} />
                        <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                        <Route path="/politica-devolucao" element={<PoliticaDevolucao />} />
                        <Route path="/termos-condicoes" element={<TermosCondicoes />} />
                        {/* <Route path="/sobre" element={<About />} /> */}
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                } />
              </Routes>
            </Router>
          </CartProvider>
        </FavoritesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
