import { X, User, Hash, Calendar, CreditCard, FileText, Database } from 'lucide-react';

export default function CreditTransactionModal({ transaction, onClose }) {
  if (!transaction) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAmountColor = (amount) => {
    return amount > 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="sticky top-0 bg-[#1a1f2e] border-b border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Detalhes da Transação</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Valor</span>
              <span className={`text-2xl font-bold ${getAmountColor(transaction.amount)}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} créditos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400 text-sm">Usuário</span>
              </div>
              <p className="text-white font-medium break-all">{transaction.email || 'N/A'}</p>
              <p className="text-gray-500 text-xs mt-1 font-mono break-all">{transaction.user_id}</p>
            </div>

            <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-400 text-sm">Saldo Após</span>
              </div>
              <p className="text-white font-medium">{transaction.balance_after.toLocaleString()} créditos</p>
            </div>

            <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400 text-sm">Tipo</span>
              </div>
              <p className="text-white font-medium capitalize">{transaction.type.replace(/_/g, ' ')}</p>
            </div>

            <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400 text-sm">Data/Hora</span>
              </div>
              <p className="text-white font-medium text-sm">{formatDate(transaction.created_at)}</p>
            </div>
          </div>

          {transaction.description && (
            <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400 text-sm">Descrição</span>
              </div>
              <p className="text-white">{transaction.description}</p>
            </div>
          )}

          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400 text-sm">Metadata</span>
              </div>
              <div className="bg-black/30 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="bg-[#121621] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">ID da Transação</span>
            </div>
            <p className="text-white font-mono text-xs break-all">{transaction.id}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1a1f2e] border-t border-gray-800 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
