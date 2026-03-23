import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, Star, Share2, ChevronLeft, ChevronRight, Grid2x2 as Grid, Maximize2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useProduct } from '../hooks/useProducts';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import { getProductSchema, getBreadcrumbSchema } from '../utils/schemas';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import Toast, { ToastType } from '../components/Toast';
import CartToast from '../components/CartToast';

const Product: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const { product, loading, error } = useProduct(id || '');
  const { products: allProducts } = useProducts();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [relatedViewMode, setRelatedViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [cartToast, setCartToast] = useState<{ name: string; image?: string; type: 'added' | 'removed' | 'updated' } | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Navigation functions for image slider (without loop)
  const goToNextImage = () => {
    if (product && selectedImage < product.images.length - 1) {
      setSelectedImage((prev) => prev + 1);
    }
  };

  const goToPreviousImage = () => {
    if (product && selectedImage > 0) {
      setSelectedImage((prev) => prev - 1);
    }
  };

  // Check if navigation buttons should be shown
  const canGoToPrevious = selectedImage > 0;
  const canGoToNext = product ? selectedImage < product.images.length - 1 : false;

  // Touch/drag handlers for Instagram-style swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;

    // Prevent dragging beyond limits
    if ((selectedImage === 0 && diff > 0) ||
        (product && selectedImage === product.images.length - 1 && diff < 0)) {
      // Add resistance at boundaries
      setDragOffset(diff * 0.2);
    } else {
      setDragOffset(diff);
    }

    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (!touchStart || touchEnd === 0) {
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const threshold = 50; // Minimum swipe distance

    // Swipe left (next image)
    if (distance > threshold && canGoToNext) {
      goToNextImage();
    }
    // Swipe right (previous image)
    else if (distance < -threshold && canGoToPrevious) {
      goToPreviousImage();
    }

    // Reset
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStart) return;

    const diff = e.clientX - touchStart;

    // Prevent dragging beyond limits
    if ((selectedImage === 0 && diff > 0) ||
        (product && selectedImage === product.images.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.2);
    } else {
      setDragOffset(diff);
    }

    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    if (!touchStart || touchEnd === 0) {
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const threshold = 50;

    if (distance > threshold && canGoToNext) {
      goToNextImage();
    } else if (distance < -threshold && canGoToPrevious) {
      goToPreviousImage();
    }

    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar produto...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Produto não encontrado'}
          </h2>
          <Link to="/loja" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            Voltar à Loja
          </Link>
        </div>
      </div>
    );
  }

  // Set default color
  if (!selectedColor && product.colors.length > 0) {
    setSelectedColor(product.colors[0]);
  }

  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedColor);
    }
    setCartToast({ name: product.name, image: imgVariant(product.images[0], 'sm'), type: 'added' });
  };

  const isFavorite = product ? favorites.some(fav => fav.product_id === String(product.id)) : false;
  const cartItem = items.find(i => String(i.product.id) === String(product.id));
  const isInCart = !!cartItem;

  const handleToggleFavorite = async () => {
    if (!product) return;

    if (isFavorite) {
      await removeFromFavorites(String(product.id));
    } else {
      await addToFavorites(String(product.id));
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareUrl = window.location.href;
    const shareTitle = product.name;
    const shareText = `${product.name} - ${product.description.substring(0, 100)}...`;

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setToast({ message: 'Produto partilhado com sucesso!', type: 'success' });
      } catch (error: any) {
        // User cancelled share or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          setToast({ message: 'Erro ao partilhar produto', type: 'error' });
        }
      }
    } else {
      // Fallback: Copy to clipboard for desktop
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ message: 'Link copiado para a área de transferência!', type: 'success' });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        setToast({ message: 'Erro ao copiar link', type: 'error' });
      }
    }
  };

  // SEO setup
  const productSchema = getProductSchema(product);
  const breadcrumbs = getBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: 'Loja', url: '/loja' },
    { name: product.category, url: `/loja?categoria=${product.category}` },
    { name: product.name, url: `/produto/${product.id}` },
  ]);

  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [productSchema, breadcrumbs],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${product.name} — Croché Artesanal Feito à Mão em Portugal`}
        description={`${product.description.slice(0, 120)} — ${product.category} em croché artesanal feito à mão em Portugal. ${product.inStock ? 'Em stock' : 'Indisponível'}. €${product.price.toFixed(2)}.`}
        canonical={`/produto/${product.id}`}
        ogType="product"
        ogImage={product.images[0]}
        schema={schemas}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-primary-600">Início</Link>
          <span>/</span>
          <Link to="/loja" className="hover:text-primary-600">Loja</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Back Button */}
        <Link
          to="/loja"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 active:text-primary-800 mb-6 font-medium transition-all duration-300 group hover:gap-3 active:gap-3"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 group-active:-translate-x-1 transition-transform duration-300" />
          <span className="group-hover:underline group-active:underline">Voltar à Loja</span>
        </Link>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 sm:p-8">
            {/* Images - Instagram Style Slider */}
            <div className="space-y-4">
              {/* Main Image with Slider */}
              <div
                ref={imageRef}
                className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 group select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {/* Image Container with Transform */}
                <div
                  className="w-full h-full flex"
                  style={{
                    transform: `translateX(calc(${-selectedImage * 100}% + ${dragOffset}px))`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={getAbsoluteImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover flex-shrink-0"
                      draggable={false}
                    />
                  ))}
                </div>

                {/* Navigation Arrows - Show based on position */}
                {product.images.length > 1 && (
                  <>
                    {/* Previous Arrow - Only show if not on first image */}
                    {canGoToPrevious && (
                      <button
                        onClick={goToPreviousImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-70 backdrop-blur-sm hover:bg-opacity-90 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-800" />
                      </button>
                    )}

                    {/* Next Arrow - Only show if not on last image */}
                    {canGoToNext && (
                      <button
                        onClick={goToNextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-70 backdrop-blur-sm hover:bg-opacity-90 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-800" />
                      </button>
                    )}

                    {/* Instagram-style Dots Indicator */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`rounded-full transition-all duration-300 ${
                            index === selectedImage
                              ? 'w-2 h-2 bg-white shadow-lg'
                              : 'w-2 h-2 bg-white bg-opacity-50 hover:bg-opacity-75'
                          }`}
                          aria-label={`Ir para imagem ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Image Counter */}
                {product.images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black bg-opacity-50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation - Maintained */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        selectedImage === index
                          ? 'border-primary-600 ring-2 ring-primary-200 scale-105'
                          : 'border-gray-200 hover:border-primary-300 hover:scale-105'
                      }`}
                    >
                      <img
                        src={getAbsoluteImageUrl(imgVariant(image, 'sm'))}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {product.new && (
                    <span className="bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full">
                      Novo
                    </span>
                  )}
                  {product.featured && (
                    <span className="bg-tertiary-100 text-tertiary-800 text-xs px-2 py-1 rounded-full">
                      Destaque
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <p className="text-3xl font-bold text-primary-600">
                    {product.price.toFixed(2)}€
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">(24 avaliações)</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Colors */}
              {product.colors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Cor:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-sm border rounded-md transition-all ${
                          selectedColor === color
                            ? 'border-primary-600 bg-primary-50 text-primary-600 ring-2 ring-primary-200'
                            : 'border-gray-300 text-gray-700 hover:border-primary-600'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantidade - Agora sempre visível */}
              <div>
                <h3 className="text-lg font-semibold mb-3">{isInCart ? 'Quantidade no carrinho:' : 'Quantidade:'}</h3>
                <div className="flex items-center border border-gray-300 rounded-md w-fit bg-white">
                  <button
                    onClick={() => {
                      if (isInCart) {
                        const newQty = cartItem!.quantity - 1;
                        if (newQty <= 0) {
                          removeItem(cartItem!.product.id);
                          setCartToast({ name: product.name, image: imgVariant(product.images[0], 'sm'), type: 'removed' });
                        } else {
                          updateQuantity(cartItem!.product.id, newQty);
                          setCartToast({ name: product.name, image: imgVariant(product.images[0], 'sm'), type: 'updated' });
                        }
                      } else {
                        setQuantity(Math.max(1, quantity - 1));
                      }
                    }}
                    className="p-3 hover:bg-gray-50 transition-colors focus:outline-none text-gray-700"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 py-3 border-l border-r border-gray-300 font-medium text-gray-900 min-w-[3rem] text-center">
                    {isInCart ? cartItem!.quantity : quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (isInCart) {
                        updateQuantity(cartItem!.product.id, cartItem!.quantity + 1);
                        setCartToast({ name: product.name, image: imgVariant(product.images[0], 'sm'), type: 'updated' });
                      } else {
                        setQuantity(quantity + 1);
                      }
                    }}
                    className="p-3 hover:bg-gray-50 transition-colors focus:outline-none text-gray-700"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col lg:flex-row gap-3 pt-4">
                {isInCart ? (
                  /* Botão Ver Carrinho (Mantendo o design limpo da primeira imagem) */
                  <Link
                    to="/carrinho"
                    className="w-full lg:flex-1 shrink-0 flex items-center justify-center gap-2.5 bg-primary-700 text-white h-12 min-h-[48px] px-6 rounded-lg hover:bg-primary-800 shadow-sm transition-all duration-200 text-[15px] font-medium group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <ShoppingBag className="h-[18px] w-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="whitespace-nowrap">Ver Carrinho</span>
                  </Link>
                ) : (
                  /* Botão Original: Adicionar ao Carrinho */
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className="w-full lg:flex-1 shrink-0 flex items-center justify-center gap-2.5 bg-primary-700 text-white h-12 min-h-[48px] px-6 rounded-lg hover:bg-primary-800 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200 text-[15px] font-medium group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <ShoppingBag className="h-[18px] w-[18px] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="whitespace-nowrap">{product.inStock ? 'Adicionar ao Carrinho' : 'Esgotado'}</span>
                  </button>
                )}

                {/* Secundários: Favoritar / Partilhar */}
                <div className="flex gap-3">
                  <button 
                    onClick={handleToggleFavorite}
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    className={`group flex flex-row lg:flex-row-reverse items-center justify-center h-12 flex-1 lg:flex-none border rounded-lg transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      isFavorite
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {/* Ícone fixo */}
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <Heart className={`h-[18px] w-[18px] transition-transform duration-300 ${isFavorite ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                    </div>
                    {/* Texto com padding ajustado */}
                    <div className="max-w-[150px] lg:max-w-0 overflow-hidden opacity-100 lg:opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out flex items-center">
                      <span className="whitespace-nowrap text-sm font-medium pl-1 lg:pl-5 pr-3 lg:pr-1">
                        {isFavorite ? 'Guardado' : 'Favoritar'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleShare}
                    aria-label="Partilhar produto"
                    className="group flex flex-row lg:flex-row-reverse items-center justify-center h-12 flex-1 lg:flex-none border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    {/* Ícone fixo */}
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <Share2 className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    {/* Texto com padding ajustado */}
                    <div className="max-w-[150px] lg:max-w-0 overflow-hidden opacity-100 lg:opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-in-out flex items-center">
                      <span className="whitespace-nowrap text-sm font-medium pl-1 lg:pl-5 pr-3 lg:pr-1">
                        Partilhar
                      </span>
                    </div>
                  </button>
                </div>
              </div>
              {/* Additional Info */}
              <div className="border-t pt-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Categoria:</h4>
                  <p className="text-gray-600">{product.category}</p>
                </div>
                
                {product.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Produtos Relacionados
              </h2>

              {/* View Mode Toggle - Mobile Only */}
              <div className="flex sm:hidden border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setRelatedViewMode('grid')}
                  className={`p-2 ${relatedViewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  title="2x2 Grid"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setRelatedViewMode('fullscreen')}
                  className={`p-2 ${relatedViewMode === 'fullscreen' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  title="Tela Cheia"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {relatedViewMode === 'fullscreen' ? (
              <div className="sm:hidden space-y-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode="fullscreen" hideActions={true} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={relatedViewMode} hideActions={true} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Cart Notification */}
      {cartToast && (
        <CartToast
          productName={cartToast.name}
          productImage={cartToast.image}
          type={cartToast.type}
          onClose={() => setCartToast(null)}
        />
      )}
    </div>
  );
};

export default Product;