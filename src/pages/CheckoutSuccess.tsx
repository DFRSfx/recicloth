import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, LogIn, X } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuthModal from '../components/AuthModal';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Retry helper with exponential backoff (1s → 2s → 4s)
async function finalizeWithRetry(body: object, attempts = 3): Promise<{ id?: number; tracking_token?: string } | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch('/api/payment/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return res.json();
    } catch { /* network error — retry */ }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  return null; // All retries failed — webhook will handle it
}

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const { isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(urlToken);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem('pending_finalize');

    if (pending) {
      // New flow: payment confirmed on frontend, finalize + clearCart here
      sessionStorage.removeItem('pending_finalize');

      finalizeWithRetry(JSON.parse(pending)).then(order => {
        clearCart();
        if (order?.tracking_token) setTrackingToken(order.tracking_token);
        if (order?.id) setOrderId(order.id);
        // If all retries failed, the webhook will create the order.
        // Cart is still cleared — the payment went through.
      });
      return;
    }

    // Legacy flow: token comes from URL (redirect from Stripe or old code path)
    if (urlToken) {
      fetch(`/api/orders/track/${urlToken}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data?.id) setOrderId(data.id); })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerEncomendas = () => {
    if (isAuthenticated) {
      navigate('/encomendas');
    } else {
      setShowGuestModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <SEO
        title="Pagamento Concluído com Sucesso"
        description="O seu pagamento foi processado com sucesso"
        canonical="/checkout/success"
        ogType="website"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pagamento Concluído com Sucesso!
          </h1>

          <p className="text-gray-600 mb-8">
            O seu pagamento foi processado com sucesso e a sua encomenda está confirmada.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Número da Encomenda</p>
              <p className="text-2xl font-bold text-primary-600">#{orderId}</p>
            </div>
          )}

          {!orderId && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600">A sua encomenda está a ser processada...</p>
            </div>
          )}

          <div className="text-sm text-gray-600 mb-8">
            <p>Pagamento confirmado</p>
            <p>Receberá um email de confirmação em breve</p>
            <p>A sua encomenda será processada nas próximas horas</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/"
              className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              Voltar ao Início
            </Link>
            <button
              onClick={handleVerEncomendas}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Ver Encomendas
            </button>
          </div>

          {trackingToken && (
            <p className="text-xs text-gray-400 mt-6">
              <Link to={`/track-order/${trackingToken}`} className="underline hover:text-gray-600">
                Acompanhar encomenda
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Guest modal */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Ver Encomendas</h2>
              <button
                onClick={() => setShowGuestModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-gray-600 text-sm mb-5">
                Para ver o histórico das suas encomendas precisa de ter uma conta e estar autenticado.
              </p>
              <button
                onClick={() => { setShowGuestModal(false); setShowAuthModal(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <LogIn className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Entrar / Criar Conta</p>
                  <p className="text-xs text-white/75">Aceda ao histórico completo de encomendas</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="login" />
        </GoogleOAuthProvider>
      )}
    </div>
  );
};

export default CheckoutSuccess;
