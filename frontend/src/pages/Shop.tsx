import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, ChevronLeft, Check } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FilterModal from '../components/FilterModal';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath, getShopPath } from '../utils/routes';

const PRODUCTS_PER_LOAD = 12;

// Função utilitária para converter nomes de categorias em slugs seguros
const toSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

const Shop: React.FC = () => {
  const { t, lang } = useLanguage();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();

  const { products: allProducts, loading, error } = useProducts();
  const { categories: allCategories } = useCategories();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [displayCount] = useState(PRODUCTS_PER_LOAD);

  // UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({ color: true, price: true });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect iOS for native select styling
  const isIOS = useMemo(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  const sortOptions = [
    { value: 'newest', label: t('shop.sort.newest') },
    { value: 'price_asc', label: t('shop.sort.priceLow') },
    { value: 'price_desc', label: t('shop.sort.priceHigh') }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const toggleFilter = (section: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // LÓGICA CORRIGIDA: Determina a categoria selecionada com base no slug do URL
  const selectedCategory = useMemo(() => {
    if (!categorySlug) return '';
    
    // Match by DB slug first (language-agnostic), then fall back to name-derived slug
    const cat = allCategories.find(c => c.slug === categorySlug.toLowerCase() || toSlug(c.name) === categorySlug.toLowerCase());
    
    // Retorna o nome real da categoria (com maiúsculas e espaços) ou, em último caso, o próprio slug
    return cat ? cat.name : categorySlug;
  }, [categorySlug, allCategories]);

  // LÓGICA CORRIGIDA: Navega para a categoria selecionada convertendo o nome num slug limpo
  const handleCategoryChange = (categoryName: string) => {
    if (!categoryName || categoryName === selectedCategory) {
      navigate(getShopPath(lang)); // Vai para a raiz da loja ("Todas")
    } else {
      navigate(getShopPath(lang, toSlug(categoryName))); // Vai para a categoria específica
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const togglePrice = (priceId: string) => {
    setSelectedPrices(prev => prev.includes(priceId) ? prev.filter(p => p !== priceId) : [...prev, priceId]);
  };

  const availableColors = useMemo(
    () => Array.from(new Set(allProducts.flatMap(product => product.colors.map(color => color.name)))),
    [allProducts]
  );

  // Get unique colors with their hex values for filter buttons
  const uniqueColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    allProducts.forEach(product => {
      product.colors.forEach(color => {
        if (color.hex && !colorMap.has(color.hex)) {
          colorMap.set(color.hex, color.name);
        }
      });
    });
    return Array.from(colorMap.entries()).map(([hex, name]) => ({ hex, name }));
  }, [allProducts]);

  // Calculate dynamic price brackets based on actual product prices
  const priceBrackets = useMemo(() => {
    if (allProducts.length === 0) {
      return [
        { id: '0-49', label: '€ 0,00 - € 49,99' },
        { id: '50-99', label: '€ 50,00 - € 99,99' },
        { id: '100-199', label: '€ 100,00 - € 199,99' }
      ];
    }

    const prices = allProducts.map(p => p.price);
    const maxPrice = Math.max(...prices);

    // Create brackets dynamically
    const brackets: { id: string; label: string }[] = [];
    const step = 50; // €50 increments

    let currentMin = 0;
    while (currentMin < maxPrice) {
      const currentMax = currentMin + step - 0.01;
      const hasProducts = prices.some(p => p >= currentMin && p < currentMin + step);

      if (hasProducts) {
        brackets.push({
          id: `${currentMin}-${currentMin + step - 1}`,
          label: `€ ${currentMin.toFixed(2)} - € ${currentMax.toFixed(2)}`
        });
      }

      currentMin += step;

      // Limit to reasonable number of brackets
      if (brackets.length >= 10) break;
    }

    // Add a final bracket for remaining high prices if needed
    if (maxPrice >= currentMin) {
      brackets.push({
        id: `${currentMin}+`,
        label: `€ ${currentMin.toFixed(2)}+`
      });
    }

    return brackets;
  }, [allProducts]);

  const selectedColor = selectedColors[0] ?? '';

  const handleColorChange = (value: string) => {
    if (!value) {
      setSelectedColors([]);
      return;
    }
    setSelectedColors([value]);
  };

  const maxProductPrice = useMemo(
    () => Math.max(100, ...allProducts.map(product => product.price)),
    [allProducts]
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const clearFilters = () => {
    setSortBy('newest');
    setSelectedColors([]);
    setSelectedPrices([]);
    setPriceRange([0, 100]);
    if (selectedCategory) {
      navigate(getShopPath(lang));
    }
  };

  // THE ENGINE
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // LÓGICA CORRIGIDA: Compara o slug da categoria do produto com o slug da categoria selecionada
      const matchesCategory = !selectedCategory || toSlug(product.category) === toSlug(selectedCategory);
      
      const matchesColor = selectedColors.length === 0 || product.colors.some(c => selectedColors.includes(c.hex));

      const matchesPrice = selectedPrices.length === 0 || selectedPrices.some(bracket => {
        // Handle dynamic price brackets
        if (bracket.endsWith('+')) {
          const minPrice = parseInt(bracket.replace('+', ''));
          return product.price >= minPrice;
        }

        const [min, max] = bracket.split('-').map(Number);
        return product.price >= min && product.price < max + 1;
      });

      const minPrice = (priceRange[0] / 100) * maxProductPrice;
      const maxPrice = (priceRange[1] / 100) * maxProductPrice;
      const matchesPriceRange = product.price >= minPrice && product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesColor && matchesPrice && matchesPriceRange;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'newest': return b.new ? -1 : 1;
        default: return 0;
      }
    });

    return filtered;
  }, [allProducts, searchTerm, selectedCategory, selectedColors, selectedPrices, sortBy, priceRange, maxProductPrice]);

  const currentProducts = filteredProducts.slice(0, displayCount);

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{t('common.error')} {error}</div>;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-gray-900 font-sans relative pb-24 lg:pb-0">
      <FilterModal
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        categories={allCategories.map(category => category.name)}
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
        colors={availableColors}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        onClearFilters={clearFilters}
      />

      {/* Header */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-12 pb-6">
        <div className="lg:hidden mb-6">
          <Link to={getRoutePath('shop', lang)} className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <ChevronLeft size={16} strokeWidth={2.5} /> {t('shop.title')}
          </Link>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight">
          {selectedCategory ? selectedCategory : t('common.newArrivals')}
        </h1>
        <p className="text-sm lg:text-base text-gray-600 max-w-2xl mb-6 lg:mb-8">
          {t('shop.tagline')}
        </p>

        {/* Top Nav */}
        <div className="-mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
          <div className="flex gap-6 overflow-x-auto border-b border-gray-300 pb-4 text-sm font-medium whitespace-nowrap scrollbar-hide pr-4 sm:pr-6 lg:pr-0">
            <button onClick={() => handleCategoryChange('')} className={`${!selectedCategory ? 'text-black border-b-4 border-gray-400 pb-[14px] -mb-[18px]' : 'text-gray-600'} flex-shrink-0`}>{t('shop.allItems')}</button>
            {allCategories.map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryChange(cat.name)} className={`${selectedCategory === cat.name ? 'text-black border-b-4 border-gray-400 pb-[14px] -mb-[18px]' : 'text-gray-600'} flex-shrink-0`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row gap-8">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" placeholder={t('shop.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-sm focus:ring-black focus:border-black" />
          </div>

          {/* Color Grid */}
          <div className="border-t border-gray-200 py-4">
            <button onClick={() => toggleFilter('color')} className="flex justify-between items-center w-full text-left font-medium text-sm">
              {t('common.color')} {expandedFilters.color ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedFilters.color && (
              <div className="mt-4 space-y-3 px-2">
                {uniqueColors.map(color => (
                  <button
                    key={color.hex}
                    onClick={() => toggleColor(color.hex)}
                    className={`flex items-center gap-3 group w-full text-left ${selectedColors.includes(color.hex) ? 'font-bold' : ''}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full border border-gray-300 shadow-sm flex-shrink-0 ${selectedColors.includes(color.hex) ? 'ring-2 ring-black ring-offset-2' : ''}`}
                      style={{ backgroundColor: color.hex }}
                    ></span>
                    <span className="text-sm group-hover:underline">{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Checkboxes */}
          <div className="border-y border-gray-200 py-4">
            <button onClick={() => toggleFilter('price')} className="flex justify-between items-center w-full text-left font-medium text-sm">
              {t('common.price')} {expandedFilters.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedFilters.price && (
              <div className="mt-4 space-y-4">
                {priceBrackets.map((bracket) => (
                  <label key={bracket.id} className="flex items-start gap-3 text-sm cursor-pointer group">
                    <input type="checkbox" checked={selectedPrices.includes(bracket.id)} onChange={() => togglePrice(bracket.id)} className="w-4 h-4 mt-0.5 rounded-sm border-2 border-gray-400 text-black focus:ring-black cursor-pointer" />
                    <span className="group-hover:underline text-gray-900 font-bold leading-tight">{bracket.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6 text-sm font-medium">
            <span className="text-gray-900 font-bold">{filteredProducts.length} {t('shop.items')}</span>
            <div className="hidden lg:flex items-center gap-2">
              {isIOS ? (
                // Native iOS select
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border-none bg-transparent focus:ring-0 cursor-pointer font-medium text-sm pr-8 appearance-none"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                // Custom styled dropdown for Desktop & Android
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent shadow-sm hover:shadow transition-all font-medium text-sm min-w-[200px]"
                  >
                    <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full min-w-[240px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group
                            ${sortBy === option.value
                              ? 'bg-gray-50 text-black font-semibold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                            }
                          `}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <Check className="h-4 w-4 text-black" strokeWidth={2.5} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-8 lg:gap-x-6 lg:gap-y-10">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} selectedColorHex={selectedColors[0]} />
            ))}
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 lg:hidden">
        <button onClick={() => setShowMobileFilters(true)} className="flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform">
          {t('shop.filterSort')} <SlidersHorizontal size={16} />
        </button>
      </div>
    </div>
  );
};

export default Shop;