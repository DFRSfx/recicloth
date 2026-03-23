import React, { useState, useEffect } from 'react';
import { X, Heart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const MarketingConsent: React.FC = () => {
  // Estados de Visibilidade
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false); // Novo Modal

  // Estado do Formulário Newsletter
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Estado das Preferências de Cookies
  const [cookieConsent, setCookieConsent] = useState({
    required: true, // Sempre true
    personalization: false,
    marketing: false,
    analytics: false,
  });

  useEffect(() => {
    const hasSeenNewsletter = localStorage.getItem('hasSeenNewsletter');
    const privacyConsent = localStorage.getItem('privacyConsent');
    const timers: NodeJS.Timeout[] = [];

    // 1. Mostrar Privacidade
    if (!privacyConsent) {
      const privacyTimer = setTimeout(() => setShowPrivacy(true), 500);
      timers.push(privacyTimer);
    }

    // 2. Mostrar Newsletter
    if (!hasSeenNewsletter) {
      const newsletterTimer = setTimeout(() => {
        setShowNewsletter(true);
      }, 2500);
      timers.push(newsletterTimer);
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  // --- Handlers Newsletter ---
  const handleCloseNewsletter = () => {
    setShowNewsletter(false);
    localStorage.setItem('hasSeenNewsletter', 'true');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError('Introduza o seu email');
      return;
    }
    setEmailError('');
    console.log(`Subscribed: ${email}`);
    handleCloseNewsletter();
  };

  // --- Handlers Privacidade ---
  const handlePrivacyAction = (action: 'accept' | 'decline' | 'manage') => {
    if (action === 'manage') {
      setShowPreferences(true); // Abre o novo modal
      return;
    }
    
    // Guardar decisão simples
    localStorage.setItem('privacyConsent', action);
    
    // Se aceitou tudo, atualiza o estado interno para refletir isso (opcional)
    if (action === 'accept') {
       setCookieConsent({ required: true, personalization: true, marketing: true, analytics: true });
       // Aqui poderias salvar um objeto JSON mais complexo no localStorage se quisesses
    }

    setShowPrivacy(false);
  };

  // --- Handlers Preferências de Cookies ---
  const toggleCookie = (key: keyof typeof cookieConsent) => {
    if (key === 'required') return; // Não deixa mudar o required
    setCookieConsent(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreferencesAction = (type: 'accept_all' | 'decline_all' | 'save') => {
    let finalConsent = { ...cookieConsent };

    if (type === 'accept_all') {
      finalConsent = { required: true, personalization: true, marketing: true, analytics: true };
    } else if (type === 'decline_all') {
      finalConsent = { required: true, personalization: false, marketing: false, analytics: false };
    }
    // Se for 'save', usa o estado atual (cookieConsent)

    setCookieConsent(finalConsent);
    
    // Salva no localStorage que o utilizador aceitou (com configurações personalizadas)
    // Podes salvar 'accept' ou um JSON stringify do objecto finalConsent
    localStorage.setItem('privacyConsent', 'accept'); 
    localStorage.setItem('cookiePreferences', JSON.stringify(finalConsent));

    setShowPreferences(false);
    setShowPrivacy(false); // Fecha também a barra de baixo
  };

  if (!showNewsletter && !showPrivacy && !showPreferences) return null;

  return (
    <>
      {/* ========================================
        1. BACKDROP ESCURO GLOBAL (Z-INDEX 40)
        ========================================
      */}
      {(showNewsletter || showPreferences) && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[51] animate-fade-in" />
      )}

      {/* ========================================
        2. NEWSLETTER MODAL (Z-INDEX 50)
        ========================================
      */}
      {showNewsletter && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 pointer-events-none">
          <div className="relative bg-white w-full max-w-[750px] grid md:grid-cols-2 shadow-2xl overflow-hidden rounded-sm pointer-events-auto animate-scale-in">
            <button 
              onClick={handleCloseNewsletter}
              className="absolute top-3 right-3 z-10 p-1 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Imagem */}
            <div className="hidden md:block h-full min-h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" 
                alt="Fashion" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Conteúdo */}
            <div className="p-8 md:p-10 flex flex-col justify-center items-center text-center bg-[#f4f4f4]">
              <h3 className="text-xl font-medium text-gray-900 mb-2 leading-relaxed tracking-wide">
                Be the first to know about<br/>exclusive deals and new<br/>arrivals!
              </h3>
              <form onSubmit={handleNewsletterSubmit} noValidate className="w-full max-w-[260px] space-y-3 mt-6">
                <div>
                  <input
                    type="email"
                    placeholder="Join our mailing list"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                    className={`w-full px-4 py-3 bg-[#e9e9e9] border-none text-gray-900 placeholder:text-gray-500 focus:ring-1 focus:ring-gray-400 outline-none text-center text-sm ${emailError ? 'ring-1 ring-red-400' : ''}`}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-500 text-center">{emailError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-bold"
                >
                  JOIN THE FAMILY! <Heart className="h-3 w-3 fill-white" />
                </button>
              </form>
              <p className="mt-4 text-[10px] text-gray-500 leading-tight max-w-[240px]">
                *By completing this form you're signing up to receive our emails and can unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
        3. PRIVACY BANNER (Z-INDEX 60)
        ========================================
      */}
      {showPrivacy && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:pb-6 flex justify-center items-end pointer-events-none">
           <div className="bg-white w-full max-w-[900px] p-6 md:p-8 shadow-[0_-5px_25px_rgba(0,0,0,0.1)] pointer-events-auto animate-slide-up border border-gray-100 rounded-sm">
              <h4 className="font-bold text-gray-900 mb-2 text-base">We value your privacy</h4>
              <p className="text-xs text-gray-600 mb-6 leading-relaxed max-w-3xl">
                We use cookies and other technologies to personalize your experience, perform marketing, and collect analytics. Learn more in our <Link to="/privacidade" className="underline text-gray-900 decoration-1 underline-offset-2">Privacy Policy</Link>.
              </p>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 border-t border-transparent md:border-none pt-4 md:pt-0">
                <button 
                  onClick={() => handlePrivacyAction('manage')}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest underline underline-offset-4 decoration-gray-300 order-3 md:order-1 mt-2 md:mt-0"
                >
                  MANAGE PREFERENCES
                </button>
                
                <div className="flex w-full md:w-auto gap-3 order-2 md:order-2">
                   <button
                    onClick={() => handlePrivacyAction('accept')}
                    className="flex-1 md:flex-none px-8 py-2.5 border border-gray-300 text-[10px] font-bold tracking-[0.15em] uppercase hover:border-gray-900 hover:bg-gray-50 transition-all text-gray-900 min-w-[120px]"
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() => handlePrivacyAction('decline')}
                    className="flex-1 md:flex-none px-8 py-2.5 border border-gray-300 text-[10px] font-bold tracking-[0.15em] uppercase hover:border-gray-900 hover:bg-gray-50 transition-all text-gray-900 min-w-[120px]"
                  >
                    DECLINE
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* ========================================
        4. PREFERENCES MODAL (Z-INDEX 70)
        ========================================
      */}
      {showPreferences && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           {/* Card Container */}
           <div className="bg-white w-full max-w-4xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-medium text-gray-900">Cookie preferences</h2>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => handlePreferencesAction('accept_all')}
                    className="px-6 py-2 border border-gray-300 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors"
                  >
                    Accept All
                  </button>
                  <button 
                    onClick={() => handlePreferencesAction('decline_all')}
                    className="px-6 py-2 border border-gray-300 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors"
                  >
                    Decline All
                  </button>
                  <button 
                    onClick={() => handlePreferencesAction('save')}
                    className="px-6 py-2 border border-gray-900 bg-white text-gray-900 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-gray-50 transition-colors"
                  >
                    Save My Choices
                  </button>
                  <button 
                    onClick={() => setShowPreferences(false)}
                    className="p-2 text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content Scrollable */}
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">You control your data</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Learn more about the cookies we use, and choose which cookies to allow. 
                    This site uses functional cookies and external scripts to improve your experience.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Option: Required */}
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
                      <h4 className="text-sm font-semibold text-gray-900">Required</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        These cookies are necessary for the site to function properly, including capabilities like logging in and adding items to the cart.
                      </p>
                    </div>
                  </div>

                  {/* Option: Personalization */}
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
                      <h4 className="text-sm font-semibold text-gray-900">Personalization</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        These cookies store details about your actions to personalize your next visit to the website.
                      </p>
                    </div>
                  </div>

                  {/* Option: Marketing */}
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
                        These cookies are used to optimize marketing communications and show you ads on other sites.
                      </p>
                    </div>
                  </div>

                  {/* Option: Analytics */}
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
                      <h4 className="text-sm font-semibold text-gray-900">Analytics</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        These cookies help us understand how you interact with the site. We use this data to identify areas to improve.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default MarketingConsent;