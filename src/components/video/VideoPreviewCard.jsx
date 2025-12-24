import { useState, useRef, useEffect } from 'react';
import { Play, Loader2, X, Eye, Download, Trash2 } from 'lucide-react';

export default function VideoPreviewCard({ video, onClick, showActions = false, onDelete, onPointerDown }) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoPreviewLoaded, setVideoPreviewLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && video.video_url && video.status === 'ready') {
      videoRef.current.load();
    }
  }, [video.video_url, video.status]);

  const handleVideoLoadedMetadata = () => {
    setVideoPreviewLoaded(true);
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

  const renderContent = () => {
    if (video.status === 'processing' || video.status === 'queued') {
      return (
        <div className="text-center p-4">
          <Loader2 size={32} className="text-brandPrimary animate-spin mx-auto mb-2" />
          <p className="text-xs text-textSecondary">
            {video.status === 'queued' ? 'Na fila...' : 'Processando...'}
          </p>
        </div>
      );
    }

    if (video.status === 'failed') {
      return (
        <div className="text-center p-4">
          <X size={32} className="text-red-500 mx-auto mb-2" />
          <p className="text-xs text-textSecondary">Falhou</p>
        </div>
      );
    }

    if (video.status === 'ready' && video.video_url) {
      if (video.thumbnail_url && !thumbnailError) {
        return (
          <img
            src={video.thumbnail_url}
            alt={video.title || 'Video thumbnail'}
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        );
      }

      return (
        <video
          ref={videoRef}
          src={video.video_url}
          className="w-full h-full object-cover"
          preload="metadata"
          onLoadedMetadata={handleVideoLoadedMetadata}
          muted
          playsInline
        />
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <Play size={32} className="text-textSecondary" />
      </div>
    );
  };

  return (
    <div
      className="aspect-video bg-surfaceMuted/30 rounded-lg flex items-center justify-center border border-border hover:border-brandPrimary/50 transition-all duration-200 cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md touch-none"
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {renderContent()}

      {video.status === 'ready' && video.video_url && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform">
              <Play size={32} className="text-white fill-white" />
            </div>
          </div>

          {showActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                title="Visualizar"
              >
                <Eye size={16} className="text-white" />
              </button>
              <a
                href={video.video_url}
                download={video.title || 'video.mp4'}
                className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Baixar"
              >
                <Download size={16} className="text-white" />
              </a>
              {onDelete && (
                <button
                  className="p-2 bg-red-600/80 backdrop-blur-sm rounded-lg hover:bg-red-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Tem certeza que deseja apagar este vídeo?')) {
                      onDelete(video.id);
                    }
                  }}
                  title="Apagar"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              )}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
            <p className="text-sm text-white font-medium truncate drop-shadow-lg">
              {video.title || 'Sem título'}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-white/90 drop-shadow-lg">
                {formatDate(video.created_at)}
              </p>
              {video.video_model && (
                <span className="text-xs bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-white/90">
                  {video.video_model}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {video.status === 'processing' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surfaceMuted/50 overflow-hidden">
          <div className="h-full bg-brandPrimary animate-pulse" style={{ width: '70%' }} />
        </div>
      )}
    </div>
  );
}
