import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, X } from 'lucide-react';
import { Product } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useConfirmStore } from '../hooks/useConfirm';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, removeFromFavorites, clearFavorites, loading } = useFavorites();
  const openConfirm = useConfirmStore(state => state.openConfirm);
  const { t, lang } = useLanguage();
  const shopPath = getRoutePath('shop', lang);

  // Convert favorite items to Product format for ProductCard
  const favoriteProducts: Product[] = favorites.map((item) => ({
    id: item.product_id,
    name: item.product_name,
    description: item.description,
    price: item.price,
    images: item.images,
    category: item.category || '',
    colors: [],
    inStock: item.stock > 0,
    stock: item.stock,
    featured: item.featured,
    new: false,
    tags: [],
  }));

  const handleClearAllFavorites = () => {
    openConfirm({
      title: t('favorites.clearAll'),
      message: `${t('cart.clearConfirm.desc')}`,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        await clearFavorites();
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] py-8 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Heart className="h-7 w-7 text-[#1E4D3B] fill-current" />
              <h1 className="text-3xl lg:text-4xl font-bold text-[#0f172a] tracking-tight">
                {t('favorites.title')}
              </h1>
            </div>
            <p className="text-[#64748b] text-[15px]">
              {favorites.length === 0
                ? t('favorites.empty.title')
                : `${favorites.length} ${favorites.length === 1 ? t('favorites.productSingular') : t('favorites.productPlural')}`}
            </p>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={handleClearAllFavorites}
              className="flex items-center gap-2 text-sm text-[#dc2626] hover:text-[#b91c1c] transition-colors font-medium"
            >
              <Trash2 className="h-4 w-4" />
              {t('favorites.clearAll')}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E4D3B]"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 lg:p-24 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                {t('favorites.empty.title')}
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed text-[15px]">
                {t('favorites.empty.desc')}
              </p>
              <button
                onClick={() => navigate(shopPath)}
                className="px-8 py-3.5 bg-[#1E4D3B] text-white rounded font-medium hover:bg-[#163a2c] transition-colors shadow-sm"
              >
                {t('common.exploreProducts')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-12">
            {favoriteProducts.map((product) => (
              <div key={product.id} className="relative group h-full">

                {/* IMPORTANT UX FIX:
                  Instead of putting a random absolute button over the card which ruins the hover state,
                  we inject the remove button into the top right, but give it a solid white background
                  and high z-index so it clearly sits on top of the image slider.
                */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFromFavorites(product.id);
                  }}
                  className="absolute top-2 right-2 z-30 flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)] text-[#dc2626] hover:bg-white hover:scale-110 transition-all"
                  aria-label={t('favorites.removeAria')}
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>

                {/* Note: We pass hideActions={true} so ProductCard doesn't render its own
                  Heart button, which would conflict with our Remove button above.
                */}
                <ProductCard product={product} hideActions={true} />
              </div>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        {favorites.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-200 text-center">
            <button
              onClick={() => navigate(shopPath)}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-[#1E4D3B] text-[#1E4D3B] rounded font-medium hover:bg-gray-50 transition-colors"
            >
              {t('common.continueShopping')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
