import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';

interface CartItemProps {
  item: CartItemType;
  onNotify?: (name: string, image?: string, type: 'added' | 'removed' | 'updated') => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onNotify }) => {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onNotify?.(item.product.name, imgVariant(item.product.images?.[0] ?? '', 'sm'), 'removed');
      removeItem(item.product.id);
    } else {
      updateQuantity(item.product.id, newQuantity);
    }
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 last:border-b-0">
      <div className="flex gap-3 sm:gap-4">
        {/* Product Image */}
        <Link to={`/produto/${item.product.id}`} className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg hover:opacity-90 transition-opacity">
          <img
            src={getAbsoluteImageUrl(imgVariant(item.product.images[0], 'sm'))}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        </Link>

        {/* Product Info & Actions */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header: Name + Remove Button */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <Link to={`/produto/${item.product.id}`} className="group/name">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover/name:text-primary-600 transition-colors line-clamp-2">
                  {item.product.name}
                </h3>
              </Link>
              {item.selectedColor && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Cor: {item.selectedColor}
                </p>
              )}
            </div>
            
            <button
              onClick={() => {
                onNotify?.(item.product.name, imgVariant(item.product.images?.[0] ?? '', 'sm'), 'removed');
                removeItem(item.product.id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
              title="Remover produto"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Price */}
          <div className="mb-3">
            <p className="text-base sm:text-lg font-bold text-primary-600">
              {item.product.price.toFixed(2)}€
              <span className="text-xs sm:text-sm text-gray-500 font-normal ml-1">
                / unidade
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
                aria-label="Diminuir quantidade"
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