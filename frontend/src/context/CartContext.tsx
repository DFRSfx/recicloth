import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; selectedColor?: string } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

interface CartContextType extends CartState {
  addItem: (product: Product, selectedColor?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(
        item => item.product.id === action.payload.product.id && 
        item.selectedColor === action.payload.selectedColor
      );

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product.id === action.payload.product.id && 
          item.selectedColor === action.payload.selectedColor
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        return { items: updatedItems, total };
      }

      const newItems = [...state.items, { 
        product: action.payload.product, 
        quantity: 1,
        selectedColor: action.payload.selectedColor 
      }];
      const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      return { items: newItems, total };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      return { items: newItems, total };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter(item => item.product.id !== action.payload.productId);
        const total = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        return { items: newItems, total };
      }

      const newItems = state.items.map(item =>
        item.product.id === action.payload.productId
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
  const [sessionId] = useState(getSessionId());
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper to get headers
  const getHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Load cart from database
  const loadCartFromDB = async () => {
    try {
      const response = await fetch('/api/cart', {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        // Transform DB items to CartItem format
        const cartItems: CartItem[] = data.items.map((item: any) => ({
          cartItemId: item.id, // Store the cart_item ID for deletions
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            images: item.images,
            stock: item.stock,
            categoryId: item.category_id,
          },
          quantity: item.quantity,
          selectedColor: undefined, // TODO: Add color to DB if needed
        }));

        const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        dispatch({ type: 'LOAD_CART', payload: { items: cartItems, total } });
      }
    } catch (error) {
      console.error('Error loading cart from DB:', error);
      // Fallback to localStorage
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
  };

  // Sync cart to database
  const syncCart = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // If user just logged in, merge session cart with user cart
      if (isAuthenticated && token) {
        await fetch('/api/cart/merge', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ sessionId }),
        });
      }

      // Reload cart from DB
      await loadCartFromDB();
    } catch (error) {
      console.error('Error syncing cart:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load cart on mount and when auth changes
  useEffect(() => {
    loadCartFromDB();
  }, [isAuthenticated, token]);

  // Sync cart when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      syncCart();
    }
  }, [isAuthenticated, token]);

  // Save to localStorage as backup
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addItem = async (product: Product, selectedColor?: string) => {
    // Optimistically update UI
    dispatch({ type: 'ADD_ITEM', payload: { product, selectedColor } });

    // Sync with database
    try {
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      // The optimistic update is already done, so user won't notice
    }
  };

  const removeItem = async (productId: string) => {
    // Find the cart item to get its database ID
    const cartItem = state.items.find(item => item.product.id === productId);

    // Optimistically update UI
    dispatch({ type: 'REMOVE_ITEM', payload: productId });

    // Sync with database
    try {
      if (cartItem?.cartItemId) {
        // Use the cart_items table ID
        await fetch(`/api/cart/${cartItem.cartItemId}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    // Find the cart item to get its database ID
    const cartItem = state.items.find(item => item.product.id === productId);

    // Optimistically update UI
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });

    // Sync with database
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
    // Optimistically update UI
    dispatch({ type: 'CLEAR_CART' });

    // Sync with database
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
