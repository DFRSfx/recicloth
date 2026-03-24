import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../../utils/apiHelpers';
import { Euro, ShoppingCart, Package, AlertTriangle, Users } from 'lucide-react';
import { getAbsoluteImageUrl, imgVariant } from '../../utils/imageUtils';

interface Stats {
  totalOrders: number;
  totalRevenue: string;
  totalProducts: number;
  pendingOrders: number;
  totalUsers: number;
  recentOrders: any[];
  lowStockProducts: any[];
  salesByCategory: Record<string, { total: number; quantity: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsApi.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      processing: 'A Processar',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">A carregar estatísticas do dashboard...</span>
      </div>
    );
  }

  return (
    <main className="space-y-6 sm:space-y-8 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Bem-vindo à sua visão geral da loja</p>
      </div>

      {/* Stats Cards - Layout agora é 100% consistente em todas as resoluções */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 xl:gap-6">
        
        {/* Cartão de Receita - Ocupa 2 colunas em mobile */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-xl border border-secondary-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Receita Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-1 truncate">
                €{stats?.totalRevenue || '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-green-100 rounded-xl flex items-center justify-center">
              <Euro className="text-green-600 w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Cartões Restantes - Agora alinhados horizontalmente (Texto Esq. / Ícone Dir.) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-secondary-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Encomendas</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-1 truncate">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <ShoppingCart className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-secondary-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Produtos</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-1 truncate">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Package className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-secondary-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-1 truncate">
                {stats?.pendingOrders || 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-secondary-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">Utilizadores</p>
              <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-1 truncate">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Users className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Listas Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Encomendas Recentes */}
        <section className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-secondary-200 bg-tertiary-100/50">
            <h2 className="font-semibold text-[#1A1A1A] text-sm sm:text-base">Encomendas Recentes</h2>
          </div>
          <div className="p-4 sm:p-5">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/encomendas/${order.id}`}
                    aria-label={`Ver detalhes da encomenda número ${order.id} de ${order.customer_name}`}
                    className="block p-3 sm:p-4 border border-gray-100 rounded-xl hover:border-primary-300 hover:bg-primary-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1A1A] text-sm sm:text-base truncate">Encomenda #{order.id}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{order.customer_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <p className="font-semibold text-[#1A1A1A] text-sm sm:text-base">€{Number(order.total).toFixed(2)}</p>
                        <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium tracking-wide ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">Sem encomendas recentes</p>
            )}
          </div>
        </section>

        {/* Alertas de Stock */}
        <section className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-secondary-200 bg-tertiary-100/50">
            <h2 className="font-semibold text-[#1A1A1A] text-sm sm:text-base">Alerta de Stock Baixo</h2>
          </div>
          <div className="p-4 sm:p-5">
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/admin/produtos/editar/${product.id}`}
                    aria-label={`Editar stock do produto ${product.name}. Apenas ${product.stock} em stock.`}
                    className="block p-3 sm:p-4 border border-red-100 bg-red-50/30 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <img
                        src={product.images && product.images.length > 0 ? getAbsoluteImageUrl(imgVariant(product.images[0], 'sm')) : '/placeholder.png'}
                        alt={`Imagem de ${product.name}`}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1A1A1A] text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-red-600">{product.stock}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-medium">em stock</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">Todos os produtos bem abastecidos</p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}