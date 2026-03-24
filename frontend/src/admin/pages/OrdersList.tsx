import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../utils/apiHelpers';
import { Eye, Search, Calendar, CreditCard } from 'lucide-react';
import AdminSelect from '../components/AdminSelect';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, selectedStatus, orders]);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toString().includes(searchTerm)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(o => o.status === selectedStatus);
    }

    setFilteredOrders(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-PT', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':    return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':  return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':  return 'bg-red-100 text-red-800 border-red-200';
      default:           return 'bg-gray-100 text-gray-800 border-secondary-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':    return 'Pendente';
      case 'processing': return 'A Processar';
      case 'shipped':    return 'Enviado';
      case 'delivered':  return 'Entregue';
      case 'cancelled':  return 'Cancelado';
      default:           return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">A carregar lista de encomendas...</span>
      </div>
    );
  }

  return (
    <main className="space-y-6 sm:space-y-8 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Encomendas</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Gira as encomendas da sua loja</p>
      </div>

      {/* Caixa Combinada (Filtros + Lista/Tabela) */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
        
        {/* Filtros */}
        <div className="p-4 border-b border-secondary-200 bg-tertiary-100/50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <label htmlFor="search-orders" className="sr-only">Pesquisar encomendas</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
              <input
                id="search-orders"
                type="text"
                placeholder="Pesquisar por nome, email ou nº..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="status-filter" className="sr-only">Filtrar por estado</label>
              <AdminSelect
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                wrapperClassName="w-full"
                options={[
                  { value: 'all', label: 'Todos os estados' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'processing', label: 'A Processar' },
                  { value: 'shipped', label: 'Enviado' },
                  { value: 'delivered', label: 'Entregue' },
                  { value: 'cancelled', label: 'Cancelado' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* --- VISTA MOBILE: CARTÕES (Mostrada apenas em ecrãs pequenos) --- */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredOrders.map((order) => {
            const { date, time } = formatDate(order.created_at);
            return (
              <div key={order.id} className="p-4 hover:bg-tertiary-100/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-bold text-[#1A1A1A]">#{order.id}</span>
                    <h3 className="text-base font-medium text-[#1A1A1A] mt-1">{order.customer_name}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-2 text-gray-400" />
                    <span>{date} às {time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard size={14} className="mr-2 text-gray-400" />
                    <span className="uppercase">{order.payment_method}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                  <div className="text-lg font-bold text-[#1A1A1A]">
                    €{Number(order.total).toFixed(2)}
                  </div>
                  <Link
                    to={`/admin/encomendas/${order.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Eye size={16} className="mr-2" />
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- VISTA DESKTOP/TABLET: TABELA (Mostrada apenas a partir de 'md') --- */}
        <div className="hidden md:block overflow-x-auto w-full">
          {/* Removido o min-w forçado para a tabela respirar no tablet */}
          <table className="w-full text-left border-collapse"> 
            <thead>
              <tr className="bg-white border-b border-secondary-200 text-xs text-gray-500 uppercase tracking-wider">
                <th scope="col" className="px-4 py-4 font-medium whitespace-nowrap">Nº</th>
                <th scope="col" className="px-4 py-4 font-medium">Cliente</th>
                <th scope="col" className="px-4 py-4 font-medium">Data</th>
                <th scope="col" className="px-4 py-4 font-medium text-right">Total</th>
                <th scope="col" className="px-4 py-4 font-medium text-center">Estado</th>
                <th scope="col" className="px-4 py-4 font-medium text-center">Método</th>
                <th scope="col" className="px-4 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const { date, time } = formatDate(order.created_at);
                return (
                  <tr key={order.id} className="hover:bg-tertiary-100/80 transition-colors group">
                    <td className="px-4 py-4 text-sm font-semibold text-[#1A1A1A] whitespace-nowrap">
                      #{order.id}
                    </td>
                    <td className="px-4 py-4 min-w-[160px] lg:min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#1A1A1A] truncate">{order.customer_name}</span>
                        <span className="text-xs text-gray-500 truncate">{order.customer_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-800">{date}</span>
                        <span className="text-xs text-gray-500">{time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-[#1A1A1A] text-right whitespace-nowrap">
                      €{Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-medium tracking-wide border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs lg:text-sm text-gray-600 text-center uppercase tracking-wider whitespace-nowrap">
                      {order.payment_method}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end">
                        <Link
                          to={`/admin/encomendas/${order.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label={`Ver detalhes da encomenda número ${order.id} de ${order.customer_name}`}
                        >
                          <Eye size={20} aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mensagem de Vazio (Serve para ambas as vistas) */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-16 px-6">
            <p className="text-gray-500 text-sm">Nenhuma encomenda encontrada com os critérios atuais.</p>
          </div>
        )}

      </div>
    </main>
  );
}