import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, Mail, AlertCircle, Lock } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import pt from 'react-phone-number-input/locale/pt.json';
import 'react-phone-number-input/style.css';
import PhoneCountrySelect from '../components/PhoneCountrySelect';
import { getAbsoluteImageUrl } from '../utils/imageUtils';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SEO from '../components/SEO';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthModal from '../components/AuthModal';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const stripeAppearance: Appearance = {
  theme: 'flat',
  variables: {
    colorPrimary: '#2D6A4F',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#dc2626',
    colorTextSecondary: '#6b7280',
    colorTextPlaceholder: '#9ca3af',
    fontFamily: '"Inter", sans-serif',
    fontSizeBase: '17px',
    borderRadius: '8px',
    spacingUnit: '5px',
  },
  rules: {
    '.Input': {
      border: '1px solid #d1d5db',
      boxShadow: 'none',
      padding: '10px 12px',
      backgroundColor: '#f9fafb',
      transition: 'border-color 0.15s, background-color 0.15s',
    },
    '.Input:focus': {
      border: '1px solid #2D6A4F',
      boxShadow: '0 0 0 3px rgba(45, 106, 79, 0.12)',
      backgroundColor: '#ffffff',
    },
    '.Input--invalid': {
      border: '1px solid #dc2626',
      boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    },
    '.Label': {
      fontWeight: '500',
      marginBottom: '5px',
      color: '#374151',
    },
    '.Error': {
      color: '#dc2626',
      fontSize: '13px',
    },
  },
};

const stripeFonts = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
];

interface ShippingAddress {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

interface CheckoutInnerProps {
  amount: number;
  paymentIntentId: string;
}

const CheckoutInner: React.FC<CheckoutInnerProps> = ({ amount, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const checkoutSuccessPath = getRoutePath('checkoutSuccess', lang);
  const checkoutPath = getRoutePath('checkout', lang);
  const cartPath = getRoutePath('cart', lang);
  const ordersPath = getRoutePath('orders', lang);
  const homePath = getRoutePath('home', lang);

  const subtotalExVat = amount / 1.23;
  const ivaAmount = amount - subtotalExVat;
  const API_BASE_URL = '/api';

  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [paymentReference, setPaymentReference] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(true);
  const [saveAddress, setSaveAddress] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const postalCodeRef = useRef<HTMLInputElement>(null);
  const billingNameRef = useRef<HTMLInputElement>(null);
  const billingAddressRef = useRef<HTMLInputElement>(null);
  const billingCityRef = useRef<HTMLInputElement>(null);
  const billingPostalCodeRef = useRef<HTMLInputElement>(null);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedAddresses();
      setCustomerInfo(prev => ({ ...prev, name: user?.name || '', email: user?.email || '' }));
    } else {
      const timer = setTimeout(() => setShowGuestWarning(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      const saved = localStorage.getItem('guest_checkout_data');
      if (saved) setCustomerInfo(JSON.parse(saved));
    }
  }, [isAuthenticated]);

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/shipping-addresses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find((a: ShippingAddress) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          selectAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const selectAddress = (addr: ShippingAddress) => {
    // Ensure E.164 format for PhoneInput; prepend +351 for legacy entries without prefix
    const phone = addr.phone.startsWith('+') ? addr.phone : `+351${addr.phone.replace(/\D/g, '')}`;
    setCustomerInfo(prev => ({
      ...prev,
      address: addr.address,
      city: addr.city,
      postalCode: addr.postal_code,
      phone,
    }));
    setShowNewAddressForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const errors: Record<string, string> = {};
    if (!customerInfo.name.trim()) errors.name = 'Nome completo é obrigatório';
    if (!customerInfo.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      errors.email = 'Formato de email inválido';
    }
    if (!customerInfo.phone) {
      errors.phone = 'Telefone é obrigatório';
    } else if (!isValidPhoneNumber(customerInfo.phone)) {
      errors.phone = 'Número de telefone inválido';
    }
    if (!customerInfo.address.trim()) errors.address = 'Endereço é obrigatório';
    if (!customerInfo.city.trim()) errors.city = 'Cidade é obrigatória';
    if (!customerInfo.postalCode.trim()) {
      errors.postalCode = 'Código postal é obrigatório';
    } else if (!/^\d{4}-\d{3}$/.test(customerInfo.postalCode.trim())) {
      errors.postalCode = 'Formato inválido (ex: 1234-567)';
    }

    if (!billingSameAsShipping) {
      if (!billingInfo.name.trim()) errors.billingName = 'Nome de faturação é obrigatório';
      if (!billingInfo.address.trim()) errors.billingAddress = 'Endereço de faturação é obrigatório';
      if (!billingInfo.city.trim()) errors.billingCity = 'Cidade de faturação é obrigatória';
      if (!billingInfo.postalCode.trim()) {
        errors.billingPostalCode = 'Código postal de faturação é obrigatório';
      } else if (!/^\d{4}-\d{3}$/.test(billingInfo.postalCode.trim())) {
        errors.billingPostalCode = 'Formato inválido (ex: 1234-567)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement>> = {
        name: nameRef, email: emailRef, phone: phoneRef,
        address: addressRef, city: cityRef, postalCode: postalCodeRef,
        billingName: billingNameRef, billingAddress: billingAddressRef,
        billingCity: billingCityRef, billingPostalCode: billingPostalCodeRef,
      };
      const firstKey = Object.keys(errors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[firstKey]?.current?.focus();
      return;
    }
    setFieldErrors({});

    if (!isAuthenticated) {
      localStorage.setItem('guest_checkout_data', JSON.stringify(customerInfo));
    }

    setIsProcessing(true);
    setPayError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${checkoutSuccessPath}` },
      redirect: 'if_required',
    });

    if (error) {
      setPayError(error.message ?? 'Erro no pagamento');
      setIsProcessing(false);
      return;
    }

    const effectiveBilling = billingSameAsShipping
      ? { billing_name: customerInfo.name, billing_address: customerInfo.address, billing_city: customerInfo.city, billing_postal_code: customerInfo.postalCode }
      : { billing_name: billingInfo.name, billing_address: billingInfo.address, billing_city: billingInfo.city, billing_postal_code: billingInfo.postalCode };

    const finalizeBody = {
      payment_intent_id: paymentIntentId,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      customer_city: customerInfo.city,
      customer_postal_code: customerInfo.postalCode,
      ...effectiveBilling,
      user_id: user?.id || null,
      save_address: isAuthenticated && saveAddress,
    };

    if (paymentIntent?.status === 'succeeded') {
      sessionStorage.setItem('pending_finalize', JSON.stringify(finalizeBody));
      navigate(checkoutSuccessPath);
      return;
    }

    if (paymentIntent?.status === 'requires_action') {
      const details = (paymentIntent as any).next_action?.multibanco_display_details;
      if (details) {
        let orderId: number | undefined;
        try {
          const orderRes = await fetch(`${API_BASE_URL}/payment/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalizeBody),
          });
          const order = await orderRes.json();
          orderId = order.id;
          if (orderId) {
            fetch(`/api/orders/${orderId}/payment-reference`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entity: details.entity, reference: details.reference }),
            }).catch(console.error);
          }
        } catch (err) {
          console.error('Error creating order:', err);
        }
        clearCart();
        success('Pedido criado com sucesso!');
        setPaymentReference({ method: 'multibanco', entity: details.entity, reference: details.reference, value: amount, orderId });
      } else {
        setPayError('Ação adicional necessária. Por favor tente novamente.');
      }
    }

    setIsProcessing(false);
  };

  if (paymentReference) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="Pedido Criado com Sucesso" description="O seu pedido foi criado com sucesso" canonical={checkoutPath} ogType="website" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pedido Criado com Sucesso!</h2>
            <p className="text-gray-600 mb-8">Use os dados abaixo para efetuar o pagamento por Multibanco:</p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Entidade:</span>
                <span className="font-mono text-lg">{paymentReference.entity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Referência:</span>
                <span className="font-mono text-lg">{paymentReference.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Valor:</span>
                <span className="font-mono text-lg">{paymentReference.value.toFixed(2)}€</span>
              </div>
            </div>
            {!isAuthenticated && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-left">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-800 mb-1">📧 Link de Tracking Enviado</h4>
                    <p className="text-xs text-blue-700">Enviámos um email para <strong>{customerInfo.email}</strong> com um link para acompanhar a sua encomenda.</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Link to={homePath} className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors">Voltar ao Início</Link>
              {isAuthenticated && (
                <Link to={ordersPath} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors">Ver Encomendas</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <SEO
          title="Checkout - Finalizar Compra"
          description="Finalize sua compra de forma segura. Aceitamos Multibanco, MB WAY e cartão de crédito."
          canonical={checkoutPath}
          ogType="website"
        />
      
      {/* ALTERAÇÃO CHAVE 1: Uso de max-w-7xl (1280px) ou max-w-[1400px] para ocupar muito mais ecrã sem quebrar a leitura */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 py-8 lg:py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link to={cartPath} className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Carrinho
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

        {showGuestWarning && !isAuthenticated && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <User className="h-8 w-8 text-blue-600 shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Crie uma conta para uma melhor experiência!</h3>
                <ul className="space-y-1 mb-4 text-sm text-gray-700">
                  <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Guardar endereços de entrega</li>
                  <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Ver histórico completo de encomendas</li>
                  <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Acompanhar encomendas sem links</li>
                </ul>
                <div className="flex gap-3">
                  <button onClick={() => setShowAuthModal(true)} className="px-6 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors">Criar Conta</button>
                  <button onClick={() => setShowGuestWarning(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors">Continuar como Convidado</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ALTERAÇÃO CHAVE 2: xl:gap-16 para gerir o espaço entre blocos perfeitamente em ecrãs grandes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 xl:gap-16 items-start">

            {/* ── Left: address form ─────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8 lg:col-span-7">

              {isAuthenticated && savedAddresses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Moradas Guardadas</h3>
                  <div className="space-y-3 mb-4">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start p-5 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        <input type="radio" name="address" checked={selectedAddressId === addr.id}
                          onChange={() => { setSelectedAddressId(addr.id); selectAddress(addr); }}
                          className="mt-1 mr-4" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{addr.name}</span>
                            {addr.is_default && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">Predefinida</span>}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{addr.address}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{addr.postal_code} {addr.city}</p>
                          <p className="text-sm text-gray-600 leading-relaxed">{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={() => { setShowNewAddressForm(!showNewAddressForm); setSelectedAddressId(null); }}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                    <Plus className="h-4 w-4" />
                    {showNewAddressForm ? 'Usar morada guardada' : 'Usar nova morada'}
                  </button>
                </div>
              )}

              {(showNewAddressForm || savedAddresses.length === 0) && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-5">Informações Pessoais</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome Completo *</label>
                        <input type="text" ref={nameRef} value={customerInfo.name}
                          onChange={(e) => { setCustomerInfo({ ...customerInfo, name: e.target.value }); clearFieldError('name'); }}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {fieldErrors.name && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                        <input type="email" ref={emailRef} value={customerInfo.email}
                          onChange={(e) => { setCustomerInfo({ ...customerInfo, email: e.target.value }); clearFieldError('email'); }}
                          onBlur={(e) => {
                            if (e.target.value) {
                              const prev = JSON.parse(localStorage.getItem('guest_checkout_data') || '{}');
                              localStorage.setItem('guest_checkout_data', JSON.stringify({ ...prev, email: e.target.value }));
                            }
                          }}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                        {fieldErrors.email && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone *</label>
                        <PhoneInput
                          flags={flags}
                          labels={pt}
                          international
                          defaultCountry="PT"
                          value={customerInfo.phone}
                          onChange={(val) => { setCustomerInfo(prev => ({ ...prev, phone: val ?? '' })); clearFieldError('phone'); }}
                          inputRef={phoneRef}
                          countrySelectComponent={PhoneCountrySelect}
                          className={`phone-input${fieldErrors.phone ? ' phone-input-error' : ''}`}
                        />
                        {fieldErrors.phone && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-5">Endereço de Entrega</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço *</label>
                        <input type="text" ref={addressRef} value={customerInfo.address}
                          onChange={(e) => { setCustomerInfo({ ...customerInfo, address: e.target.value }); clearFieldError('address'); }}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`} />
                        {fieldErrors.address && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.address}</p>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade *</label>
                          <input type="text" ref={cityRef} value={customerInfo.city}
                            onChange={(e) => { setCustomerInfo({ ...customerInfo, city: e.target.value }); clearFieldError('city'); }}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.city ? 'border-red-500' : 'border-gray-300'}`} />
                          {fieldErrors.city && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.city}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Código Postal *</label>
                          <input type="text" ref={postalCodeRef} value={customerInfo.postalCode}
                            onChange={(e) => { setCustomerInfo({ ...customerInfo, postalCode: e.target.value }); clearFieldError('postalCode'); }}
                            placeholder="1234-567"
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.postalCode ? 'border-red-500' : 'border-gray-300'}`} />
                          {fieldErrors.postalCode && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.postalCode}</p>}
                        </div>
                      </div>
                    </div>

                    {isAuthenticated && showNewAddressForm && (
                      <div className="mt-6">
                        <label className="flex items-center">
                          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)}
                            className="w-4 h-4 text-primary-600 bg-gray-50 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
                          <span className="ml-2 text-sm text-gray-700">Guardar esta morada para futuras compras</span>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Billing address ──────────────────────────────── */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Morada de Faturação</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-50 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Igual à morada de entrega</span>
                </label>

                {!billingSameAsShipping && (
                  <div className="mt-5 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                      <input
                        type="text"
                        ref={billingNameRef}
                        value={billingInfo.name}
                        onChange={(e) => { setBillingInfo(prev => ({ ...prev, name: e.target.value })); clearFieldError('billingName'); }}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.billingName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {fieldErrors.billingName && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.billingName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço *</label>
                      <input
                        type="text"
                        ref={billingAddressRef}
                        value={billingInfo.address}
                        onChange={(e) => { setBillingInfo(prev => ({ ...prev, address: e.target.value })); clearFieldError('billingAddress'); }}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.billingAddress ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {fieldErrors.billingAddress && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.billingAddress}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade *</label>
                        <input
                          type="text"
                          ref={billingCityRef}
                          value={billingInfo.city}
                          onChange={(e) => { setBillingInfo(prev => ({ ...prev, city: e.target.value })); clearFieldError('billingCity'); }}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.billingCity ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {fieldErrors.billingCity && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.billingCity}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Código Postal *</label>
                        <input
                          type="text"
                          ref={billingPostalCodeRef}
                          value={billingInfo.postalCode}
                          onChange={(e) => { setBillingInfo(prev => ({ ...prev, postalCode: e.target.value })); clearFieldError('billingPostalCode'); }}
                          placeholder="1234-567"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${fieldErrors.billingPostalCode ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {fieldErrors.billingPostalCode && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.billingPostalCode}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ── Right: order summary + payment ─────────────────────────── */}
            <div className="space-y-6 lg:col-span-5 sticky top-8">
              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-semibold mb-5">Resumo do Pedido</h3>
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`} className="flex items-center gap-3">
                      <img
                        src={getAbsoluteImageUrl(
                          (item.product.images?.[0] ?? '').replace(/(-md|-sm)?(\.webp)$/, '-sm$2') || '/images/placeholder.jpg'
                        )}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg shrink-0 bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                        {item.selectedColor && <p className="text-sm text-gray-500">Cor: {item.selectedColor}</p>}
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium text-gray-900 shrink-0">{(item.product.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-5 space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal (s/ IVA)</span>
                    <span className="font-medium text-gray-900">{subtotalExVat.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envio</span>
                    <span className="text-green-600 font-medium">Grátis</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (23%)</span>
                    <span className="font-medium text-gray-900">{ivaAmount.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-3 mt-2 text-gray-900">
                    <span>Total (c/ IVA)</span>
                    <span className="text-primary-600">{amount.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-gray-400" />
                  Pagamento Seguro
                </h3>

                {!isPaymentReady && (
                  <div className="animate-pulse space-y-4 mb-5">
                    <div className="h-12 bg-gray-100 rounded-lg" />
                    <div className="h-12 bg-gray-100 rounded-lg" />
                  </div>
                )}

                <div className={isPaymentReady ? 'block' : 'hidden'}>
                  <PaymentElement
                    onReady={() => setIsPaymentReady(true)}
                    options={{ defaultValues: { billingDetails: { address: { country: 'PT' } } } }}
                  />
                </div>

                {payError && (
                  <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-700 text-sm leading-relaxed">{payError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!stripe || isProcessing || !isPaymentReady}
                  className="w-full mt-6 bg-primary-600 text-white py-3.5 px-6 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2 text-[15px]"
                >
                  {isProcessing && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isProcessing ? 'A processar...' : `Pagar ${amount.toFixed(2)} €`}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      {showAuthModal && (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode="register" />
        </GoogleOAuthProvider>
      )}
    </div>
  );
};

const Checkout: React.FC = () => {
  const { items } = useCart();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const shopPath = getRoutePath('shop', lang);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [initError, setInitError] = useState<string | null>(null);
  const intentCreated = React.useRef(false);
  const API_BASE_URL = '/api';

  useEffect(() => {
    if (items.length === 0 || intentCreated.current) return;
    intentCreated.current = true;

    const PI_TTL = 30 * 60 * 1000;
    const cartKey = `checkout_pi_${items.map(i => `${i.product.id}x${i.quantity}`).join('_')}`;
    const cached = sessionStorage.getItem(cartKey);
    if (cached) {
      try {
        const { clientSecret, amount, paymentIntentId, createdAt } = JSON.parse(cached);
        if (Date.now() - createdAt < PI_TTL) {
          setClientSecret(clientSecret);
          setAmount(amount);
          setPaymentIntentId(paymentIntentId);
          return;
        }
      } catch { /* fall through */ }
    }

    fetch(`${API_BASE_URL}/payment/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        user_id: user?.id || null,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.clientSecret) throw new Error(data.error || 'No clientSecret');
        sessionStorage.setItem(cartKey, JSON.stringify({ ...data, createdAt: Date.now() }));
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setPaymentIntentId(data.paymentIntentId);
      })
      .catch(() => setInitError('Erro ao inicializar pagamento. Por favor refresque a página.'));
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Carrinho vazio</h2>
          <Link to={shopPath} className="text-primary-600 hover:text-primary-700">Voltar à loja</Link>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{initError}</p>
          <button onClick={() => window.location.reload()} className="text-primary-600 hover:text-primary-700">Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'pt', appearance: stripeAppearance, fonts: stripeFonts }}>
      <CheckoutInner amount={amount} paymentIntentId={paymentIntentId} />
    </Elements>
  );
};

export default Checkout;
