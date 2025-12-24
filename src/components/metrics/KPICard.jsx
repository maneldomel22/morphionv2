import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, icon, trend, format = 'number' }) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  const formatValue = (val) => {
    if (format === 'currency') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    if (format === 'number' && typeof val === 'number') {
      return val.toLocaleString('pt-BR');
    }
    return val;
  };

  return (
    <div className="gradient-card rounded-lg sm:rounded-xl p-3 sm:p-4 border premium-shadow hover:premium-shadow-hover transition-all duration-500 group">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="p-1.5 sm:p-2 bg-surfaceMuted/30 rounded-lg group-hover:bg-surfaceMuted/50 transition-colors flex-shrink-0">
          {icon}
        </div>
        {trend !== undefined && !isNeutral && (
          <div className={`flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={12} sm:size={14} /> : <TrendingDown size={12} sm:size={14} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-0.5 sm:space-y-1">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-textPrimary tracking-tight">
          {formatValue(value)}
        </h3>
        <p className="text-[10px] sm:text-xs text-textSecondary line-clamp-1">{title}</p>
      </div>
    </div>
  );
}
