import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import { fireCartToast } from './CartToastManager';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  activeColor: string;
  activeImage: string;
  onAdded: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, activeColor, activeImage, onAdded }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const { addItem } = useCart();
  const { t } = useLanguage();

  // Reset size selection whenever modal opens
  useEffect(() => {
    if (isOpen) setSelectedSize('');
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = product.size_stock ?? [];

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, activeColor || undefined, selectedSize);
    fireCartToast({
      productId: product.id,
      colorName: activeColor,
      productName: product.name,
      image: imgVariant(activeImage, 'sm'),
      type: 'added',
    });
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-lg overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-sm tracking-wide uppercase">{t('product.selectSize')}</span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Product snapshot */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="w-14 h-14 bg-[#f0f0f0] flex-shrink-0 overflow-hidden">
            <img
              src={getAbsoluteImageUrl(imgVariant(activeImage, 'sm'))}
              alt={product.name}
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{product.name}</p>
            {activeColor && <p className="text-xs text-gray-500 mt-0.5">{activeColor}</p>}
            <p className="font-bold text-sm mt-1">€ {product.price.toFixed(2)}</p>
          </div>
        </div>

        {/* Size grid */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {sizes.map(({ size, stock }) => {
              const outOfStock = Number(stock) <= 0;
              return (
                <button
                  key={size}
                  disabled={outOfStock}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[48px] px-3 py-2 text-sm font-medium border transition-all ${
                    outOfStock
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

        {/* Add to cart */}
        <div className="px-4 pb-4 pt-3">
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="w-full h-12 font-bold text-sm bg-black text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {selectedSize ? t('product.addToCart') : t('product.selectSizeFirst')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;
