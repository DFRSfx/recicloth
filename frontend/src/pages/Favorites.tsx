import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Loader2, X } from 'lucide-react';
import { Product } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useConfirmStore } from '../hooks/useConfirm';
import ProductCard from '../components/ProductCard';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, removeFromFavorites, clearFavorites, loading } = useFavorites();
  const openConfirm = useConfirmStore(state => state.openConfirm);

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
      title: 'Limpar todos os favoritos?',
      message: `Tem a certeza que deseja remover todos os ${favorites.length} produtos dos favoritos? Esta ação não pode ser desfeita.`,
      confirmText: 'Remover Todos',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await clearFavorites();
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary-600 fill-current" />
              Os Meus Favoritos
            </h1>
            <p className="text-gray-600 mt-2">
              {favorites.length === 0
                ? 'Ainda não tem favoritos guardados'
                : `${favorites.length} ${favorites.length === 1 ? 'produto' : 'produtos'} guardado${
                    favorites.length === 1 ? '' : 's'
                  }`}
            </p>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={handleClearAllFavorites}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Favoritos
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Ainda sem favoritos
              </h3>
              <p className="text-gray-600 mb-8">
                Explore a nossa loja e adicione produtos à sua lista de favoritos para os encontrar
                facilmente mais tarde.
              </p>
              <button
                onClick={() => navigate('/loja')}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Explorar Produtos
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favoriteProducts.map((product) => (
              <div key={product.id} className="relative group h-full">
                {/* Remove Button - Always visible on mobile, hover on desktop */}
                <button
                  onClick={() => removeFromFavorites(product.id)}
                  className="absolute top-2 right-2 z-30 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:scale-110 transition-all md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Remover dos favoritos"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        {favorites.length > 0 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/loja')}
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors font-semibold"
            >
              Continuar a Comprar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
