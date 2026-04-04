import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../utils/api';

// Generate or retrieve session ID (reuse same one from cart)
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

interface FavoriteItem {
  id: number;
  product_id: string;
  product_name: string;
  description: string;
  price: number;
  stock: number;
  stock_mode: 'unit' | 'apparel' | 'shoes';
  size_stock: { size: string; stock: number }[];
  colors: { name: string; hex: string }[];
  images: string[];
  category: string;
  category_id: number;
  featured: boolean;
  created_at: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  syncFavorites: () => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load favorites from database
  const loadFavoritesFromDB = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/favorites`, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
        // Also save to localStorage as backup
        localStorage.setItem('favorites', JSON.stringify(data.favorites || []));
      }
    } catch (error) {
      console.error('Error loading favorites from DB:', error);
      // Fallback to localStorage
      const savedFavorites = localStorage.getItem('favorites');
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (e) {
          console.error('Error parsing favorites from localStorage:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync favorites to database (merge on login)
  const syncFavorites = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // If user just logged in, merge session favorites with user favorites
      if (isAuthenticated && token) {
        await fetch(`${API_URL}/favorites/merge`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ sessionId }),
        });
      }

      // Reload favorites from DB
      await loadFavoritesFromDB();
    } catch (error) {
      console.error('Error syncing favorites:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load favorites on mount and when auth changes.
  // If authenticated, sync (merge session favorites) then load.
  // If not, just load. Single effect prevents the double-fetch that
  // occurs when two effects share the same dependency array.
  useEffect(() => {
    if (isAuthenticated && token) {
      syncFavorites();
    } else {
      loadFavoritesFromDB();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const addToFavorites = async (productId: string) => {
    try {
      const response = await fetch(`${API_URL}/favorites/add`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productId: productId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Added to favorites:', productId);
        // Reload favorites to get updated list
        await loadFavoritesFromDB();
      } else {
        console.error('Error adding to favorites:', data);
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const removeFromFavorites = async (productId: string) => {
    // Optimistically update UI
    setFavorites(prev => prev.filter(item => item.product_id !== productId));

    try {
      await fetch(`${API_URL}/favorites/product/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      // Reload to fix any inconsistencies
      await loadFavoritesFromDB();
    }
  };

  const clearFavorites = async () => {
    // Optimistically update UI
    setFavorites([]);

    try {
      await fetch(`${API_URL}/favorites`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some(item => item.product_id === productId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        clearFavorites,
        isFavorite,
        syncFavorites,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
