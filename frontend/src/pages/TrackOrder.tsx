import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, CheckCircle, Truck, Clock, XCircle, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

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
  tracking_token: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'expired';
  payment_method: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const TrackOrder: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = '/api';

  useEffect(() => {
    if (token) {
      loadOrder();
    }
  }, [token]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/orders/track/${token}`);

      if (!response.ok) {
        throw new Error('Encomenda não encontrada');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar encomenda');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-8 w-8" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'Pagamento Pendente',
          description: 'Aguardando confirmação de pagamento'
        };
      case 'processing':
        return {
          icon: <Package className="h-8 w-8" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          text: 'Em Processamento',
          description: 'Estamos a preparar a sua encomenda'
        };
      case 'shipped':
        return {
          icon: <Truck className="h-8 w-8" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          text: 'Enviado',
          description: 'A sua encomenda está a caminho'
        };
      case 'delivered':
        return {
          icon: <CheckCircle className="h-8 w-8" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'Entregue',
          description: 'Encomenda entregue com sucesso'
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-8 w-8" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'Cancelado',
          description: 'Esta encomenda foi cancelada'
        };
      default:
        return {
          icon: <Package className="h-8 w-8" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'Desconhecido',
          description: ''
        };
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pago</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Falhado</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Expirado</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar encomenda...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Encomenda não encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Não foi possível encontrar a encomenda com este link.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`Rastrear Encomenda #${order.id}`}
        description="Acompanhe o estado da sua encomenda"
        canonical={`/track-order/${token}`}
        ogType="website"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Rastrear Encomenda
          </h1>
          <p className="text-gray-600 mt-2">
            Encomenda #{order.id} • {new Date(order.created_at).toLocaleDateString('pt-PT')}
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col items-center text-center mb-8">
            <div className={`${statusInfo.bgColor} ${statusInfo.color} rounded-full p-4 mb-4`}>
              {statusInfo.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {statusInfo.text}
            </h2>
            <p className="text-gray-600 mb-4">
              {statusInfo.description}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Estado do Pagamento:</span>
              {getPaymentStatusBadge(order.payment_status)}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {/* Pending */}
              <div className="relative flex items-start gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  order.status !== 'cancelled' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-gray-900">Pedido Criado</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleString('pt-PT')}
                  </p>
                </div>
              </div>

              {/* Processing */}
              <div className="relative flex items-start gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  ['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {['processing', 'shipped', 'delivered'].includes(order.status) ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Clock className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-gray-900">Em Processamento</p>
                  <p className="text-sm text-gray-600">
                    {['processing', 'shipped', 'delivered'].includes(order.status)
                      ? 'Concluído'
                      : 'Aguardando'}
                  </p>
                </div>
              </div>

              {/* Shipped */}
              <div className="relative flex items-start gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  ['shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {['shipped', 'delivered'].includes(order.status) ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Clock className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-gray-900">Enviado</p>
                  <p className="text-sm text-gray-600">
                    {['shipped', 'delivered'].includes(order.status)
                      ? 'Concluído'
                      : 'Aguardando'}
                  </p>
                </div>
              </div>

              {/* Delivered */}
              <div className="relative flex items-start gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {order.status === 'delivered' ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Clock className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-gray-900">Entregue</p>
                  <p className="text-sm text-gray-600">
                    {order.status === 'delivered' ? 'Concluído' : 'Aguardando'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Detalhes da Encomenda</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Nome:</span>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              <div>
                <span className="text-gray-600">Morada de Entrega:</span>
                <p className="font-medium">{order.customer_address}</p>
                <p className="font-medium">
                  {order.customer_postal_code} {order.customer_city}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Método de Pagamento:</span>
                <p className="font-medium capitalize">{order.payment_method}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Artigos</h3>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantity} × {parseFloat(String(item.price)).toFixed(2)}€
                    </p>
                  </div>
                  <span className="font-medium">
                    {(item.quantity * parseFloat(String(item.price))).toFixed(2)}€
                  </span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{parseFloat(String(order.total)).toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Precisa de ajuda?
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Se tiver alguma dúvida sobre a sua encomenda, entre em contacto connosco.
          </p>
          <a
            href="mailto:arteemponto1972@gmail.com"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            arteemponto1972@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
