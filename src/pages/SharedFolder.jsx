import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Folder, ArrowLeft, AlertCircle, Loader2, Download, Eye, Grid3x3, List, DownloadCloud
} from 'lucide-react';
import JSZip from 'jszip';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import VideoDetailsModal from '../components/ui/VideoDetailsModal';
import { checkFolderAccess, getFolderVideos } from '../services/folderShareService';

export default function SharedFolder() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [folder, setFolder] = useState(null);
  const [videos, setVideos] = useState([]);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('grid');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [folderId]);

  const checkAccess = async () => {
    setLoading(true);
    setError(null);

    const result = await checkFolderAccess(folderId);

    if (!result.hasAccess) {
      setHasAccess(false);
      setError('Você não tem permissão para acessar esta pasta');
      setLoading(false);
      return;
    }

    setHasAccess(true);
    setRole(result.role);
    setFolder(result.folder);

    const folderVideos = await getFolderVideos(folderId);
    setVideos(folderVideos);
    setLoading(false);
  };

  const openVideoDetails = (video) => {
    setSelectedVideo(video);
    setShowDetailsModal(true);
  };

  const handleDownloadAll = async () => {
    const readyVideos = videos.filter(v => v.status === 'ready' && v.video_url);

    if (readyVideos.length === 0) {
      alert('Não há vídeos prontos para baixar nesta pasta.');
      return;
    }

    const confirmed = confirm(`Deseja baixar ${readyVideos.length} vídeo${readyVideos.length !== 1 ? 's' : ''} em um arquivo ZIP?`);
    if (!confirmed) return;

    try {
      const zip = new JSZip();
      let loadedCount = 0;

      for (let i = 0; i < readyVideos.length; i++) {
        const video = readyVideos[i];
        try {
          const response = await fetch(video.video_url);
          const blob = await response.blob();
          const fileName = `${video.title || `video-${video.id}`}.mp4`;
          zip.file(fileName, blob);
          loadedCount++;
        } catch (error) {
          console.error(`Erro ao processar vídeo ${video.title}:`, error);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${folder.name}-${new Date().toISOString().split('T')[0]}.zip`;

      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`${loadedCount} vídeo${loadedCount !== 1 ? 's' : ''} baixado${loadedCount !== 1 ? 's' : ''} com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar arquivo ZIP:', error);
      alert('Erro ao criar arquivo ZIP. Por favor, tente novamente.');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'ready': { label: 'Pronto', variant: 'green' },
      'failed': { label: 'Falhou', variant: 'red' },
      'processing': { label: 'Processando', variant: 'blue' },
      'queued': { label: 'Na Fila', variant: 'yellow' }
    };
    return variants[status] || { label: status, variant: 'gray' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brandPrimary mx-auto mb-4" />
          <p className="text-textSecondary">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <div className="text-center p-12">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-textPrimary mb-3">Acesso Negado</h2>
            <p className="text-textSecondary mb-8 leading-relaxed">
              {error || 'Você não tem permissão para acessar esta pasta'}
            </p>
            <Button
              onClick={() => navigate('/library')}
              className="w-full sm:w-auto"
            >
              Voltar para Biblioteca
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          Voltar para Biblioteca
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: folder.color + '20' }}
          >
            <Folder size={32} style={{ color: folder.color }} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-textPrimary">{folder.name}</h1>
            <p className="text-textSecondary">
              {videos.length} vídeo{videos.length !== 1 ? 's' : ''} • {role === 'owner' ? 'Sua pasta' : 'Compartilhado com você'}
            </p>
          </div>
        </div>

        {role === 'viewer' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <p className="text-blue-400 text-sm">
              Esta pasta foi compartilhada com você. Você pode visualizar e baixar os vídeos, mas não pode editar ou excluir.
            </p>
          </div>
        )}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h3 className="text-lg font-semibold text-textPrimary">
            Vídeos ({videos.length})
          </h3>

          <div className="flex items-center gap-2">
            {videos.filter(v => v.status === 'ready').length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-brandPrimary hover:bg-brandPrimary/90 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <DownloadCloud size={18} />
                Baixar Todos ({videos.filter(v => v.status === 'ready').length})
              </button>
            )}

            <div className="flex gap-1 bg-surfaceMuted/30 p-1 rounded-lg">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'grid' ? 'bg-brandPrimary/20 text-brandPrimary' : 'text-textSecondary hover:bg-surfaceMuted/30'
                }`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-brandPrimary/20 text-brandPrimary' : 'text-textSecondary hover:bg-surfaceMuted/30'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-16">
            <Folder size={64} className="text-textSecondary/30 mx-auto mb-4" />
            <p className="text-textSecondary text-lg">Nenhum vídeo nesta pasta</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {videos.map((video) => {
              const statusBadge = getStatusBadge(video.status);

              return (
                <div
                  key={video.id}
                  className={`bg-surfaceMuted/30 rounded-xl overflow-hidden border border-transparent hover:border-brandPrimary/30 transition-all cursor-pointer ${
                    view === 'list' ? 'flex items-center gap-4 p-3' : ''
                  }`}
                  onClick={() => openVideoDetails(video)}
                >
                  <div className={view === 'list' ? 'w-32 h-24 flex-shrink-0' : 'aspect-video'}>
                    {video.thumbnail_url || video.image_url ? (
                      <img
                        src={video.thumbnail_url || video.image_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surfaceMuted/50 flex items-center justify-center">
                        <Folder size={32} className="text-textSecondary/30" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-textPrimary line-clamp-1">{video.title}</h4>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>

                    <p className="text-sm text-textSecondary line-clamp-2 mb-3">
                      {video.dialogue || 'Sem descrição'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-textSecondary">
                      <span>{new Date(video.created_at).toLocaleDateString('pt-BR')}</span>
                      {video.status === 'ready' && (
                        <>
                          <span>•</span>
                          <span>{video.duration || '10s'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <VideoDetailsModal
        video={selectedVideo}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVideo(null);
        }}
        onRetry={() => {}}
        onDelete={() => {}}
        readOnly={role === 'viewer'}
      />
    </div>
  );
}
