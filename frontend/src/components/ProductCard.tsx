import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import { fireCartToast } from '../utils/cartToast';
import { getProductPath } from '../utils/routes';
import ProductModal from './ProductModal';

interface ProductCardProps {
  product: Product;
  hideActions?: boolean;
  selectedColorHex?: string;
  viewMode?: 'grid' | 'fullscreen';
}

const toColorSlug = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const ProductCard: React.FC<ProductCardProps> = ({ product, hideActions = false, selectedColorHex }) => {
  const { addItem } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const { lang, t } = useLanguage();
  const productPath = getProductPath(lang, product.id);

  // Estados de Interação
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasSizes = (product.stock_mode === 'apparel' || product.stock_mode === 'shoes') && (product.size_stock?.length ?? 0) > 0;

  // O ÚNICO ESTADO DE ÍNDICE: Controla a imagem, o dot e a cor em simultâneo
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Define as cores a apresentar (máx 4)
  const displayColors = useMemo(() => {
    const allColors = product.colors ?? [];
    const base = allColors.slice(0, 4);
    if (!selectedColorHex) return base;

    const selected = allColors.find(color => color.hex === selectedColorHex);
    if (!selected) return base;
    if (base.some(color => color.name === selected.name)) return base;

    if (base.length < 4) return [...base, selected];
    return [...base.slice(0, 3), selected];
  }, [product.colors, selectedColorHex]);

  // 2. Mapeamento 1:1 - Constrói um array de imagens exatamente na mesma ordem que as cores
  const carouselImages = useMemo(() => {
    const images = product.images && product.images.length > 0 ? product.images : ['placeholder.jpg'];

    if (displayColors.length === 0) return images;

    return displayColors.map((color, index) => {
      const slug = toColorSlug(color.original_name || color.name);
      const match = images.find(img => img.toLowerCase().includes(slug));
      // Se encontrar a imagem da cor, usa-a. Senão, faz fallback para a imagem na mesma posição.
      return match || images[index] || images[0];
    });
  }, [displayColors, product.images]);

  // Deriva a cor ativa a partir do índice atual
  const activeColor = displayColors[currentIndex]?.name || '';

  // Sincroniza via Filtros da Loja (Props)
  useEffect(() => {
    if (selectedColorHex) {
      const idx = displayColors.findIndex(c => c.hex === selectedColorHex);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [selectedColorHex, displayColors]);

  const isFavorite = favorites.some(fav => fav.product_id === product.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.inStock || isAdded) return;

    if (hasSizes) {
      setIsModalOpen(true);
      return;
    }

    addItem(product, activeColor);

    const previewImage = imgVariant(carouselImages[currentIndex] || carouselImages[0], 'sm');
    fireCartToast({ productId: product.id, colorName: activeColor, productName: product.name, image: previewImage, type: 'added' });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleModalAdded = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // --- Carousel Logic ---
  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : carouselImages.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < carouselImages.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragOffset(e.touches[0].clientX - startX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : carouselImages.length - 1));
      } else {
        setCurrentIndex((prev) => (prev < carouselImages.length - 1 ? prev + 1 : 0));
      }
    }
    setDragOffset(0);
    setStartX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - startX);
  };

  const handleMouseLeave = () => {
    if (isDragging) handleDragEnd();
  };

  return (
    <>
      {hasSizes && (
        <ProductModal
          product={product}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activeColor={activeColor}
          activeImage={carouselImages[currentIndex] || carouselImages[0]}
          onAdded={handleModalAdded}
        />
      )}
      <div className="flex flex-col group relative h-full">

        {/* --- IMAGE CAROUSEL CONTAINER --- */}
        <div className="relative bg-[#f0f0f0] aspect-[4/5] mb-4 overflow-hidden group/image">

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            {!product.inStock && (
              <span className="bg-white px-2 py-1 text-xs font-bold text-gray-500 shadow-sm border border-gray-200">
                Esgotado
              </span>
            )}
            {product.new && product.inStock && (
              <span className="bg-white px-2 py-1 text-xs font-bold text-black shadow-sm">
                Novo
              </span>
            )}
          </div>

          {/* Favorite Button Overlay (Top Right) */}
          {!hideActions && (
            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className="absolute top-2 right-2 z-20 p-2.5 rounded-full bg-white/80 backdrop-blur-sm text-black opacity-0 group-hover/image:opacity-100 hover:bg-white hover:scale-110 hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              <Heart className={`h-5 w-5 transition-all duration-200 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'fill-none hover:fill-red-50 hover:text-red-500'}`} strokeWidth={1.5} />
            </button>
          )}

          {/* Swipeable Track */}
          <Link to={productPath} className="block w-full h-full cursor-pointer">
            <div
              className="w-full h-full select-none touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="flex w-full h-full"
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                }}
              >
                {carouselImages.map((image, index) => (
                  <div key={index} className="w-full h-full flex-shrink-0 bg-gray-100">
                    <img
                      src={getAbsoluteImageUrl(imgVariant(image, 'md'))}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover pointer-events-none mix-blend-multiply"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Link>

          {/* Navigation Arrows (Visible on Desktop Hover) */}
          {carouselImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10 lg:block hidden"
              >
                <ChevronLeft className="h-5 w-5 text-black" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10 lg:block hidden"
              >
                <ChevronRight className="h-5 w-5 text-black" />
              </button>

              {/* Pagination Dots (Sincronizado com currentIndex) */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {carouselImages.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${index === currentIndex ? 'bg-black w-4' : 'bg-gray-400 w-1'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Hover Gradient Protection */}
          <div className="hidden lg:block absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

          {/* DESKTOP Hover: Quick Add Button */}
          <div className="hidden lg:block absolute bottom-4 left-4 right-4 opacity-0 group-hover/image:opacity-100 transform translate-y-2 group-hover/image:translate-y-0 transition-all duration-300 ease-out z-20">
            <button
              onClick={handleAddToCart}
              className={`w-full font-bold py-3 text-sm transition-all duration-300 shadow-lg ${!product.inStock
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isAdded
                  ? 'bg-[#1E4D3B] text-white border border-[#1E4D3B]'
                  : 'bg-white text-black hover:bg-black hover:text-white border border-transparent hover:border-black'
                }`}
              disabled={!product.inStock || isAdded}
            >
              {!product.inStock ? t('product.soldOut') : isAdded ? `${t('product.added')} ✓` : t('product.quickAdd')}
            </button>
          </div>
        </div>

        {/* --- PRODUCT INFO SECTION --- */}
        <div className="flex flex-col flex-1 px-1 relative">

          {/* Color Swatches (Clica e muda o currentIndex) */}
          <div className="flex gap-1.5 mb-2 items-center h-6">
            {displayColors.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                className={`w-[18px] h-[18px] rounded-full border shadow-sm transition-transform hover:scale-110 ${idx === currentIndex ? 'ring-2 ring-black ring-offset-1' : 'border-gray-300'}`}
                style={{ backgroundColor: color.hex || '#D1D5DB' }}
                title={color.name}
              />
            ))}
            {product.colors && product.colors.length > 4 && (
              <span className="text-xs text-gray-500 font-medium">+{product.colors.length - 4}</span>
            )}
          </div>

          {/* Title & Price */}
          <Link to={productPath} className="hover:underline group-hover:text-black">
            <h3 className="text-sm font-medium text-gray-900 leading-tight mb-1 pr-8">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm font-medium text-gray-900 mb-2">€ {product.price.toFixed(2)}</p>

          {/* Reviews (Mocked) */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-black text-xs">★★★★☆</div>
            <span className="text-xs text-gray-500">(2)</span>
          </div>

          {/* Feature Tags */}
          <div className="flex flex-wrap gap-1 mt-auto pb-1">
            {product.featured && (
              <span className="bg-gray-100 text-gray-600 text-[10px] lowercase font-medium px-2 py-0.5">
                {t('product.tag.featured')}
              </span>
            )}
          </div>
        </div>

        {/* MOBILE: Persistent Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || isAdded}
          className={`lg:hidden absolute bottom-2 right-1 rounded-full w-[38px] h-[38px] flex items-center justify-center shadow-sm transition-all duration-300 active:scale-95 ${!product.inStock
            ? 'bg-gray-200 text-gray-400'
            : isAdded
              ? 'bg-[#1E4D3B] text-white scale-105'
              : 'bg-black text-white'
            }`}
        >
          {isAdded ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={2.5} />}
        </button>

      </div>
    </>
  );
};

export default ProductCard;
