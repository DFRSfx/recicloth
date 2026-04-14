import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Share2, ChevronDown, ChevronUp, ChevronLeft, Star, Check, Search, ThumbsUp, ThumbsDown, Info, CheckCircle2, X, Upload } from 'lucide-react';
import SEO from '../components/SEO';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { getProductSchema, getBreadcrumbSchema } from '../utils/schemas';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import Toast, { ToastType } from '../components/Toast';
import { fireCartToast } from '../utils/cartToast';
import { useLanguage } from '../context/LanguageContext';
import { getProductPath, getRoutePath, getShopPath } from '../utils/routes';

const toColorSlug = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const fixHtmlArtifacts = (html: string): string =>
  html
    .replace(/&\s+([a-z]+);/gi, '&$1;')      // "& amp;" → "&amp;"
    .replace(/<\s*\/\s*(\w+)\s*>/g, '</$1>') // "< / p>" → "</p>"
    .replace(/<\s+(\w)/g, '<$1');            // "< p" → "<p"

interface Review {
  id: number;
  rating: number;
  headline: string;
  content: string;
  reviewer_name: string;
  size?: string | null;
  color?: string | null;
  fit?: string | null;
  height?: string | null;
  likelihood?: string | null;
  activities?: string | null;
  created_at: string;
  status?: 'approved' | 'pending' | 'rejected';
}

interface EligibleReviewItem {
  order_item_id: number;
  order_id: number;
  created_at: string;
  size?: string | null;
  color?: string | null;
}

const Product: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem, items } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const { isAuthenticated, token, user } = useAuth();
  const { product, loading, error } = useProduct(id || '');
  const { products: allProducts } = useProducts();
  const { t, lang } = useLanguage();
  const shopPath = getRoutePath('shop', lang);
  const API_BASE_URL = '/api';

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  
  const isSwipingRef = useRef(false);
  const isThumbnailSelectionRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null); 
  const reviewsRef = useRef<HTMLDivElement>(null); 

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [eligibleItems, setEligibleItems] = useState<EligibleReviewItem[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    headline: '',
    content: '',
    name: user?.name || '',
    email: user?.email || '',
    likelihood: '',
    fit: '',
    height: '',
    activities: [] as string[],
    orderItemId: '',
  });

  const [expandedSections, setExpandedSections] = useState({
    description: true,
    shipping: false
  });

  useEffect(() => {
    if (!product) return;
    if (product.colors.length > 0) {
      setSelectedColor(product.colors[0].name);
    } else {
      setSelectedColor('');
    }
    setSelectedSize('');
    setSelectedImageIndex(null);
  }, [product]);

  const { mainImage, otherImages } = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) {
      return { mainImage: null, otherImages: [] };
    }

    let mainIdx = 0;
    if (selectedImageIndex !== null && selectedImageIndex >= 0 && selectedImageIndex < product.images.length) {
      mainIdx = selectedImageIndex;
    } else if (selectedColor) {
      const colorObj = product.colors?.find(c => c.name === selectedColor);
      const slugSource = colorObj?.original_name || selectedColor;
      const slug = toColorSlug(slugSource);
      const slugIdx = product.images.findIndex(img => img.toLowerCase().includes(slug));
      if (slugIdx >= 0) {
        mainIdx = slugIdx;
      } else if (product.colors) {
        const colorIndex = product.colors.findIndex(c => c.name === selectedColor);
        if (colorIndex >= 0 && colorIndex < product.images.length) {
          mainIdx = colorIndex;
        }
      }
    }

    const main = product.images[mainIdx];
    const others = product.images.filter((_, idx) => idx !== mainIdx);

    return {
      mainImage: main,
      otherImages: others
    };
  }, [selectedColor, product, selectedImageIndex]);

  useEffect(() => {
    if (isThumbnailSelectionRef.current) {
      isThumbnailSelectionRef.current = false;
      return;
    }
    setSelectedImageIndex(null);
  }, [selectedColor, product?.id]);

  const getColorForImage = useCallback((image: string) => {
    if (!product?.colors || product.colors.length === 0) return null;
    const lower = image.toLowerCase();
    const match = product.colors.find((color) => {
      const slugSource = color.original_name || color.name;
      const slug = toColorSlug(slugSource);
      return slug ? lower.includes(slug) : false;
    });
    return match?.name || null;
  }, [product?.colors]);

  const mobileImages = product?.images || [];

  // CORREÇÃO CRÍTICA DO SLIDER MOBILE (Agora procura pelo Slug para garantir correspondência)
  useEffect(() => {
    if (isSwipingRef.current) {
      isSwipingRef.current = false;
      return;
    }

    if (product && product.images && product.colors) {
      let targetIdx = -1;
      const colorObj = product.colors.find(c => c.name === selectedColor);
      
      // 1. Tentar encontrar a imagem pelo nome original da cor (slug no URL da imagem)
      if (colorObj) {
        const slugSource = colorObj.original_name || colorObj.name;
        const slug = toColorSlug(slugSource);
        targetIdx = product.images.findIndex(img => img.toLowerCase().includes(slug));
      }

      // 2. Fallback caso a imagem não tenha a cor no nome: usa o índice 1:1
      if (targetIdx === -1) {
        targetIdx = product.colors.findIndex(c => c.name === selectedColor);
      }

      // 3. Executa o Scroll
      if (targetIdx >= 0 && targetIdx < mobileImages.length && targetIdx !== mobileImageIndex) {
        const slider = document.getElementById('mobile-image-slider');
        if (slider) {
          isProgrammaticScrollRef.current = true;
          
          slider.scrollTo({ left: targetIdx * slider.clientWidth, behavior: 'smooth' });
          setMobileImageIndex(targetIdx);
          
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          
          scrollTimeoutRef.current = setTimeout(() => { 
            isProgrammaticScrollRef.current = false; 
          }, 500);
        }
      }
    }
  }, [selectedColor, product, mobileImages.length, mobileImageIndex]);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScrollRef.current) return;
    
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width === 0) return;
    
    const newIndex = Math.round(scrollLeft / width);
    
    if (newIndex !== mobileImageIndex) {
      setMobileImageIndex(newIndex);
      const image = mobileImages[newIndex];
      const matchedColor = image ? getColorForImage(image) : null;
      const fallbackColor = product?.colors?.[newIndex]?.name || null;
      const newColor = matchedColor || fallbackColor;
      
      if (newColor && newColor !== selectedColor) {
        isSwipingRef.current = true;
        setSelectedColor(newColor);
      }
    }
  };

  const scrollToReviews = () => {
    if (reviewsRef.current) {
      const yOffset = -100;
      const y = reviewsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(part => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'U';

  const formatReviewDate = (value: string) =>
    new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const parseActivities = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };

  useEffect(() => {
    setReviewForm(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
    }));
  }, [user?.name, user?.email]);

  const loadReviews = useCallback(async () => {
    if (!product?.id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE_URL}/products/${product.id}/reviews`, { headers });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('product.review.loadError'));
      }
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setReviewsError(err.message || t('product.review.loadError'));
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [API_BASE_URL, product?.id, token]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const loadEligibleItems = useCallback(async () => {
    if (!product?.id || !isAuthenticated || !token) {
      setEligibleItems([]);
      return;
    }
    setEligibleLoading(true);
    setReviewSubmitError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}/reviews/eligible`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('product.review.error.loadEligible'));
      }
      const data = await response.json();
      setEligibleItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setEligibleItems([]);
      setReviewSubmitError(err.message || t('product.review.error.loadEligible'));
    } finally {
      setEligibleLoading(false);
    }
  }, [API_BASE_URL, isAuthenticated, product?.id, token]);

  useEffect(() => {
    if (isReviewModalOpen) {
      loadEligibleItems();
    }
  }, [isReviewModalOpen, loadEligibleItems]);

  useEffect(() => {
    if (!reviewForm.orderItemId && eligibleItems.length > 0) {
      setReviewForm(prev => ({ ...prev, orderItemId: String(eligibleItems[0].order_item_id) }));
    }
  }, [eligibleItems, reviewForm.orderItemId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitError(null);
    setReviewSuccess(null);

    if (!isAuthenticated || !token) {
      setReviewSubmitError(t('product.review.error.loginRequired'));
      return;
    }
    if (!reviewForm.orderItemId) {
      setReviewSubmitError(t('product.review.error.selectOrder'));
      return;
    }
    if (!reviewForm.rating || reviewForm.rating < 1) {
      setReviewSubmitError(t('product.review.error.selectRating'));
      return;
    }
    if (!reviewForm.headline.trim()) {
      setReviewSubmitError(t('product.review.error.addHeadline'));
      return;
    }
    if (!reviewForm.content.trim()) {
      setReviewSubmitError(t('product.review.error.writeContent'));
      return;
    }

    setReviewSubmitLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${product?.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_item_id: Number(reviewForm.orderItemId),
          rating: reviewForm.rating,
          headline: reviewForm.headline,
          content: reviewForm.content,
          fit: reviewForm.fit,
          height: reviewForm.height,
          likelihood: reviewForm.likelihood,
          activities: reviewForm.activities,
          reviewer_name: reviewForm.name,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t('product.review.error.submit'));
      }
      setIsReviewModalOpen(false);
      setReviewSuccess(t('product.review.success'));
      setReviewForm(prev => ({
        ...prev,
        rating: 0,
        headline: '',
        content: '',
        likelihood: '',
        fit: '',
        height: '',
        activities: [],
        orderItemId: '',
      }));
    } catch (err: any) {
      setReviewSubmitError(err.message || t('product.review.error.submit'));
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const approvedReviews = useMemo(
    () => reviews.filter(review => review.status === 'approved' || !review.status),
    [reviews]
  );

  const reviewStats = useMemo(() => {
    if (approvedReviews.length === 0) {
      return { average: 0, count: 0, topFit: null as string | null, topActivities: [] as string[] };
    }

    const total = approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const average = Math.round((total / approvedReviews.length) * 10) / 10;
    const fitCounts: Record<string, number> = {};
    const activityCounts: Record<string, number> = {};

    approvedReviews.forEach((review) => {
      if (review.fit) {
        fitCounts[review.fit] = (fitCounts[review.fit] || 0) + 1;
      }
      if (review.activities) {
        review.activities.split(',').map((item) => item.trim()).filter(Boolean).forEach((activity) => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      }
    });

    const topFit = Object.entries(fitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([activity]) => activity);

    return { average, count: approvedReviews.length, topFit, topActivities };
  }, [approvedReviews]);

  // ── Review filters / search / sort / pagination ───────────────────────────
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 3;

  type FilterKey = 'rating' | 'likelihood' | 'size' | 'height' | 'activity' | 'fit';
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string>>({
    rating: '', likelihood: '', size: '', height: '', activity: '', fit: '',
  });
  const [openDropdown, setOpenDropdown] = useState<FilterKey | null>(null);

  const filterOptions = useMemo<Record<FilterKey, string[]>>(() => {
    const unique = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.filter(Boolean) as string[])].sort();
    const activities = approvedReviews.flatMap(r =>
      r.activities ? r.activities.split(',').map(a => a.trim()).filter(Boolean) : []
    );
    return {
      rating: ['5', '4', '3', '2', '1'],
      likelihood: unique(approvedReviews.map(r => r.likelihood)),
      size: unique(approvedReviews.map(r => r.size)),
      height: unique(approvedReviews.map(r => r.height)),
      activity: [...new Set(activities)].sort(),
      fit: unique(approvedReviews.map(r => r.fit)),
    };
  }, [approvedReviews]);

  const filteredReviews = useMemo(() => {
    let list = [...approvedReviews];

    if (activeFilters.rating)
      list = list.filter(r => r.rating === Number(activeFilters.rating));
    if (activeFilters.likelihood)
      list = list.filter(r => r.likelihood === activeFilters.likelihood);
    if (activeFilters.size)
      list = list.filter(r => r.size === activeFilters.size);
    if (activeFilters.height)
      list = list.filter(r => r.height === activeFilters.height);
    if (activeFilters.activity)
      list = list.filter(r => r.activities?.split(',').map(a => a.trim()).includes(activeFilters.activity));
    if (activeFilters.fit)
      list = list.filter(r => r.fit === activeFilters.fit);
    if (reviewSearch.trim())
      list = list.filter(r =>
        r.headline.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.content.toLowerCase().includes(reviewSearch.toLowerCase())
      );

    list.sort((a, b) => {
      if (reviewSort === 'highest') return b.rating - a.rating;
      if (reviewSort === 'lowest') return a.rating - b.rating;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [approvedReviews, activeFilters, reviewSearch, reviewSort]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice(
    (reviewPage - 1) * REVIEWS_PER_PAGE,
    reviewPage * REVIEWS_PER_PAGE
  );

  const setFilter = (key: FilterKey, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));
    setOpenDropdown(null);
    setReviewPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({ rating: '', likelihood: '', size: '', height: '', activity: '', fit: '' });
    setReviewSearch('');
    setReviewPage(1);
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean) || reviewSearch.trim();

  const selectedEligibleItem = useMemo(
    () => eligibleItems.find(item => String(item.order_item_id) === reviewForm.orderItemId) || null,
    [eligibleItems, reviewForm.orderItemId]
  );
  const canWriteReview = isAuthenticated && !eligibleLoading && eligibleItems.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || t('product.notFound')}</h2>
          <Link to={shopPath} className="inline-flex items-center px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors">
            {t('product.backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  const relatedProducts = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
  const isFavorite = favorites.some(fav => fav.product_id === String(product.id));
  const hasSizes = (product.stock_mode === 'apparel' || product.stock_mode === 'shoes') && (product.size_stock?.length ?? 0) > 0;
  const sizeRequired = hasSizes && !selectedSize;

  // Cart quantity already held for this product+size
  const cartQtyForSize = (size: string) =>
    items.find(i => String(i.product.id) === String(product.id) && i.selectedSize === size)?.quantity ?? 0;

  const stockForSize = (size: string) =>
    product.size_stock?.find(s => s.size === size)?.stock ?? 0;

  const selectedSizeMaxed =
    hasSizes && !!selectedSize && cartQtyForSize(selectedSize) >= stockForSize(selectedSize);

  const handleAddToCart = () => {
    if (!product.inStock || isAdded || sizeRequired || selectedSizeMaxed) return;
    addItem(product, selectedColor, selectedSize || undefined);
    const previewImage = mainImage || product.images[0];
    fireCartToast({ productId: product.id, colorName: selectedColor, productName: product.name, image: imgVariant(previewImage, 'sm'), type: 'added' });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleToggleFavorite = async () => {
    if (isFavorite) await removeFromFavorites(String(product.id));
    else await addToFavorites(String(product.id));
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description, url: shareUrl });
      } catch (error: any) {
        if (error.name !== 'AbortError') setToast({ message: t('product.shareError'), type: 'error' });
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ message: t('product.linkCopied'), type: 'success' });
      } catch {
        setToast({ message: t('product.linkCopyError'), type: 'error' });
      }
    }
  };

  const toggleAccordion = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getColorCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Bege': '#F5F5DC', 'Castanho': '#8B4513', 'Branco': '#FFFFFF', 'Cru': '#F5E6D3',
      'Verde': '#22C55E', 'Azul': '#3B82F6', 'Vermelho': '#EF4444', 'Rosa': '#EC4899',
      'Amarelo': '#F59E0B', 'Preto': '#000000', 'Cinzento': '#6B7280', 'Bordô': '#7F1D1D',
      'Verde floresta': '#2E8B57', 'Caqui': '#F0E68C', 'Multicolor': '#E5E7EB',
      'Cinza': '#9CA3AF', 'Terracota': '#E2725B', 'Castanho Escuro': '#5C4033'
    };
    return colorMap[colorName] || '#E5E7EB';
  };

  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [
      getProductSchema(product, lang),
      getBreadcrumbSchema([
        { name: t('nav.home'), url: getRoutePath('home', lang) },
        { name: t('nav.shop'), url: shopPath },
        { name: product.category, url: getShopPath(lang, product.category_slug) },
        { name: product.name, url: getProductPath(lang, product.id) }
      ])
    ],
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <SEO title={`${product.name} | Loja`} description={product.description.slice(0, 120)} canonical={getProductPath(lang, product.id)} ogType="product" ogImage={product.images[0]} schema={schemas} />

      {/* Breadcrumbs */}
      <div className="hidden lg:block max-w-[1440px] mx-auto px-8 py-6 text-sm font-medium text-gray-500">
        <Link to={shopPath} className="hover:text-black hover:underline">{t('nav.shop')}</Link>
        <span className="mx-2">/</span>
        <Link to={getShopPath(lang, product.category_slug)} className="hover:text-black hover:underline">{product.category}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start gap-0 lg:gap-12 relative px-0 lg:px-8">

        {/* LEFT COLUMN: Images */}
        <div className="w-full lg:w-7/12 xl:w-2/3">

          <div className="relative block lg:hidden">
            <div
              id="mobile-image-slider"
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar" 
              onScroll={handleMobileScroll}
            >
              {mobileImages.map((image, index) => (
                <div key={`${image}-${index}`} className="w-full flex-shrink-0 snap-center relative aspect-[4/5] bg-[#f2f2f2]">
                  <img src={getAbsoluteImageUrl(imgVariant(image, 'md'))} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
              ))}
            </div>

            {mobileImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
                {mobileImageIndex + 1}/{mobileImages.length}
              </div>
            )}
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-2">
            {mainImage && (
              <div className="col-span-2 w-full bg-[#f2f2f2] relative">
                <img
                  src={getAbsoluteImageUrl(imgVariant(mainImage, 'lg'))}
                  alt={`${product.name} - Cor principal`}
                  className="w-full h-auto object-cover mix-blend-multiply"
                />
              </div>
            )}
            {otherImages.map((image, index) => (
              <div
                key={`other-${index}`}
                onClick={() => {
                  const origIdx = product.images.indexOf(image);
                  if (origIdx >= 0) {
                    isThumbnailSelectionRef.current = true;
                    setSelectedImageIndex(origIdx);
                    const matchedColor = getColorForImage(image);
                    const fallbackColor = product.colors?.[origIdx]?.name || null;
                    const newColor = matchedColor || fallbackColor;
                    if (newColor) {
                      setSelectedColor(newColor);
                    }
                  }
                }}
                className="col-span-1 w-full bg-[#f2f2f2] relative aspect-[4/5] hover:opacity-90 transition-opacity duration-300 cursor-pointer"
              >
                <img
                  src={getAbsoluteImageUrl(imgVariant(image, 'md'))}
                  alt={`${product.name} detalhe ${index + 2}`}
                  className="w-full h-full object-cover mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Details */}
        <div className="w-full lg:w-5/12 xl:w-1/3 px-4 py-6 lg:px-0 lg:py-0 lg:sticky lg:top-24">

          <div className="block lg:hidden mb-6">
            <Link to={getShopPath(lang, product.category_slug)} className="flex items-center text-sm font-bold text-gray-900 mb-4">
              <ChevronLeft size={16} className="mr-1" strokeWidth={2.5} /> {t('product.backToShop')}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-2 text-sm cursor-pointer" onClick={scrollToReviews}>
              <div className="flex items-center text-black gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(reviewStats.average) ? 'fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({reviewStats.count})</span>
              </div>
              <span className="text-primary-600 hover:underline">{t('product.reviews')}</span>
            </div>
            <p className="text-[22px] font-bold">€ {product.price.toFixed(2)}</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4 text-sm cursor-pointer group" onClick={scrollToReviews}>
              <div className="flex items-center text-black gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(reviewStats.average) ? 'fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({reviewStats.count})</span>
              </div>
              <span className="text-primary-600 group-hover:underline">{t('product.reviews')}</span>
            </div>
            <p className="text-2xl font-medium">€ {product.price.toFixed(2)}</p>
          </div>

          {product.colors.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="font-medium text-sm text-gray-900">{t('common.color')}</span>
                <span className="text-sm font-bold text-gray-900">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      selectedColor === color.name ? 'ring-2 ring-black ring-offset-2' : 'ring-1 ring-gray-300 hover:ring-gray-400'
                    }`}
                    aria-label={`${t('product.selectColor')} ${color.name}`}
                  >
                    <span className="w-7 h-7 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: color.hex || getColorCode(color.name) }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSizes && (
            <div className="mb-8">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="font-medium text-sm text-gray-900">{t('product.selectSize')}</span>
                {selectedSize && <span className="text-sm font-bold text-gray-900">{selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.size_stock!.map(({ size, stock }) => {
                  const outOfStock = Number(stock) <= 0;
                  const maxedInCart = cartQtyForSize(size) >= Number(stock);
                  const unavailable = outOfStock || maxedInCart;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] px-3 py-2 text-sm font-medium border transition-all rounded-sm ${
                        unavailable
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                          : selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 text-gray-900 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-10">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdded || sizeRequired || selectedSizeMaxed}
              className={`flex-1 h-14 font-bold text-[15px] transition-all rounded-sm flex items-center justify-center gap-2 ${
                !product.inStock || sizeRequired || selectedSizeMaxed
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : isAdded
                  ? 'bg-[#1E4D3B] text-white border border-[#1E4D3B]'
                  : 'bg-black text-white hover:bg-gray-900 shadow-[0_4px_14px_rgba(0,0,0,0.15)]'
              }`}
            >
              {!product.inStock
                ? t('product.soldOut')
                : isAdded
                ? <><Check size={18} strokeWidth={3} /> {t('product.added')}</>
                : sizeRequired
                ? t('product.selectSizeFirst')
                : selectedSizeMaxed
                ? t('product.maxStockReached')
                : t('product.addToCart')}
            </button>

            <button
              onClick={handleToggleFavorite}
              className="h-14 w-14 flex items-center justify-center border border-gray-300 hover:border-black rounded-sm transition-colors"
              aria-label={t('product.wishlist')}
            >
              <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-black text-black' : 'text-gray-900'}`} strokeWidth={2} />
            </button>
          </div>

          <div className="border-t border-gray-300">
            <div className="border-b border-gray-300">
              <button onClick={() => toggleAccordion('description')} className="flex justify-between items-center w-full py-5 text-left font-bold text-[15px] text-gray-900">
                {t('product.description')}
                {expandedSections.description ? <ChevronUp size={20} strokeWidth={1.5} /> : <ChevronDown size={20} strokeWidth={1.5} />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${expandedSections.description ? 'max-h-[2000px] pb-6' : 'max-h-0'}`}>
                <div className="product-description" dangerouslySetInnerHTML={{ __html: fixHtmlArtifacts(product.description) }} />

                <div className="flex flex-wrap gap-2 mt-4">
                  {product.featured && <span className="border border-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1 uppercase tracking-wider">{t('product.tag.featured')}</span>}
                  {product.new && <span className="border border-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1 uppercase tracking-wider">{t('product.tag.new')}</span>}
                  {product.category && <span className="border border-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1 uppercase tracking-wider">{product.category}</span>}
                </div>
              </div>
            </div>

            <div className="border-b border-gray-300">
              <button onClick={() => toggleAccordion('shipping')} className="flex justify-between items-center w-full py-5 text-left font-bold text-[15px] text-gray-900">
                {t('product.shipping.title')}
                {expandedSections.shipping ? <ChevronUp size={20} strokeWidth={1.5} /> : <ChevronDown size={20} strokeWidth={1.5} />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${expandedSections.shipping ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                <p className="text-gray-700 text-sm leading-relaxed">{t('product.shipping.desc')}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button onClick={handleShare} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
              <Share2 size={16} /> {t('product.share')}
            </button>
          </div>

        </div>
      </div>

      {/* --- NOVA SECÇÃO DE AVALIAÇÕES (REVIEWS) --- */}
      <div ref={reviewsRef} className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-24 pt-16 border-t border-gray-200">
        
        {/* Rating Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-black">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={24}
                    className={i < Math.round(reviewStats.average) ? 'fill-current' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-3xl font-bold">{reviewStats.average.toFixed(1)}/5</span>
            </div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              {t('product.review.basedOn')} {reviewStats.count} {reviewStats.count === 1 ? t('product.review.reviewSingular') : t('product.review.reviewPlural')} <Info size={14} className="text-gray-400" />
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">{t('product.review.fit')}</h3>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
              {reviewStats.topFit || t('product.review.noData')} <Info size={14} className="text-gray-400" />
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">{t('product.review.activities')}</h3>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {reviewStats.topActivities.length > 0 ? reviewStats.topActivities.join(', ') : t('product.review.noData')}
            </p>
            <p className="text-sm text-gray-500">{t('product.review.popularAmong')}</p>
          </div>
        </div>

        {/* Action Buttons & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAskModalOpen(true)}
                className="px-6 py-2.5 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors text-sm"
              >
                {t('product.review.askQuestion')}
              </button>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-6 py-2.5 bg-white text-black border-2 border-black font-bold rounded-full hover:bg-gray-50 transition-colors text-sm"
              >
                {t('product.review.writeReview')}
              </button>
            </div>

            <div className="relative max-w-xs mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('product.review.searchPlaceholder')}
                value={reviewSearch}
                onChange={e => { setReviewSearch(e.target.value); setReviewPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('product.review.sortBy')}</span>
            <select
              value={reviewSort}
              onChange={e => { setReviewSort(e.target.value as typeof reviewSort); setReviewPage(1); }}
              className="border-none bg-transparent font-medium text-sm focus:ring-0 cursor-pointer pr-6"
            >
              <option value="newest">{t('product.review.sortNewest')}</option>
              <option value="highest">{t('product.review.sortHighest')}</option>
              <option value="lowest">{t('product.review.sortLowest')}</option>
            </select>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-4 mb-4" onClick={() => setOpenDropdown(null)}>
          {(
            [
              { key: 'rating' as FilterKey, label: t('product.review.filterRating') },
              { key: 'likelihood' as FilterKey, label: t('product.review.filterLikelihood') },
              { key: 'size' as FilterKey, label: t('product.review.filterSize') },
              { key: 'height' as FilterKey, label: t('product.review.filterHeight') },
              { key: 'activity' as FilterKey, label: t('product.review.filterActivity') },
              { key: 'fit' as FilterKey, label: t('product.review.filterFit') },
            ] as { key: FilterKey; label: string }[]
          ).map(({ key, label }) => {
            const opts = filterOptions[key];
            if (opts.length === 0) return null;
            const selected = activeFilters[key];
            const isOpen = openDropdown === key;
            return (
              <div key={key} className="relative">
                <div
                  className={`flex items-center justify-between gap-2 min-w-[120px] pb-1 border-b-2 cursor-pointer group ${selected ? 'border-black' : 'border-black'}`}
                  onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : key); }}
                >
                  <span className={`text-sm font-medium group-hover:text-black ${selected ? 'text-black' : 'text-gray-700'}`}>
                    {selected ? (key === 'rating' ? `${selected} ★` : selected) : label}
                  </span>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md z-20 min-w-[160px] py-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!selected ? 'font-bold' : ''}`}
                      onClick={() => setFilter(key, '')}
                    >
                      {t('product.review.filterAll')}
                    </button>
                    {opts.map(opt => (
                      <button
                        key={opt}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${selected === opt ? 'font-bold' : ''}`}
                        onClick={() => setFilter(key, opt)}
                      >
                        <span>{key === 'rating' ? `${'★'.repeat(Number(opt))} ${opt}` : opt}</span>
                        {selected === opt && <span className="text-xs text-gray-400">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-black underline underline-offset-2 self-end pb-1"
            >
              {t('product.review.clearAll')}
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(Object.entries(activeFilters) as [FilterKey, string][]).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-sm rounded-full">
                {v}
                <button onClick={() => setFilter(k, v)} className="text-gray-400 hover:text-black leading-none">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-10">
          {reviewsLoading && (
            <p className="text-sm text-gray-500">{t('product.review.loading')}</p>
          )}
          {!reviewsLoading && reviewsError && (
            <p className="text-sm text-red-600">{reviewsError}</p>
          )}
          {!reviewsLoading && !reviewsError && approvedReviews.length === 0 && (
            <p className="text-sm text-gray-500">{t('product.review.empty')}</p>
          )}
          {!reviewsLoading && !reviewsError && approvedReviews.length > 0 && filteredReviews.length === 0 && (
            <p className="text-sm text-gray-500">{t('product.review.noMatch')}</p>
          )}
          {paginatedReviews.map((review) => (
            <div key={review.id} className="flex flex-col md:flex-row gap-6">
              {/* Left Column: User Info & Meta */}
              <div className="w-full md:w-1/3 xl:w-1/4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-lg">
                    {getInitials(review.reviewer_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 leading-none">{review.reviewer_name}</p>
                      {review.status === 'pending' && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">
                          {t('product.review.pending')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={12} className="fill-current text-white bg-green-600 rounded-full" /> {t('product.review.verified')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {review.height && (
                    <div className="flex gap-4">
                      <span className="font-bold text-gray-900 min-w-[100px]">{t('product.review.height')}</span>
                      <span className="text-gray-700">{review.height}</span>
                    </div>
                  )}
                  {review.likelihood && (
                    <div className="flex gap-4">
                      <span className="font-bold text-gray-900 min-w-[100px]">{t('product.review.likelihood')}</span>
                      <span className="text-gray-700">{review.likelihood}</span>
                    </div>
                  )}
                  {review.size && (
                    <div className="flex gap-4">
                      <span className="font-bold text-gray-900 min-w-[100px]">{t('product.review.size')}</span>
                      <span className="text-gray-700">{review.size}</span>
                    </div>
                  )}
                  {review.activities && (
                    <div className="flex gap-4">
                      <span className="font-bold text-gray-900 min-w-[100px]">{t('product.review.activity')}</span>
                      <span className="text-gray-700 leading-relaxed">{parseActivities(review.activities)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Review Content */}
              <div className="w-full md:w-2/3 xl:w-3/4">
                <div className="flex text-black mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < review.rating ? 'fill-current' : 'text-gray-300'} />
                  ))}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{review.headline}</h4>
                <p className="text-[15px] text-gray-800 leading-relaxed mb-6">
                  {review.content}
                </p>
                <p className="text-sm text-gray-500 mb-6">{formatReviewDate(review.created_at)}</p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="w-64">
                    <p className="text-sm font-bold text-gray-900 mb-2">{t('product.review.fit')}</p>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full relative">
                      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
                      <div className="absolute left-0 w-1/2 h-full bg-black rounded-l-full" />
                    </div>
                    <p className="text-xs font-bold text-center mt-2">{review.fit || '—'}</p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{t('product.review.helpful')}</span>
                    <button className="flex items-center gap-1 hover:text-black"><ThumbsUp size={16} /> 0</button>
                    <button className="flex items-center gap-1 hover:text-black"><ThumbsDown size={16} /> 0</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setReviewPage(p => Math.max(1, p - 1))}
              disabled={reviewPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setReviewPage(p)}
                className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                  p === reviewPage ? 'bg-black text-white border-black' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setReviewPage(p => Math.min(totalPages, p + 1))}
              disabled={reviewPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        )}

        {filteredReviews.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-3">
            {(reviewPage - 1) * REVIEWS_PER_PAGE + 1}–{Math.min(reviewPage * REVIEWS_PER_PAGE, filteredReviews.length)} {t('product.review.of')} {filteredReviews.length} {t('product.review.countSuffix')}
          </p>
        )}
      </div>

      {/* --- "Ask a Question" Modal --- */}
      {isAskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAskModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-md shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAskModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <X size={24} strokeWidth={1.5} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">{t('product.ask.title')} {product.name}</h2>
            <p className="text-sm text-gray-600 mb-6">{t('product.ask.required')}</p>
            
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setIsAskModalOpen(false); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <input type="text" id="ask_name" required className="block w-full border-0 border-b-2 border-black px-0 py-2 focus:ring-0 focus:border-black peer text-sm" placeholder=" " />
                  <label htmlFor="ask_name" className="absolute top-2 left-0 text-sm font-medium text-gray-900 transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-valid:-top-4 peer-valid:text-xs">{t('product.ask.yourName')}</label>
                </div>
                <div className="relative flex items-center">
                  <input type="email" id="ask_email" required className="block w-full border-0 border-b-2 border-black px-0 py-2 focus:ring-0 focus:border-black peer text-sm" placeholder=" " />
                  <label htmlFor="ask_email" className="absolute top-2 left-0 text-sm font-medium text-gray-900 transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-valid:-top-4 peer-valid:text-xs flex items-center gap-1">{t('product.ask.yourEmail')} <Info size={14} className="text-blue-500" /></label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">{t('product.ask.question')}</label>
                <textarea required rows={5} className="w-full border border-gray-400 rounded p-3 focus:ring-1 focus:ring-black focus:border-black text-sm"></textarea>
              </div>
              
              <p className="text-[15px] text-gray-800">
                {t('product.ask.terms')} <span className="font-bold underline cursor-pointer">{t('product.ask.termsLink')}</span>{t('product.ask.termsMid')} <span className="font-bold underline cursor-pointer">{t('product.ask.privacyLink')}</span>.
              </p>

              <button type="submit" className="px-12 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors w-full sm:w-auto">
                {t('product.ask.send')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- "Write a Review" Modal --- */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsReviewModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-md shadow-2xl p-8 max-h-[90vh] overflow-y-auto hide-scrollbar">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <X size={24} strokeWidth={1.5} />
            </button>
            
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm mb-6">
                {t('product.review.loginRequired')}
              </div>
            )}
            {isAuthenticated && eligibleLoading && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md text-sm mb-6">
                {t('product.review.loadingEligible')}
              </div>
            )}
            {isAuthenticated && !eligibleLoading && eligibleItems.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm mb-6">
                {t('product.review.noPurchase')}
              </div>
            )}
            
            {canWriteReview && (
              <>
                <p className="text-sm font-bold text-gray-900 mb-8">{t('product.review.required')}</p>

                {reviewSubmitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
                    {reviewSubmitError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6">
                    {reviewSuccess}
                  </div>
                )}
                <form className="space-y-8" onSubmit={handleReviewSubmit}>
                  <div>
                    <label className="block text-[15px] font-bold text-gray-900 mb-2">{t('product.review.order')}</label>
                    <select
                      value={reviewForm.orderItemId}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, orderItemId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      {eligibleItems.map(item => (
                        <option key={item.order_item_id} value={item.order_item_id}>
                          #{item.order_id} · {new Date(item.created_at).toLocaleDateString('pt-PT')} · {item.color || '—'} {item.size ? `(${item.size})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                    
                  <div>
                    <label className="block text-[15px] font-bold text-gray-900 mb-2">{t('product.review.rateExperience')}</label>
                    <div className="flex gap-1 text-gray-300 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: value }))}
                          className={value <= reviewForm.rating ? 'text-black' : 'text-gray-300'}
                          aria-label={`Rate ${value}`}
                        >
                          <Star size={30} className="fill-current" strokeWidth={1} />
                        </button>
                      ))}
                    </div>
                  </div>
 
                  <div className="relative pt-4">
                    <input
                      type="text"
                      id="rev_headline"
                      required
                      value={reviewForm.headline}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, headline: e.target.value }))}
                      className="block w-full border-0 border-b-2 border-black px-0 py-2 focus:ring-0 focus:border-black peer text-[15px]"
                      placeholder=" "
                    />
                    <label htmlFor="rev_headline" className="absolute top-6 left-0 text-[15px] font-medium text-gray-900 transition-all duration-200 peer-focus:top-0 peer-focus:text-xs peer-valid:top-0 peer-valid:text-xs">{t('product.review.addHeadline')}</label>
                  </div>
 
                  <div>
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">{t('product.review.writeContent')}</label>
                    <textarea
                      required
                      rows={6}
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full border border-gray-400 rounded-lg p-3 focus:ring-1 focus:ring-black focus:border-black text-[15px]"
                    ></textarea>
                  </div>
 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="relative">
                      <input
                        type="text"
                        id="rev_name"
                        required
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                        className="block w-full border-0 border-b-2 border-black px-0 py-2 focus:ring-0 focus:border-black peer text-sm"
                        placeholder=" "
                      />
                      <label htmlFor="rev_name" className="absolute top-2 left-0 text-sm font-medium text-gray-900 transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-valid:-top-4 peer-valid:text-xs">{t('product.review.yourName')}</label>
                    </div>
                    <div className="relative flex flex-col">
                      <div className="relative">
                        <input
                          type="email"
                          id="rev_email"
                          required
                          value={reviewForm.email}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, email: e.target.value }))}
                          className="block w-full border-0 border-b-2 border-black px-0 py-2 focus:ring-0 focus:border-black peer text-sm"
                          placeholder=" "
                        />
                        <label htmlFor="rev_email" className="absolute top-2 left-0 text-sm font-medium text-gray-900 transition-all duration-200 peer-focus:-top-4 peer-focus:text-xs peer-valid:-top-4 peer-valid:text-xs flex items-center gap-1">{t('product.review.yourEmail')}</label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{t('product.review.emailVerify')}</p>
                    </div>
                  </div>
 
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 mb-3">{t('product.review.addMedia')}</h3>
                    <div className="flex items-center gap-2 cursor-pointer text-gray-900 font-bold text-[15px]">
                      <Upload size={18} /> {t('product.review.upload')}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('product.review.uploadDesc')}</p>
                  </div>
 
                  {/* Custom Questions */}
                  <div className="space-y-6 pt-4">
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 mb-2">{t('product.review.recommendQuestion')} <span className="font-normal text-gray-500">{t('product.review.chooseOne')}</span></p>
                      <div className="flex gap-2">
                        {['Yes', 'No'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, likelihood: opt }))}
                            className={`px-5 py-2 font-medium text-sm rounded transition-colors ${
                              reviewForm.likelihood === opt ? 'bg-black text-white' : 'bg-[#d7d7d7] text-black hover:bg-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
 
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 mb-2">{t('product.review.fitQuestion')} <span className="font-normal text-gray-500">{t('product.review.chooseOne')}</span></p>
                      <div className="flex flex-wrap gap-2">
                        {['Runs Small', 'Kinda Small', 'True to Size', 'Kinda Large', 'Runs Large'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, fit: opt }))}
                            className={`px-4 py-2 font-medium text-sm rounded transition-colors ${
                              reviewForm.fit === opt ? 'bg-black text-white' : 'bg-[#d7d7d7] text-black hover:bg-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
 
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 mb-2">{t('product.review.sizeQuestion')} <span className="font-normal text-gray-500">{t('product.review.chooseOne')}</span></p>
                      {selectedEligibleItem ? (
                        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                          <span className="px-3 py-1 rounded-full bg-gray-100">
                            {t('product.review.sizeLabel')} {selectedEligibleItem.size || '—'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-gray-100">
                            {t('product.review.colorLabel')} {selectedEligibleItem.color || '—'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{t('product.review.selectOrderAbove')}</p>
                      )}
                    </div>
 
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 mb-2">{t('product.review.heightQuestion')} <span className="font-normal text-gray-500">{t('product.review.chooseOne')}</span></p>
                      <div className="flex flex-wrap gap-2">
                        {['145 cm or less', '145 - 150 cm', '151 - 155 cm', '156 - 160 cm', '161 - 165 cm', '166 - 170 cm', '171 - 175 cm'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, height: opt }))}
                            className={`px-4 py-2 font-medium text-sm rounded transition-colors ${
                              reviewForm.height === opt ? 'bg-black text-white' : 'bg-[#d7d7d7] text-black hover:bg-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
 
                    <div>
                      <p className="text-[15px] font-bold text-gray-900 mb-2">{t('product.review.activityQuestion')} <span className="font-normal text-gray-500">{t('product.review.chooseAll')}</span></p>
                      <div className="flex flex-wrap gap-2">
                        {['Casual Wear', 'Climbing', 'Yoga', 'Cycling', 'Fishing', 'Hiking', 'Running', 'Ski/Snowboarding'].map(opt => {
                          const isSelected = reviewForm.activities.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setReviewForm(prev => ({
                                ...prev,
                                activities: isSelected
                                  ? prev.activities.filter(item => item !== opt)
                                  : [...prev.activities, opt],
                              }))}
                              className={`px-4 py-2 font-medium text-sm rounded transition-colors ${
                                isSelected ? 'bg-black text-white' : 'bg-[#d7d7d7] text-black hover:bg-gray-300'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
 
                  <div className="pt-8 border-t border-gray-200">
                    <p className="text-[15px] text-gray-800 mb-4">
                      {t('product.review.termsText')} <span className="font-bold underline cursor-pointer">{t('product.review.termsLink')}</span>{t('product.review.privacyMid')} <span className="font-bold underline cursor-pointer">{t('product.review.privacyLink')}</span>.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">{t('product.review.requiredFields')}</p>
                    <button
                      type="submit"
                      disabled={reviewSubmitLoading || !reviewForm.orderItemId}
                      className="px-12 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviewSubmitLoading ? t('product.review.sending') : t('product.review.send')}
                    </button>
                  </div>
 
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-24">
          <div className="border-t border-gray-200 pt-16">
            <h2 className="text-2xl font-bold tracking-tight mb-8">{t('product.related')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
              {relatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} hideActions={true} />
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Product;