import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderOpen,
  Menu,
  LogOut,
  User,
  ArrowLeft,
  Image
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Painel', path: '/admin', icon: LayoutDashboard },
    { name: 'Hero Slides', path: '/admin/hero-slides', icon: Image },
    { name: 'Categorias', path: '/admin/categorias', icon: FolderOpen },
    { name: 'Produtos', path: '/admin/produtos', icon: Package },
    { name: 'Encomendas', path: '/admin/encomendas', icon: ShoppingCart },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-tertiary-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-secondary-200 transform transition-transform duration-300 flex flex-col
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-24 flex items-center px-6 border-b border-secondary-200 flex-shrink-0">
          <img
            src="/images/logo.png"
            alt="Recicloth"
            className="h-20 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <h1 className="text-xl font-bold text-[#1A1A1A] hidden">Recicloth</h1>
        </div>

        {/* Back to Website Link */}
        <div className="p-4 border-b border-secondary-200 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>Voltar ao Website</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${active 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-700 hover:bg-tertiary-100'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-secondary-200 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3 px-4 py-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-tertiary-100 active:bg-gray-100 rounded-lg transition-colors touch-manipulation min-h-[44px]"
          >
            <LogOut size={18} />
            <span className="text-sm">Terminar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 -ml-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1"></div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
