import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, CreditCard, RefreshCw, ArrowUpDown } from 'lucide-react';
import { adminService } from '../services/adminService';
import UserDetailsModal from '../components/UserDetailsModal';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filters, setFilters] = useState({
    email: '',
    plan: '',
    maxCredits: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await adminService.getUsers(filters);
      const sortedData = sortUsers(data, sortBy);
      setUsers(sortedData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  function sortUsers(data, sortOption) {
    const sorted = [...data];

    switch (sortOption) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'credits_desc':
        return sorted.sort((a, b) => (b.credits || 0) - (a.credits || 0));
      case 'credits_asc':
        return sorted.sort((a, b) => (a.credits || 0) - (b.credits || 0));
      case 'email_asc':
        return sorted.sort((a, b) => a.email.localeCompare(b.email));
      case 'email_desc':
        return sorted.sort((a, b) => b.email.localeCompare(a.email));
      default:
        return sorted;
    }
  }

  function handleSortChange(value) {
    setSortBy(value);
    const sortedData = sortUsers(users, value);
    setUsers(sortedData);
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  async function handleApplyFilters() {
    await loadUsers();
  }

  function handleViewDetails(user) {
    setSelectedUser(user);
  }

  async function handleDeleteUser(userId, email) {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${email}?\n\nEsta ação não pode ser desfeita e todos os dados do usuário serão removidos.`)) {
      return;
    }

    if (!confirm('CONFIRME NOVAMENTE: Esta ação é irreversível!')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      await loadUsers();
      alert('Usuário deletado com sucesso');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao deletar usuário');
    }
  }

  const plans = ['free', 'junior', 'starter', 'creator', 'pro', 'admin'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Usuários</h1>
        <p className="text-gray-400">Gerenciar usuários do sistema</p>
      </div>

      <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={filters.email}
                onChange={(e) => handleFilterChange('email', e.target.value)}
                placeholder="Buscar por email..."
                className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plano</label>
            <select
              value={filters.plan}
              onChange={(e) => handleFilterChange('plan', e.target.value)}
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              {plans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Créditos (máx)</label>
            <input
              type="number"
              value={filters.maxCredits}
              onChange={(e) => handleFilterChange('maxCredits', e.target.value)}
              placeholder="Ex: 100"
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ordenar por</label>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="date_desc">Data (mais recente)</option>
                <option value="date_asc">Data (mais antigo)</option>
                <option value="credits_desc">Créditos (maior)</option>
                <option value="credits_asc">Créditos (menor)</option>
                <option value="email_asc">Email (A-Z)</option>
                <option value="email_desc">Email (Z-A)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ações</label>
            <button
              onClick={handleApplyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#121621] rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum usuário encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1f2e] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Plano</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Créditos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Telefone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Cadastro</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1a1f2e] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
                        {user.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{user.credits?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                          title="Deletar usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={loadUsers}
        />
      )}
    </div>
  );
}
