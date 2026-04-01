import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import AdminSelect from '../components/AdminSelect';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';
import { getRoutePath, getShopPath, withQuery } from '../../utils/routes';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${SERVER_URL}/api`;

interface HeroSlide {
  id: number;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  background_image: string;
  background_image_md: string;
  background_image_sm: string;
  text_color: 'white' | 'dark';
  display_order: number;
  is_active: boolean;
}

export default function HeroSlidesList() {
  const { t, lang } = useLanguage();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const { error: showError, success: showSuccess } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    button_text: '',
    button_link: '',
    button_link_type: 'page' as 'page' | 'category' | 'custom',
    text_color: 'white' as 'white' | 'dark',
    display_order: 0,
    is_active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [categories, setCategories] = useState<Array<{id: number; name: string; slug: string}>>([]);
  const [addFieldErrors, setAddFieldErrors] = useState<Record<string, string>>({});

  // Refs for the Add form
  const addTitleRef = useRef<HTMLInputElement>(null);
  const addButtonTextRef = useRef<HTMLInputElement>(null);
  const addImageRef = useRef<HTMLInputElement>(null);

  const buildPageRouteValues = (targetLang: 'pt' | 'en') => [
    getRoutePath('home', targetLang),
    getRoutePath('shop', targetLang),
    withQuery(getRoutePath('shop', targetLang), { filter: 'new' }),
    withQuery(getRoutePath('shop', targetLang), { filter: 'featured' }),
    getRoutePath('favorites', targetLang),
    getRoutePath('cart', targetLang),
    getRoutePath('checkout', targetLang),
    getRoutePath('checkoutSuccess', targetLang),
    getRoutePath('checkoutFail', targetLang),
    getRoutePath('contact', targetLang),
    getRoutePath('profile', targetLang),
    getRoutePath('orders', targetLang),
    getRoutePath('verifyEmail', targetLang),
    getRoutePath('resetPassword', targetLang),
    getRoutePath('privacyPolicy', targetLang),
    getRoutePath('returnPolicy', targetLang),
    getRoutePath('terms', targetLang)
  ];

  const pageRouteOptions = [
    { value: getRoutePath('home', lang), label: t('admin.heroSlides.routes.home') },
    { value: getRoutePath('shop', lang), label: t('admin.heroSlides.routes.shopAll') },
    { value: withQuery(getRoutePath('shop', lang), { filter: 'new' }), label: t('admin.heroSlides.routes.shopNew') },
    { value: withQuery(getRoutePath('shop', lang), { filter: 'featured' }), label: t('admin.heroSlides.routes.shopFeatured') },
    { value: getRoutePath('favorites', lang), label: t('admin.heroSlides.routes.favorites') },
    { value: getRoutePath('cart', lang), label: t('admin.heroSlides.routes.cart') },
    { value: getRoutePath('checkout', lang), label: t('admin.heroSlides.routes.checkout') },
    { value: getRoutePath('checkoutSuccess', lang), label: t('admin.heroSlides.routes.checkoutSuccess') },
    { value: getRoutePath('checkoutFail', lang), label: t('admin.heroSlides.routes.checkoutFail') },
    { value: getRoutePath('contact', lang), label: t('admin.heroSlides.routes.contact') },
    { value: getRoutePath('profile', lang), label: t('admin.heroSlides.routes.profile') },
    { value: getRoutePath('orders', lang), label: t('admin.heroSlides.routes.orders') },
    { value: getRoutePath('verifyEmail', lang), label: t('admin.heroSlides.routes.verifyEmail') },
    { value: getRoutePath('resetPassword', lang), label: t('admin.heroSlides.routes.resetPassword') },
    { value: getRoutePath('privacyPolicy', lang), label: t('admin.heroSlides.routes.privacyPolicy') },
    { value: getRoutePath('returnPolicy', lang), label: t('admin.heroSlides.routes.returnPolicy') },
    { value: getRoutePath('terms', lang), label: t('admin.heroSlides.routes.terms') }
  ];

  const pageRouteValueSet = new Set([
    ...buildPageRouteValues('pt'),
    ...buildPageRouteValues('en')
  ]);

  const withCurrentOption = (
    options: Array<{ value: string; label: string }>,
    value: string
  ) => {
    if (!value) return options;
    return options.some(option => option.value === value)
      ? options
      : [{ value, label: `${t('admin.heroSlides.routes.current')} (${value})` }, ...options];
  };

  const getDefaultPageRoute = () =>
    pageRouteOptions[0]?.value ?? getRoutePath('home', lang);

  const getDefaultCategoryRoute = () =>
    categories[0] ? getShopPath(lang, categories[0].slug) : '';

  const clearAddError = (field: string) => {
    setAddFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  useEffect(() => {
    loadSlides();
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.button_link_type === 'page' && !formData.button_link) {
      setFormData(prev => ({ ...prev, button_link: getDefaultPageRoute() }));
    }
  }, [formData.button_link_type, formData.button_link, lang]);

  useEffect(() => {
    if (formData.button_link_type === 'category' && !formData.button_link && categories.length > 0) {
      setFormData(prev => ({ ...prev, button_link: getDefaultCategoryRoute() }));
    }
  }, [formData.button_link_type, formData.button_link, categories, lang]);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSlides = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/hero-slides/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      // Check for authentication errors
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          setError(t('admin.heroSlides.sessionExpired'));
          setSlides([]);
          return;
        }
        throw new Error(data.error || t('admin.heroSlides.loadError'));
      }

      // Ensure data is an array
      if (Array.isArray(data)) {
        setSlides(data);
        setError(null);
      } else {
        console.error('Invalid data format from API:', data);
        setError(t('admin.heroSlides.invalidData'));
        setSlides([]);
      }
    } catch (error) {
      console.error('Error loading slides:', error);
      setError(error instanceof Error ? error.message : t('admin.heroSlides.loadError'));
      setSlides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkTypeChange = (type: 'page' | 'category' | 'custom') => {
    const nextValue =
      type === 'page'
        ? getDefaultPageRoute()
        : type === 'category'
          ? getDefaultCategoryRoute()
          : '';

    setFormData({
      ...formData,
      button_link_type: type,
      button_link: nextValue
    });
  };

  const detectLinkType = (link: string): 'page' | 'category' | 'custom' => {
    const shopPt = getRoutePath('shop', 'pt');
    const shopEn = getRoutePath('shop', 'en');
    if (pageRouteValueSet.has(link)) return 'page';
    if (
      link.includes('categoria=') ||
      link.startsWith(`${shopPt}/`) ||
      link.startsWith(`${shopEn}/`)
    ) {
      return 'category';
    }
    return 'custom';
  };

  const handleEditLinkTypeChange = (slideId: number, type: 'page' | 'category' | 'custom') => {
    const nextValue =
      type === 'page'
        ? getDefaultPageRoute()
        : type === 'category'
          ? getDefaultCategoryRoute()
          : '';
    updateSlide(slideId, 'button_link', nextValue);
  };

  const openAddModal = () => {
    setShowAddForm(true);
    setAddFieldErrors({});
    setFormData((prev) => ({
      ...prev,
      button_link_type: 'page',
      button_link: prev.button_link || getDefaultPageRoute()
    }));
  };

  const closeAddModal = () => {
    setShowAddForm(false);
    setAddFieldErrors({});
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = t('common.required');
    if (!formData.button_text.trim()) errors.button_text = t('common.required');
    if (!imageFile) errors.image = t('admin.heroSlides.requiredImage');

    if (Object.keys(errors).length > 0) {
      setAddFieldErrors(errors);
      if (errors.title) {
        addTitleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addTitleRef.current?.focus();
      } else if (errors.button_text) {
        addButtonTextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        addButtonTextRef.current?.focus();
      } else if (errors.image) {
        addImageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setAddFieldErrors({});

    try {
      const token = localStorage.getItem('auth_token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('button_text', formData.button_text);
      formDataToSend.append('button_link', formData.button_link);
      formDataToSend.append('text_color', formData.text_color);
      formDataToSend.append('display_order', formData.display_order.toString());
      formDataToSend.append('is_active', formData.is_active.toString());
      formDataToSend.append('image', imageFile!);

      const response = await fetch(`${API_URL}/hero-slides`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        showSuccess(t('admin.heroSlides.createSuccess'));
        setShowAddForm(false);
        setAddFieldErrors({});
        setFormData({
          title: '',
          description: '',
          button_text: '',
          button_link: getDefaultPageRoute(),
          button_link_type: 'page',
          text_color: 'white',
          display_order: 0,
          is_active: true
        });
        setImageFile(null);
        setImagePreview('');
        loadSlides();
      } else {
        showError(t('admin.heroSlides.createError'));
      }
    } catch (error) {
      console.error('Error adding slide:', error);
      showError(t('admin.heroSlides.createError'));
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const slide = slides.find(s => s.id === id);
      if (!slide) return;

      const token = localStorage.getItem('auth_token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', slide.title);
      formDataToSend.append('description', slide.description || '');
      formDataToSend.append('button_text', slide.button_text);
      formDataToSend.append('button_link', slide.button_link);
      formDataToSend.append('text_color', slide.text_color);
      formDataToSend.append('display_order', slide.display_order.toString());
      formDataToSend.append('is_active', slide.is_active.toString());

      // Only append image if one was selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(`${API_URL}/hero-slides/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        showSuccess(t('admin.heroSlides.updateSuccess'));
        setEditingId(null);
        setImageFile(null);
        setImagePreview('');
        // Force reload with cache bust
        await loadSlides();
      } else {
        showError(t('admin.heroSlides.updateError'));
      }
    } catch (error) {
      console.error('Error updating slide:', error);
      showError(t('admin.heroSlides.updateError'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/hero-slides/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess(t('admin.heroSlides.deleteSuccess'));
        setDeleteConfirm(null);
        loadSlides();
      } else {
        showError(t('admin.heroSlides.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      showError(t('admin.heroSlides.deleteError'));
    }
  };

  const updateSlide = (id: number, field: string, value: any) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, [field]: value } : slide
    ));
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const slide = slides.find(s => s.id === id);
      if (!slide) return;

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/hero-slides/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...slide, is_active: !currentStatus })
      });

      if (response.ok) {
        showSuccess(
          !currentStatus
            ? t('admin.heroSlides.activateSuccess')
            : t('admin.heroSlides.deactivateSuccess')
        );
        loadSlides();
      } else {
        showError(t('admin.heroSlides.toggleError'));
      }
    } catch (error) {
      console.error('Error toggling slide status:', error);
      showError(t('admin.heroSlides.toggleError'));
    }
  };

  const isSessionExpired = error === t('admin.heroSlides.sessionExpired');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <main className="space-y-6 sm:space-y-8 pb-8">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          {isSessionExpired && (
            <button
              onClick={() => window.location.href = '/'}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              {t('admin.heroSlides.loginAction')}
            </button>
          )}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{t('admin.heroSlides.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.heroSlides.subtitle')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium text-sm"
        >
          <Plus size={18} />
          {t('admin.heroSlides.addButton')}
        </button>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeAddModal}
            role="button"
            tabIndex={-1}
            aria-label={t('common.close')}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-secondary-200">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">{t('admin.heroSlides.addTitle')}</h2>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1"
                    aria-label={t('common.close')}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleAdd} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.heroSlides.fields.title')} *
                      </label>
                      <input
                        ref={addTitleRef}
                        type="text"
                        value={formData.title}
                        onChange={(e) => { setFormData({ ...formData, title: e.target.value }); clearAddError('title'); }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${addFieldErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addFieldErrors.title && <p className="mt-1.5 text-sm text-red-500">{addFieldErrors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.heroSlides.fields.buttonText')} *
                      </label>
                      <input
                        ref={addButtonTextRef}
                        type="text"
                        value={formData.button_text}
                        onChange={(e) => { setFormData({ ...formData, button_text: e.target.value }); clearAddError('button_text'); }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${addFieldErrors.button_text ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {addFieldErrors.button_text && <p className="mt-1.5 text-sm text-red-500">{addFieldErrors.button_text}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.heroSlides.fields.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('admin.heroSlides.fields.destination')} *
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleLinkTypeChange('page')}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.button_link_type === 'page'
                            ? 'border-primary-600 bg-primary-50 text-primary-900 font-medium'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {t('admin.heroSlides.linkType.page')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLinkTypeChange('category')}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.button_link_type === 'category'
                            ? 'border-primary-600 bg-primary-50 text-primary-900 font-medium'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {t('admin.heroSlides.linkType.category')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLinkTypeChange('custom')}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          formData.button_link_type === 'custom'
                            ? 'border-primary-600 bg-primary-50 text-primary-900 font-medium'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {t('admin.heroSlides.linkType.custom')}
                      </button>
                    </div>

                    {formData.button_link_type === 'page' && (
                      <AdminSelect
                        value={formData.button_link}
                        onChange={(value) => setFormData({ ...formData, button_link: value })}
                        wrapperClassName="w-full"
                        options={pageRouteOptions}
                      />
                    )}

                    {formData.button_link_type === 'category' && (
                      <AdminSelect
                        value={formData.button_link}
                        onChange={(value) => setFormData({ ...formData, button_link: value })}
                        wrapperClassName="w-full"
                        placeholder={t('admin.heroSlides.selectCategory')}
                        options={categories.map(cat => ({ value: getShopPath(lang, cat.slug), label: cat.name }))}
                      />
                    )}

                    {formData.button_link_type === 'custom' && (
                      <input
                        type="text"
                        value={formData.button_link}
                        onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                        placeholder={t('admin.heroSlides.placeholder.customLink')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.heroSlides.fields.textColor')}
                      </label>
                      <AdminSelect
                        value={formData.text_color}
                        onChange={(value) => setFormData({ ...formData, text_color: value as 'white' | 'dark' })}
                        wrapperClassName="w-full"
                        options={[
                          { value: 'white', label: t('admin.heroSlides.textColor.white') },
                          { value: 'dark', label: t('admin.heroSlides.textColor.dark') },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.heroSlides.fields.backgroundImage')} *
                    </label>
                    <input
                      ref={addImageRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => { handleImageChange(e); clearAddError('image'); }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${addFieldErrors.image ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {addFieldErrors.image && <p className="mt-1.5 text-sm text-red-500">{addFieldErrors.image}</p>}
                    {imagePreview && (
                      <div className="mt-3">
                        <img src={imagePreview} alt={t('admin.heroSlides.fields.imagePreviewAlt')} className="w-full h-48 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.heroSlides.fields.displayOrder')}
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex items-center pt-7">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-gray-700">{t('admin.heroSlides.fields.slideActive')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeAddModal}
                      className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation min-h-[44px] font-medium text-sm"
                    >
                      {t('admin.heroSlides.addButton')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slides List - Preview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Slide Preview */}
            <div className="relative h-48 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${getAbsoluteImageUrl(slide.background_image_md || slide.background_image)})` }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>

              {/* Content Preview */}
              <div className="relative z-10 h-full flex items-center p-6">
                <div>
                  <h3 className={`text-2xl font-bold mb-2 ${
                    slide.text_color === 'white' ? 'text-white' : 'text-[#1A1A1A]'
                  }`}>
                    {slide.title}
                  </h3>
                  <p className={`text-sm mb-3 line-clamp-2 ${
                    slide.text_color === 'white' ? 'text-gray-100' : 'text-gray-600'
                  }`}>
                    {slide.description}
                  </p>
                  <span className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg">
                    {slide.button_text}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={() => toggleActive(slide.id, slide.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shadow-lg ${
                    slide.is_active
                      ? 'bg-green-500 text-white'
                      : 'bg-tertiary-1000 text-white'
                  }`}
                >
                  {slide.is_active ? <Eye size={14} className="inline mr-1" /> : <EyeOff size={14} className="inline mr-1" />}
                  {slide.is_active ? t('admin.heroSlides.status.active') : t('admin.heroSlides.status.inactive')}
                </button>
              </div>

              {/* Order Badge */}
              <div className="absolute top-3 left-3 z-20">
                <div className="bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {t('admin.heroSlides.fields.order')}: {slide.display_order}
                </div>
              </div>
            </div>

            {/* Info & Actions */}
            <div className="p-4 bg-tertiary-100">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('admin.heroSlides.fields.link')}:</span> {slide.button_link}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(slide.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px]"
                >
                  <Edit size={18} />
                  <span>{t('common.edit')}</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm({ id: slide.id, title: slide.title })}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[44px]"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={18} />
                  <span>{t('common.delete')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500">{t('admin.heroSlides.empty')}</p>
          </div>
        )}
      </div>


      {/* Edit Modal */}
      {editingId !== null && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setEditingId(null);
              loadSlides();
            }}
            role="button"
            tabIndex={-1}
            aria-label={t('common.close')}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-secondary-200">
              <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">{t('admin.heroSlides.editTitle')}</h2>
                <button
                  onClick={() => {
                    setEditingId(null);
                    loadSlides();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1"
                  aria-label={t('common.close')}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
                {(() => {
                  const slide = slides.find(s => s.id === editingId);
                  if (!slide) return null;

                  const linkType = detectLinkType(slide.button_link);
                  const pageOptionsWithCurrent = withCurrentOption(pageRouteOptions, slide.button_link);
                  const categoryOptionsWithCurrent = withCurrentOption(
                    categories.map(cat => ({ value: getShopPath(lang, cat.slug), label: cat.name })),
                    slide.button_link
                  );

                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.heroSlides.fields.title')}</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => updateSlide(editingId, 'title', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.heroSlides.fields.description')}</label>
                        <textarea
                          value={slide.description}
                          onChange={(e) => updateSlide(editingId, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.heroSlides.fields.buttonText')}</label>
                        <input
                          type="text"
                          value={slide.button_text}
                          onChange={(e) => updateSlide(editingId, 'button_text', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
                        />
                      </div>

                      {/* Link Configuration */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">{t('admin.heroSlides.fields.destination')}</label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => handleEditLinkTypeChange(editingId, 'page')}
                            className={`px-4 py-3 rounded-lg border-2 transition-all text-base ${
                              linkType === 'page'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-medium'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {t('admin.heroSlides.linkType.page')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditLinkTypeChange(editingId, 'category')}
                            className={`px-4 py-3 rounded-lg border-2 transition-all text-base ${
                              linkType === 'category'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-medium'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {t('admin.heroSlides.linkType.category')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditLinkTypeChange(editingId, 'custom')}
                            className={`px-4 py-3 rounded-lg border-2 transition-all text-base ${
                              linkType === 'custom'
                                ? 'border-primary-600 bg-primary-50 text-primary-900 font-medium'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {t('admin.heroSlides.linkType.custom')}
                          </button>
                        </div>

                        {linkType === 'page' && (
                          <AdminSelect
                            value={slide.button_link}
                            onChange={(value) => updateSlide(editingId, 'button_link', value)}
                            wrapperClassName="w-full"
                            options={pageOptionsWithCurrent}
                          />
                        )}

                        {linkType === 'category' && (
                          <AdminSelect
                            value={slide.button_link}
                            onChange={(value) => updateSlide(editingId, 'button_link', value)}
                            wrapperClassName="w-full"
                            placeholder={t('admin.heroSlides.selectCategory')}
                            options={categoryOptionsWithCurrent}
                          />
                        )}

                        {linkType === 'custom' && (
                          <input
                            type="text"
                            value={slide.button_link}
                            onChange={(e) => updateSlide(editingId, 'button_link', e.target.value)}
                            placeholder={t('admin.heroSlides.placeholder.customLink')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.heroSlides.fields.changeImage')}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
                        />
                        {/* Show current image or preview */}
                        <div className="mt-3">
                          <img
                            src={imagePreview || getAbsoluteImageUrl(slide.background_image_md || slide.background_image)}
                            alt={t('admin.heroSlides.fields.imagePreviewAlt')}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.heroSlides.fields.textColor')}</label>
                          <AdminSelect
                            value={slide.text_color}
                            onChange={(value) => updateSlide(editingId, 'text_color', value)}
                            wrapperClassName="w-full"
                            options={[
                              { value: 'white', label: t('admin.heroSlides.textColor.white') },
                              { value: 'dark', label: t('admin.heroSlides.textColor.dark') },
                            ]}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.heroSlides.fields.order')}</label>
                          <input
                            type="number"
                            value={slide.display_order}
                            onChange={(e) => updateSlide(editingId, 'display_order', parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
                          />
                        </div>

                        <div className="flex items-end">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slide.is_active}
                              onChange={(e) => updateSlide(editingId, 'is_active', e.target.checked)}
                              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-gray-700">{t('admin.heroSlides.fields.active')}</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => {
                            setEditingId(null);
                            loadSlides();
                          }}
                          className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() => handleUpdate(editingId)}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <Save size={18} />
                          {t('common.save')}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setDeleteConfirm(null)}
            role="button"
            tabIndex={-1}
            aria-label={t('common.close')}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-secondary-200 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">{t('admin.heroSlides.deleteTitle')}</h2>
                <p className="text-gray-600 mb-1">
                  {t('admin.heroSlides.deleteConfirmPrefix')}{' '}
                  <span className="font-semibold">"{deleteConfirm.title}"</span>?
                </p>
                <p className="text-sm text-gray-500">
                  {t('admin.heroSlides.deleteWarning')}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
