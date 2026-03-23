import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list' | 'fullscreen';
  hideActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid', hideActions = false }) => {
  const { addItem } = useCart();
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

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

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 50;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swipe right - previous image
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
      } else {
        // Swipe left - next image
        setCurrentImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
      }
    }

    setDragOffset(0);
    setStartX(0);
  };

  // Mouse handlers for drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const threshold = 50;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Drag right - previous image
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
      } else {
        // Drag left - next image
        setCurrentImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
      }
    }

    setDragOffset(0);
    setStartX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      setStartX(0);
    }
  };

  if (viewMode === 'fullscreen') {
    return (
      <Link to={`/produto/${product.id}`} className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
        <div className="relative group">
          <div
            className="aspect-square overflow-hidden cursor-pointer select-none relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="flex w-full h-full"
              style={{
                transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className="w-full h-full flex-shrink-0"
                >
                  <img
                    src={getAbsoluteImageUrl(imgVariant(image, 'md'))}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Image Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                aria-label="Imagem anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={handleNextImage}
                aria-label="Próxima imagem"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>

              {/* Image Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {product.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white w-4' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-row gap-2 flex-wrap">
            {product.new && (
              <span className="bg-secondary-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                Novo
              </span>
            )}
            {product.featured && (
              <span className="bg-tertiary-700 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                Destaque
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!hideActions && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className={`p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 ${
                  isFavorite
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-primary-600 hover:text-white'
                }`}
              >
                <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <div>
            <h3 className="text-2xl font-medium text-gray-900 mb-3">
              {product.name}
            </h3>
          </div>

          <p className="text-base text-gray-600 mb-4 line-clamp-3">
            {product.description}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Cores disponíveis:</span>
            <div className="flex gap-1.5">
              {product.colors.slice(0, 5).map((color, index) => (
                <div
                  key={index}
                  className="w-5 h-5 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: getColorCode(color) }}
                  title={color}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-sm text-gray-500 ml-1">
                  +{product.colors.length - 5}
                </span>
              )}
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {product.price.toFixed(2)}€
              </span>
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-md text-lg font-medium transition-colors duration-200 ${
                product.inStock
                  ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              {product.inStock ? 'Ver Produto' : 'Esgotado'}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (viewMode === 'list') {
    return (
      <Link to={`/produto/${product.id}`} className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-row overflow-hidden">
        <div className="flex-shrink-0 relative group/image">
          <div
            className="w-48 h-48 overflow-hidden cursor-pointer select-none relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="flex w-full h-full"
              style={{
                transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className="w-full h-full flex-shrink-0"
                >
                  <img
                    src={getAbsoluteImageUrl(imgVariant(image, 'md'))}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Image Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                aria-label="Imagem anterior"
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10"
              >
                <ChevronLeft className="h-4 w-4 text-gray-800" />
              </button>
              <button
                onClick={handleNextImage}
                aria-label="Próxima imagem"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10"
              >
                <ChevronRight className="h-4 w-4 text-gray-800" />
              </button>

              {/* Image Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {product.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 h-1 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                {product.new && (
                  <span className="bg-secondary-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                    Novo
                  </span>
                )}
                {product.featured && (
                  <span className="bg-tertiary-700 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                    Destaque
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {product.description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Cores disponíveis:</span>
              <div className="flex gap-1">
                {product.colors.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorCode(color) }}
                    title={color}
                  />
                ))}
                {product.colors.length > 5 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{product.colors.length - 5}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary-600">
              {product.price.toFixed(2)}€
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                className={`p-2 border rounded-full transition-colors ${
                  isFavorite
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current text-primary-600' : 'text-gray-600'}`} />
              </button>
              <div
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-2 py-2 px-6 rounded-md transition-colors duration-200 cursor-pointer ${
                  product.inStock
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                {product.inStock ? 'Ver Produto' : 'Esgotado'}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <Link to={`/produto/${product.id}`} className="relative group/image">
        <div
          className="aspect-square overflow-hidden rounded-t-lg cursor-pointer select-none relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="flex w-full h-full"
            style={{
              transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {product.images.map((image, index) => (
              <div
                key={index}
                className="w-full h-full flex-shrink-0"
              >
                <img
                  src={getAbsoluteImageUrl(imgVariant(image, 'md'))}
                  alt={`${product.name} - ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Image Navigation Arrows */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10"
            >
              <ChevronLeft className="h-4 w-4 text-gray-800" />
            </button>
            <button
              onClick={handleNextImage}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow-md opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10"
            >
              <ChevronRight className="h-4 w-4 text-gray-800" />
            </button>

            {/* Image Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1 h-1 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </Link>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-row gap-2 flex-wrap z-20">
        {product.new && (
          <span className="bg-secondary-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
            Novo
          </span>
        )}
        {product.featured && (
          <span className="bg-tertiary-700 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
            Destaque
          </span>
        )}
      </div>

      {/* Action buttons */}
      {!hideActions && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2 z-20">
          <button
            onClick={handleToggleFavorite}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`p-2 rounded-full shadow-md hover:scale-110 transition-all duration-300 ${
              isFavorite
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-primary-600 hover:text-white'
            }`}
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      )}

      <Link to={`/produto/${product.id}`} className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary-600">
              {product.price.toFixed(2)}€
            </span>

            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: getColorCode(color) }}
                  title={color}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          </div>

          <div
            className={`w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors duration-200 text-sm ${
              product.inStock
                ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{product.inStock ? 'Ver Produto' : 'Esgotado'}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Helper function to get color codes
const getColorCode = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Bege': '#F5F5DC',
    'Castanho': '#8B4513',
    'Branco': '#FFFFFF',
    'Cru': '#F5E6D3',
    'Verde': '#22C55E',
    'Azul': '#3B82F6',
    'Vermelho': '#EF4444',
    'Rosa': '#EC4899',
    'Amarelo': '#F59E0B',
    'Preto': '#000000',
    'Cinzento': '#6B7280',
    'Bordô': '#7F1D1D',
  };
  return colorMap[colorName] || '#D1D5DB';
};

export default ProductCard;