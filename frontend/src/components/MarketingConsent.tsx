import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'recicloth_cookie_consent';
const PREFS_KEY = 'recicloth_cookie_preferences';

const MarketingConsent: React.FC = () => {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [marketingError, setMarketingError] = useState('');

  const [cookieConsent, setCookieConsent] = useState({
    required: true,
    personalization: false,
    marketing: false,
    analytics: false,
  });

  useEffect(() => {
    const hasSeenNewsletter = localStorage.getItem('hasSeenNewsletter');
    const currentConsent = localStorage.getItem(CONSENT_KEY);
    const storedPrefs = localStorage.getItem(PREFS_KEY);
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs);
        setCookieConsent(prev => ({
          ...prev,
          personalization: !!parsed.personalization,
          marketing: !!parsed.marketing,
          analytics: !!parsed.analytics,
        }));
      } catch {
        // ignore invalid saved preferences
      }
    }

    if (currentConsent !== 'true' && currentConsent !== 'false') {
      const privacyTimer = setTimeout(() => setShowPrivacy(true), 500);
      timers.push(privacyTimer);
    }

    if (!hasSeenNewsletter && (currentConsent === 'true' || currentConsent === 'false')) {
      const newsletterTimer = setTimeout(() => setShowNewsletter(true), 2500);
      timers.push(newsletterTimer);
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  const persistConsent = (accepted: boolean, preferences = cookieConsent) => {
    localStorage.setItem(CONSENT_KEY, String(accepted));
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new Event('recicloth:cookie-consent-changed'));
  };

  const handleCloseNewsletter = () => {
    setShowNewsletter(false);
    localStorage.setItem('hasSeenNewsletter', 'true');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!email.trim()) {
      setEmailError('Introduza o seu email');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!marketingChecked) {
      setMarketingError('É necessário aceitar para subscrever');
      valid = false;
    } else {
      setMarketingError('');
    }
    if (!valid) return;
    console.log(`Subscribed: ${email}`);
    handleCloseNewsletter();
  };

  const handlePrivacyAction = (action: 'accept' | 'decline' | 'manage') => {
    if (action === 'manage') {
      setShowPreferences(true);
      return;
    }

    if (action === 'accept') {
      const fullConsent = { required: true, personalization: true, marketing: true, analytics: true };
      setCookieConsent(fullConsent);
      persistConsent(true, fullConsent);
    } else {
      const minimalConsent = { required: true, personalization: false, marketing: false, analytics: false };
      setCookieConsent(minimalConsent);
      persistConsent(false, minimalConsent);
    }

    setShowPrivacy(false);
  };

  const toggleCookie = (key: keyof typeof cookieConsent) => {
    if (key === 'required') return;
    setCookieConsent(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreferencesAction = (type: 'accept_all' | 'decline_all' | 'save') => {
    let finalConsent = { ...cookieConsent };

    if (type === 'accept_all') {
      finalConsent = { required: true, personalization: true, marketing: true, analytics: true };
    } else if (type === 'decline_all') {
      finalConsent = { required: true, personalization: false, marketing: false, analytics: false };
    }

    setCookieConsent(finalConsent);
    persistConsent(finalConsent.analytics, finalConsent);

    setShowPreferences(false);
    setShowPrivacy(false);
  };

  if (!showNewsletter && !showPrivacy && !showPreferences) return null;

  return (
    <>
      {(showNewsletter || showPreferences) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[51] animate-fade-in" />
      )}

      {showNewsletter && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 pointer-events-none">
          <div className="relative bg-white w-full max-w-[750px] grid md:grid-cols-2 shadow-2xl overflow-hidden rounded-sm pointer-events-auto animate-scale-in">
            <button
              onClick={handleCloseNewsletter}
              className="absolute top-3 right-3 z-10 p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="hidden md:block h-full min-h-[400px]">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                alt="Moda sustentável"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8 md:p-10 flex flex-col justify-center items-center text-center bg-[#f4f4f4]">
              <h3 className="text-xl font-medium text-gray-900 mb-2 leading-relaxed tracking-wide">
                Receba novidades sobre<br />moda sustentável e<br />novas peças!
              </h3>
              <form onSubmit={handleNewsletterSubmit} noValidate className="w-full max-w-[260px] space-y-3 mt-6">
                <div>
                  <input
                    type="email"
                    placeholder="Junte-se à newsletter"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                    className={`w-full px-4 py-3 bg-[#e9e9e9] border-none text-gray-900 placeholder:text-gray-500 focus:ring-1 focus:ring-gray-400 outline-none text-center text-sm ${emailError ? 'ring-1 ring-red-400' : ''}`}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-500 text-center">{emailError}</p>}
                </div>
                <div className="text-left">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingChecked}
                      onChange={(e) => { setMarketingChecked(e.target.checked); if (marketingError) setMarketingError(''); }}
                      className="mt-0.5 w-4 h-4 rounded border-gray-400 text-black focus:ring-black cursor-pointer flex-shrink-0"
                    />
                    <span className="text-[11px] text-gray-600 leading-relaxed">
                      Aceito receber comunicações de marketing e novidades sobre moda sustentável
                    </span>
                  </label>
                  {marketingError && <p className="mt-1 text-xs text-red-500">{marketingError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-bold"
                >
                  QUERO RECEBER <Heart className="h-3 w-3 fill-white" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:pb-6 flex justify-center items-end pointer-events-none">
          <div className="bg-white w-full max-w-[900px] p-6 md:p-8 shadow-[0_-5px_25px_rgba(0,0,0,0.1)] pointer-events-auto animate-slide-up border border-gray-100 rounded-sm">
            <h4 className="font-bold text-gray-900 mb-2 text-base">Valorizamos a sua privacidade</h4>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed max-w-3xl">
              Utilizamos cookies para personalização e análise de desempenho.
              Saiba mais na nossa{' '}
              <Link to="/politica-privacidade" className="underline text-gray-900 decoration-1 underline-offset-2">
                Política de Privacidade
              </Link>.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-between gap-5 border-t border-transparent md:border-none pt-4 md:pt-0">
              <button
                onClick={() => handlePrivacyAction('manage')}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest underline underline-offset-4 decoration-gray-300 order-3 md:order-1 mt-2 md:mt-0"
              >
                GERIR PREFERÊNCIAS
              </button>

              <div className="flex w-full md:w-auto gap-3 order-2 md:order-2">
                <button
                  onClick={() => handlePrivacyAction('accept')}
                  className="flex-1 md:flex-none px-8 py-2.5 border border-gray-300 text-[10px] font-bold tracking-[0.15em] uppercase hover:border-gray-900 hover:bg-gray-50 transition-all text-gray-900 min-w-[120px]"
                >
                  ACEITAR
                </button>
                <button
                  onClick={() => handlePrivacyAction('decline')}
                  className="flex-1 md:flex-none px-8 py-2.5 border border-gray-300 text-[10px] font-bold tracking-[0.15em] uppercase hover:border-gray-900 hover:bg-gray-50 transition-all text-gray-900 min-w-[120px]"
                >
                  REJEITAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-medium text-gray-900">Preferências de cookies</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handlePreferencesAction('accept_all')}
                  className="px-6 py-2 border border-gray-300 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors"
                >
                  Aceitar tudo
                </button>
                <button
                  onClick={() => handlePreferencesAction('decline_all')}
                  className="px-6 py-2 border border-gray-300 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors"
                >
                  Rejeitar tudo
                </button>
                <button
                  onClick={() => handlePreferencesAction('save')}
                  className="px-6 py-2 border border-gray-900 bg-white text-gray-900 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors"
                >
                  Guardar escolhas
                </button>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-2 text-gray-500 hover:text-gray-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Controla os seus dados</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Escolha que tipos de cookies quer permitir.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5 rounded border-gray-300 text-gray-400 focus:ring-0 cursor-not-allowed bg-gray-100"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Obrigatórios</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Necessários para o funcionamento da loja.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={cookieConsent.personalization}
                      onChange={() => toggleCookie('personalization')}
                      className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Personalização</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Guardam preferências para melhorar a sua experiência.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={cookieConsent.marketing}
                      onChange={() => toggleCookie('marketing')}
                      className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Marketing</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Permitem mostrar comunicações mais relevantes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={cookieConsent.analytics}
                      onChange={() => toggleCookie('analytics')}
                      className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Analítica</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Ajudam-nos a melhorar a loja com dados de navegação agregados.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-xs text-gray-500">
                Ao continuar, concorda com os nossos{' '}
                <Link to="/termos-condicoes" className="underline">
                  Termos e Condições
                </Link>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MarketingConsent;
