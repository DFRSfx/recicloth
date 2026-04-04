import React, { useState, useRef } from 'react';
import { X, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import FloatingLabelInput from './FloatingLabelInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { isAuthenticated, login, register, setAuthState } = useAuth();
  const { success, error: showError } = useToast();
  const { t, lang } = useLanguage();
  const privacyPath = getRoutePath('privacyPolicy', lang);
  const termsPath = getRoutePath('terms', lang);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Per-field validation errors (shared across all form modes, cleared on mode switch)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Login refs
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);

  // Register refs
  const registerNameRef = useRef<HTMLInputElement>(null);
  const registerEmailRef = useRef<HTMLInputElement>(null);
  const registerPasswordRef = useRef<HTMLInputElement>(null);

  // Forgot password ref
  const forgotEmailRef = useRef<HTMLInputElement>(null);

  // Swipe to close states
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Password validation
  const validatePassword = (password: string) => {
    return {
      hasMinLength: password.length >= 6,
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  };

  const passwordChecks = validatePassword(registerData.password);
  const validChecksCount = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordValid = validChecksCount >= 4;

  const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setFieldErrors({});
    setError(null);
  };

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    if (isOpen) {
      setForgotSuccess(false);
      setForgotEmail('');
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen]);


  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setMode(initialMode);
      setForgotSuccess(false);
      setForgotEmail('');
      setError(null);
      setFieldErrors({});
      setShowVerificationNotice(false);
      setRegisteredEmail('');
      setUnverifiedEmail(null);
    }, 300);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    clearFieldError(e.target.name);
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    clearFieldError(e.target.name);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    if (!forgotEmail.trim()) errors.forgotEmail = t('common.required');
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      forgotEmailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      forgotEmailRef.current?.focus();
      return;
    }
    setFieldErrors({});

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail, language: 'pt' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao processar pedido');
      }

      setForgotSuccess(true);
      setForgotEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação');
      showError(err.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);

    const errors: Record<string, string> = {};
    if (!loginData.email.trim()) errors.email = t('common.required');
    if (!loginData.password.trim()) errors.password = t('common.required');

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
        email: loginEmailRef,
        password: loginPasswordRef,
      };
      const firstKey = Object.keys(errors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[firstKey]?.current?.focus();
      return;
    }
    setFieldErrors({});

    setIsLoading(true);

    try {
      await login(loginData.email, loginData.password);
      success(t('auth.welcomeBack'));
      // Login successful - modal will close via useEffect
    } catch (err: any) {
      // Verificar se é erro de email não verificado
      if (err.requiresEmailVerification) {
        setUnverifiedEmail(err.email || loginData.email);
        setError(err.message || t('auth.verifyEmailFirst'));
        // NÃO mostrar toast - o aviso visual no modal é suficiente
      } else {
        setError(err.message || t('auth.invalidCredentials'));
        showError(err.message || t('auth.invalidCredentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors: Record<string, string> = {};
    if (!registerData.name.trim()) errors.name = t('common.required');
    if (!registerData.email.trim()) {
      errors.email = t('common.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = t('contact.form.errors.emailInvalid');
    }
    if (!registerData.password.trim()) errors.password = t('common.required');
    if (!privacyPolicy) errors.privacyPolicy = 'Deve aceitar os Termos e a Política de Privacidade';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
        name: registerNameRef,
        email: registerEmailRef,
        password: registerPasswordRef,
      };
      const firstKey = Object.keys(errors)[0];
      if (refs[firstKey]) {
        refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        refs[firstKey]?.current?.focus();
      }
      return;
    }

    if (!isPasswordValid) {
      setError(t('auth.register.passwordWeak'));
      setFieldErrors(prev => ({ ...prev, password: t('auth.register.passwordWeak') }));
      registerPasswordRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      await register(registerData.name, registerData.email, registerData.password);
      setRegisteredEmail(registerData.email);
      setShowVerificationNotice(true);
      setRegisterData({ name: '', email: '', password: '' });
      // Don't show success toast, show verification notice instead
    } catch (err: any) {
      const msg = err?.message || '';
      const isEmailInUse = /registado|em uso|in use|already/i.test(msg);
      const errorKey = isEmailInUse ? 'auth.register.emailInUse' : 'auth.register.error';
      setError(t(errorKey));
      showError(t(errorKey));
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);
        setError(null);

        // Send the authorization code to the backend
        const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: codeResponse.code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao fazer login com Google');
        }

        const data = await response.json();

        // Update auth context directly (no reload needed)
        setAuthState(data.token, data.user);

        success('Bem-vindo! Login efetuado com sucesso');
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer login com Google');
        showError(err.message || 'Erro ao fazer login com Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Erro ao fazer login com Google');
      showError('Erro ao fazer login com Google. Por favor, tente novamente.');
    },
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: window.location.origin,
  });

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 768) return; // Only on mobile
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || window.innerWidth >= 768) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff > 0) { // Only allow dragging to the right
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || window.innerWidth >= 768) return;
    setIsDragging(false);
    const threshold = 100;

    if (dragOffset > threshold) {
      handleClose();
    }

    setDragOffset(0);
    setStartX(0);
  };

  // Close modal automatically when user logs in (but not after register)
  React.useEffect(() => {
    if (isAuthenticated && isOpen && !showVerificationNotice) {
      handleClose();
    }
  }, [isAuthenticated, isOpen, showVerificationNotice]);

  if (!isOpen || isAuthenticated) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[60] ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl z-[70] max-h-[90vh] overflow-hidden ${isClosing ? 'animate-fadeOut scale-95' : 'animate-fadeIn scale-100'} transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDragging
            ? `translate(calc(-50% + ${dragOffset}px), -50%)`
            : 'translate(-50%, -50%)',
          transition: isDragging ? 'none' : 'all 0.3s',
        }}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-gray-100 transition-all shadow-md"
            aria-label={t('common.close')}
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Content - Two Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8 md:p-12 h-full max-h-[90vh] overflow-y-auto">

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.signIn')}</h2>

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-6 flex-1 flex flex-col">
                {unverifiedEmail ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-yellow-800 mb-1">
                          Email não verificado
                        </h4>
                        <p className="text-xs text-yellow-700 mb-2">
                          {error}
                        </p>
                        <p className="text-xs text-yellow-600 mb-3">
                          Enviámos um email de verificação para <strong>{unverifiedEmail}</strong>.
                          Verifique a sua caixa de entrada (ou spam).
                        </p>
                        <button
                          type="button"
                          onClick={() => {/* TODO: Resend verification */}}
                          className="text-xs font-semibold text-yellow-800 underline hover:text-yellow-900"
                        >
                          Reenviar email de verificação
                        </button>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                ) : null}

                <div>
                  <FloatingLabelInput
                    id="login_email"
                    name="email"
                    type="email"
                    label={t('form.email')}
                    value={loginData.email}
                    onChange={handleLoginChange}
                    autoComplete="email"
                    ref={loginEmailRef}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <FloatingLabelInput
                    id="login_password"
                    name="password"
                    type="password"
                    label="Password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    autoComplete="current-password"
                    ref={loginPasswordRef}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-primary-600 bg-gray-50 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Lembrar-me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-sm text-red-500 hover:text-red-600 hover:underline transition-all"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                <div className="flex-1"></div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.9911 9.16838C16.9911 8.43093 16.9333 7.89279 16.8081 7.33472H8.66943V10.6632H13.4467C13.3504 11.4904 12.8303 12.7361 11.6745 13.5732L11.6583 13.6846L14.2316 15.7472L14.4099 15.7657C16.0472 14.201 16.9911 11.899 16.9911 9.16838Z" fill="#4285F4"/>
                      <path d="M8.66913 17.9381C11.0096 17.9381 12.9744 17.1408 14.4096 15.7656L11.6742 13.5731C10.9422 14.1013 9.95973 14.47 8.66913 14.47C6.37682 14.47 4.43125 12.9055 3.73771 10.7429L3.63605 10.7519L0.960285 12.8945L0.925293 12.9951C2.35076 15.925 5.27877 17.9381 8.66913 17.9381Z" fill="#34A853"/>
                      <path d="M3.738 10.7428C3.555 10.1848 3.4491 9.58679 3.4491 8.96896C3.4491 8.35105 3.555 7.75313 3.72837 7.19506L3.72353 7.07621L1.01423 4.89917L0.925588 4.9428C0.338086 6.15862 0.000976562 7.52394 0.000976562 8.96896C0.000976562 10.414 0.338086 11.7792 0.925588 12.995L3.738 10.7428Z" fill="#FBBC05"/>
                      <path d="M8.66912 3.46802C10.2968 3.46802 11.3948 4.19551 12.0209 4.80346L14.4673 2.33196C12.9648 0.886946 11.0096 0 8.66912 0C5.27877 0 2.35076 2.01305 0.925293 4.94292L3.72808 7.19519C4.43125 5.03265 6.37682 3.46802 8.66912 3.46802Z" fill="#EB4335"/>
                    </svg>
                    Entrar com Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-sm uppercase hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('auth.signIn')}
                  </button>
                </div>
              </form>
            ) : mode === 'forgot' ? (
              <div className="flex-1 flex flex-col">
                <button
                  onClick={() => switchMode('login')}
                  className="self-start flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4 transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm font-medium">{t('auth.back')}</span>
                </button>

                {!forgotSuccess ? (
                  <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recuperar Palavra-passe
                      </h3>
                      <p className="text-sm text-gray-600">
                        Introduza o seu email para receber um link de recuperação.
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <FloatingLabelInput
                        id="forgot_email"
                        name="forgotEmail"
                        type="email"
                        label={t('form.email')}
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          clearFieldError('forgotEmail');
                        }}
                        autoComplete="email"
                        disabled={isLoading}
                        ref={forgotEmailRef}
                      />
                      {fieldErrors.forgotEmail && (
                        <p className="mt-1.5 text-sm text-red-500">{fieldErrors.forgotEmail}</p>
                      )}
                    </div>

                    <div className="flex-1"></div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-sm uppercase hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'A enviar...' : 'Enviar Link de Recuperação'}
                    </button>
                  </form>
                ) : (
                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle size={32} className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {t('auth.recoveryEmailSent')}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {t('auth.recoveryEmailSent')}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Próximos Passos:
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-gray-700">Verifique a sua caixa de entrada</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-gray-700">O link é válido por 15 minutos</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-gray-700">Verifique também o spam</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => switchMode('login')}
                      className="w-full border-2 border-primary-600 text-primary-600 py-3 px-12 rounded-lg font-semibold text-sm uppercase hover:bg-primary-600 hover:text-white transition-all"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                )}
              </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">{t('auth.alreadyHaveAccount')}</h3>
                  <p className="text-gray-600">
                    Inicia sessão para aceder à tua conta Recicloth e explorar as nossas coleções exclusivas.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 text-left">Acesso rápido aos teus favoritos</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 text-left">Histórico de encomendas</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 text-left">Ofertas personalizadas</p>
                  </div>
                </div>

                <button
                  onClick={() => switchMode('login')}
                  className="w-full border-2 border-primary-600 text-primary-600 py-3 px-12 rounded-lg font-semibold text-sm uppercase hover:bg-primary-600 hover:text-white transition-all"
                >
                  {t('auth.signIn')}
                </button>
              </div>
            )}
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.signUp')}</h2>

            {showVerificationNotice ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-10 w-10 text-primary-600" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Conta Criada com Sucesso! 
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Enviámos um email de verificação para:
                  </p>
                  <p className="text-primary-600 font-semibold mb-6">
                    {registeredEmail}
                  </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg text-left w-full">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-yellow-800 mb-2">
                        Ação Necessária
                      </h4>
                      <p className="text-sm text-yellow-700 mb-2">
                        <strong>Tem de verificar o seu email antes de aceder à sua conta.</strong>
                      </p>
                      <p className="text-xs text-yellow-600">
                        A conta será automaticamente apagada em 1 hora se não for verificada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 w-full">
                  <p className="text-sm text-primary-900 font-semibold mb-3">
                    Próximos Passos:
                  </p>
                  <ul className="space-y-2 text-sm text-primary-800">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">1.</span>
                      <span>Verifique a sua caixa de entrada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">2.</span>
                      <span>Clique no link de verificação (válido por 1 hora)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">3.</span>
                      <span>Faça login para aceder à sua conta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-xs text-gray-600">Não se esqueça de verificar a pasta de spam</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setShowVerificationNotice(false);
                    switchMode('login');
                  }}
                  className="w-full border-2 border-primary-600 text-primary-600 py-3 px-12 rounded-lg font-semibold text-sm uppercase hover:bg-primary-600 hover:text-white transition-all"
                >
                  Entendi, ir para Login
                </button>
              </div>
            ) : mode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-6 flex-1 flex flex-col">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <FloatingLabelInput
                    id="register_name"
                    name="name"
                    type="text"
                    label={t('form.name')}
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    ref={registerNameRef}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <FloatingLabelInput
                    id="register_email"
                    name="email"
                    type="email"
                    label={t('form.email')}
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    ref={registerEmailRef}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <FloatingLabelInput
                    id="register_password"
                    name="password"
                    type="password"
                    label="Password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    ref={registerPasswordRef}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="text-xs bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2 text-gray-700">
                    A password terá de cumprir 4 dos seguintes requisitos:
                    {registerData.password && (
                      <span className={`ml-2 ${isPasswordValid ? 'text-green-600' : 'text-gray-500'}`}>
                        ({validChecksCount}/5)
                      </span>
                    )}
                  </p>
                  <ul className="space-y-1.5">
                    <li className={`flex items-center gap-2 ${passwordChecks.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasMinLength ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                      {t('auth.passwordStrength.minChars')}
                    </li>
                    <li className={`flex items-center gap-2 ${passwordChecks.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasLowerCase ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                      {t('auth.passwordStrength.lowercase')}
                    </li>
                    <li className={`flex items-center gap-2 ${passwordChecks.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasUpperCase ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                      {t('auth.passwordStrength.uppercase')}
                    </li>
                    <li className={`flex items-center gap-2 ${passwordChecks.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasSpecialChar ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                      {t('auth.passwordStrength.special')}
                    </li>
                    <li className={`flex items-center gap-2 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordChecks.hasNumber ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )}
                      {t('auth.passwordStrength.number')}
                    </li>
                  </ul>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-primary-600 bg-gray-50 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="newsletter" className="ml-3 text-xs text-gray-700 cursor-pointer">
                    Eu gostaria de receber notícias personalizadas e comunicações comerciais da Recicloth.
                  </label>
                </div>

                <div>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={privacyPolicy}
                      onChange={(e) => {
                        setPrivacyPolicy(e.target.checked);
                        if (e.target.checked) clearFieldError('privacyPolicy');
                      }}
                      className={`w-5 h-5 mt-0.5 text-primary-600 bg-gray-50 border-gray-300 rounded focus:ring-primary-500 cursor-pointer ${fieldErrors.privacyPolicy ? 'border-red-500' : ''}`}
                    />
                    <label htmlFor="privacy" className="ml-3 text-xs text-gray-700 cursor-pointer">
                      Li e aceito os{' '}
                      <a href={termsPath} className="text-primary-600 hover:text-primary-700 underline">
                        Termos e Condições
                      </a>
                      {' '}e a{' '}
                      <a href={privacyPath} className="text-primary-600 hover:text-primary-700 underline">
                        Política de Privacidade
                      </a>
                    </label>
                  </div>
                  {fieldErrors.privacyPolicy && (
                    <p className="mt-1.5 text-sm text-red-500">{fieldErrors.privacyPolicy}</p>
                  )}
                </div>

                <div className="flex-1"></div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold text-sm hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.9911 9.16838C16.9911 8.43093 16.9333 7.89279 16.8081 7.33472H8.66943V10.6632H13.4467C13.3504 11.4904 12.8303 12.7361 11.6745 13.5732L11.6583 13.6846L14.2316 15.7472L14.4099 15.7657C16.0472 14.201 16.9911 11.899 16.9911 9.16838Z" fill="#4285F4"/>
                      <path d="M8.66913 17.9381C11.0096 17.9381 12.9744 17.1408 14.4096 15.7656L11.6742 13.5731C10.9422 14.1013 9.95973 14.47 8.66913 14.47C6.37682 14.47 4.43125 12.9055 3.73771 10.7429L3.63605 10.7519L0.960285 12.8945L0.925293 12.9951C2.35076 15.925 5.27877 17.9381 8.66913 17.9381Z" fill="#34A853"/>
                      <path d="M3.738 10.7428C3.555 10.1848 3.4491 9.58679 3.4491 8.96896C3.4491 8.35105 3.555 7.75313 3.72837 7.19506L3.72353 7.07621L1.01423 4.89917L0.925588 4.9428C0.338086 6.15862 0.000976562 7.52394 0.000976562 8.96896C0.000976562 10.414 0.338086 11.7792 0.925588 12.995L3.738 10.7428Z" fill="#FBBC05"/>
                      <path d="M8.66912 3.46802C10.2968 3.46802 11.3948 4.19551 12.0209 4.80346L14.4673 2.33196C12.9648 0.886946 11.0096 0 8.66912 0C5.27877 0 2.35076 2.01305 0.925293 4.94292L3.72808 7.19519C4.43125 5.03265 6.37682 3.46802 8.66912 3.46802Z" fill="#EB4335"/>
                    </svg>
                    Registar com Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid}
                    className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg font-semibold text-sm uppercase hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'A criar conta...' : 'Criar Conta'}
                  </button>
                </div>
              </form>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">{t('auth.noAccount')}</h3>
                  <p className="text-gray-600">
                    O registo é fácil e grátis! Cria a tua conta e começa a explorar.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 text-left">Registo rápido e gratuito</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 text-left">Acesso a produtos exclusivos</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-gray-700 text-left">Newsletter com novidades</p>
                  </div>
                </div>

                <button
                  onClick={() => switchMode('register')}
                  className="w-full border-2 border-primary-600 text-primary-600 py-3 px-12 rounded-lg font-semibold text-sm uppercase hover:bg-primary-600 hover:text-white transition-all"
                >
                  {t('auth.signUp')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};



export default AuthModal;
