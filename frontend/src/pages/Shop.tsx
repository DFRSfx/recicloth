import React, { useState, useMemo } from 'react';
import { Filter, Search, Grid2x2 as Grid, List, Maximize2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import FilterModal from '../components/FilterModal';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { getItemListSchema, getBreadcrumbSchema } from '../utils/schemas';

const PRODUCTS_PER_LOAD = 8;

const Shop: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const { products: allProducts, loading, error } = useProducts();
  const { categories: allCategories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'fullscreen'>('grid');
  const [displayCount, setDisplayCount] = useState(PRODUCTS_PER_LOAD);

  // Get category name from slug
  const selectedCategory = React.useMemo(() => {
    if (!categorySlug) return '';

    const category = allCategories.find(cat => {
      // Create slug from category name for comparison (lowercase, replace spaces with hyphens)
      const catSlug = cat.name.toLowerCase().replace(/\s+/g, '-');
      return catSlug === categorySlug.toLowerCase();
    });

    return category ? category.name : '';
  }, [categorySlug, allCategories]);

  const categories = [...new Set(allProducts.map(p => p.category))];
  const colors = [...new Set(allProducts.flatMap(p => p.colors))];

  // Handle category change and sync with URL
  const handleCategoryChange = (category: string) => {
    if (!category) {
      // No category - go to /loja
      navigate('/loja');
    } else {
      // Create slug from category name
      const slug = category.toLowerCase().replace(/\s+/g, '-');
      navigate(`/loja/${slug}`);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      // Handle URL filter parameters
      const urlParams = new URLSearchParams(window.location.search);
      const filterParam = urlParams.get('filter');

      if (filterParam === 'new' && !product.new) return false;
      if (filterParam === 'featured' && !product.featured) return false;

      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesColor = !selectedColor || product.colors.includes(selectedColor);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesColor && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'newest':
          return b.new === a.new ? 0 : b.new ? 1 : -1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, searchTerm, selectedCategory, selectedColor, priceRange, sortBy]);

  // Get products to display
  const currentProducts = filteredProducts.slice(0, displayCount);
  const hasMore = displayCount < filteredProducts.length;

  // Reset display count when filters change
  React.useEffect(() => {
    setDisplayCount(PRODUCTS_PER_LOAD);
  }, [searchTerm, selectedCategory, selectedColor, priceRange, sortBy]);

  // SEO setup
  const breadcrumbs = getBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: 'Loja', url: '/loja' },
  ]);

  const itemListSchema = getItemListSchema(currentProducts);

  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbs, itemListSchema],
  };

  const pageTitle = selectedCategory
    ? `${selectedCategory} em Croché Artesanal Feito à Mão`
    : 'Loja — Malas de Croché e Acessórios Artesanais Feitos à Mão em Portugal';

  const pageDescription = selectedCategory
    ? `Descubra a nossa coleção de ${selectedCategory.toLowerCase()} em croché artesanal feito à mão em Portugal. Peças únicas, de qualidade premium — perfeitas para oferecer.`
    : 'Explore a nossa loja online de malas de croché feitas à mão em Portugal. Acessórios de croché artesanais para oferecer, decoração de sala em croché artesanal e bolsas de croché personalizadas por encomenda.';

  const loadMore = () => {
    setDisplayCount(prev => prev + PRODUCTS_PER_LOAD);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedColor('');
    setPriceRange([0, 100]);
    handleCategoryChange(''); // Clear category and update URL
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar produtos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical="/loja"
        ogType="website"
        schema={schemas}
      />
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        colors={colors}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        onClearFilters={handleClearFilters}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossa Loja
          </h1>
          <p className="text-lg text-gray-600">
            Explore todos os nossos produtos de crochê
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="search"
                placeholder="Procurar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode - Desktop */}
              <div className="hidden sm:flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              {/* View Mode - Mobile */}
              <div className="flex sm:hidden border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  title="2x2 Grid"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('fullscreen')}
                  className={`p-2 ${viewMode === 'fullscreen' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  title="Tela Cheia"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-5 w-5" />
                Filtrar & Ordenar
              </button>
            </div>
          </div>

        </div>

        {/* Results - Only show if there are products */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            
            {(searchTerm || selectedCategory || selectedColor || priceRange[0] !== 0 || priceRange[1] !== 100) && (
              <button
                onClick={handleClearFilters}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {viewMode === 'fullscreen' ? (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-4">
                {currentProducts.map((product) => (
                  <div key={product.id} className="w-screen flex-shrink-0 snap-center px-4">
                    <ProductCard product={product} viewMode="fullscreen" />
                  </div>
                ))}
              </div>
            </div>
            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {currentProducts.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-gray-300"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-300 font-medium text-lg"
            >
              Carregar Mais
            </button>
          </div>
        )}

        {/* Empty State - Enhanced UI */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm mt-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-50 rounded-full">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Não encontramos produtos correspondentes aos seus filtros. 
              Tente limpar os filtros ou buscar por outro termo.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm font-medium"
            >
              Ver Todos os Produtos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;