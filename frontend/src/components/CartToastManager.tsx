import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAbsoluteImageUrl } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const DURATION = 3500;

interface ToastEntry {
  key: string;
  productName: string;
  image?: string;
  count: number;
  type: 'added' | 'removed' | 'updated';
  resetKey: number;
}

export interface CartToastDetail {
  productId: string | number;
  colorName?: string;
  productName: string;
  image?: string;
  type?: 'added' | 'removed' | 'updated';
}

export const fireCartToast = (detail: CartToastDetail) => {
  window.dispatchEvent(new CustomEvent('recicloth:cart-toast', { detail }));
};

const CartToastManager: React.FC = () => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { lang } = useLanguage();
  const cartPath = getRoutePath('cart', lang);

  const removeToast = useCallback((key: string) => {
    timers.current.delete(key);
    setToasts(prev => prev.filter(t => t.key !== key));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { productId, colorName, productName, image, type = 'added' } = (e as CustomEvent<CartToastDetail>).detail;

      // 'added' for same product+color stacks with badge; others are always unique
      const key = type === 'added'
        ? `added-${productId}-${colorName ?? ''}`
        : `${type}-${Date.now()}`;

      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      const timerId = setTimeout(() => removeToast(key), DURATION);
      timers.current.set(key, timerId);

      setToasts(prev => {
        const existingToast = prev.find(t => t.key === key);
        if (existingToast) {
          return prev.map(t =>
            t.key === key ? { ...t, count: t.count + 1, resetKey: t.resetKey + 1 } : t
          );
        }
        return [...prev, { key, productName, image, count: 1, type, resetKey: 0 }];
      });
    };

    window.addEventListener('recicloth:cart-toast', handler);
    return () => {
      window.removeEventListener('recicloth:cart-toast', handler);
      timers.current.forEach(clearTimeout);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 md:top-24 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const isRemoved = toast.type === 'removed';
        return (
          <div
            key={toast.key}
            className={`w-72 bg-white border-l-4 ${isRemoved ? 'border-red-500' : 'border-[#2D6A4F]'} rounded-lg shadow-xl overflow-hidden animate-slideInRight pointer-events-auto`}
          >
            <div className="flex items-center gap-3 p-3">
              {toast.image ? (
                <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border border-gray-100">
                  <img
                    src={getAbsoluteImageUrl(toast.image)}
                    alt={toast.productName}
                    className="w-full h-full object-cover"
                  />
                  {toast.count > 1 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                      +{toast.count - 1}
                    </span>
                  )}
                </div>
              ) : (
                <div className={`flex-shrink-0 p-2 rounded-full ${isRemoved ? 'bg-red-50' : 'bg-green-50'}`}>
                  {isRemoved
                    ? <Trash2 className="h-6 w-6 text-red-500" />
                    : <CheckCircle className="h-6 w-6 text-[#2D6A4F]" />}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{toast.productName}</p>
                <p className={`text-xs ${isRemoved ? 'text-red-600' : 'text-[#2D6A4F]'}`}>
                  {isRemoved ? 'Removido do carrinho' : toast.type === 'updated' ? 'Quantidade atualizada' : 'Adicionado ao carrinho'}
                </p>
                {!isRemoved && (
                  <Link
                    to={cartPath}
                    onClick={() => removeToast(toast.key)}
                    className="text-xs font-medium text-[#2D6A4F] hover:underline"
                  >
                    Ver carrinho →
                  </Link>
                )}
              </div>

              <button
                onClick={() => { clearTimeout(timers.current.get(toast.key)); removeToast(toast.key); }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-0.5 bg-gray-100">
              <div
                key={toast.resetKey}
                className={`h-full ${isRemoved ? 'bg-red-500' : 'bg-[#2D6A4F]'} animate-shrink`}
                style={{ animationDuration: `${DURATION}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartToastManager;
