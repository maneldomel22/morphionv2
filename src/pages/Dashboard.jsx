import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Video, TrendingUp, BarChart3, Play, Calendar, X, Download, Loader2, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentCreatives, setRecentCreatives] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState(null);
  const [isEntering, setIsEntering] = useState(true);
  const [usageStats, setUsageStats] = useState({
    videosGenerated: 0,
    imagesGenerated: 0,
    voicesCloned: 0
  });
  const [performanceStats, setPerformanceStats] = useState({
    creativesThisWeek: 0,
    totalVideos: 0,
    growthPercentage: 0
  });

  useEffect(() => {
    fetchRecentVideos();
    fetchUsageStats();
    fetchPerformanceStats();

    const pollInterval = setInterval(() => {
      checkProcessingVideos();
    }, 10000);

    const enterTimeout = setTimeout(() => {
      setIsEntering(false);
    }, 500);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(enterTimeout);
    };
  }, []);

  async function fetchRecentVideos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setRecentCreatives(data || []);
    } catch (error) {
      console.error('Error fetching recent videos:', error);
    }
  }

  async function checkProcessingVideos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: processingVideos } = await supabase
        .from('videos')
        .select('id, kie_task_id, status')
        .eq('user_id', user.id)
        .in('status', ['queued', 'processing'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!processingVideos || processingVideos.length === 0) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      for (const video of processingVideos) {
        if (video.kie_task_id) {
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status?taskId=${video.kie_task_id}`;

          fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }).catch(err => console.error('Error checking video status:', err));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchRecentVideos();
    } catch (error) {
      console.error('Error checking processing videos:', error);
    }
  }

  async function fetchUsageStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [videosResult, imagesResult, voicesResult] = await Promise.all([
        supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth),

        supabase
          .from('recent_images')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth),

        supabase
          .from('cloned_voices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      setUsageStats({
        videosGenerated: videosResult.count || 0,
        imagesGenerated: imagesResult.count || 0,
        voicesCloned: voicesResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  }

  async function fetchPerformanceStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [weekResult, totalResult, thisMonthResult, lastMonthResult] = await Promise.all([
        supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfWeek.toISOString()),

        supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),

        supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfThisMonth.toISOString()),

        supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfLastMonth.toISOString())
          .lte('created_at', endOfLastMonth.toISOString())
      ]);

      const creativesThisWeek = weekResult.count || 0;
      const totalVideos = totalResult.count || 0;
      const thisMonthCount = thisMonthResult.count || 0;
      const lastMonthCount = lastMonthResult.count || 0;

      let growthPercentage = 0;
      if (lastMonthCount > 0) {
        growthPercentage = Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
      } else if (thisMonthCount > 0) {
        growthPercentage = 100;
      }

      setPerformanceStats({
        creativesThisWeek,
        totalVideos,
        growthPercentage
      });
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    }
  }

  function openPreviewModal(video) {
    setSelectedVideoForPreview(video);
    setShowPreviewModal(true);
  }

  function closePreviewModal() {
    setShowPreviewModal(false);
    setTimeout(() => setSelectedVideoForPreview(null), 200);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  }

  return (
    <div className={isEntering ? 'page-enter' : ''}>
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary mb-2 sm:mb-3 tracking-tight">Estúdio de Criação UGC</h1>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-12 text-sm sm:text-base md:text-lg lg:text-xl">Crie, teste e escale criativos com inteligência artificial.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-12">
        <Card hover className="md:col-span-2 lg:col-span-2">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-surfaceMuted/50 rounded-xl flex-shrink-0">
              <Video size={20} sm:size={24} md:size={28} className="text-brandPrimary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-textPrimary">Criativos Recentes</h3>
              <p className="text-textSecondary mb-4 sm:mb-6 text-xs sm:text-sm">Seus últimos vídeos e anúncios gerados</p>

              <div className="space-y-2 sm:space-y-3">
                {recentCreatives.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-textSecondary text-sm sm:text-base">
                    Nenhum criativo ainda. Comece criando seu primeiro vídeo!
                  </div>
                ) : (
                  <>
                    {recentCreatives.map((creative) => (
                      <div
                        key={creative.id}
                        onClick={() => openPreviewModal(creative)}
                        className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 bg-surfaceMuted/30 rounded-xl hover:bg-surfaceMuted/50 transition-colors cursor-pointer overflow-hidden"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-surfaceMuted/50 rounded-lg overflow-hidden flex-shrink-0">
                          {creative.video_url ? (
                            <video
                              src={creative.video_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surfaceMuted to-surface">
                              <Video size={20} sm:size={24} md:size={28} className="text-textSecondary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h4 className="text-textPrimary font-medium truncate mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">
                            {creative.avatar_name || 'Avatar'} • {creative.creative_style || 'UGC'}
                          </h4>
                          <p className="text-textSecondary text-xs sm:text-sm line-clamp-2 overflow-hidden">
                            {creative.dialogue || 'Vídeo gerado'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                          <span className="text-textSecondary text-[10px] sm:text-xs whitespace-nowrap">{formatDate(creative.created_at)}</span>
                          <Badge className={`${
                            creative.status === 'ready'
                              ? 'bg-green-500/20 text-green-600 border-green-500/30'
                              : creative.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
                              : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                          }`}>
                            {creative.status === 'ready' ? 'Pronto' :
                             creative.status === 'processing' ? 'Processando' : 'Na fila'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => navigate('/library')}
                      className="w-full mt-4 p-3 rounded-xl bg-surfaceMuted/30 hover:bg-surfaceMuted/50 transition-all flex items-center justify-center gap-2 text-textSecondary hover:text-textPrimary group"
                    >
                      <FolderOpen size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Ver todos na biblioteca</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-surfaceMuted/50 rounded-xl flex-shrink-0">
              <TrendingUp size={20} sm:size={24} md:size={28} className="text-brandPrimary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-textPrimary">Uso Criativo</h3>
              <p className="text-textSecondary mb-4 sm:mb-6 text-xs sm:text-sm">Acompanhe sua produção mensal</p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary text-sm">Vídeos Gerados</span>
                    <span className="text-textPrimary font-semibold">{usageStats.videosGenerated}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary text-sm">Imagens Geradas</span>
                    <span className="text-textPrimary font-semibold">{usageStats.imagesGenerated}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary text-sm">Vozes Clonadas</span>
                    <span className="text-textPrimary font-semibold">{usageStats.voicesCloned}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card hover>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-surfaceMuted/50 rounded-xl flex-shrink-0">
            <BarChart3 size={20} sm:size={24} md:size={28} className="text-brandPrimary" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-textPrimary">Visão Geral de Performance</h3>
            <p className="text-textSecondary mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm">Insights sobre seus criativos</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 sm:p-5 md:p-6 bg-surfaceMuted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} sm:size={16} className="text-textSecondary" />
                  <span className="text-textSecondary text-xs sm:text-sm">Esta Semana</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-textPrimary mb-1">{performanceStats.creativesThisWeek}</p>
                <p className="text-textSecondary text-xs sm:text-sm">Criativos gerados</p>
              </div>

              <div className="p-4 sm:p-5 md:p-6 bg-surfaceMuted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Video size={14} sm:size={16} className="text-textSecondary" />
                  <span className="text-textSecondary text-xs sm:text-sm">Total</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-textPrimary mb-1">{performanceStats.totalVideos}</p>
                <p className="text-textSecondary text-xs sm:text-sm">Vídeos criados</p>
              </div>

              <div className="p-4 sm:p-5 md:p-6 bg-surfaceMuted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} sm:size={16} className="text-textSecondary" />
                  <span className="text-textSecondary text-xs sm:text-sm">Crescimento</span>
                </div>
                <p className="text-3xl font-bold text-textPrimary mb-1">{performanceStats.growthPercentage > 0 ? '+' : ''}{performanceStats.growthPercentage}%</p>
                <p className="text-textSecondary text-sm">vs mês anterior</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      {showPreviewModal && selectedVideoForPreview && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-6 overlay-enter"
          onClick={closePreviewModal}
        >
          <div
            className="w-full h-full max-w-7xl max-h-[90vh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Video Player */}
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[rgb(var(--background))] via-[rgb(var(--surface))] to-[rgb(var(--background))] p-8">
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                {selectedVideoForPreview.status === 'ready' && selectedVideoForPreview.video_url ? (
                  <video
                    src={selectedVideoForPreview.video_url}
                    controls
                    controlsList="nodownload"
                    autoPlay
                    className={`${
                      selectedVideoForPreview.aspect_ratio === '9:16'
                        ? 'h-[75vh] w-auto'
                        : selectedVideoForPreview.aspect_ratio === '1:1'
                        ? 'h-[65vh] w-[65vh]'
                        : 'w-[60vw] h-auto max-w-3xl'
                    }`}
                  />
                ) : (
                  <>
                    {selectedVideoForPreview.thumbnail_url ? (
                      <img
                        src={selectedVideoForPreview.thumbnail_url}
                        alt="Video preview"
                        className={`object-cover ${
                          selectedVideoForPreview.aspect_ratio === '9:16'
                            ? 'h-[75vh] w-auto'
                            : selectedVideoForPreview.aspect_ratio === '1:1'
                            ? 'h-[65vh] w-[65vh]'
                            : 'w-[60vw] h-auto max-w-3xl'
                        }`}
                      />
                    ) : (
                      <div className="w-[400px] h-[75vh] bg-surfaceMuted/30 flex items-center justify-center">
                        <Loader2 size={48} className="text-brandPrimary animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Information */}
            <div className="w-[420px] h-full bg-surface flex flex-col">
              <div className="border-b p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-textPrimary flex-1 pr-3">
                    {selectedVideoForPreview.avatar_name || 'Avatar'} • {selectedVideoForPreview.creative_style || 'UGC'}
                  </h3>
                  <button
                    onClick={closePreviewModal}
                    className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-surfaceMuted/50 flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${
                    selectedVideoForPreview.status === 'ready'
                      ? 'bg-green-500/20 text-green-600 border-green-500/30'
                      : selectedVideoForPreview.status === 'processing'
                      ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
                      : selectedVideoForPreview.status === 'queued'
                      ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-600 border-red-500/30'
                  }`}>
                    {selectedVideoForPreview.status === 'ready' ? 'Pronto' :
                     selectedVideoForPreview.status === 'processing' ? 'Processando' :
                     selectedVideoForPreview.status === 'queued' ? 'Na fila' : 'Erro'}
                  </Badge>
                  {selectedVideoForPreview.status === 'ready' && selectedVideoForPreview.video_url && (
                    <a
                      href={selectedVideoForPreview.video_url}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={12} />
                      Baixar
                    </a>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Avatar Info */}
                <div>
                  <h4 className="text-sm font-semibold text-textSecondary mb-3">Personagem</h4>
                  <Card className="bg-surfaceMuted/30">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Nome</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.avatar_name || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Estilo</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.creative_style || 'UGC'}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Dialogue */}
                {selectedVideoForPreview.dialogue && (
                  <div>
                    <h4 className="text-sm font-semibold text-textSecondary mb-3">Diálogo</h4>
                    <Card className="bg-surfaceMuted/30">
                      <p className="text-textPrimary text-sm leading-relaxed">
                        "{selectedVideoForPreview.dialogue}"
                      </p>
                    </Card>
                  </div>
                )}

                {/* Technical Details */}
                <div>
                  <h4 className="text-sm font-semibold text-textSecondary mb-3">Detalhes Técnicos</h4>
                  <Card className="bg-surfaceMuted/30">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Formato</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.aspect_ratio || '16:9'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Criado em</span>
                        <span className="text-textPrimary font-medium text-sm">{new Date(selectedVideoForPreview.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
