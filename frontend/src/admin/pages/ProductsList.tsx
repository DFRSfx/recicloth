import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { productsApi } from '../../utils/apiHelpers';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import AdminSelect from '../components/AdminSelect';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAbsoluteImageUrl, imgVariant } from '../../utils/imageUtils';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  images?: string[];
  stock: number;
  featured: boolean;
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const { error: showError } = useToast();
  const { lang } = useLanguage();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll(lang);
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const filterProducts = useCallback(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category_name === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await productsApi.delete(deleteConfirm.id);
      setProducts(products.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Erro ao eliminar produto');
    }
  };

  const categoryNames = Array.from(
    new Set(
      products
        .map((p) => p.category_name)
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    )
  );
  const categories: string[] = ['all', ...categoryNames];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Produtos</h1>
        <Link
          to="/admin/produtos/novo"
          className="bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center touch-manipulation min-h-[44px]"
        >
          <Plus size={20} className="mr-2" />
          Adicionar Produto
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <AdminSelect
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
            options={categories.map(cat => ({ value: cat, label: cat === 'all' ? 'Todas as Categorias' : cat }))}
          />
        </div>
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-tertiary-100 border-b border-secondary-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-2/5">Produto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categoria</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Preço</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Destaque</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-tertiary-100 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={getAbsoluteImageUrl(imgVariant(product.images[0], 'sm'))}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23d1d5db" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1A1A1A]">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{product.category_name || '-'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">€{Number(product.price).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock <= 10
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.featured
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.featured ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/produtos/editar/${product.id}`}
                        className="p-3 text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Editar"
                        aria-label="Editar produto"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                        className="p-3 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Eliminar"
                        aria-label="Eliminar produto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Products Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden"
          >
            <div className="flex gap-4 p-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={getAbsoluteImageUrl(imgVariant(product.images[0], 'sm'))}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23d1d5db" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1A1A1A] text-base mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{product.category_name || 'Sem categoria'}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-primary-600">€{Number(product.price).toFixed(2)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.stock <= 10
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    Stock: {product.stock}
                  </span>
                  {!!product.featured && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      Destaque
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 p-4 pt-0">
              <Link
                to={`/admin/produtos/editar/${product.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 active:bg-primary-200 transition-colors touch-manipulation min-h-[44px] font-medium"
              >
                <Edit size={18} />
                <span>Editar</span>
              </Link>
              <button
                onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors touch-manipulation min-h-[44px] font-medium"
              >
                <Trash2 size={18} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-12 text-center">
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - PORTALED TO BODY */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
          
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity"
            onClick={() => setDeleteConfirm(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto transform transition-all">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] text-center mb-2">Eliminar Produto</h2>
              <p className="text-gray-600 text-center">
                Tem a certeza que deseja eliminar o produto <span className="font-semibold">"{deleteConfirm.name}"</span>?
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Esta ação não pode ser revertida.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-tertiary-100 active:bg-gray-100 transition-colors touch-manipulation min-h-[48px] font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[48px] font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body // <--- THIS IS THE MAGIC BULLET
      )}
    </div>
  );
}
