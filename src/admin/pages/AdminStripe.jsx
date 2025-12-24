import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, TrendingUp, Users, RefreshCw, Eye, ArrowUpDown, Zap, AlertTriangle, Search, Link2, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminStripe() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    orphanedSubscriptions: 0,
    canceledSubscriptions: 0,
    totalInDatabase: 0
  });
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sortBy, setSortBy] = useState('date_desc');
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncResult, setSyncResult] = useState(null);
  const [orphansWithMatches, setOrphansWithMatches] = useState([]);
  const [linking, setLinking] = useState(null);

  useEffect(() => {
    loadStripeData();
  }, []);

  async function loadStripeData() {
    setLoading(true);
    try {
      // First get customers with their profiles
      const customersRes = await supabase
        .from('stripe_customers')
        .select('*, profiles(email)');

      if (customersRes.error) {
        console.error('Customers error:', customersRes.error);
        throw customersRes.error;
      }

      const customersData = customersRes.data || [];
      const customerMap = {};
      customersData.forEach(c => {
        customerMap[c.customer_id] = c.profiles?.email || '-';
      });

      // Get orders and subscriptions
      const [ordersRes, subsRes] = await Promise.all([
        supabase
          .from('stripe_orders')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('stripe_subscriptions')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
      ]);

      if (ordersRes.error) {
        console.error('Orders error:', ordersRes.error);
        throw ordersRes.error;
      }
      if (subsRes.error) {
        console.error('Subscriptions error:', subsRes.error);
        throw subsRes.error;
      }

      const ordersData = (ordersRes.data || []).map(order => ({
        ...order,
        customer_email: customerMap[order.customer_id] || '-'
      }));

      const subsData = (subsRes.data || [])
        .map(sub => ({
          ...sub,
          customer_email: customerMap[sub.customer_id] || '-',
          is_orphaned: !customerMap[sub.customer_id]
        }));

      const PRICE_TO_MONTHLY_VALUE = {
        'price_1ScWyDKTMfsEL5TJRLQjgB7z': 5900,   // Starter - R$ 59
        'price_1ScWyiKTMfsEL5TJiGf4nGaZ': 14700,  // Creator - R$ 147
        'price_1ScWzMKTMfsEL5TJcVktB0qq': 27900,  // Pro - R$ 279
        'price_1SRKxLKTMfsEL5TJwMTW4NOg': 19700,  // Starter Antigo - R$ 197
        'price_1SRL0dKTMfsEL5TJ7wQQb8eR': 29700,  // Creator Antigo - R$ 297
      };

      const activeSubscriptions = subsData.filter(s => s.status === 'active' && !s.is_orphaned).length;
      const orphanedSubscriptions = subsData.filter(s => s.is_orphaned && s.status === 'active').length;
      const canceledSubscriptions = subsData.filter(s => s.status === 'canceled').length;

      const monthlyRevenue = subsData
        .filter(s => s.status === 'active')
        .reduce((sum, sub) => {
          const value = PRICE_TO_MONTHLY_VALUE[sub.price_id] || 0;
          return sum + value;
        }, 0);

      setStats({
        totalRevenue: monthlyRevenue / 100,
        totalOrders: ordersData.length,
        totalSubscriptions: subsData.length,
        activeSubscriptions,
        orphanedSubscriptions,
        canceledSubscriptions,
        totalInDatabase: subsRes.data?.length || 0
      });

      setOrders(ordersData);
      setSubscriptions(subsData);
      setCustomers(customersData);
      setError(null);
    } catch (error) {
      console.error('Error loading Stripe data:', error);
      setError(error.message || 'Erro ao carregar dados do Stripe');
    } finally {
      setLoading(false);
    }
  }

  async function syncWithStripe() {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-stripe-subscriptions`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar com Stripe');
      }

      const result = await response.json();
      console.log('Sync result:', result);

      setSyncResult(result);

      // Processar órfãos com matches sugeridos
      if (result.orphanedCustomers && result.orphanedCustomers.length > 0) {
        const withMatches = result.orphanedCustomers.filter(
          orphan => orphan.possibleMatches && orphan.possibleMatches.length > 0
        );
        setOrphansWithMatches(withMatches);
      } else {
        setOrphansWithMatches([]);
      }

      if (result.stats?.linkedByEmail > 0) {
        console.log(`✅ ${result.stats.linkedByEmail} assinatura(s) vinculada(s) automaticamente por email`);
      }
      if (result.stats?.linkedByCreditsHistory > 0) {
        console.log(`✅ ${result.stats.linkedByCreditsHistory} assinatura(s) vinculada(s) automaticamente por histórico de créditos`);
      }
      if (result.stats?.orphanedWithMatches > 0) {
        console.log(`🔍 ${result.stats.orphanedWithMatches} órfão(s) com correspondências sugeridas`);
      }
      if (result.stats?.orphanedNoMatches > 0) {
        console.log(`⚠️ ${result.stats.orphanedNoMatches} órfão(s) sem correspondências encontradas`);
      }

      await loadStripeData();
      setError(null);
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      setError(error.message || 'Erro ao sincronizar com Stripe');
    } finally {
      setSyncing(false);
    }
  }

  async function linkOrphanManually(customerId, userId, orphanIndex) {
    setLinking(customerId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-orphan-customer`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId, user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao vincular cliente');
      }

      const result = await response.json();
      console.log('Link result:', result);

      // Remover órfão da lista de matches sugeridos
      setOrphansWithMatches(prev => prev.filter((_, idx) => idx !== orphanIndex));

      await loadStripeData();
      setError(null);
    } catch (error) {
      console.error('Error linking orphan:', error);
      setError(error.message || 'Erro ao vincular cliente órfão');
    } finally {
      setLinking(null);
    }
  }

  function dismissOrphanMatch(orphanIndex) {
    setOrphansWithMatches(prev => prev.filter((_, idx) => idx !== orphanIndex));
  }

  function formatTimeDiff(minutes) {
    if (minutes < 60) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    return `${days} dia${days !== 1 ? 's' : ''}`;
  }

  function getScoreColor(score) {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  }

  function sortData(data, type) {
    const sorted = [...data];

    if (type === 'orders') {
      switch (sortBy) {
        case 'date_desc':
          return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'date_asc':
          return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'amount_desc':
          return sorted.sort((a, b) => (b.amount_total || 0) - (a.amount_total || 0));
        case 'amount_asc':
          return sorted.sort((a, b) => (a.amount_total || 0) - (b.amount_total || 0));
        default:
          return sorted;
      }
    } else if (type === 'subscriptions') {
      switch (sortBy) {
        case 'date_desc':
          return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'date_asc':
          return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'status_active':
          return sorted.sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            return 0;
          });
        default:
          return sorted;
      }
    }

    return sorted;
  }

  function handleSortChange(value) {
    setSortBy(value);
  }

  function getFilteredSubscriptions() {
    let filtered = subscriptions;

    // Filtrar por aba
    if (activeTab === 'active') {
      filtered = filtered.filter(s => s.status === 'active' && !s.is_orphaned);
    } else if (activeTab === 'orphaned') {
      filtered = filtered.filter(s => s.is_orphaned && s.status === 'active');
    } else if (activeTab === 'canceled') {
      filtered = filtered.filter(s => s.status === 'canceled');
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.customer_email?.toLowerCase().includes(term) ||
        s.customer_id?.toLowerCase().includes(term) ||
        s.subscription_id?.toLowerCase().includes(term)
      );
    }

    // Filtrar por status adicional
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    return filtered;
  }

  const sortedOrders = sortData(orders, 'orders');
  const filteredSubscriptions = getFilteredSubscriptions();
  const sortedSubscriptions = sortData(filteredSubscriptions, 'subscriptions');

  function getStatusColor(status) {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-600/20 text-green-400';
      case 'pending':
      case 'trialing':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'canceled':
      case 'unpaid':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando dados do Stripe...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Stripe</h1>
        <p className="text-gray-400">Gerenciar pagamentos e assinaturas</p>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
          <p className="text-red-400 font-medium">Erro: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-400">Receita Mensal (MRR)</div>
        </div>

        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalOrders}</div>
          <div className="text-sm text-gray-400">Total de Pedidos</div>
        </div>

        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-600/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalSubscriptions}</div>
          <div className="text-sm text-gray-400">Total de Assinaturas</div>
        </div>

        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600/20 rounded-xl">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.activeSubscriptions}</div>
          <div className="text-sm text-gray-400">Assinaturas Ativas</div>
        </div>

        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.orphanedSubscriptions}</div>
          <div className="text-sm text-gray-400">Sem Usuário Vinculado</div>
        </div>
      </div>

      {syncResult && (
        <div className="bg-blue-600/10 border border-blue-600/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-400 font-medium mb-2">Sincronização Concluída</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {syncResult.stats?.linkedByEmail > 0 && (
                  <div className="text-green-400">
                    ✅ {syncResult.stats.linkedByEmail} vinculadas por email
                  </div>
                )}
                {syncResult.stats?.linkedByCreditsHistory > 0 && (
                  <div className="text-green-400">
                    ✅ {syncResult.stats.linkedByCreditsHistory} vinculadas por histórico
                  </div>
                )}
                {syncResult.stats?.orphanedWithMatches > 0 && (
                  <div className="text-yellow-400">
                    🔍 {syncResult.stats.orphanedWithMatches} com correspondências
                  </div>
                )}
                {syncResult.stats?.orphanedNoMatches > 0 && (
                  <div className="text-orange-400">
                    ⚠️ {syncResult.stats.orphanedNoMatches} sem correspondências
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {orphansWithMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Correspondências Sugeridas</h2>
            <span className="text-sm text-gray-400">
              ({orphansWithMatches.length} órfão{orphansWithMatches.length > 1 ? 's' : ''})
            </span>
          </div>

          <div className="grid gap-4">
            {orphansWithMatches.map((orphan, orphanIndex) => (
              <div key={orphan.customerId} className="bg-[#121621] rounded-xl border border-yellow-600/30 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">Cliente Órfão no Stripe</h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-400">
                        <span className="text-gray-500">Email:</span>{' '}
                        <span className="text-white">{orphan.email || 'Não disponível'}</span>
                      </div>
                      <div className="text-gray-400">
                        <span className="text-gray-500">Customer ID:</span>{' '}
                        <span className="text-gray-400 font-mono">{orphan.customerId}</span>
                      </div>
                      <div className="text-gray-400">
                        <span className="text-gray-500">Data da Assinatura:</span>{' '}
                        <span className="text-white">
                          {new Date(orphan.subscriptionDate).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {orphan.expectedCredits && (
                        <div className="text-gray-400">
                          <span className="text-gray-500">Créditos Esperados:</span>{' '}
                          <span className="text-white">{orphan.expectedCredits}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissOrphanMatch(orphanIndex)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Ignorar"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  {orphan.possibleMatches.slice(0, 3).map((match, matchIndex) => (
                    <div
                      key={matchIndex}
                      className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-700 hover:border-blue-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
                              {match.score}
                            </span>
                            <div className="flex-1">
                              <div className="text-white font-medium">{match.userEmail}</div>
                              <div className="text-xs text-gray-500 font-mono">{match.userId.substring(0, 24)}...</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Créditos Adicionados:</span>{' '}
                              <span className="text-white font-medium">{match.creditsAdded}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Diferença de Tempo:</span>{' '}
                              <span className="text-white font-medium">{formatTimeDiff(match.timeDiffMinutes)}</span>
                            </div>
                          </div>

                          <div className="text-sm">
                            <span className="text-gray-500">Data da Adição:</span>{' '}
                            <span className="text-gray-400">
                              {new Date(match.addedAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {match.autoLinked && (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Vinculado Automaticamente
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => linkOrphanManually(orphan.customerId, match.userId, orphanIndex)}
                          disabled={linking === orphan.customerId}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium whitespace-nowrap"
                        >
                          <Link2 className="w-4 h-4" />
                          {linking === orphan.customerId ? 'Vinculando...' : 'Vincular'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {orphan.possibleMatches.length > 3 && (
                  <div className="mt-3 text-sm text-gray-400 text-center">
                    + {orphan.possibleMatches.length - 3} correspondência{orphan.possibleMatches.length - 3 > 1 ? 's' : ''} adicional{orphan.possibleMatches.length - 3 > 1 ? 'is' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.orphanedSubscriptions > 0 && (
        <div className="bg-yellow-600/10 border border-yellow-600/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium mb-1">
                {stats.orphanedSubscriptions} assinatura{stats.orphanedSubscriptions > 1 ? 's' : ''} sem usuário vinculado
              </p>
              <p className="text-yellow-400/80 text-sm">
                Estas assinaturas existem no Stripe mas não têm um usuário associado no sistema.
                Use o botão "Sincronizar com Stripe" para tentar vincular automaticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Pedidos</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="date_desc">Data (mais recente)</option>
                <option value="date_asc">Data (mais antigo)</option>
                <option value="amount_desc">Valor (maior)</option>
                <option value="amount_asc">Valor (menor)</option>
              </select>
            </div>
            <button
              onClick={loadStripeData}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1f2e] border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Valor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">ID Pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#1a1f2e] transition-colors">
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {order.customer_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-semibold">
                      R$ {((order.amount_total || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {order.checkout_session_id?.substring(0, 16)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Assinaturas</h2>
          <button
            onClick={syncWithStripe}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
          >
            <Zap className={`w-5 h-5 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar com Stripe'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'active'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ativas ({stats.activeSubscriptions})
          </button>
          <button
            onClick={() => setActiveTab('orphaned')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'orphaned'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Órfãs ({stats.orphanedSubscriptions})
          </button>
          <button
            onClick={() => setActiveTab('canceled')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'canceled'
                ? 'text-red-400 border-b-2 border-red-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Canceladas ({stats.canceledSubscriptions})
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por email, customer ID ou subscription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-[#1a1f2e] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="date_desc">Data (mais recente)</option>
              <option value="date_asc">Data (mais antigo)</option>
              <option value="status_active">Status (ativas primeiro)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1f2e] border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email / Customer ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Cartão</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Último Pagamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Próximo Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              ) : (
                sortedSubscriptions.map((sub) => (
                  <tr key={sub.id} className={`hover:bg-[#1a1f2e] transition-colors ${sub.is_orphaned ? 'bg-yellow-600/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {sub.is_orphaned ? (
                            <>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-600/20 text-yellow-400">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Órfã
                              </span>
                              <span className="text-xs text-gray-500 font-mono">{sub.customer_id}</span>
                            </>
                          ) : (
                            <span className="text-sm text-white font-medium">{sub.customer_email}</span>
                          )}
                        </div>
                        {sub.is_orphaned && (
                          <span className="text-xs text-gray-500">Sem usuário vinculado no sistema</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {sub.payment_method_brand && sub.payment_method_last4
                        ? `${sub.payment_method_brand} •••• ${sub.payment_method_last4}`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {sub.current_period_start
                        ? new Date(sub.current_period_start * 1000).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end * 1000).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Clientes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1f2e] border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stripe ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#1a1f2e] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {customer.customer_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {customer.profiles?.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(customer.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
