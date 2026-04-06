import { useState, useEffect, useCallback } from 'react';
import { Search, Check, X, Trash2 } from 'lucide-react';
import AdminSelect from '../components/AdminSelect';
import { fetchWithAuth } from '../../utils/apiHelpers';

interface Review {
  id: number;
  product_id: number;
  product_name: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  headline: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/products/reviews');
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    let filtered = reviews;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(review =>
        review.product_name.toLowerCase().includes(term)
        || review.reviewer_name.toLowerCase().includes(term)
        || review.reviewer_email.toLowerCase().includes(term)
        || review.headline.toLowerCase().includes(term)
        || review.id.toString().includes(term)
      );
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(review => review.status === selectedStatus);
    }
    setFilteredReviews(filtered);
  }, [reviews, searchTerm, selectedStatus]);

  const updateStatus = async (reviewId: number, status: Review['status']) => {
    try {
      setUpdatingId(reviewId);
      await fetchWithAuth(`/products/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReviews(prev => prev.map(review => review.id === reviewId ? { ...review, status } : review));
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!window.confirm('Tens a certeza que queres eliminar esta review?')) return;
    try {
      setUpdatingId(reviewId);
      await fetchWithAuth(`/products/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('pt-PT', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovada';
      case 'rejected':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">A carregar reviews...</span>
      </div>
    );
  }

  return (
    <main className="space-y-6 sm:space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Reviews</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Validar e gerir reviews de produtos</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200 bg-tertiary-100/50">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
            <div className="relative flex-1">
              <label htmlFor="search-reviews" className="sr-only">Pesquisar reviews</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
              <input
                id="search-reviews"
                type="text"
                placeholder="Pesquisar por produto, cliente ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
              />
            </div>
            <div className="w-full lg:w-56">
              <label htmlFor="status-filter" className="sr-only">Filtrar por estado</label>
              <AdminSelect
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                wrapperClassName="w-full"
                options={[
                  { value: 'all', label: 'Todos os estados' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'approved', label: 'Aprovada' },
                  { value: 'rejected', label: 'Rejeitada' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-secondary-200 text-xs text-gray-500 uppercase tracking-wider">
                <th scope="col" className="px-4 py-4 font-medium">Review</th>
                <th scope="col" className="px-4 py-4 font-medium">Cliente</th>
                <th scope="col" className="px-4 py-4 font-medium">Rating</th>
                <th scope="col" className="px-4 py-4 font-medium">Estado</th>
                <th scope="col" className="px-4 py-4 font-medium">Data</th>
                <th scope="col" className="px-4 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-tertiary-100/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-medium text-[#1A1A1A]">{review.product_name}</div>
                    <div className="text-sm text-gray-600">{review.headline}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{review.reviewer_name}</div>
                    <div className="text-xs text-gray-500">{review.reviewer_email}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#1A1A1A]">{review.rating}/5</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusColor(review.status)}`}>
                      {getStatusLabel(review.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{formatDate(review.created_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStatus(review.id, 'approved')}
                        disabled={updatingId === review.id || review.status === 'approved'}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50"
                      >
                        <Check size={14} /> Aprovar
                      </button>
                      <button
                        onClick={() => updateStatus(review.id, 'rejected')}
                        disabled={updatingId === review.id || review.status === 'rejected'}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={14} /> Rejeitar
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={updatingId === review.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                    Nenhuma review encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100">
          {filteredReviews.map((review) => (
            <div key={review.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#1A1A1A]">{review.product_name}</div>
                  <div className="text-sm text-gray-600">{review.headline}</div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusColor(review.status)}`}>
                  {getStatusLabel(review.status)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {review.reviewer_name} · {review.rating}/5
              </div>
              <div className="text-xs text-gray-500">{formatDate(review.created_at)}</div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => updateStatus(review.id, 'approved')}
                  disabled={updatingId === review.id || review.status === 'approved'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50"
                >
                  <Check size={14} /> Aprovar
                </button>
                <button
                  onClick={() => updateStatus(review.id, 'rejected')}
                  disabled={updatingId === review.id || review.status === 'rejected'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                >
                  <X size={14} /> Rejeitar
                </button>
                <button
                  onClick={() => deleteReview(review.id)}
                  disabled={updatingId === review.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Apagar
                </button>
              </div>
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              Nenhuma review encontrada.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
