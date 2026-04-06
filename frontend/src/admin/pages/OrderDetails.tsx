import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersApi } from '../../utils/apiHelpers';
import { ArrowLeft, Package, User, MapPin, CreditCard, Calendar } from 'lucide-react';
import AdminSelect from '../components/AdminSelect';
import { getAbsoluteImageUrl } from '../../utils/imageUtils';
import { getPaymentMethodLabel } from '../../utils/paymentLabels';

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const data = await ordersApi.getOne(Number(id));
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const updateStatus = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pendente', processing: 'Em processamento',
      shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado'
    };
    if (!confirm(`Tem a certeza que pretende alterar o estado para "${statusLabels[newStatus] ?? newStatus}"?`)) return;

    setUpdating(true);
    try {
      await ordersApi.updateStatus(Number(id), newStatus);
      loadOrder();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Encomenda não encontrada</p>
      </div>
    );
  }

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/encomendas')}
          className="p-3 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Encomenda #{order.id}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Package className="mr-2" size={20} />
              Artigos
            </h2>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <img
                    src={item.product.image ? getAbsoluteImageUrl(item.product.image) : '/placeholder.png'}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">€{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">€{Number(item.price).toFixed(2)} cada</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-gray-800">Total</span>
                <span className="text-primary-600">€{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="mr-2" size={20} />
              Informações do Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium text-gray-800">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{order.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="font-medium text-gray-800">{order.customer_phone}</p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Morada de Entrega
            </h2>
            <div className="space-y-1">
              <p className="text-gray-800">{order.customer_address}</p>
              <p className="text-gray-800">{order.customer_city}</p>
              <p className="text-gray-800">{order.customer_postal_code}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Estado da Encomenda</h2>
            <AdminSelect
              value={order.status}
              onChange={(value) => updateStatus(value)}
              disabled={updating}
              wrapperClassName="w-full"
              options={statusOptions.map(status => ({
                value: status,
                label: ({ pending: 'Pendente', processing: 'Em processamento', shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' } as Record<string, string>)[status] ?? status,
              }))}
            />
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CreditCard className="mr-2" size={20} />
              Pagamento
            </h2>
            <p className="text-gray-800">{getPaymentMethodLabel(order.payment_method, 'pt')}</p>
          </div>

          {/* Date */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Data da Encomenda
            </h2>
            <p className="text-gray-800">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
