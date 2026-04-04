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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop: Invisible but captures clicks to close. 
        We use pointer-events-auto to make this specific div clickable.
      */}
      <div className="fixed inset-0 bg-transparent pointer-events-auto" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] pointer-events-auto border border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="font-bold text-[15px] tracking-wide text-gray-900 uppercase">
            {t('product.selectSize')}
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors focus:outline-none"
            aria-label={t('common.close')}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Product snapshot */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          <div className="w-20 h-20 bg-[#f2f2f2] flex-shrink-0">
            <img
              src={getAbsoluteImageUrl(imgVariant(activeImage, 'sm'))}
              alt={product.name}
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-medium text-[16px] text-gray-900 leading-snug">
              {product.name}
            </p>
            {activeColor && (
              <p className="text-[14px] text-gray-500 mt-1">
                {activeColor}
              </p>
            )}
            <p className="font-bold text-[16px] text-gray-900 mt-1.5">
              € {product.price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Size grid */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex flex-wrap gap-2.5">
            {sizes.map(({ size, stock }) => {
              const outOfStock = Number(stock) <= 0;
              return (
                <button
                  key={size}
                  disabled={outOfStock}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[60px] h-12 flex items-center justify-center px-4 text-[15px] font-medium transition-all ${
                    outOfStock
                      ? 'border border-gray-200 text-gray-300 cursor-not-allowed line-through'
                      : selectedSize === size
                      ? 'border-2 border-black text-black'
                      : 'border border-gray-300 text-gray-900 hover:border-black focus:outline-none focus:ring-1 focus:ring-black'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add to cart */}
        <div className="px-6 pb-6 pt-4">
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className={`w-full h-14 font-bold text-[16px] transition-colors focus:outline-none ${
              !selectedSize 
                ? 'bg-[#e2e4e7] text-[#8e98a8] cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            {selectedSize ? t('product.addToCart') : t('product.selectSizeFirst')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;