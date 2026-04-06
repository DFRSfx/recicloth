import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, Edit2, Lock, Shield, KeyRound, Plus, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ShippingAddress {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

const emptyAddressForm = { name: '', address: '', city: '', postal_code: '', phone: '', is_default: false };

const InputField = ({
  label,
  id,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  disabled,
  fieldError,
  inputRef,
}: {
  label: string;
  id: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  disabled: boolean;
  fieldError?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className={`h-4 w-4 transition-colors ${disabled ? 'text-gray-400' : 'text-gray-500'}`} aria-hidden="true" />
      </div>
      <input
        ref={inputRef}
        type={type}
        name={id}
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full pl-10 pr-3 py-3 text-sm rounded transition-all duration-200 outline-none
          ${disabled
            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
            : `bg-white text-gray-900 border focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] hover:border-gray-400 ${fieldError ? 'border-red-500' : 'border-gray-300'}`
          }`}
      />
    </div>
    {fieldError && !disabled && (
      <p className="mt-1 text-sm font-medium text-red-500">{fieldError}</p>
    )}
  </div>
);

const PasswordField = ({
  label,
  id,
  value,
  onChange,
  fieldError,
  inputRef,
}: {
  label: string;
  id: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  fieldError?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Lock className={`h-4 w-4 transition-colors text-gray-500`} aria-hidden="true" />
      </div>
      <input
        ref={inputRef}
        type="password"
        name={id}
        id={id}
        value={value}
        onChange={onChange}
        className={`block w-full pl-10 pr-3 py-3 text-sm rounded transition-all duration-200 outline-none bg-white text-gray-900 border focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] hover:border-gray-400 ${fieldError ? 'border-red-500' : 'border-gray-300'}`}
      />
    </div>
    {fieldError && (
      <p className="mt-1 text-sm font-medium text-red-500">{fieldError}</p>
    )}
  </div>
);

const Profile: React.FC = () => {
  const { user, token, isAuthenticated, authLoading } = useAuth();
  const { error, success } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Shipping addresses state
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Newsletter subscription
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Field-level validation errors
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});
  const [addressFieldErrors, setAddressFieldErrors] = useState<Record<string, string>>({});
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

  // Profile form refs
  const profileNameRef = useRef<HTMLInputElement>(null);
  const profileEmailRef = useRef<HTMLInputElement>(null);

  // Address form refs
  const addrNameRef = useRef<HTMLInputElement>(null);
  const addrPhoneRef = useRef<HTMLInputElement>(null);
  const addrAddressRef = useRef<HTMLInputElement>(null);
  const addrCityRef = useRef<HTMLInputElement>(null);
  const addrPostalRef = useRef<HTMLInputElement>(null);

  // Password form refs
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const API = '/api';

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/');
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch shipping addresses
  useEffect(() => {
    if (!token) return;
    const fetchAddresses = async () => {
      try {
        const res = await fetch(`${API}/shipping-addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAddresses(await res.json());
      } catch {
        // silent
      } finally {
        setAddressesLoading(false);
      }
    };
    fetchAddresses();
  }, [token]);

  // Fetch newsletter subscription status
  useEffect(() => {
    if (!token) return;
    fetch('/api/newsletter/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setNewsletterSubscribed(d.subscribed ?? false))
      .catch(() => setNewsletterSubscribed(false));
  }, [token]);

  const handleNewsletterUnsubscribe = async () => {
    if (!token) return;
    setNewsletterLoading(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNewsletterSubscribed(false);
    } catch {
      // silent
    } finally {
      setNewsletterLoading(false);
    }
  };

  const clearProfileError = (field: string) => {
    setProfileFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const clearAddressError = (field: string) => {
    setAddressFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const clearPasswordError = (field: string) => {
    setPasswordFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearProfileError(e.target.name);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    clearPasswordError(e.target.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t('common.required');
    if (!formData.email.trim()) {
      errors.email = t('common.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('form.emailInvalid');
    }

    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement>> = {
        name: profileNameRef,
        email: profileEmailRef,
      };
      const firstKey = Object.keys(errors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[firstKey]?.current?.focus();
      return;
    }
    setProfileFieldErrors({});

    console.log('Updating profile:', formData);
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!passwordData.currentPassword) errors.currentPassword = t('common.required');
    if (!passwordData.newPassword) errors.newPassword = t('common.required');
    if (!passwordData.confirmPassword) errors.confirmPassword = t('common.required');

    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement>> = {
        currentPassword: currentPasswordRef,
        newPassword: newPasswordRef,
        confirmPassword: confirmPasswordRef,
      };
      const firstKey = Object.keys(errors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[firstKey]?.current?.focus();
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFieldErrors({ confirmPassword: t('profile.passwordMismatch') });
      confirmPasswordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      confirmPasswordRef.current?.focus();
      return;
    }

    setPasswordFieldErrors({});
    console.log('Changing password');
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // --- Shipping address handlers ---
  const openAddForm = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddressForm);
    setAddressFieldErrors({});
    setShowAddressForm(true);
  };

  const openEditForm = (addr: ShippingAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name,
      address: addr.address,
      city: addr.city,
      postal_code: addr.postal_code,
      phone: addr.phone,
      is_default: addr.is_default,
    });
    setAddressFieldErrors({});
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddressForm);
    setAddressFieldErrors({});
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (type !== 'checkbox') clearAddressError(name);
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!addressForm.name.trim()) errors.name = t('common.required');
    if (!addressForm.phone.trim()) {
      errors.phone = t('common.required');
    } else if (!/^\d{9}$/.test(addressForm.phone.replace(/\s/g, ''))) {
      errors.phone = t('form.phoneInvalid');
    }
    if (!addressForm.address.trim()) errors.address = t('common.required');
    if (!addressForm.city.trim()) errors.city = t('common.required');
    if (!addressForm.postal_code.trim()) errors.postal_code = t('common.required');

    if (Object.keys(errors).length > 0) {
      setAddressFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement>> = {
        name: addrNameRef,
        phone: addrPhoneRef,
        address: addrAddressRef,
        city: addrCityRef,
        postal_code: addrPostalRef,
      };
      const firstKey = Object.keys(errors)[0];
      refs[firstKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      refs[firstKey]?.current?.focus();
      return;
    }
    setAddressFieldErrors({});

    setAddressSaving(true);
    try {
      const method = editingAddress ? 'PUT' : 'POST';
      const url = editingAddress
        ? `${API}/shipping-addresses/${editingAddress.id}`
        : `${API}/shipping-addresses`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addressForm),
      });

      if (!res.ok) throw new Error();

      const saved: ShippingAddress = await res.json();

      if (editingAddress) {
        setAddresses(prev =>
          prev.map(a => {
            if (saved.is_default && a.id !== saved.id) return { ...a, is_default: false };
            return a.id === saved.id ? saved : a;
          })
        );
        success(t('profile.addressUpdated'));
      } else {
        setAddresses(prev => {
          const list = saved.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev;
          return [saved, ...list];
        });
        success(t('profile.addressAdded'));
      }

      closeAddressForm();
    } catch {
      error(t('profile.addressSaveError'));
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefault = async (addr: ShippingAddress) => {
    if (addr.is_default) return;
    try {
      const res = await fetch(`${API}/shipping-addresses/${addr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) throw new Error();
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === addr.id })));
      success(t('profile.addressDefaultUpdated'));
    } catch {
      error(t('profile.addressDefaultError'));
    }
  };

  const handleDeleteAddress = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/shipping-addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setAddresses(prev => prev.filter(a => a.id !== id));
      success(t('profile.addressDeleted'));
    } catch {
      error(t('profile.addressDeleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">A Minha Conta</h1>
          <p className="text-gray-500 mt-2 text-[15px]">Gira os seus dados pessoais e preferências.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* LEFT SIDEBAR: User Info & Security */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* User Identity Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-gray-100 shadow-sm mb-5">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-[#f2f2f2] flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <div className="flex items-center justify-center gap-1.5 text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                
                {user?.role === 'admin' && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#e8f5e9] text-[#1E4D3B] border border-[#1E4D3B]/20">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t('auth.admin')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Section (If Password Exists) */}
            {user?.hasPassword && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    {t('profile.security')}
                  </h2>
                </div>

                <div className="p-6">
                  {!showPasswordForm ? (
                    <div>
                      <p className="text-[14px] text-gray-500 mb-4">{t('profile.securityDesc')}</p>
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full inline-flex items-center justify-center px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-sm shadow-sm"
                      >
                        {t('profile.changePassword')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
                      <PasswordField
                        id="currentPassword"
                        label={t('profile.currentPassword') + ' *'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        fieldError={passwordFieldErrors.currentPassword}
                        inputRef={currentPasswordRef}
                      />
                      <PasswordField
                        id="newPassword"
                        label={t('profile.newPassword') + ' *'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        fieldError={passwordFieldErrors.newPassword}
                        inputRef={newPasswordRef}
                      />
                      <PasswordField
                        id="confirmPassword"
                        label={t('profile.confirmPassword') + ' *'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        fieldError={passwordFieldErrors.confirmPassword}
                        inputRef={confirmPasswordRef}
                      />

                      <div className="flex flex-col gap-3 pt-2">
                        <button
                          type="submit"
                          className="w-full px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition-colors shadow-sm text-sm"
                        >
                          Guardar Password
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            setPasswordFieldErrors({});
                          }}
                          className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors text-sm"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Newsletter */}
            {newsletterSubscribed !== null && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-full flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Newsletter</h3>
                    {newsletterSubscribed ? (
                      <>
                        <p className="text-xs text-gray-500 mb-3">Está subscrito/a à newsletter da Recicloth.</p>
                        <button
                          onClick={handleNewsletterUnsubscribe}
                          disabled={newsletterLoading}
                          className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 disabled:opacity-50 transition-colors"
                        >
                          {newsletterLoading ? 'A cancelar…' : 'Cancelar subscrição'}
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">Não está subscrito/a à newsletter.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT MAIN AREA: Forms */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            {/* Dados Pessoais Form */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">{t('profile.personalInfo')}</h2>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-semibold text-sm shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar Dados
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <InputField
                    id="name"
                    label={t('form.name') + ' *'}
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    icon={User}
                    fieldError={profileFieldErrors.name}
                    inputRef={profileNameRef}
                  />
                  <InputField
                    id="email"
                    type="email"
                    label={t('form.email') + ' *'}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    icon={Mail}
                    fieldError={profileFieldErrors.email}
                    inputRef={profileEmailRef}
                  />
                  <InputField
                    id="phone"
                    type="tel"
                    label={t('form.phone')}
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    icon={Phone}
                  />
                </div>

                {isEditing && (
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button type="button" onClick={() => { setIsEditing(false); setProfileFieldErrors({}); }} className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors text-sm">
                      {t('common.cancel')}
                    </button>
                    <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#1E4D3B] text-white font-bold rounded hover:bg-[#163a2c] transition-colors shadow-sm text-sm">
                      <Save className="h-4 w-4" />
                      {t('common.save')}
                    </button>
                  </div>
                )}
              </form>
            </section>

            {/* Moradas de Entrega */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">{t('profile.shippingAddresses')}</h2>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={openAddForm}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-semibold text-sm shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Morada
                  </button>
                )}
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Add / Edit Form */}
                {showAddressForm && (
                  <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-6 sm:p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-900 text-[16px]">
                        {editingAddress ? t('profile.editAddress') : t('profile.addAddress')}
                      </h3>
                      <button onClick={closeAddressForm} className="p-1 text-gray-400 hover:text-black transition-colors focus:outline-none">
                        <X className="h-5 w-5" strokeWidth={2} />
                      </button>
                    </div>
                    <form onSubmit={handleAddressSave} noValidate className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {t('form.name')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={addrNameRef}
                            name="name"
                            value={addressForm.name}
                            onChange={handleAddressFormChange}
                            placeholder={t('profile.addressPlaceholder.name')}
                            className={`block w-full px-4 py-3 text-sm rounded border text-gray-900 bg-white focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] outline-none transition-shadow ${addressFieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {addressFieldErrors.name && <p className="mt-1 text-sm font-medium text-red-500">{addressFieldErrors.name}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {t('form.phone')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={addrPhoneRef}
                            name="phone"
                            value={addressForm.phone}
                            onChange={handleAddressFormChange}
                            placeholder={t('profile.addressPlaceholder.phone')}
                            className={`block w-full px-4 py-3 text-sm rounded border text-gray-900 bg-white focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] outline-none transition-shadow ${addressFieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {addressFieldErrors.phone && <p className="mt-1 text-sm font-medium text-red-500">{addressFieldErrors.phone}</p>}
                        </div>
                        
                        <div className="sm:col-span-2 space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {t('form.address')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={addrAddressRef}
                            name="address"
                            value={addressForm.address}
                            onChange={handleAddressFormChange}
                            placeholder={t('profile.addressPlaceholder.address')}
                            className={`block w-full px-4 py-3 text-sm rounded border text-gray-900 bg-white focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] outline-none transition-shadow ${addressFieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {addressFieldErrors.address && <p className="mt-1 text-sm font-medium text-red-500">{addressFieldErrors.address}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {t('form.city')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={addrCityRef}
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressFormChange}
                            placeholder={t('profile.addressPlaceholder.city')}
                            className={`block w-full px-4 py-3 text-sm rounded border text-gray-900 bg-white focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] outline-none transition-shadow ${addressFieldErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {addressFieldErrors.city && <p className="mt-1 text-sm font-medium text-red-500">{addressFieldErrors.city}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {t('form.postalCode')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={addrPostalRef}
                            name="postal_code"
                            value={addressForm.postal_code}
                            onChange={handleAddressFormChange}
                            placeholder={t('profile.addressPlaceholder.postalCode')}
                            className={`block w-full px-4 py-3 text-sm rounded border text-gray-900 bg-white focus:ring-1 focus:ring-[#1E4D3B] focus:border-[#1E4D3B] outline-none transition-shadow ${addressFieldErrors.postal_code ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {addressFieldErrors.postal_code && <p className="mt-1 text-sm font-medium text-red-500">{addressFieldErrors.postal_code}</p>}
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2 cursor-pointer mt-2 pt-2">
                        <input
                          type="checkbox"
                          name="is_default"
                          checked={addressForm.is_default}
                          onChange={handleAddressFormChange}
                          className="w-4 h-4 rounded border-gray-300 text-[#1E4D3B] focus:ring-[#1E4D3B] cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700">{t('profile.setDefaultCheckbox')}</span>
                      </label>

                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200/60 mt-6">
                        <button type="button" onClick={closeAddressForm} className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors text-sm">
                          {t('common.cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={addressSaving}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#1E4D3B] text-white font-bold rounded hover:bg-[#163a2c] transition-colors shadow-sm text-sm disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                          {t('common.save')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Address list */}
                {addressesLoading ? (
                  <div className="text-center py-10 text-sm font-medium text-gray-400">{t('profile.addressesLoading')}</div>
                ) : addresses.length === 0 && !showAddressForm ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-[15px] font-medium text-gray-500">{t('profile.addressesEmpty')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        className={`relative rounded-lg border p-6 flex flex-col transition-all ${
                          addr.is_default
                            ? 'border-[#1E4D3B] bg-[#e8f5e9]/30 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {addr.is_default && (
                          <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#1E4D3B] text-white text-[10px] font-bold uppercase tracking-wider">
                              Principal
                            </span>
                          </div>
                        )}
                        
                        <p className="font-bold text-gray-900 text-[15px] mb-3 pr-16">{addr.name}</p>
                        
                        <div className="space-y-1.5 text-[14px] text-gray-600 flex-1">
                          <p>{addr.address}</p>
                          <p>{addr.postal_code} {addr.city}</p>
                          <p className="pt-1 text-gray-500 font-medium">{addr.phone}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-gray-100">
                          {!addr.is_default ? (
                            <button
                              onClick={() => handleSetDefault(addr)}
                              className="text-[13px] text-gray-500 hover:text-[#1E4D3B] transition-colors font-semibold"
                            >
                              Definir como Principal
                            </button>
                          ) : (
                            <span className="text-[13px] text-gray-400 font-medium">Morada Padrão</span>
                          )}
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditForm(addr)}
                              className="text-[13px] text-gray-500 hover:text-black transition-colors font-semibold"
                            >
                              Editar
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              disabled={deletingId === addr.id}
                              className="text-[13px] text-gray-400 hover:text-red-600 transition-colors font-semibold disabled:opacity-40"
                            >
                              Apagar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
