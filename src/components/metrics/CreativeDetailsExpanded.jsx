import PerformanceChart from './PerformanceChart';
import { Lightbulb, AlertCircle, CheckCircle, Info, Copy, Pause, Zap, DollarSign, CreditCard } from 'lucide-react';

export default function CreativeDetailsExpanded({ metrics }) {
  const getInsightIcon = (type) => {
    const icons = {
      success: <CheckCircle size={16} className="text-green-500" />,
      warning: <AlertCircle size={16} className="text-yellow-500" />,
      info: <Info size={16} className="text-blue-500" />
    };
    return icons[type] || icons.info;
  };

  const getInsightBgColor = (type) => {
    const colors = {
      success: 'bg-green-500/10 border-green-500/20',
      warning: 'bg-yellow-500/10 border-yellow-500/20',
      info: 'bg-blue-500/10 border-blue-500/20'
    };
    return colors[type] || colors.info;
  };

  const formatCurrency = (amount) => {
    return `R$ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const avgTicket = metrics.paid > 0 ? metrics.totalRevenue / metrics.paid : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-xs text-green-500/80 mb-2 uppercase tracking-wider font-medium">Receita Total</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(metrics.totalRevenue)}</p>
        </div>
        <div className="text-center p-4 bg-surfaceMuted/20 rounded-xl border border-white/[0.05]">
          <p className="text-xs text-textSecondary mb-2 uppercase tracking-wider">CPA Médio</p>
          <p className="text-2xl font-bold text-textPrimary">{formatCurrency(metrics.cpa)}</p>
        </div>
        <div className="text-center p-4 bg-surfaceMuted/20 rounded-xl border border-white/[0.05]">
          <p className="text-xs text-textSecondary mb-2 uppercase tracking-wider">Conversão</p>
          <p className="text-2xl font-bold text-brandPrimary">{metrics.conversionRate}%</p>
        </div>
        <div className="text-center p-4 bg-surfaceMuted/20 rounded-xl border border-white/[0.05]">
          <p className="text-xs text-textSecondary mb-2 uppercase tracking-wider">CPC</p>
          <p className="text-2xl font-bold text-textPrimary">{formatCurrency(metrics.cpc)}</p>
        </div>
        <div className="text-center p-4 bg-surfaceMuted/20 rounded-xl border border-white/[0.05]">
          <p className="text-xs text-textSecondary mb-2 uppercase tracking-wider">CPM</p>
          <p className="text-2xl font-bold text-textPrimary">{formatCurrency(metrics.cpm)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <CreditCard size={16} className="text-green-500" />
            </div>
            <h4 className="text-sm font-semibold text-textPrimary">
              Pagamentos Gerados
            </h4>
            <span className="ml-auto px-2.5 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-full font-semibold">
              {metrics.paid} {metrics.paid === 1 ? 'pagamento' : 'pagamentos'}
            </span>
          </div>

          <div className="bg-surfaceMuted/30 rounded-xl p-4 border border-white/[0.05] max-h-[280px] overflow-y-auto">
            {metrics.payments && metrics.payments.length > 0 ? (
              <div className="space-y-2.5">
                {metrics.payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-surfaceMuted/40 hover:bg-surfaceMuted/60 rounded-lg border border-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={14} className="text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-textPrimary">{payment.ticketName}</p>
                        <p className="text-[10px] text-textSecondary/60">{formatDate(payment.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-green-500">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-textSecondary/60">
                <p className="text-sm">Nenhum pagamento registrado ainda</p>
              </div>
            )}
          </div>

          <div className="mt-3 p-3 bg-brandPrimary/5 border border-brandPrimary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-textSecondary uppercase tracking-wider">Ticket Médio</span>
              <span className="text-lg font-bold text-brandPrimary">{formatCurrency(avgTicket)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-brandPrimary/10 rounded-lg">
              <Lightbulb size={16} className="text-brandPrimary" />
            </div>
            <h4 className="text-sm font-semibold text-textPrimary">
              Performance ao Longo do Tempo
            </h4>
          </div>
          <div className="bg-surfaceMuted/30 rounded-xl p-4 border border-white/[0.05]">
            <PerformanceChart data={metrics.history} />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-brandSecondary/10 rounded-lg">
            <Zap size={16} className="text-brandSecondary" />
          </div>
          <h4 className="text-sm font-semibold text-textPrimary">
            Insights Automáticos (Morph AI)
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {metrics.insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getInsightBgColor(insight.type)} transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <p className="text-sm text-textPrimary leading-relaxed flex-1">
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.08]">
        <h4 className="text-sm font-semibold text-textPrimary mb-3">
          Ações Rápidas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            disabled
            className="p-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 border border-white/[0.08] rounded-xl text-sm text-textSecondary transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
            title="Disponível em breve"
          >
            <Zap size={16} />
            <span>Otimizar Automático</span>
          </button>
          <button
            disabled
            className="p-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 border border-white/[0.08] rounded-xl text-sm text-textSecondary transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
            title="Disponível em breve"
          >
            <Copy size={16} />
            <span>Criar Variação</span>
          </button>
          <button
            disabled
            className="p-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 border border-white/[0.08] rounded-xl text-sm text-textSecondary transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
            title="Disponível em breve"
          >
            <Pause size={16} />
            <span>Pausar Criativo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
