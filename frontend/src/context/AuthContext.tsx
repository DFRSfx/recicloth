import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  emailVerified?: boolean;
  hasPassword?: boolean;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isEmailVerified: boolean;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
  setAuthState: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const lastUserRefreshRef = useRef<number>(
    Number(localStorage.getItem('auth_user_refreshed_at') || 0)
  );

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se houver erro de verificação de email, lançar erro específico
        if (data.requiresEmailVerification) {
          const error: any = new Error(data.error || 'Email não verificado');
          error.requiresEmailVerification = true;
          error.email = data.email;
          throw error;
        }
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      const now = Date.now();
      localStorage.setItem('auth_user_refreshed_at', String(now));
      lastUserRefreshRef.current = now;

      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await fetch('/api/auth/google/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      // Store token and user
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      const now = Date.now();
      localStorage.setItem('auth_user_refreshed_at', String(now));
      lastUserRefreshRef.current = now;

      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Registration failed');
      }

      // NÃO fazer login automático - user precisa verificar email primeiro
      // Token e user serão retornados mas não salvos até verificar email
      console.log('✅ Conta criada, aguardando verificação de email');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_user_refreshed_at');
    setToken(null);
    setUser(null);
  };

  const setAuthState = (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    const now = Date.now();
    localStorage.setItem('auth_user_refreshed_at', String(now));
    lastUserRefreshRef.current = now;
    setToken(token);
    setUser(user);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const now = Date.now();
    if (now - lastUserRefreshRef.current < USER_REFRESH_INTERVAL_MS) {
      return;
    }
    lastUserRefreshRef.current = now;
    localStorage.setItem('auth_user_refreshed_at', String(now));

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser((prev) => {
          if (!prev) return prev;
          const updatedUser = {
            ...prev,
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            emailVerified: data.email_verified || false,
            hasPassword: data.hasPassword ?? prev.hasPassword,
            avatarUrl: data.avatarUrl ?? prev.avatarUrl,
          };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isEmailVerified: user?.emailVerified ?? false,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    refreshUser,
    setAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook must be exported after the Provider component for Fast Refresh compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
