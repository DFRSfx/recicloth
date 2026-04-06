import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ProductsList from './pages/ProductsList';
import ProductForm from './pages/ProductForm';
import OrdersList from './pages/OrdersList';
import OrderDetails from './pages/OrderDetails';
import CategoriesList from './pages/CategoriesList';
import HeroSlidesList from './pages/HeroSlidesList';
import UsersList from './pages/UsersList';
import ReviewsList from './pages/ReviewsList';
import NewsletterAdmin from './pages/NewsletterAdmin';

export default function AdminApp() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated and is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tertiary-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Necessita de privilégios de administrador para aceder a esta área.</p>
          <a
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Voltar à Página Inicial
          </a>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/categorias" element={<CategoriesList />} />
        <Route path="/produtos" element={<ProductsList />} />
        <Route path="/produtos/novo" element={<ProductForm />} />
        <Route path="/produtos/editar/:id" element={<ProductForm />} />
        <Route path="/encomendas" element={<OrdersList />} />
        <Route path="/encomendas/:id" element={<OrderDetails />} />
        <Route path="/avaliacoes" element={<ReviewsList />} />
        <Route path="/utilizadores" element={<UsersList />} />
        <Route path="/hero-slides" element={<HeroSlidesList />} />
        <Route path="/newsletter" element={<NewsletterAdmin />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}
