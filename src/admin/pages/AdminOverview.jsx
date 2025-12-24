import { useState, useEffect } from 'react';
import { Users, CreditCard, Video, Image, DollarSign, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { adminService } from '../services/adminService';
import CreditTransactionModal from '../components/CreditTransactionModal';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [signupsData, setSignupsData] = useState([]);
  const [creditsData, setCreditsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, signups, credits] = await Promise.all([
        adminService.getOverviewStats(),
        adminService.getSignupsLast30Days(),
        adminService.getCreditsUsageLast30Days()
      ]);

      setStats(statsData);
      setSignupsData(signups);
      setCreditsData(credits);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total de Usuários',
      value: stats.totalUsers.toLocaleString(),
      color: 'blue'
    },
    {
      icon: CreditCard,
      label: 'Créditos no Sistema',
      value: stats.totalCredits.toLocaleString(),
      color: 'purple'
    },
    {
      icon: Video,
      label: 'Vídeos Gerados',
      value: stats.totalVideos.toLocaleString(),
      color: 'green'
    },
    {
      icon: Image,
      label: 'Imagens Geradas',
      value: stats.totalImages.toLocaleString(),
      color: 'orange'
    },
    {
      icon: DollarSign,
      label: 'Receita Mensal (MRR)',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: 'emerald'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-600/20 text-blue-400',
    purple: 'bg-purple-600/20 text-purple-400',
    green: 'bg-green-600/20 text-green-400',
    orange: 'bg-orange-600/20 text-orange-400',
    emerald: 'bg-emerald-600/20 text-emerald-400'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
        <p className="text-gray-400">Visão geral do sistema Morphion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#121621] rounded-2xl p-6 border border-gray-800"
          >
            <div className={`w-12 h-12 rounded-xl ${colorClasses[card.color]} flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-sm text-gray-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Cadastros (Últimos 30 dias)</h2>
          <div className="space-y-3">
            {signupsData.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum cadastro nos últimos 30 dias</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {signupsData.map((item) => (
                  <div key={item.date} className="flex items-center justify-between py-2 px-3 bg-[#1a1f2e] rounded-lg">
                    <span className="text-sm text-gray-400">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.count} usuários</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#121621] rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Atividade de Créditos (Últimos 30 dias)</h2>
          <div className="space-y-3">
            {creditsData.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhuma atividade nos últimos 30 dias</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {creditsData.map((item) => (
                  <div key={item.date} className="bg-[#1a1f2e] rounded-lg overflow-hidden">
                    <div
                      className="p-3 cursor-pointer hover:bg-[#1f2437] transition-colors"
                      onClick={() => toggleDay(item.date)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                          </span>
                          {expandedDays[item.date] ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {item.total >= 0 ? '+' : ''}{item.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-green-400">+{item.added.toLocaleString()}</span>
                          <span className="text-gray-500">adicionados</span>
                        </div>
                        {item.used > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-red-400">-{item.used.toLocaleString()}</span>
                            <span className="text-gray-500">usados</span>
                          </div>
                        )}
                        <span className="text-gray-500">
                          {item.transactions.length} {item.transactions.length === 1 ? 'transação' : 'transações'}
                        </span>
                      </div>
                    </div>

                    {expandedDays[item.date] && (
                      <div className="border-t border-gray-800 bg-black/20 p-2 space-y-1">
                        {item.transactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-2 bg-[#121621] rounded-lg hover:bg-[#1a1f2e] transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 truncate">
                                  {transaction.email || 'Email não disponível'}
                                </span>
                                <span className={`text-xs font-semibold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {transaction.description || transaction.type}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTransaction(transaction);
                              }}
                              className="ml-2 p-1.5 hover:bg-blue-600/20 rounded-lg transition-colors flex-shrink-0"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTransaction && (
        <CreditTransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
