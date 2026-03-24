import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, ChevronLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import FilterModal from '../components/FilterModal';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';

const PRODUCTS_PER_LOAD = 12;

const Shop: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  
  const { products: allProducts, loading, error } = useProducts();
  const { categories: allCategories } = useCategories();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [displayCount, setDisplayCount] = useState(PRODUCTS_PER_LOAD);
  
  // UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({ color: true, price: true });

  const toggleFilter = (section: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedCategory = useMemo(() => {
    if (!categorySlug) return '';
    const cat = allCategories.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase());
    return cat ? cat.name : '';
  }, [categorySlug, allCategories]);

  const handleCategoryChange = (category: string) => {
    if (!category || category === selectedCategory) navigate('/loja');
    else navigate(`/loja/${category.toLowerCase().replace(/\s+/g, '-')}`);
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
      navigate('/loja');
    }
  };

  // THE ENGINE
  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesColor = selectedColors.length === 0 || product.colors.some(c => selectedColors.includes(c.name));
      
      const matchesPrice = selectedPrices.length === 0 || selectedPrices.some(bracket => {
        if (bracket === '0-49') return product.price < 50;
        if (bracket === '50-99') return product.price >= 50 && product.price < 100;
        if (bracket === '100-199') return product.price >= 100 && product.price < 200;
        if (bracket === '200-299') return product.price >= 200 && product.price < 300;
        if (bracket === '300-399') return product.price >= 300 && product.price < 400;
        if (bracket === '400+') return product.price >= 400;
        return false;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;

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
          <Link to="/loja" className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <ChevronLeft size={16} strokeWidth={2.5} /> Shop by Category
          </Link>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3 tracking-tight">
          {selectedCategory ? selectedCategory : "Men's New Arrivals"}
        </h1>
        <p className="text-sm lg:text-base text-gray-600 max-w-2xl mb-6 lg:mb-8">
          Gear to connect with the places that make us feel small. Timeless designs for our future planet.
        </p>

        {/* Top Nav */}
        <div className="flex gap-6 overflow-x-auto border-b border-gray-300 pb-4 text-sm font-medium whitespace-nowrap hide-scrollbar">
          <button onClick={() => handleCategoryChange('')} className={`${!selectedCategory ? 'text-black border-b-4 border-gray-400 pb-[14px] -mb-[18px]' : 'text-gray-600'}`}>All Items</button>
          {allCategories.map((cat) => (
            <button key={cat.id} onClick={() => handleCategoryChange(cat.name)} className={`${selectedCategory === cat.name ? 'text-black border-b-4 border-gray-400 pb-[14px] -mb-[18px]' : 'text-gray-600'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row gap-8">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" placeholder="Procurar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-sm focus:ring-black focus:border-black" />
          </div>

          {/* Color Grid */}
          <div className="border-t border-gray-200 py-4">
            <button onClick={() => toggleFilter('color')} className="flex justify-between items-center w-full text-left font-medium text-sm">
              Color {expandedFilters.color ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedFilters.color && (
              <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-2 px-2">
                {/* Map your actual dynamic colors here. Using static array for the layout demo */}
                {['#1e3a8a', '#064e3b', '#000000', '#9ca3af'].map(colorHex => (
                  <button key={colorHex} onClick={() => toggleColor(colorHex)} className={`flex items-center gap-2 group ${selectedColors.includes(colorHex) ? 'ring-2 ring-black rounded-full' : ''}`}>
                    <span className="w-6 h-6 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: colorHex }}></span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Checkboxes */}
          <div className="border-y border-gray-200 py-4">
            <button onClick={() => toggleFilter('price')} className="flex justify-between items-center w-full text-left font-medium text-sm">
              Price {expandedFilters.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedFilters.price && (
              <div className="mt-4 space-y-4">
                {[
                  { id: '0-49', label: '€ 0,00 - € 49,99' },
                  { id: '50-99', label: '€ 50,00 - € 99,99' },
                  { id: '100-199', label: '€ 100,00 - € 199,99' }
                ].map((bracket) => (
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
            <span className="text-gray-900 font-bold">{filteredProducts.length} Items</span>
            <div className="hidden lg:flex items-center gap-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border-none bg-transparent font-medium text-sm focus:ring-0 cursor-pointer pr-8">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-8 lg:gap-x-6 lg:gap-y-10">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 lg:hidden">
        <button onClick={() => setShowMobileFilters(true)} className="flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform">
          Filter & Sort <SlidersHorizontal size={16} />
        </button>
      </div>
    </div>
  );
};

export default Shop;
