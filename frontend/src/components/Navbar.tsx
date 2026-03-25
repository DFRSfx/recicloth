import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, ShoppingCart, Heart, User, LogOut, Package, UserCircle, Settings } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { Product } from '../types';
import AuthModal from './AuthModal';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

const Navbar: React.FC = () => {
  const { products } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { user, isAuthenticated, logout, refreshUser, setAuthState } = useAuth();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();
  const { success, info } = useToast();

  const getCategoryImage = (categoryName: string): string | null => {
    const categoryProducts = products.filter(p => p.category === categoryName);
    if (categoryProducts.length === 0) return null;

    const randomProduct = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
    return randomProduct.images[0] ? getAbsoluteImageUrl(imgVariant(randomProduct.images[0], 'md')) : null;
  };

  const CategoryPlaceholder = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#e0e7ff', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#c7d2fe', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad1)" />
      <g transform="translate(100, 100)">
        <path d="M-30,-30 L30,-30 L30,30 L-30,30 Z" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="0" cy="-15" r="8" fill="#6366f1" opacity="0.6" />
        <path d="M-20,0 Q0,-10 20,0 T-20,20" fill="none" stroke="#6366f1" strokeWidth="2.5" opacity="0.6" />
      </g>
    </svg>
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) return;

    const processedCode = sessionStorage.getItem('google_oauth_processed_code');
    if (processedCode === code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    sessionStorage.setItem('google_oauth_processed_code', code);

    const processCode = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: window.location.origin }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Erro ao fazer login com Google');
        }
        const data = await res.json();
        setAuthState(data.token, data.user);
        window.history.replaceState({}, document.title, window.location.pathname);
        success('Bem-vindo! Login efetuado com sucesso 🎉');
      } catch {
        sessionStorage.removeItem('google_oauth_processed_code');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    processCode();
  }, []); 

  const [isOpen, setIsOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuClosing, setUserMenuClosing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasMoved, setHasMoved] = useState(false);

  const navigation = [
    { name: 'Início', href: '/' },
    { name: 'Loja', href: '/loja' },
    { name: 'Contato', href: '/contacto' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'loja' && pathParts[2]) {
      const slug = pathParts[2];
      const category = categories.find(cat => {
        const catSlug = cat.name.toLowerCase().replace(/\s+/g, '-');
        return catSlug === slug;
      });
      if (category) {
        setSelectedCategory(category.name);
      }
    } else if (pathParts[1] === 'loja') {
      setSelectedCategory('');
    } else {
      setSelectedCategory('');
    }
  }, [location.pathname, categories]);

  useEffect(() => {
    if (searchQuery.trim().length > 0 && products.length > 0) {
      const results = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchButtonRef.current && searchButtonRef.current.contains(event.target as Node)) return;

      if (searchRef.current && !searchRef.current.contains(event.target as Node) && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        handleCloseUserMenu();
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  const handleProductClick = (productId: string) => {
    navigate(`/produto/${productId}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleCloseMenu = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsMenuClosing(false);
    }, 200);
  };

  const handleCloseUserMenu = () => {
    setUserMenuClosing(true);
    setTimeout(() => {
      setUserMenuOpen(false);
      setUserMenuClosing(false);
    }, 300);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    handleCloseUserMenu();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoriesRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) setHasMoved(true);
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!categoriesRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.touches[0].pageX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !categoriesRef.current) return;
    const x = e.touches[0].pageX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) setHasMoved(true);
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleCategoryClick = (categoryName: string) => {
    if (hasMoved) return; 
    const wasSelected = selectedCategory === categoryName;
    setSelectedCategory(wasSelected ? '' : categoryName);

    if (wasSelected) {
      navigate('/loja');
    } else {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      navigate(`/loja/${slug}`);
    }
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) setSearchQuery('');
  };

  return (
    <>
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between py-4 gap-6">
          
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center gap-8 lg:gap-12 flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="Recicloth"
                className="h-12 w-auto" 
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                item.name === 'Loja' ? (
                  <div key={item.name} className="relative h-full flex items-center" ref={megaMenuRef}>
                    <button
                      onMouseEnter={() => setMegaMenuOpen(true)}
                      onClick={() => navigate('/loja')}
                      className={`text-[16px] font-medium transition-colors duration-200 pb-1 border-b-2 ${
                        isActive(item.href)
                          ? 'text-primary-800 border-primary-800'
                          : 'text-gray-600 border-transparent hover:text-primary-800'
                      }`}
                    >
                      {item.name}
                    </button>

                    {/* Mega Menu */}
                    {megaMenuOpen && (
                      <div
                        className="absolute top-full left-0 mt-6 w-screen max-w-4xl bg-white rounded-lg shadow-2xl z-50 animate-fadeIn border border-gray-100"
                        onMouseEnter={() => setMegaMenuOpen(true)}
                        onMouseLeave={() => setMegaMenuOpen(false)}
                      >
                        <div className="p-8">
                          <h3 className="text-xl font-semibold text-gray-900 mb-6">Explorar Categorias</h3>
                          {categoriesLoading ? (
                            <div className="grid grid-cols-3 gap-6">
                              {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="animate-pulse">
                                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-6">
                              <Link
                                to="/loja"
                                onClick={() => setMegaMenuOpen(false)}
                                className="group relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                              >
                                <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                  <span className="text-4xl font-bold text-primary-600">Todas</span>
                                </div>
                                <div className="p-4 bg-white">
                                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    Todas as Categorias
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">Ver todos os produtos</p>
                                </div>
                              </Link>

                              {categories.length > 0 && categories.map((category) => {
                                const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
                                const categoryImage = getCategoryImage(category.name);
                                return (
                                  <Link
                                    key={category.id}
                                    to={`/loja/${slug}`}
                                    onClick={() => setMegaMenuOpen(false)}
                                    className="group relative overflow-hidden rounded-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                                  >
                                    <div className="aspect-square overflow-hidden bg-gray-50">
                                      {categoryImage ? (
                                        <img
                                          src={categoryImage}
                                          alt={category.name}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                          }}
                                        />
                                      ) : null}
                                      <div className={categoryImage ? 'hidden' : ''}>
                                        <CategoryPlaceholder />
                                      </div>
                                    </div>
                                    <div className="p-4 bg-white">
                                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                        {category.name}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {category.description || 'Explorar produtos'}
                                      </p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-[16px] font-medium transition-colors duration-200 pb-1 border-b-2 ${
                      isActive(item.href)
                        ? 'text-primary-800 border-primary-800'
                        : 'text-gray-600 border-transparent hover:text-primary-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Centered Desktop Search Bar */}
          <div className="hidden md:flex flex-1 justify-center max-w-2xl" ref={searchRef}>
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Procurar produtos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-800 focus:border-primary-800 text-sm placeholder-gray-400 transition-colors"
              />

              {/* Search Results Dropdown */}
              {searchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute top-full mt-3 w-full bg-white rounded-lg shadow-xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                        >
                          <img
                            src={getAbsoluteImageUrl(imgVariant(product.images[0], 'sm'))}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                          <p className="text-sm font-semibold text-primary-800">{product.price.toFixed(2)}€</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <p>Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-5 flex-shrink-0 text-gray-800">
            {/* Search Icon Mobile */}
            <button
              ref={searchButtonRef}
              onClick={handleSearchToggle}
              aria-label={searchOpen ? 'Fechar pesquisa' : 'Pesquisar'}
              className="md:hidden hover:text-black transition-colors"
            >
              <Search className="h-6 w-6" strokeWidth={1.5} />
            </button>

            {/* Heart Icon Desktop */}
            <Link to="/favoritos" aria-label="Favoritos" className="hidden md:block hover:text-black transition-colors relative">
              <Heart className="h-6 w-6" strokeWidth={1.5} />
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary-800 text-white rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center shadow-sm">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart Icon Mobile & Desktop */}
            <Link to="/carrinho" aria-label="Carrinho" className="hover:text-black transition-colors relative">
              <ShoppingCart className="h-6 w-6" strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary-800 text-white rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Icon Desktop */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="A minha conta"
                className="hover:text-black transition-colors"
              >
                <User className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* Hamburger/Close Menu Mobile */}
            <button
              onClick={() => isOpen ? handleCloseMenu() : setIsOpen(true)}
              aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
              className="md:hidden hover:text-black transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input (Visible only when toggled on mobile) */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-4 pt-2">
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                name="search"
                placeholder="Procurar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-800 focus:border-primary-800 text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

              {searchQuery.trim().length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto z-50 animate-slideInTop border border-gray-100">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product.id)}
                          className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                        >
                          <img src={getAbsoluteImageUrl(imgVariant(product.images[0], 'sm'))} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                          <p className="text-sm font-semibold text-primary-800">{product.price.toFixed(2)}€</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <p>Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu Dropdown */}
        {(isOpen || isMenuClosing) && (
          <div className={`md:hidden absolute w-full left-0 bg-white border-b border-gray-100 shadow-sm ${isMenuClosing ? 'animate-menuSlideUp' : 'animate-menuSlideDown'}`}>
            <div className="px-4 pt-2 pb-4 space-y-1">
              
              {/* Navigation Links */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleCloseMenu}
                  className={`block px-4 py-3 text-[15px] rounded-md transition-colors ${
                    isActive(item.href) ? 'text-primary-900 bg-primary-50 font-medium' : 'text-gray-700 hover:text-primary-900 hover:bg-primary-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-2 mx-2"></div>

              {/* Favorites - Mobile */}
              <Link to="/favoritos" onClick={handleCloseMenu} className="w-full flex items-center justify-between px-4 py-3 rounded-md text-[15px] text-gray-700 hover:text-primary-900 hover:bg-primary-50 transition-colors">
                <div className="flex items-center gap-3"><Heart className="h-5 w-5 text-gray-500" strokeWidth={1.5} /> Favoritos</div>
                {favorites.length > 0 && <span className="bg-primary-800 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">{favorites.length}</span>}
              </Link>

              {/* Cart - Mobile */}
              <Link to="/carrinho" onClick={handleCloseMenu} className="w-full flex items-center justify-between px-4 py-3 rounded-md text-[15px] text-gray-700 hover:text-primary-900 hover:bg-primary-50 transition-colors">
                <div className="flex items-center gap-3"><ShoppingCart className="h-5 w-5 text-gray-500" strokeWidth={1.5} /> Carrinho</div>
                {itemCount > 0 && <span className="bg-primary-800 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">{itemCount}</span>}
              </Link>

              <div className="border-t border-gray-100 my-2 mx-2"></div>

              {/* User Account - Mobile */}
              <button
                onClick={() => {
                  handleCloseMenu();
                  setTimeout(() => setUserMenuOpen(true), 200);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-[15px] text-gray-700 hover:text-primary-900 hover:bg-primary-50 transition-colors"
              >
                <User className="h-5 w-5 text-gray-500" strokeWidth={1.5} /> Minha Conta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categories Row - Desktop */}
      <div className="hidden md:block">
        <div
          ref={categoriesRef}
          className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-10 py-4 justify-center min-w-max">
              {categoriesLoading ? (
                <div className="flex gap-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-5 w-20 bg-gray-100 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`flex-shrink-0 transition-colors duration-200 whitespace-nowrap text-[15px] ${
                      selectedCategory === category.name
                        ? 'text-gray-900 font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {category.name}
                  </button>
                ))
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Categories Row - Mobile (Keeps functionality but distinct structure) */}
    <div className="md:hidden border-b border-gray-100 bg-white">
      <div
        ref={categoriesRef}
        className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 flex gap-6 py-3.5 justify-start min-w-max">
          {categoriesLoading ? (
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-5 w-20 bg-gray-100 animate-pulse rounded"></div>)}
            </div>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`flex-shrink-0 transition-colors duration-200 whitespace-nowrap text-[15px] ${
                  selectedCategory === category.name
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
            ))
          ) : null}
        </div>
      </div>
    </div>

    {/* User Menu Sidebar */}
    {userMenuOpen && (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${userMenuClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={handleCloseUserMenu}
        />

        {/* Sidebar */}
        <div className={`fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 overflow-y-auto ${userMenuClosing ? 'animate-slideOutRight' : 'animate-slideInRight'}`}>
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCloseUserMenu}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-gray-100 transition-all shadow-md"
              aria-label="Fechar menu"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* Content changes based on authentication */}
          {!isAuthenticated ? (
            <>
              {/* Header com gradiente - Not Authenticated */}
              <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 flex flex-col justify-end p-8 pt-20 pb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                  <div className="inline-block p-3 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Olá!</h2>
                  <p className="text-white/90 text-sm mb-6">
                    Ainda não és cliente da Recicloth?<br />
                    <span className="text-white/70 text-xs">O registo é fácil e grátis!</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleOpenAuthModal('register')}
                      className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-800 hover:scale-105 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl"
                    >
                      CRIAR CONTA
                    </button>
                    <button
                      onClick={() => handleOpenAuthModal('login')}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-white text-primary-800 rounded-lg hover:bg-primary-50 hover:scale-105 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl"
                    >
                      INICIAR SESSÃO
                    </button>
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Benefícios de Cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Package className="h-5 w-5 text-primary-800" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Produtos Exclusivos</h4>
                      <p className="text-xs text-gray-600 mt-1">Acesso a novos produtos em primeira mão</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Heart className="h-5 w-5 text-primary-800" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Promoções Especiais</h4>
                      <p className="text-xs text-gray-600 mt-1">Descontos e ofertas personalizadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header - Authenticated */}
              <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 flex flex-col justify-end p-8 pt-20 pb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                  <div className="inline-block p-3 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Olá, {user?.name?.split(' ')[0]}!
                  </h2>
                  <p className="text-white/90 text-sm">
                    {user?.email}
                  </p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                      Administrador
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Items - Authenticated */}
              <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  A Minha Conta
                </h3>
                <div className="flex flex-col gap-2">
                  <Link to="/perfil" onClick={handleCloseUserMenu} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-primary-50 transition-all border border-transparent hover:border-primary-200">
                    <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                      <UserCircle className="h-5 w-5 text-primary-800" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-800 transition-colors">Dados Pessoais</h4>
                      <p className="text-xs text-gray-500">Gerir informação da conta</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-primary-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>

                  <Link to="/encomendas" onClick={handleCloseUserMenu} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-primary-50 transition-all border border-transparent hover:border-primary-200">
                    <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                      <Package className="h-5 w-5 text-primary-800" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-800 transition-colors">As Minhas Encomendas</h4>
                      <p className="text-xs text-gray-500">Ver histórico de compras</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-primary-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>

                  <Link to="/favoritos" onClick={handleCloseUserMenu} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-primary-50 transition-all border border-transparent hover:border-primary-200">
                    <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors relative">
                      <Heart className="h-5 w-5 text-primary-800" />
                      {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-primary-800 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center">{favorites.length}</span>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-800 transition-colors">Favoritos</h4>
                      <p className="text-xs text-gray-500">{favorites.length === 0 ? 'Produtos guardados' : `${favorites.length} ${favorites.length === 1 ? 'produto' : 'produtos'}`}</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-primary-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>

                  {user?.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-200 my-3"></div>
                      <Link to="/admin" onClick={handleCloseUserMenu} className="group flex items-center gap-4 p-4 rounded-xl bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-all">
                        <div className="p-2 bg-primary-200 rounded-lg group-hover:bg-primary-300 transition-colors">
                          <Settings className="h-5 w-5 text-primary-800" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-primary-800">Painel de Administrador</h4>
                          <p className="text-xs text-primary-700">Gerir loja e produtos</p>
                        </div>
                        <svg className="h-5 w-5 text-primary-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      logout();
                      info('Sessão terminada. Até breve!');
                      handleCloseUserMenu();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    <LogOut className="h-5 w-5" /> Terminar Sessão
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </>
    )}

    {/* Auth Modal */}
    {authModalOpen && (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
      </GoogleOAuthProvider>
    )}
    </>
  );
};

export default Navbar;