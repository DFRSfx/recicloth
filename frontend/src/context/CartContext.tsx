import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Helper para criar uma chave verdadeiramente única para cada variação do produto
export const getCartItemUniqueId = (productId: string | number, color?: string, size?: string) => {
  return `${productId}-${color || ''}-${size || ''}`;
};

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; selectedColor?: string; selectedSize?: string } }
  | { type: 'REMOVE_ITEM'; payload: string } // payload is uniqueId
  | { type: 'UPDATE_QUANTITY'; payload: { uniqueId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

interface CartContextType extends CartState {
  addItem: (product: Product, selectedColor?: string, selectedSize?: string) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const uniqueId = getCartItemUniqueId(action.payload.product.id, action.payload.selectedColor, action.payload.selectedSize);
      const existingItem = state.items.find(
        item => getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) === uniqueId
      );

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) === uniqueId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        return { items: updatedItems, total };
      }

      const newItems = [...state.items, {
        product: action.payload.product,
        quantity: 1,
        selectedColor: action.payload.selectedColor,
        selectedSize: action.payload.selectedSize,
      }];
      const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      return { items: newItems, total };
    }

    case 'REMOVE_ITEM': {
      // Usa a chave composta para comparar exatamente com o que enviámos ("25-Verde bacia-S")
      const newItems = state.items.filter(item => 
        getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) !== action.payload
      );
      const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      return { items: newItems, total };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter(item => 
          getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) !== action.payload.uniqueId
        );
        const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        return { items: newItems, total };
      }

      const newItems = state.items.map(item =>
        getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) === action.payload.uniqueId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      return { items: newItems, total };
    }

    case 'CLEAR_CART':
      return { items: [], total: 0 };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const { token, isAuthenticated } = useAuth();
  const { lang } = useLanguage();
  const [sessionId] = useState(getSessionId());
  const isSyncingRef = useRef(false);

  const getHeaders = useCallback(() => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [sessionId, token]);

  const loadCartFromDB = useCallback(async (currentLang?: string) => {
    try {
      const langParam = currentLang || lang || 'en';
      const response = await fetch(`/api/cart?lang=${langParam}`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        
        const cartItems: CartItem[] = data.items.map((item: any) => ({
          cartItemId: item.id,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            images: item.images || [],
            stock: item.stock,
            inStock: item.stock > 0,
            stock_mode: item.stock_mode || 'unit',
            size_stock: item.size_stock || [],
            colors: item.colors || [],
            category: item.category || '',
            categoryId: item.category_id,
            description: item.description || '',
            featured: false,
            new: false,
            tags: [],
          },
          quantity: item.quantity,
          selectedColor: item.color || undefined,
          selectedSize: item.size || undefined,
        }));

        const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        dispatch({ type: 'LOAD_CART', payload: { items: cartItems, total } });
      }
    } catch (error) {
      console.error('Error loading cart from DB:', error);
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        } catch (e) {
          console.error('Error loading cart from localStorage:', e);
        }
      }
    }
  }, [getHeaders, lang]);

  const syncCart = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      if (isAuthenticated && token) {
        await fetch('/api/cart/merge', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ sessionId }),
        });
      }
      await loadCartFromDB();
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [getHeaders, isAuthenticated, loadCartFromDB, sessionId, token]);

  useEffect(() => {
    loadCartFromDB();
  }, [loadCartFromDB]);

  useEffect(() => {
    if (isAuthenticated && token) {
      syncCart();
    }
  }, [isAuthenticated, token, syncCart]);

  // Re-fetch cart with new language translations when lang changes (skip initial render)
  const isFirstLangRender = useRef(true);
  useEffect(() => {
    if (isFirstLangRender.current) {
      isFirstLangRender.current = false;
      return;
    }
    loadCartFromDB(lang);
  }, [lang, loadCartFromDB]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addItem = async (product: Product, selectedColor?: string, selectedSize?: string) => {
    // Always store the original English color name so image slug matching works
    // regardless of the active language. The display name is derived from product.colors.
    const colorObj = selectedColor ? product.colors?.find(c => c.name === selectedColor) : undefined;
    const colorToStore = colorObj?.original_name || selectedColor;

    dispatch({ type: 'ADD_ITEM', payload: { product, selectedColor: colorToStore, selectedSize } });

    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          color: colorToStore,
          size: selectedSize,
          lang,
        }),
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const removeItem = async (uniqueId: string) => {
    const cartItem = state.items.find(item => 
      getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) === uniqueId
    );

    dispatch({ type: 'REMOVE_ITEM', payload: uniqueId });

    try {
      if (cartItem?.cartItemId) {
        await fetch(`/api/cart/${cartItem.cartItemId}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const updateQuantity = async (uniqueId: string, quantity: number) => {
    const cartItem = state.items.find(item => 
      getCartItemUniqueId(item.product.id, item.selectedColor, item.selectedSize) === uniqueId
    );

    dispatch({ type: 'UPDATE_QUANTITY', payload: { uniqueId, quantity } });

    try {
      if (!cartItem?.cartItemId) return;

      if (quantity <= 0) {
        await fetch(`/api/cart/${cartItem.cartItemId}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
      } else {
        await fetch(`/api/cart/${cartItem.cartItemId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ quantity }),
        });
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        syncCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
