import Badge from '../ui/Badge';
import { ChevronDown, ChevronUp, Video, Play, TrendingUp, DollarSign } from 'lucide-react';
import { useState, useRef } from 'react';

export default function CreativeMetricsCard({ video, metrics, isExpanded, onToggleExpand, children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'active': 'green',
      'testing': 'yellow',
      'paused': 'red'
    };
    return variants[status] || 'gray';
  };

  const formatNumber = (num) => {
    return num.toLocaleString('pt-BR');
  };

  const formatCurrency = (num) => {
    return `R$ ${num.toFixed(2)}`;
  };

  const getCPAStatus = (cpa) => {
    if (cpa < 25) return 'excellent';
    if (cpa < 35) return 'good';
    return 'warning';
  };

  const cpaStatus = getCPAStatus(metrics.cpa);
  const conversionPct = metrics.leads > 0 ? ((metrics.paid / metrics.leads) * 100).toFixed(1) : 0;

  const tooltips = {
    impressions: 'Número total de visualizações do anúncio',
    ctr: 'Taxa de cliques sobre impressões',
    conversion: 'Taxa de conversão de leads para pagamento',
    leads: 'Total de leads gerados',
    revenue: 'Receita total gerada por este criativo',
    cpc: 'Custo médio por clique',
    cpm: 'Custo por mil impressões',
    cpa: 'Custo médio por aquisição'
  };

  return (
    <div className={`gradient-card rounded-xl border premium-shadow transition-all duration-300 ease-in-out overflow-hidden hover:premium-shadow-hover group/card ${
      isExpanded ? 'ring-2 ring-brandPrimary/20' : ''
    }`}>
      <div
        className="p-5 cursor-pointer hover:bg-surfaceMuted/10 transition-all duration-200"
        onClick={onToggleExpand}
      >
        <div className="min-w-[1100px] grid grid-cols-[minmax(280px,auto)_minmax(400px,1fr)_minmax(220px,auto)] gap-6 items-center">

          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0 w-20 aspect-[9/16] bg-surfaceMuted/50 rounded-xl overflow-hidden group/thumb shadow-lg">
              {video.status === 'ready' && video.video_url && !videoError ? (
                <>
                  <video
                    ref={videoRef}
                    src={video.video_url}
                    className="w-full h-full object-contain bg-black"
                    preload="metadata"
                    playsInline
                    onPause={handlePause}
                    onError={handleVideoError}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {!isPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                      onClick={handlePlayClick}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
                        <Play size={16} className="text-black ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2">
                  <Video size={20} className="text-textSecondary/40" />
                  <span className="text-[8px] text-textSecondary/40 text-center leading-tight">
                    Preview indisponível
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-2.5">
              <h3 className="text-lg font-semibold text-textPrimary truncate max-w-[200px]">
                {video.title}
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(metrics.status)} className="text-[10px] px-2 py-0.5">
                    {metrics.statusLabel}
                  </Badge>
                  <span className="text-textSecondary/40">•</span>
                  <span className="text-[11px] text-textSecondary/60">
                    {video.duration || '15s'}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-brandPrimary/10 text-brandPrimary text-[10px] rounded font-medium w-fit">
                  Morphion
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0 grid grid-cols-2 gap-x-6 gap-y-4 px-6 border-l border-r border-white/[0.08]">
            <div
              className="relative group/metric"
              onMouseEnter={() => setHoveredMetric('impressions')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <p className="text-[11px] text-textSecondary/60 mb-1 uppercase tracking-wider">Impressões</p>
              <p className="text-xl font-bold text-textPrimary">{formatNumber(metrics.impressions)}</p>
              {hoveredMetric === 'impressions' && (
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                  {tooltips.impressions}
                </div>
              )}
            </div>

            <div
              className="relative group/metric"
              onMouseEnter={() => setHoveredMetric('ctr')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <p className="text-[11px] text-textSecondary/60 mb-1 uppercase tracking-wider">CTR</p>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold text-brandPrimary">{metrics.ctr}%</p>
                {metrics.ctr > 2.0 && <TrendingUp size={16} className="text-green-500" />}
              </div>
              {hoveredMetric === 'ctr' && (
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                  {tooltips.ctr}
                </div>
              )}
            </div>

            <div
              className="relative group/metric"
              onMouseEnter={() => setHoveredMetric('conversion')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <p className="text-[11px] text-textSecondary/60 mb-1 uppercase tracking-wider">Conversão</p>
              <p className="text-xl font-bold text-green-500">{conversionPct}%</p>
              {hoveredMetric === 'conversion' && (
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                  {tooltips.conversion}
                </div>
              )}
            </div>

            <div
              className="relative group/metric"
              onMouseEnter={() => setHoveredMetric('leads')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <p className="text-[11px] text-textSecondary/60 mb-1 uppercase tracking-wider">Leads</p>
              <p className="text-xl font-bold text-textPrimary">{formatNumber(metrics.leads)}</p>
              {hoveredMetric === 'leads' && (
                <div className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                  {tooltips.leads}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex items-center gap-6">
            <div className="space-y-3 min-w-[180px]">
              <div
                className="relative group/metric"
                onMouseEnter={() => setHoveredMetric('revenue')}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign size={14} className="text-green-500" />
                  <p className="text-[11px] text-textSecondary/60 uppercase tracking-wider">Receita Total</p>
                </div>
                <p className="text-3xl font-bold text-green-500">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
                {hoveredMetric === 'revenue' && (
                  <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                    {tooltips.revenue}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.08] space-y-2">
                <div
                  className="relative group/metric"
                  onMouseEnter={() => setHoveredMetric('cpa')}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  <p className="text-[10px] text-textSecondary/60 uppercase tracking-wider">CPA Médio</p>
                  <p className={`text-lg font-bold ${
                    cpaStatus === 'excellent' ? 'text-green-500' :
                    cpaStatus === 'good' ? 'text-textPrimary' :
                    'text-yellow-500'
                  }`}>
                    {formatCurrency(metrics.cpa)}
                  </p>
                  {hoveredMetric === 'cpa' && (
                    <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                      {tooltips.cpa}
                    </div>
                  )}
                </div>

                {!isExpanded && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div
                      className="relative group/metric flex-1"
                      onMouseEnter={() => setHoveredMetric('cpc')}
                      onMouseLeave={() => setHoveredMetric(null)}
                    >
                      <p className="text-[9px] text-textSecondary/50 uppercase tracking-wider">CPC</p>
                      <p className="text-xs font-semibold text-textSecondary">{formatCurrency(metrics.cpc)}</p>
                      {hoveredMetric === 'cpc' && (
                        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                          {tooltips.cpc}
                        </div>
                      )}
                    </div>
                    <div
                      className="relative group/metric flex-1"
                      onMouseEnter={() => setHoveredMetric('cpm')}
                      onMouseLeave={() => setHoveredMetric(null)}
                    >
                      <p className="text-[9px] text-textSecondary/50 uppercase tracking-wider">CPM</p>
                      <p className="text-xs font-semibold text-textSecondary">{formatCurrency(metrics.cpm)}</p>
                      {hoveredMetric === 'cpm' && (
                        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-black/90 text-white text-[10px] rounded whitespace-nowrap z-10 backdrop-blur-sm">
                          {tooltips.cpm}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              className="flex-shrink-0 p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors opacity-60 group-hover/card:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? (
                <ChevronUp size={18} className="text-textSecondary" />
              ) : (
                <ChevronDown size={18} className="text-textSecondary" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`border-t border-white/[0.08] bg-surfaceMuted/20 transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
