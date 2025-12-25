import { useState, useEffect, useMemo } from 'react';
import { Video, Users, DollarSign, TrendingUp, Target, CreditCard, Link2, Sparkles, Loader2 } from 'lucide-react';
import KPICard from '../components/metrics/KPICard';
import CreativeMetricsCard from '../components/metrics/CreativeMetricsCard';
import CreativeMetricsCardSkeleton from '../components/metrics/CreativeMetricsCardSkeleton';
import CreativeDetailsExpanded from '../components/metrics/CreativeDetailsExpanded';
import ToolInfo from '../components/ui/ToolInfo';
import { videoService } from '../services/videoService';
import { getMockMetricsForVideo, getGlobalMetrics } from '../lib/mockMetrics';
import { toolsInfo } from '../data/toolsInfo';

export default function Metrics() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await videoService.getVideos({ limit: 1000 });
      const readyVideos = (response.videos || []).filter(v => v.status === 'ready');
      setVideos(readyVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVideoDataComplete = (video) => {
    return video.status === 'ready' && video.video_url && video.metrics;
  };

  const videosWithMetrics = useMemo(() => {
    return videos.map((video, index) => ({
      ...video,
      metrics: getMockMetricsForVideo(video.id, index),
      isDataComplete: isVideoDataComplete({
        ...video,
        metrics: getMockMetricsForVideo(video.id, index)
      })
    }));
  }, [videos]);

  const globalMetrics = useMemo(() => {
    if (videosWithMetrics.length === 0) {
      return {
        activesCount: 0,
        activesCountTrend: 0,
        totalLeads: 0,
        totalLeadsTrend: 0,
        totalPaid: 0,
        totalPaidTrend: 0,
        conversionRate: 0,
        conversionRateTrend: 0,
        avgCPA: 0,
        avgCPATrend: 0,
        totalSpent: 0,
        totalSpentTrend: 0
      };
    }
    return getGlobalMetrics(videosWithMetrics);
  }, [videosWithMetrics]);

  const filteredVideos = useMemo(() => {
    if (statusFilter === 'all') return videosWithMetrics;
    return videosWithMetrics.filter(v => v.metrics.status === statusFilter);
  }, [videosWithMetrics, statusFilter]);

  const handleToggleExpand = (videoId) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-textSecondary animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">
              Métricas dos Criativos
            </h1>
            <ToolInfo tool={toolsInfo.metrics} icon={TrendingUp} />
          </div>
          <p className="text-textSecondary text-sm sm:text-base md:text-lg lg:text-xl">
            Análise detalhada de performance de cada vídeo
          </p>
        </div>

        <div className="gradient-card rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 border premium-shadow">
          <div className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-6 bg-surfaceMuted/30 rounded-xl sm:rounded-2xl">
              <Video size={48} sm:size={56} md:size={64} className="text-textSecondary/40" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-textPrimary">Nenhum vídeo pronto ainda</h3>
              <p className="text-textSecondary max-w-md text-sm sm:text-base px-4">
                Crie seus primeiros vídeos no Morphion para começar a acompanhar métricas de performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">
            Métricas dos Criativos
          </h1>
          <ToolInfo tool={toolsInfo.metrics} icon={TrendingUp} />
        </div>
        <p className="text-textSecondary text-sm sm:text-base md:text-lg lg:text-xl">
          Análise detalhada de performance de cada vídeo
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <KPICard
          title="Criativos Ativos"
          value={globalMetrics.activesCount}
          icon={<Video size={20} className="text-brandPrimary" />}
          trend={globalMetrics.activesCountTrend}
          format="number"
        />
        <KPICard
          title="Receita Total"
          value={globalMetrics.totalRevenue}
          icon={<DollarSign size={20} className="text-green-500" />}
          trend={globalMetrics.totalRevenueTrend}
          format="currency"
        />
        <KPICard
          title="Leads Totais"
          value={globalMetrics.totalLeads}
          icon={<Users size={20} className="text-blue-500" />}
          trend={globalMetrics.totalLeadsTrend}
          format="number"
        />
        <KPICard
          title="Pagamentos"
          value={globalMetrics.totalPaid}
          icon={<CreditCard size={20} className="text-green-500" />}
          trend={globalMetrics.totalPaidTrend}
          format="number"
        />
        <KPICard
          title="CPA Médio"
          value={globalMetrics.avgCPA}
          icon={<TrendingUp size={20} className="text-yellow-500" />}
          trend={globalMetrics.avgCPATrend}
          format="currency"
        />
        <KPICard
          title="Gasto Total"
          value={globalMetrics.totalSpent}
          icon={<Target size={20} className="text-brandSecondary" />}
          trend={globalMetrics.totalSpentTrend}
          format="currency"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-textSecondary">Filtrar por:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-4 bg-surfaceMuted/30 border rounded-xl text-textPrimary text-sm focus:outline-none focus:border-white/[0.15] transition-colors"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="testing">Em teste</option>
            <option value="paused">Pausados</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            disabled
            className="px-4 py-2 bg-surfaceMuted/30 border border-white/[0.08] rounded-xl text-sm text-textSecondary hover:bg-surfaceMuted/50 transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
            title="Disponível em breve"
          >
            <Link2 size={16} />
            <span>Conectar Perfil de Anúncios</span>
          </button>
          <button
            disabled
            className="px-4 py-2 bg-brandPrimary/10 border border-brandPrimary/20 rounded-xl text-sm text-brandPrimary hover:bg-brandPrimary/20 transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
            title="Disponível em breve"
          >
            <Sparkles size={16} />
            <span>Ativar Sugestões (Morph AI)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 auto-rows-auto">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className={`overflow-x-auto transition-all duration-300 ease-in-out ${
              expandedVideoId === video.id ? 'lg:col-span-2 2xl:col-span-3' : ''
            }`}
          >
            {!video.isDataComplete ? (
              <CreativeMetricsCardSkeleton />
            ) : (
              <div className="animate-fadeIn">
                <CreativeMetricsCard
                  video={video}
                  metrics={video.metrics}
                  isExpanded={expandedVideoId === video.id}
                  onToggleExpand={() => handleToggleExpand(video.id)}
                >
                  <CreativeDetailsExpanded metrics={video.metrics} />
                </CreativeMetricsCard>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="gradient-card rounded-2xl p-12 border premium-shadow text-center">
          <p className="text-textSecondary">
            Nenhum criativo encontrado com o filtro selecionado.
          </p>
        </div>
      )}
    </div>
  );
}
