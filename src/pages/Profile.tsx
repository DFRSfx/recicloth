import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, Edit2, Lock, Shield, KeyRound, Plus, Trash2, Star, X } from 'lucide-react';

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

const Profile: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
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

  const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

  React.useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

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
    if (!formData.name.trim()) errors.name = 'Campo obrigatório';
    if (!formData.email.trim()) errors.email = 'Campo obrigatório';

    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
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
    if (!passwordData.currentPassword) errors.currentPassword = 'Campo obrigatório';
    if (!passwordData.newPassword) errors.newPassword = 'Campo obrigatório';
    if (!passwordData.confirmPassword) errors.confirmPassword = 'Campo obrigatório';

    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
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
      setPasswordFieldErrors({ confirmPassword: 'As passwords não coincidem' });
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
    if (!addressForm.name.trim()) errors.name = 'Campo obrigatório';
    if (!addressForm.phone.trim()) errors.phone = 'Campo obrigatório';
    if (!addressForm.address.trim()) errors.address = 'Campo obrigatório';
    if (!addressForm.city.trim()) errors.city = 'Campo obrigatório';
    if (!addressForm.postal_code.trim()) errors.postal_code = 'Campo obrigatório';

    if (Object.keys(errors).length > 0) {
      setAddressFieldErrors(errors);
      const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
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
        success('Morada atualizada');
      } else {
        setAddresses(prev => {
          const list = saved.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev;
          return [saved, ...list];
        });
        success('Morada adicionada');
      }

      closeAddressForm();
    } catch {
      error('Erro ao guardar morada');
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
      success('Morada predefinida atualizada');
    } catch {
      error('Erro ao definir morada predefinida');
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
      success('Morada eliminada');
    } catch {
      error('Erro ao eliminar morada');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) return null;

  // Local input component — no required on the DOM input
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
    inputRef?: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className={`h-5 w-5 transition-colors ${disabled ? 'text-gray-300' : 'text-amber-700'}`} aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          type={type}
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-lg transition-all duration-300 outline-none
            ${disabled
              ? 'bg-gray-50/50 border-transparent text-gray-500 shadow-none'
              : `bg-white text-gray-900 shadow-sm border focus:ring-2 focus:ring-amber-600 focus:border-amber-600 hover:border-gray-400 ${fieldError ? 'border-red-500' : 'border-gray-300'}`
            }`}
        />
      </div>
      {fieldError && !disabled && (
        <p className="mt-1 text-sm text-red-500">{fieldError}</p>
      )}
    </div>
  );

  // Password input component
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
    inputRef?: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className={`h-5 w-5 transition-colors text-amber-700`} aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          type="password"
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-lg transition-all duration-300 outline-none bg-white text-gray-900 shadow-sm border focus:ring-2 focus:ring-amber-600 focus:border-amber-600 hover:border-gray-400 ${fieldError ? 'border-red-500' : 'border-gray-300'}`}
        />
      </div>
      {fieldError && (
        <p className="mt-1 text-sm text-red-500">{fieldError}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/30 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0 overflow-hidden border border-amber-100">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-amber-50 flex items-center justify-center">
                  <User className="h-10 w-10 text-amber-700" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user?.name}</h1>
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 text-gray-600">
                <span className="flex items-center gap-1.5 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email}
                </span>
                {user?.role === 'admin' && (
                  <>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100/50 text-amber-800 border border-amber-200">
                      <Shield className="w-3.5 h-3.5" />
                      Administrador
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dados Pessoais</h2>
              <p className="text-sm text-gray-500 mt-1">Gerencie as suas informações de contacto.</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 transition-colors font-medium text-sm w-full sm:w-auto shadow-sm"
              >
                <Edit2 className="h-4 w-4 text-gray-500" />
                Editar Perfil
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <InputField
                id="name"
                label="Nome Completo *"
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
                label="Email *"
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
                label="Telefone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                icon={Phone}
              />
            </div>

            {isEditing && (
              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-50">
                <button type="button" onClick={() => { setIsEditing(false); setProfileFieldErrors({}); }} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-800 text-white font-medium rounded-lg hover:bg-amber-900 transition-colors shadow-sm">
                  <Save className="h-4 w-4" />
                  Guardar Alterações
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Moradas de Entrega */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                Moradas de Entrega
              </h2>
              <p className="text-sm text-gray-500 mt-1">Guarde moradas para agilizar as suas encomendas.</p>
            </div>
            {!showAddressForm && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 transition-colors font-medium text-sm w-full sm:w-auto shadow-sm"
              >
                <Plus className="h-4 w-4 text-gray-500" />
                Adicionar Morada
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {/* Add / Edit Form */}
            {showAddressForm && (
              <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {editingAddress ? 'Editar Morada' : 'Nova Morada'}
                  </h3>
                  <button onClick={closeAddressForm} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleAddressSave} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Label */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Nome da Morada <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={addrNameRef}
                        name="name"
                        value={addressForm.name}
                        onChange={handleAddressFormChange}
                        placeholder="ex: Casa, Trabalho"
                        className={`block w-full px-3 py-2.5 sm:text-sm rounded-lg border text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none ${addressFieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addressFieldErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{addressFieldErrors.name}</p>
                      )}
                    </div>
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Telemóvel <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={addrPhoneRef}
                        name="phone"
                        value={addressForm.phone}
                        onChange={handleAddressFormChange}
                        placeholder="912 345 678"
                        className={`block w-full px-3 py-2.5 sm:text-sm rounded-lg border text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none ${addressFieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addressFieldErrors.phone && (
                        <p className="mt-1 text-sm text-red-500">{addressFieldErrors.phone}</p>
                      )}
                    </div>
                    {/* Address full width */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Morada Completa <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={addrAddressRef}
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressFormChange}
                        placeholder="Rua, número, andar"
                        className={`block w-full px-3 py-2.5 sm:text-sm rounded-lg border text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none ${addressFieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addressFieldErrors.address && (
                        <p className="mt-1 text-sm text-red-500">{addressFieldErrors.address}</p>
                      )}
                    </div>
                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Cidade <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={addrCityRef}
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressFormChange}
                        placeholder="Lisboa"
                        className={`block w-full px-3 py-2.5 sm:text-sm rounded-lg border text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none ${addressFieldErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addressFieldErrors.city && (
                        <p className="mt-1 text-sm text-red-500">{addressFieldErrors.city}</p>
                      )}
                    </div>
                    {/* Postal code */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Código Postal <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={addrPostalRef}
                        name="postal_code"
                        value={addressForm.postal_code}
                        onChange={handleAddressFormChange}
                        placeholder="1000-001"
                        className={`block w-full px-3 py-2.5 sm:text-sm rounded-lg border text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-amber-600 focus:border-amber-600 outline-none ${addressFieldErrors.postal_code ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addressFieldErrors.postal_code && (
                        <p className="mt-1 text-sm text-red-500">{addressFieldErrors.postal_code}</p>
                      )}
                    </div>
                  </div>

                  {/* Set as default checkbox */}
                  <label className="inline-flex items-center gap-2.5 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={addressForm.is_default}
                      onChange={handleAddressFormChange}
                      className="w-4 h-4 rounded border-gray-300 text-amber-700 focus:ring-amber-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">Definir como morada predefinida</span>
                  </label>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button type="button" onClick={closeAddressForm} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-800 text-white font-medium rounded-lg hover:bg-amber-900 transition-colors shadow-sm text-sm disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {addressSaving ? 'A guardar...' : 'Guardar Morada'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Address list */}
            {addressesLoading ? (
              <div className="text-center py-8 text-sm text-gray-400">A carregar moradas...</div>
            ) : addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Ainda não tem moradas guardadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className={`relative rounded-xl border p-5 transition-all ${
                      addr.is_default
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'
                    }`}
                  >
                    {addr.is_default && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                        Predefinida
                      </span>
                    )}
                    <p className="font-semibold text-gray-900 text-sm mb-2 pr-20">{addr.name}</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {addr.address}
                      </p>
                      <p className="pl-5.5">{addr.postal_code} {addr.city}</p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {addr.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      {!addr.is_default && (
                        <button
                          onClick={() => handleSetDefault(addr)}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-700 transition-colors font-medium"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Predefinir
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(addr)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium ml-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        disabled={deletingId === addr.id}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors font-medium disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === addr.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Segurança da Conta */}
        {user?.hasPassword && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Segurança da Conta
                </h2>
                <p className="text-sm text-gray-500 mt-1">Mantenha a sua conta segura atualizando a password regularmente.</p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-amber-500 transition-colors font-medium text-sm w-full sm:w-auto shadow-sm"
                >
                  <KeyRound className="h-4 w-4 text-gray-500" />
                  Alterar Password
                </button>
              ) : (
                <form onSubmit={handlePasswordSubmit} noValidate className="max-w-md space-y-5">
                  <PasswordField
                    id="currentPassword"
                    label="Password Atual *"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    fieldError={passwordFieldErrors.currentPassword}
                    inputRef={currentPasswordRef}
                  />
                  <PasswordField
                    id="newPassword"
                    label="Nova Password *"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    fieldError={passwordFieldErrors.newPassword}
                    inputRef={newPasswordRef}
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Confirmar Nova Password *"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    fieldError={passwordFieldErrors.confirmPassword}
                    inputRef={confirmPasswordRef}
                  />

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordFieldErrors({});
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-amber-800 text-white font-medium rounded-lg hover:bg-amber-900 transition-colors shadow-sm"
                    >
                      Atualizar Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Profile;
