import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, Trash2 } from 'lucide-react';
import { getAbsoluteImageUrl } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

interface CartToastProps {
  productName: string;
  productImage?: string;
  type: 'added' | 'removed' | 'updated';
  onClose: () => void;
}

const CartToast: React.FC<CartToastProps> = ({ productName, productImage, type, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { lang } = useLanguage();
  const cartPath = getRoutePath('cart', lang);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), 3500);
    return () => clearTimeout(timer);
  }, [handleClose]);

  const isRemoved = type === 'removed';

  return (
    <div
      className={`fixed top-20 right-4 md:top-24 md:right-6 z-[100] w-72 ${
        isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'
      }`}
    >
      <div
        className={`bg-white border-l-4 ${
          isRemoved ? 'border-red-500' : 'border-primary-500'
        } rounded-lg shadow-xl overflow-hidden`}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Product image */}
          {productImage ? (
            <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border border-gray-100">
              <img
                src={getAbsoluteImageUrl(productImage)}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`flex-shrink-0 p-2 rounded-full ${isRemoved ? 'bg-red-50' : 'bg-primary-50'}`}>
              {isRemoved ? (
                <Trash2 className="h-6 w-6 text-red-500" />
              ) : (
                <CheckCircle className="h-6 w-6 text-primary-600" />
              )}
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{productName}</p>
            <p className={`text-xs ${isRemoved ? 'text-red-600' : 'text-primary-600'}`}>
              {isRemoved
                ? 'Removido do carrinho'
                : type === 'updated'
                ? 'Quantidade atualizada'
                : 'Adicionado ao carrinho'}
            </p>
            {!isRemoved && (
              <Link
                to={cartPath}
                onClick={handleClose}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Ver carrinho →
              </Link>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className={`h-full ${isRemoved ? 'bg-red-500' : 'bg-primary-500'} animate-shrink`}
            style={{ animationDuration: '3500ms' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CartToast;
