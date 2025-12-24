import { X, Download, Play, Loader2, Calendar, Clock, Film, Ratio } from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { useEffect } from 'react';
import { MODEL_LABELS } from '../../types/videoModels';

export default function VideoPreviewModal({ video, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!video) return null;

  const getModelLabel = () => {
    if (video.video_model) {
      return MODEL_LABELS[video.video_model] || video.video_model;
    }

    console.warn('Video sem video_model definido:', video.id);
    return 'Modelo desconhecido (vídeo antigo)';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Processando...';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Processando...';
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Processando...';
    }
  };

  const getStatusBadge = () => {
    switch (video.status) {
      case 'ready':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'queued':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getStatusLabel = () => {
    switch (video.status) {
      case 'ready': return 'Pronto';
      case 'processing': return 'Processando';
      case 'queued': return 'Na fila';
      case 'failed': return 'Erro';
      default: return video.status;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex flex-col md:flex-row h-full max-h-[95vh] w-full max-w-7xl bg-surface rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex items-center justify-center bg-black p-4 md:p-8">
          <div className="relative rounded-xl overflow-hidden shadow-xl max-w-full max-h-full">
            {video.status === 'ready' && video.video_url ? (
              <video
                src={video.video_url}
                controls
                autoPlay
                loop
                className={`max-h-[70vh] ${
                  video.aspect_ratio === '9:16'
                    ? 'h-[70vh] w-auto'
                    : video.aspect_ratio === '1:1'
                    ? 'h-[60vh] w-[60vh]'
                    : 'w-[55vw] h-auto max-w-3xl'
                }`}
              />
            ) : video.thumbnail_url ? (
              <div className="relative">
                <img
                  src={video.thumbnail_url}
                  alt="Video preview"
                  className={`object-cover ${
                    video.aspect_ratio === '9:16'
                      ? 'h-[70vh] w-auto'
                      : video.aspect_ratio === '1:1'
                      ? 'h-[60vh] w-[60vh]'
                      : 'w-[55vw] h-auto max-w-3xl'
                  }`}
                />
                {video.status === 'processing' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 size={48} className="text-brandPrimary animate-spin mx-auto mb-3" />
                      <p className="text-white text-sm">Processando vídeo...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[60vh] w-[40vw] bg-surfaceMuted/30 rounded-xl">
                {video.status === 'processing' || video.status === 'queued' ? (
                  <div className="text-center">
                    <Loader2 size={48} className="text-brandPrimary animate-spin mx-auto mb-3" />
                    <p className="text-textSecondary text-sm">
                      {video.status === 'queued' ? 'Na fila de processamento...' : 'Processando vídeo...'}
                    </p>
                  </div>
                ) : (
                  <Play size={48} className="text-textSecondary" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-[420px] h-full bg-surface flex flex-col border-l border-border">
          <div className="border-b border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-textPrimary flex-1 pr-3 line-clamp-2">
                {video.title || 'Vídeo sem título'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-surfaceMuted/50 flex-shrink-0"
                title="Fechar (ESC)"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusBadge()}>
                {getStatusLabel()}
              </Badge>
              {getModelLabel() && (
                <Badge className="bg-surfaceMuted/50 text-textPrimary border-border">
                  {getModelLabel()}
                </Badge>
              )}
              {video.status === 'ready' && video.video_url && (
                <a
                  href={video.video_url}
                  download={video.title || 'video.mp4'}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border bg-brandPrimary/10 text-brandPrimary border-brandPrimary/20 hover:bg-brandPrimary/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={12} />
                  Baixar
                </a>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {video.dialogue && (
              <div>
                <h4 className="text-sm font-semibold text-textSecondary mb-3 flex items-center gap-2">
                  <Film size={16} />
                  Prompt de Movimento
                </h4>
                <Card className="bg-surfaceMuted/30 border-border">
                  <p className="text-textPrimary text-sm leading-relaxed">
                    "{video.dialogue}"
                  </p>
                </Card>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-textSecondary mb-3">Informações do Vídeo</h4>
              <Card className="bg-surfaceMuted/30 border-border">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-textSecondary text-sm">
                      <Ratio size={14} />
                      <span>Proporção</span>
                    </div>
                    <span className="text-textPrimary font-medium text-sm">
                      {video.aspect_ratio || '9:16'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-textSecondary text-sm">
                      <Clock size={14} />
                      <span>Duração</span>
                    </div>
                    <span className="text-textPrimary font-medium text-sm">
                      {video.duration || '5s'}
                    </span>
                  </div>
                  {getModelLabel() && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-textSecondary text-sm">
                        <Film size={14} />
                        <span>Modelo</span>
                      </div>
                      <span className="text-textPrimary font-medium text-sm">
                        {getModelLabel()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-textSecondary text-sm">
                      <Calendar size={14} />
                      <span>Criado em</span>
                    </div>
                    <span className="text-textPrimary font-medium text-sm">
                      {formatDate(video.created_at)}
                    </span>
                  </div>
                  {video.completed_at && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-textSecondary text-sm">
                        <Calendar size={14} />
                        <span>Finalizado em</span>
                      </div>
                      <span className="text-textPrimary font-medium text-sm">
                        {formatDate(video.completed_at)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {video.status === 'failed' && (video.kie_fail_message || video.wan_fail_message) && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-3">Erro</h4>
                <Card className="bg-red-500/10 border-red-500/30">
                  <p className="text-red-600 text-sm leading-relaxed">
                    {video.kie_fail_message || video.wan_fail_message || 'Erro desconhecido'}
                  </p>
                  {(video.kie_fail_code || video.wan_fail_code) && (
                    <p className="text-red-500/70 text-xs mt-2">
                      Código: {video.kie_fail_code || video.wan_fail_code}
                    </p>
                  )}
                </Card>
              </div>
            )}

            {video.metadata && (
              <div>
                <h4 className="text-sm font-semibold text-textSecondary mb-3">Detalhes Técnicos</h4>
                <Card className="bg-surfaceMuted/30 border-border">
                  <pre className="text-xs text-textSecondary overflow-x-auto">
                    {JSON.stringify(video.metadata, null, 2)}
                  </pre>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
