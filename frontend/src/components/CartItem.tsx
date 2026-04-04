import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';
import { fireCartToast } from './CartToastManager';
import { useLanguage } from '../context/LanguageContext';
import { getProductPath } from '../utils/routes';

interface CartItemProps {
  item: CartItemType;
}

// Mapeamento 1:1 baseado no índice da cor
const getColorImage = (item: CartItemType): string => {
  const images = item.product.images;
  const colors = item.product.colors;

  if (!images || images.length === 0) return '';
  if (!item.selectedColor || !colors || colors.length === 0) return images[0];

  const colorIndex = colors.findIndex(c => c.name === item.selectedColor);

  if (colorIndex >= 0 && colorIndex < images.length) {
    return images[colorIndex];
  }

  return images[0];
};

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const { t, lang } = useLanguage();
  const productPath = getProductPath(lang, item.product.id);

  const colorImage = getColorImage(item);

  // ID composto gerado em tempo real
  const cartItemId = `${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      fireCartToast({ 
        productId: item.product.id, 
        colorName: item.selectedColor, 
        productName: item.product.name, 
        image: imgVariant(colorImage, 'sm'), 
        type: 'removed' 
      });
      removeItem(cartItemId);
    } else {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    fireCartToast({ 
      productId: item.product.id, 
      colorName: item.selectedColor, 
      productName: item.product.name, 
      image: imgVariant(colorImage, 'sm'), 
      type: 'removed' 
    });
    
    removeItem(cartItemId);
  };

  return (
    <div className="p-5 sm:p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex gap-4 sm:gap-6 items-start">
        
        {/* Product Image */}
        <Link to={productPath} className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded bg-[#f2f2f2] border border-gray-100 hover:opacity-90 transition-opacity">
          <img
            src={getAbsoluteImageUrl(imgVariant(colorImage, 'sm'))}
            alt={item.product.name}
            className="w-full h-full object-cover mix-blend-multiply"
          />
        </Link>

        {/* Product Info & Actions */}
        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <Link to={productPath} className="group/name block mb-1">
                <h3 className="text-[15px] sm:text-[16px] font-bold text-gray-900 group-hover/name:text-[#1E4D3B] transition-colors leading-snug">
                  {item.product.name}
                </h3>
              </Link>

              <div className="space-y-0.5 mt-2">
                {item.selectedColor && (
                  <p className="text-[13px] text-gray-500">
                    <span className="font-medium text-gray-700">Cor: </span>{item.selectedColor}
                  </p>
                )}
                {item.selectedSize && (
                  <p className="text-[13px] text-gray-500">
                    <span className="font-medium text-gray-700">Tamanho: </span>{item.selectedSize}
                  </p>
                )}
              </div>
            </div>
            
            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 -mt-1 -mr-1"
              title="Remover produto"
              aria-label="Remover"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            
            <div className="flex flex-col gap-3">
              {/* Unit Price */}
              <p className="text-[14px] font-bold text-gray-900">
                {item.product.price.toFixed(2)}€
                <span className="text-[12px] text-gray-400 font-normal ml-1">/ unidade</span>
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-200 rounded h-10 w-fit bg-white">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  className="px-3 h-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 active:bg-gray-100"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-3 min-w-[2.5rem] text-center text-[14px] font-bold text-gray-900 border-l border-r border-gray-200 h-full flex items-center justify-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="px-3 h-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 active:bg-gray-100"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="text-right">
              <p className="text-[11px] font-medium text-gray-500 mb-0.5">Total</p>
              <p className="text-[16px] sm:text-[18px] font-bold text-gray-900 leading-none">
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