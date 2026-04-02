import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Share2, ChevronDown, ChevronUp, ChevronLeft, Star, Check } from 'lucide-react';
import SEO from '../components/SEO';
import { useProduct, useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import { getProductSchema, getBreadcrumbSchema } from '../utils/schemas';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import Toast, { ToastType } from '../components/Toast';
import { fireCartToast } from '../components/CartToastManager';
import { useLanguage } from '../context/LanguageContext';
import { getProductPath, getRoutePath, withQuery } from '../utils/routes';

const fixHtmlArtifacts = (html: string): string =>
  html
    .replace(/&\s+([a-z]+);/gi, '&$1;')      // "& amp;" → "&amp;"
    .replace(/<\s*\/\s*(\w+)\s*>/g, '</$1>') // "< / p>" → "</p>"
    .replace(/<\s+(\w)/g, '<$1');             // "< p" → "<p"

const toColorSlug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const Product: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const { product, loading, error } = useProduct(id || '');
  const { products: allProducts } = useProducts();
  const { t, lang } = useLanguage();
  const shopPath = getRoutePath('shop', lang);

  const [selectedColor, setSelectedColor] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

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
  }, [product?.id, product?.colors]);

  // THE ENGINE: Separação Inteligente das Imagens
  const { matchedImages, unmatchedImages, visibleImages } = useMemo(() => {
    if (!product) return { matchedImages: [], unmatchedImages: [], visibleImages: [] };
    const selectedColorSlug = selectedColor ? toColorSlug(selectedColor) : '';

    if (!selectedColorSlug) {
      return {
        matchedImages: product.images,
        unmatchedImages: [],
        visibleImages: product.images
      };
    }

    const matched = product.images.filter(img => img.includes(`-${selectedColorSlug}.webp`));
    const unmatched = product.images.filter(img => !img.includes(`-${selectedColorSlug}.webp`));

    // Se por algum motivo o slug falhar ou os ficheiros não tiverem o nome correto,
    // fazemos fallback para mostrar tudo como matched
    if (matched.length === 0) {
      return {
        matchedImages: product.images,
        unmatchedImages: [],
        visibleImages: product.images
      };
    }

    return {
      matchedImages: matched,
      unmatchedImages: unmatched,
      visibleImages: [...matched, ...unmatched] // Mobile mostra todas por ordem
    };
  }, [selectedColor, product]);

  useEffect(() => {
    setMobileImageIndex(0);
    const slider = document.getElementById('mobile-image-slider');
    if (slider) slider.scrollLeft = 0;
  }, [selectedColor, product?.id]);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    setMobileImageIndex(newIndex);

    // Sync selectedColor to whichever color's image is now visible
    const image = visibleImages[newIndex];
    if (image && product?.colors?.length) {
      for (const color of product.colors) {
        if (image.includes(`-${toColorSlug(color.name)}`)) {
          setSelectedColor(color.name);
          return;
        }
      }
    }
  };

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

  const handleAddToCart = () => {
    if (!product.inStock || isAdded) return;

    addItem(product, selectedColor);
    const previewImage = matchedImages[0] || product.images[0];
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
      } catch (error) {
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
        { name: product.category, url: withQuery(shopPath, { categoria: product.category }) },
        { name: product.name, url: getProductPath(lang, product.id) }
      ])
    ],
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <SEO title={`${product.name} | Loja`} description={product.description.slice(0, 120)} canonical={getProductPath(lang, product.id)} ogType="product" ogImage={product.images[0]} schema={schemas} />

      <div className="hidden lg:block max-w-[1440px] mx-auto px-8 py-6 text-sm font-medium text-gray-500">
        <Link to={shopPath} className="hover:text-black hover:underline">{t('nav.shop')}</Link>
        <span className="mx-2">/</span>
        <Link to={withQuery(shopPath, { categoria: product.category })} className="hover:text-black hover:underline">{product.category}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start gap-0 lg:gap-12 relative px-0 lg:px-8">

        {/* LEFT COLUMN: Images */}
        <div className="w-full lg:w-7/12 xl:w-2/3">

          {/* Mobile Image Carousel */}
          <div className="relative block lg:hidden">
            <div
              id="mobile-image-slider"
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth"
              onScroll={handleMobileScroll}
            >
              {visibleImages.map((image, index) => (
                <div key={`${image}-${index}`} className="w-full flex-shrink-0 snap-center relative aspect-[4/5] bg-[#f2f2f2]">
                  <img src={getAbsoluteImageUrl(imgVariant(image, 'md'))} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
              ))}
            </div>

            {visibleImages.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-sm pointer-events-none">
                {mobileImageIndex + 1}/{visibleImages.length}
              </div>
            )}
          </div>

          {/* DESKTOP IMAGE GRID: Hierarquia Visual */}
          <div className="hidden lg:grid grid-cols-2 gap-2">

            {/* Imagens Selecionadas (Gigantes / Largura Total) */}
            {matchedImages.map((image, index) => (
              <div key={`matched-${index}`} className="col-span-2 w-full bg-[#f2f2f2] relative">
                <img
                  src={getAbsoluteImageUrl(imgVariant(image, 'lg'))}
                  alt={`${product.name} em ${selectedColor} ${index + 1}`}
                  className="w-full h-auto object-cover mix-blend-multiply"
                />
              </div>
            ))}

            {/* Imagens das Outras Cores (Pequenas / Opacas) */}
            {unmatchedImages.length > 0 && (
              <>
                <div className="col-span-2 mt-8 mb-2 px-2">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('product.moreColors')}</h3>
                </div>
                {unmatchedImages.map((image, index) => (
                  <div
                    key={`unmatched-${index}`}
                    className="col-span-1 w-full bg-[#f2f2f2] relative aspect-[4/5] opacity-60 hover:opacity-100 transition-opacity duration-300"
                  >
                    <img
                      src={getAbsoluteImageUrl(imgVariant(image, 'md'))}
                      alt={`Outra cor de ${product.name}`}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  </div>
                ))}
              </>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Details */}
        <div className="w-full lg:w-5/12 xl:w-1/3 px-4 py-6 lg:px-0 lg:py-0 lg:sticky lg:top-24">

          <div className="block lg:hidden mb-6">
            <Link to={withQuery(shopPath, { categoria: product.category })} className="flex items-center text-sm font-bold text-gray-900 mb-4">
              <ChevronLeft size={16} className="mr-1" strokeWidth={2.5} /> {t('product.backToShop')}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{product.name}</h1>
            <div className="flex items-center gap-2 mb-2 text-sm">
              <div className="flex items-center text-black">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
              </div>
              <span className="text-primary-600">{t('product.reviews')}</span>
            </div>
            <p className="text-[22px] font-bold">€ {product.price.toFixed(2)}</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">{product.name}</h1>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <div className="flex items-center text-black">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
              </div>
              <span className="text-primary-600 cursor-pointer hover:underline">{t('product.reviews')}</span>
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

          <div className="flex items-center gap-3 mb-10">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdded}
              className={`flex-1 h-14 font-bold text-[15px] transition-all rounded-sm flex items-center justify-center gap-2 ${
                !product.inStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : isAdded
                  ? 'bg-[#1E4D3B] text-white border border-[#1E4D3B]'
                  : 'bg-black text-white hover:bg-gray-900 shadow-[0_4px_14px_rgba(0,0,0,0.15)]'
              }`}
            >
              {!product.inStock ? t('product.soldOut') : isAdded ? <><Check size={18} strokeWidth={3} /> {t('product.added')}</> : t('product.addToCart')}
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

                <div className="flex flex-wrap gap-2">
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
