import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import { getAbsoluteImageUrl } from '../utils/imageUtils';
import InvoiceModal from '../components/InvoiceModal';
import { InvoiceOrder } from '../utils/generateInvoice';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getProductPath, getRoutePath, getTrackOrderPath } from '../utils/routes';

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
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'expired';
  payment_method: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  order_items: OrderItem[];
}

const Orders: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const ordersPath = getRoutePath('orders', lang);
  const shopPath = getRoutePath('shop', lang);
  const homePath = getRoutePath('home', lang);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<InvoiceOrder | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = '/api';

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      if (!token) {
        console.error('No auth token available');
        setError(t('orders.error.noToken'));
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(t('orders.error.load'));
      }

      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || t('orders.error.load'));
    } finally {
      setLoading(false);
    }
  };

  // Remove mock data
  /*const [orders] = useState<Order[]>([
  */

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate(homePath);
    }
  }, [isAuthenticated, navigate, homePath]);

  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      pending: {
        label: t('orders.status.pending'),
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      },
      processing: {
        label: t('orders.status.processing'),
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      shipped: {
        label: t('orders.status.shipped'),
        icon: Truck,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      delivered: {
        label: t('orders.status.delivered'),
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      cancelled: {
        label: t('orders.status.cancelled'),
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      },
    };
    return configs[status];
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">{t('orders.status.paid')}</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">{t('orders.status.pending')}</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">{t('orders.status.failed')}</span>;
      case 'expired':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{t('orders.status.expired')}</span>;
      default:
        return null;
    }
  };

  const toggleOrder = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SEO
        title={t('admin.nav.orders')}
        description={t('orders.error.load')}
        canonical={ordersPath}
        ogType="website"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.nav.orders')}</h1>
          <p className="text-gray-600 mt-2">{t('orders.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('orders.empty.title')}</h3>
            <p className="text-gray-600 mb-6">{t('orders.empty.desc')}</p>
            <button
              onClick={() => navigate(shopPath)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('common.exploreProducts')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div
                    onClick={() => toggleOrder(order.id)}
                    onKeyDown={(e) => {
                      // Allow keyboard users to trigger the toggle with Enter or Space
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleOrder(order.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-100 focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  >
                    <div className="flex items-start justify-between gap-4">

                      {/* Left Side: Order Info & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">

                        {/* Text Data (Grid ensures they align nicely on tiny screens) */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                          <div>
                            <p className="text-sm text-gray-500">{t('orders.orderLabel')}</p>
                            <p className="font-semibold text-gray-900">#{order.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('orders.dateLabel')}</p>
                            <p className="font-medium text-gray-900">
                              {new Date(order.created_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t('cart.total')}</p>
                            <p className="font-semibold text-gray-900">{Number(order.total).toFixed(2)}€</p>
                          </div>
                        </div>

                        {/* Status Badges (Now wrap properly on mobile) */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                          >
                            <StatusIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{statusConfig.label}</span>
                          </span>
                          {getPaymentStatusBadge(order.payment_status)}
                        </div>

                      </div>

                      {/* Right Side: Chevron Icon */}
                      <div className="p-1 mt-1 sm:mt-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600 shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600 shrink-0" />
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Order Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Order Items */}
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-gray-900 mb-4">{t('admin.nav.products')}</h4>
                          <div className="space-y-4">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 bg-white p-4 rounded-lg"
                              >
                                <img
                                  src={getAbsoluteImageUrl(item.product.image)}
                                  alt={item.product.name}
                                  className="w-20 h-20 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/placeholder.jpg';
                                  }}
                                />
                                <div className="flex-1">
                                  <Link
                                    to={getProductPath(lang, item.product.id)}
                                    className="font-medium text-gray-900 hover:text-primary-600"
                                  >
                                    {item.product.name}
                                  </Link>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {t('orders.quantityLabel')}: {item.quantity} × {item.price.toFixed(2)}€
                                  </p>
                                </div>
                                <p className="font-semibold text-gray-900">
                                  {(item.quantity * item.price).toFixed(2)}€
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">{t('orders.infoTitle')}</h4>
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">{t('orders.shippingAddress')}</p>
                              <p className="text-sm text-gray-900">{order.customer_address}</p>
                              <p className="text-sm text-gray-900">{order.customer_postal_code} {order.customer_city}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">{t('orders.paymentMethod')}</p>
                              <p className="text-sm text-gray-900 capitalize">{order.payment_method}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">{t('cart.total')}</p>
                              <p className="text-lg font-bold text-primary-600">
                                {Number(order.total).toFixed(2)}€
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 space-y-2">
                            <Link
                              to={getTrackOrderPath(lang, order.tracking_token)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              {t('checkout.success.trackOrder')}
                            </Link>
                            {order.payment_status === 'paid' && (
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-primary-600 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                              >
                                <FileText className="h-4 w-4" />
                                {t('orders.viewInvoice')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

export default Orders;
