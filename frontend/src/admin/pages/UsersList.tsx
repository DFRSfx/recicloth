import { useState, useEffect } from 'react';
import { Search, X, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { usersApi } from '../../utils/apiHelpers';

interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'customer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  n_telemovel?: string;
  created_at: string;
}

interface EditingUser extends Partial<User> {
  id: number;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<EditingUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(term) ||
      user.name.toLowerCase().includes(term) ||
      user.n_telemovel?.includes(term)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      setUsers(response.users || []);
      setError('');
    } catch (err) {
      setError('Erro ao carregar utilizadores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user: User) => {
    setSelectedUser({ ...user });
    setIsModalOpen(true);
    setError('');
    setMessage('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      setError('');

      await usersApi.update(selectedUser.id, {
        role: selectedUser.role,
        status: selectedUser.status,
        n_telemovel: selectedUser.n_telemovel,
      });

      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...selectedUser } : u));
      setMessage('Utilizador atualizado com sucesso!');

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar utilizador');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'suspended': return 'Suspenso';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Admin' : 'Cliente';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">A carregar lista de utilizadores...</span>
      </div>
    );
  }

  return (
    <main className="space-y-6 sm:space-y-8 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Utilizadores</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Gerir utilizadores da plataforma</p>
      </div>

      {/* Caixa Combinada (Filtros + Lista/Tabela) */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">

        {/* Filtros */}
        <div className="p-4 border-b border-secondary-200 bg-tertiary-100/50">
          <div className="relative flex-1">
            <label htmlFor="search-users" className="sr-only">Pesquisar utilizadores</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
            <input
              id="search-users"
              type="text"
              placeholder="Pesquisar por email, nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {/* --- VISTA MOBILE: CARTÕES (Mostrada apenas em ecrãs pequenos) --- */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhum utilizador encontrado</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-tertiary-100/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-[#1A1A1A] truncate">{user.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border flex-shrink-0 ${getStatusBadgeColor(user.status)}`}>
                    {getStatusLabel(user.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">Telefone</span>
                    <p className="text-sm">{user.n_telemovel || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">Role</span>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border mt-1 ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openModal(user)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
              </div>
            ))
          )}
        </div>

        {/* --- VISTA DESKTOP/TABLET: TABELA (Mostrada apenas a partir de 'md') --- */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-secondary-200 text-xs text-gray-500 uppercase tracking-wider">
                <th scope="col" className="px-4 py-4 font-medium">Utilizador</th>
                <th scope="col" className="px-4 py-4 font-medium">Email</th>
                <th scope="col" className="px-4 py-4 font-medium">Telefone</th>
                <th scope="col" className="px-4 py-4 font-medium text-center">Role</th>
                <th scope="col" className="px-4 py-4 font-medium text-center">Estado</th>
                <th scope="col" className="px-4 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-tertiary-100/80 transition-colors group">
                  <td className="px-4 py-4 min-w-[160px] lg:min-w-[200px]">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 truncate">{user.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{user.n_telemovel || '-'}</td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-medium tracking-wide border ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-medium tracking-wide border ${getStatusBadgeColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openModal(user)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label={`Editar utilizador ${user.name}`}
                    >
                      <Edit2 size={20} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum utilizador encontrado</p>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-4 py-3 border-t border-secondary-200 bg-tertiary-100/30 text-sm text-gray-600">
            {filteredUsers.length} de {users.length} utilizadores
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden border border-secondary-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Editar Utilizador</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* User Avatar */}
              {selectedUser.avatar_url && (
                <div className="flex justify-center mb-4">
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.name}
                    className="w-16 h-16 rounded-full border-2 border-tertiary-200"
                  />
                </div>
              )}

              {/* User Info (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nome</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#1A1A1A]">
                  {selectedUser.name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#1A1A1A] truncate">
                  {selectedUser.email}
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Telefone</label>
                <input
                  id="phone"
                  type="tel"
                  value={selectedUser.n_telemovel || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, n_telemovel: e.target.value })}
                  placeholder="+351 xxx xxx xxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                <select
                  id="role"
                  value={selectedUser.role || 'customer'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as 'admin' | 'customer' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow bg-white"
                >
                  <option value="customer">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estado</label>
                <select
                  id="status"
                  value={selectedUser.status || 'active'}
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as 'active' | 'inactive' | 'suspended' | 'pending' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow bg-white"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>

              {/* Messages */}
              {message && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <div className="text-green-700 text-sm flex-1">{message}</div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-red-700 text-sm flex-1">{error}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-secondary-200 bg-tertiary-100/30">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                {updating ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
