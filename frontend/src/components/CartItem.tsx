import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import { fireCartToast } from './CartToastManager';
import { useLanguage } from '../context/LanguageContext';
import { getProductPath } from '../utils/routes';

const toColorSlug = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const getColorImage = (images: string[], colorName?: string): string => {
  if (!colorName || !images?.length) return images?.[0] ?? '';
  const slug = toColorSlug(colorName);
  return images.find(img => img.includes(`-${slug}.webp`) || img.includes(`-${slug}-`)) ?? images[0];
};

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const { t, lang } = useLanguage();
  const productPath = getProductPath(lang, item.product.id);

  const colorImage = getColorImage(item.product.images, item.selectedColor);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      fireCartToast({ productId: item.product.id, colorName: item.selectedColor, productName: item.product.name, image: imgVariant(colorImage, 'sm'), type: 'removed' });
      removeItem(item.product.id);
    } else {
      updateQuantity(item.product.id, newQuantity);
    }
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 last:border-b-0">
      <div className="flex gap-3 sm:gap-4">
        {/* Product Image */}
        <Link to={productPath} className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg hover:opacity-90 transition-opacity">
          <img
            src={getAbsoluteImageUrl(imgVariant(colorImage, 'sm'))}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Product Info & Actions */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header: Name + Remove Button */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <Link to={productPath} className="group/name">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover/name:text-primary-600 transition-colors line-clamp-2">
                  {item.product.name}
                </h3>
              </Link>
              {item.selectedColor && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {t('cartItem.colorLabel')} {item.selectedColor}
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                fireCartToast({ productId: item.product.id, colorName: item.selectedColor, productName: item.product.name, image: imgVariant(colorImage, 'sm'), type: 'removed' });
                removeItem(item.product.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
              title={t('cartItem.remove')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Price */}
          <div className="mb-3">
            <p className="text-base sm:text-lg font-bold text-primary-600">
              {item.product.price.toFixed(2)}€
              <span className="text-xs sm:text-sm text-gray-500 font-normal ml-1">
                {t('cartItem.perUnit')}
              </span>
            </p>
          </div>

          {/* Bottom Row: Quantity Controls + Total */}
          <div className="flex items-center justify-between gap-3 mt-auto">
            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="p-2 sm:p-2.5 hover:bg-gray-50 transition-colors active:bg-gray-100"
                aria-label={t('cartItem.decreaseQty')}
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <span className="px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-900 min-w-[2.5rem] sm:min-w-[3rem] text-center border-l border-r border-gray-300">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                className="p-2 sm:p-2.5 hover:bg-gray-50 transition-colors active:bg-gray-100"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Total Price */}
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500 mb-0.5">
                Total
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {(item.product.price * item.quantity).toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
