import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Folder, FolderPlus, Play, Search, Grid3x3, List, Loader2, Info, RefreshCw,
  AlertCircle, Clock, Download, Trash2, Eye, Edit2, MoreVertical, X, Check, Sparkles, DownloadCloud, Share2
} from 'lucide-react';
import JSZip from 'jszip';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ToolInfo from '../components/ui/ToolInfo';
import VideoDetailsModal from '../components/ui/VideoDetailsModal';
import CreateFolderModal from '../components/library/CreateFolderModal';
import ShareFolderModal from '../components/library/ShareFolderModal';
import GenerateVariationsModal from '../components/video/GenerateVariationsModal';
import DragPreview from '../components/library/DragPreview';
import useDragAndDrop from '../hooks/useDragAndDrop';
import { videoService } from '../services/videoService';
import { folderService } from '../services/folderService';
import { kieApiService } from '../services/kieApiService';
import { videoVariationsService } from '../services/videoVariationsService';
import { toolsInfo } from '../data/toolsInfo';

function VideoCard({ video, view, openVideoDetails, onDelete, onGenerateVariations, onPointerDown, isDragging }) {
  const [isPlaying, setIsPlaying] = useState(false);
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

  const getStatusBadge = (status) => {
    const variants = {
      'ready': { label: 'Pronto', variant: 'green' },
      'failed': { label: 'Falhou', variant: 'red' },
      'processing': { label: 'Processando', variant: 'blue' },
      'queued': { label: 'Na Fila', variant: 'yellow' }
    };
    return variants[status] || { label: status, variant: 'gray' };
  };

  const getStatusIcon = (status) => {
    const icons = {
      'ready': '✓',
      'failed': <AlertCircle size={32} className="text-red-500" />,
      'processing': <Loader2 size={32} className="text-blue-500 animate-spin" />,
      'queued': <Clock size={32} className="text-yellow-500" />
    };
    return icons[status] || '📹';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const status = getStatusBadge(video.status);
  const icon = getStatusIcon(video.status);

  if (view === 'list') {
    return (
      <div
        className={`flex items-center gap-4 p-4 bg-surfaceMuted/30 rounded-xl hover:bg-surfaceMuted/50 transition-all cursor-move group ${
          isDragging ? 'opacity-40 ring-2 ring-brandPrimary/30' : ''
        }`}
        onClick={(e) => {
          if (!isDragging) {
            openVideoDetails(video);
          }
        }}
        onPointerDown={(e) => {
          console.log('VideoCard (list) onPointerDown triggered');
          onPointerDown(e, video);
        }}
      >
        <div className="w-16 aspect-[9/16] bg-black rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
          {video.status === 'ready' && video.video_url ? (
            <video
              src={video.video_url}
              className="w-full h-full object-contain"
              preload="metadata"
              playsInline
            />
          ) : (
            <span className="text-2xl">{typeof icon === 'string' ? icon : icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-textPrimary font-medium mb-1 truncate">{video.title || 'Sem título'}</h4>
          <p className="text-textSecondary text-sm">{formatDate(video.created_at)}</p>
        </div>
        <Badge variant={status.variant} className="flex-shrink-0">{status.label}</Badge>

        {video.status === 'ready' && video.video_url ? (
          <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openVideoDetails(video);
              }}
              className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors"
              title="Ver detalhes"
            >
              <Eye size={18} className="text-textSecondary" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateVariations(video);
              }}
              className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
              title="Gerar variações com Morphy"
            >
              <Sparkles size={18} className="text-purple-500" />
            </button>
            <a
              href={video.video_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors"
              title="Baixar vídeo"
            >
              <Download size={18} className="text-textSecondary" />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja excluir este vídeo?')) {
                  onDelete(video.id);
                }
              }}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group/delete"
              title="Excluir vídeo"
            >
              <Trash2 size={18} className="text-textSecondary group-hover/delete:text-red-500" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openVideoDetails(video);
              }}
              className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors"
            >
              <Info size={18} className="text-textSecondary" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja excluir este vídeo?')) {
                  onDelete(video.id);
                }
              }}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group/delete"
              title="Excluir vídeo"
            >
              <Trash2 size={18} className="text-textSecondary group-hover/delete:text-red-500" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group cursor-move transition-opacity ${
        isDragging ? 'opacity-40' : ''
      }`}
      onClick={(e) => {
        if (!isDragging) {
          openVideoDetails(video);
        }
      }}
      onPointerDown={(e) => {
        console.log('VideoCard onPointerDown triggered');
        onPointerDown(e, video);
      }}
    >
      <div className="aspect-[9/16] bg-black rounded-xl flex items-center justify-center border hover:border-white/[0.15] transition-all mb-3 relative overflow-hidden">
        {video.status === 'ready' && video.video_url ? (
          <>
            <video
              ref={videoRef}
              src={video.video_url}
              className="w-full h-full object-contain relative z-0"
              controls={isPlaying}
              preload="metadata"
              playsInline
              onPause={handlePause}
              onClick={(e) => e.stopPropagation()}
            />
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-colors z-10"
                onClick={handlePlayClick}
              >
                <div className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
                  <Play size={40} className="text-black ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : video.status === 'processing' || video.status === 'queued' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            {typeof icon === 'string' ? (
              <div className="text-5xl">{icon}</div>
            ) : (
              icon
            )}
            <div className="text-sm text-textSecondary">
              {video.status === 'queued' ? 'Na fila...' : 'Gerando vídeo...'}
            </div>
          </div>
        ) : video.status === 'failed' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
            <div className="text-5xl">⚠️</div>
            <div className="text-sm text-red-400 text-center font-medium">Falha na geração</div>
            {video.kie_fail_message && (
              <div className="text-xs text-textSecondary text-center line-clamp-3">
                {video.kie_fail_message}
              </div>
            )}
          </div>
        ) : (
          <div className="text-5xl flex items-center justify-center">
            {typeof icon === 'string' ? icon : icon}
          </div>
        )}
        <div className="absolute top-3 right-3 z-50 pointer-events-none">
          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
        </div>
        <div className="absolute top-3 left-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Tem certeza que deseja excluir este vídeo?')) {
                onDelete(video.id);
              }
            }}
            className="p-2.5 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors shadow-xl backdrop-blur-sm"
            title="Excluir vídeo"
          >
            <Trash2 size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-textPrimary font-medium truncate text-sm">{video.title || 'Sem título'}</h4>
            <p className="text-textSecondary text-xs">{formatDate(video.created_at)}</p>
          </div>
        </div>

        {video.status === 'ready' && video.video_url && (
          <>
            <div className="grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openVideoDetails(video);
                }}
                className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={14} />
                Ver
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateVariations(video);
                }}
                className="p-2 text-xs text-textSecondary hover:text-purple-500 hover:bg-purple-500/5 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Gerar variações com Morphy"
              >
                <Sparkles size={14} />
                Variar
              </button>
              <a
                href={video.video_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Download size={14} />
                Baixar
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FolderItem({ folder, isSelected, videosCount, onClick, onRename, onDelete, onDownload, onShare, isDropTarget }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [showMenu, setShowMenu] = useState(false);
  const isSystemFolder = folder.id === 'null';

  const handleSaveName = async () => {
    if (newName.trim() && newName.trim() !== folder.name) {
      await onRename(folder.id, newName.trim());
    }
    setIsEditing(false);
    setNewName(folder.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewName(folder.name);
  };

  return (
    <div
      data-folder-id={folder.id}
      className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
        isSelected
          ? 'bg-brandPrimary/20 border border-brandPrimary/30'
          : isDropTarget
          ? 'bg-brandPrimary/15 border border-brandPrimary/60 scale-105 shadow-lg shadow-brandPrimary/20'
          : 'bg-surfaceMuted/30 hover:bg-surfaceMuted/50 border border-transparent'
      }`}
      onClick={() => !isEditing && onClick()}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
            isDropTarget ? 'scale-110' : ''
          }`}
          style={{ backgroundColor: folder.color + '20' }}
        >
          <Folder size={20} style={{ color: folder.color }} />
        </div>
        <div className="flex-1 min-w-0">
          {isDropTarget ? (
            <div className="py-1">
              <p className="text-brandPrimary font-medium text-sm">
                Mover para {folder.name}
              </p>
            </div>
          ) : isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="flex-1 px-2 py-1 bg-surfaceMuted/50 border rounded text-textPrimary text-sm focus:outline-none focus:border-brandPrimary"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                className="p-1 hover:bg-green-500/20 rounded"
              >
                <Check size={14} className="text-green-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="p-1 hover:bg-red-500/20 rounded"
              >
                <X size={14} className="text-red-500" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-textPrimary font-medium text-sm truncate">{folder.name}</p>
              <p className="text-textSecondary text-xs">{videosCount} vídeo{videosCount !== 1 ? 's' : ''}</p>
            </>
          )}
        </div>
        {!isEditing && !isSystemFolder && (
          <div className="flex items-center gap-1">
            {videosCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(folder.id);
                }}
                className="p-1.5 hover:bg-brandPrimary/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Baixar todos os vídeos em ZIP"
              >
                <DownloadCloud size={16} className="text-brandPrimary" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-surfaceMuted/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={16} className="text-textSecondary" />
              </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 w-48 bg-surface border rounded-lg shadow-xl py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-textPrimary hover:bg-surfaceMuted/30 flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    Renomear
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onShare(folder);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-textPrimary hover:bg-surfaceMuted/30 flex items-center gap-2"
                  >
                    <Share2 size={14} />
                    Compartilhar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"? Os vídeos não serão apagados.`)) {
                        onDelete(folder.id);
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Library() {
  const [view, setView] = useState('grid');
  const [videos, setVideos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [folderToShare, setFolderToShare] = useState(null);
  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [videoForVariations, setVideoForVariations] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleDrop = useCallback(async (result) => {
    console.log('Drop result:', result);

    if (result.wasDragging && result.draggedItem && result.dropTarget !== undefined) {
      try {
        const targetFolderId = result.dropTarget === 'null' ? null : result.dropTarget;
        console.log('Moving video', result.draggedItem.id, 'to folder', targetFolderId);
        await folderService.moveVideoToFolder(result.draggedItem.id, targetFolderId);
        await loadData(false);
      } catch (error) {
        console.error('Error moving video:', error);
        alert('Erro ao mover vídeo. Tente novamente.');
      }
    } else {
      console.log('Drop não completado:', {
        wasDragging: result.wasDragging,
        hasDraggedItem: !!result.draggedItem,
        hasDropTarget: result.dropTarget !== undefined,
        dropTarget: result.dropTarget,
      });
    }
  }, []);

  const {
    isDragging,
    draggedItem,
    dragPosition,
    dropTarget,
    handlePointerDown,
  } = useDragAndDrop(handleDrop);

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const hasPendingVideos = videos.some(v =>
      v.status === 'queued' || v.status === 'processing'
    );

    if (!hasPendingVideos) return;

    const interval = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [videos]);


  const loadData = async (isInitial = false, loadMore = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
      setPage(0);
    } else if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsPolling(true);
    }

    try {
      const hasPendingVideos = videos.some(v =>
        v.status === 'queued' || v.status === 'processing'
      );

      if (hasPendingVideos && !loadMore) {
        try {
          await kieApiService.checkAllPendingVideos();
        } catch (error) {
          console.error('Error checking pending videos:', error);
        }
      }

      const currentPage = loadMore ? page + 1 : 0;
      const offset = currentPage * 30;

      const [videosResponse, foldersData] = await Promise.all([
        videoService.getVideos({ limit: 30, offset }),
        folderService.getFolders()
      ]);

      if (loadMore) {
        setVideos([...videos, ...(videosResponse.videos || [])]);
        setPage(currentPage);
      } else {
        setVideos(videosResponse.videos || []);
        setPage(0);
      }

      setHasMore(videosResponse.hasMore || false);
      setTotalVideos(videosResponse.total || 0);
      setFolders(foldersData || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
      if (loadMore) {
        setIsLoadingMore(false);
      }
      setIsPolling(false);
    }
  };

  const handleLoadMore = () => {
    loadData(false, true);
  };

  const handleCreateFolder = async (name, color) => {
    const newFolder = await folderService.createFolder(name, color);
    setFolders([newFolder, ...folders]);
  };

  const handleRenameFolder = async (folderId, newName) => {
    await folderService.renameFolder(folderId, newName);
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: newName } : f));
  };

  const handleDeleteFolder = async (folderId) => {
    await folderService.deleteFolder(folderId);
    setFolders(folders.filter(f => f.id !== folderId));
    if (selectedFolder === folderId) {
      setSelectedFolder('all');
    }
    loadData(false);
  };

  const handleShareFolder = (folder) => {
    setFolderToShare(folder);
    setShowShareModal(true);
  };

  const handleOpenVariationsModal = (video) => {
    setVideoForVariations(video);
    setShowVariationsModal(true);
  };

  const handleGenerateVariations = async (config) => {
    try {
      console.log('Iniciando geração de variações:', config);

      if (config.previewOnly) {
        const result = await videoVariationsService.previewVariations(config);
        console.log('Preview gerado com sucesso:', result);
        return result;
      }

      const result = await videoVariationsService.createVideosFromVariations(config);

      console.log('Variações geradas com sucesso:', result);

      setShowVariationsModal(false);
      setVideoForVariations(null);

      alert(`${result.createdCount} variações criadas e enviadas para geração!`);

      await loadData(false);
    } catch (error) {
      console.error('Erro ao gerar variações:', error);
      alert(`Erro: ${error.message}`);
      throw error;
    }
  };

  const handleDelete = async (videoId) => {
    try {
      await videoService.deleteVideo(videoId);
      loadData();
      if (selectedVideo?.id === videoId) {
        setShowDetailsModal(false);
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Erro ao excluir vídeo. Por favor, tente novamente.');
    }
  };

  const handleRetry = async (videoId) => {
    try {
      await kieApiService.retryFailedVideo(videoId);
      setShowDetailsModal(false);
      loadData();
    } catch (error) {
      console.error('Error retrying video:', error);
      alert('Erro ao tentar gerar vídeo novamente. Por favor, tente novamente.');
    }
  };

  const openVideoDetails = (video) => {
    setSelectedVideo(video);
    setShowDetailsModal(true);
  };

  const filteredAndSortedVideos = videos
    .filter(v => {
      if (selectedFolder === 'all') return true;
      if (selectedFolder === 'no-folder') return !v.folder_id;
      return v.folder_id === selectedFolder;
    })
    .filter(v => statusFilter === 'all' || v.status === statusFilter)
    .filter(v => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (v.title || '').toLowerCase().includes(query) ||
             (v.dialogue || '').toLowerCase().includes(query) ||
             (v.kie_prompt || '').toLowerCase().includes(query);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

  const getVideosCountInFolder = (folderId) => {
    if (folderId === 'no-folder') {
      return videos.filter(v => !v.folder_id).length;
    }
    return videos.filter(v => v.folder_id === folderId).length;
  };

  const handleDownloadFolder = async (folderId) => {
    let videosToDownload;
    let folderName;

    if (folderId === 'all') {
      videosToDownload = videos.filter(v => v.status === 'ready' && v.video_url);
      folderName = 'todos-os-videos';
    } else if (folderId === 'no-folder') {
      videosToDownload = videos.filter(v => v.folder_id === null && v.status === 'ready' && v.video_url);
      folderName = 'sem-pasta';
    } else {
      videosToDownload = videos.filter(v => v.folder_id === folderId && v.status === 'ready' && v.video_url);
      const folder = folders.find(f => f.id === folderId);
      folderName = folder?.name || 'videos';
    }

    if (videosToDownload.length === 0) {
      alert('Não há vídeos prontos para baixar nesta pasta.');
      return;
    }

    const confirmed = confirm(`Deseja baixar ${videosToDownload.length} vídeo${videosToDownload.length !== 1 ? 's' : ''} em um arquivo ZIP?`);
    if (!confirmed) return;

    try {
      const zip = new JSZip();
      let loadedCount = 0;

      for (let i = 0; i < videosToDownload.length; i++) {
        const video = videosToDownload[i];
        try {
          const response = await fetch(video.video_url);
          const blob = await response.blob();
          const fileName = `${video.title || `video-${video.id}`}.mp4`;
          zip.file(fileName, blob);
          loadedCount++;
          console.log(`${loadedCount}/${videosToDownload.length} vídeos adicionados ao ZIP`);
        } catch (error) {
          console.error(`Erro ao processar vídeo ${video.title}:`, error);
        }
      }

      console.log('Gerando arquivo ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const zipFileName = `${folderName}-${new Date().toISOString().split('T')[0]}.zip`;

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

  const handleDownloadAll = async () => {
    await handleDownloadFolder(selectedFolder);
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8 md:mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Biblioteca de Criativos</h1>
          <ToolInfo tool={toolsInfo.library} icon={Folder} />
        </div>
        <p className="text-textSecondary text-sm sm:text-base md:text-lg lg:text-xl">Organize, visualize e gerencie seus vídeos e anúncios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-textPrimary">Pastas</h3>
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="p-2 hover:bg-brandPrimary/10 rounded-lg transition-colors"
                title="Nova pasta"
              >
                <FolderPlus size={18} className="text-brandPrimary" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`w-full p-3 rounded-xl transition-all text-left ${
                  selectedFolder === 'all'
                    ? 'bg-brandPrimary/20 border border-brandPrimary/30'
                    : 'bg-surfaceMuted/30 hover:bg-surfaceMuted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Folder size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-textPrimary font-medium text-sm">Todos os vídeos</p>
                    <p className="text-textSecondary text-xs">{totalVideos} vídeo{totalVideos !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </button>

              <FolderItem
                folder={{ id: 'null', name: 'Sem pasta', color: '#6B7280' }}
                isSelected={selectedFolder === 'no-folder'}
                videosCount={getVideosCountInFolder('no-folder')}
                onClick={() => setSelectedFolder('no-folder')}
                onRename={() => {}}
                onDelete={() => {}}
                onDownload={() => handleDownloadFolder('no-folder')}
                onShare={() => {}}
                isDropTarget={dropTarget === 'null'}
              />

              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isSelected={selectedFolder === folder.id}
                  videosCount={getVideosCountInFolder(folder.id)}
                  onClick={() => setSelectedFolder(folder.id)}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                  onDownload={() => handleDownloadFolder(folder.id)}
                  onShare={handleShareFolder}
                  isDropTarget={dropTarget === folder.id}
                />
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Filtros</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-textSecondary mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-surfaceMuted/30 border rounded-lg text-textPrimary text-sm focus:outline-none focus:border-white/[0.15]"
                >
                  <option value="all">Todos</option>
                  <option value="ready">Prontos</option>
                  <option value="processing">Processando</option>
                  <option value="queued">Na Fila</option>
                  <option value="failed">Com erro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-textSecondary mb-2">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2 px-3 bg-surfaceMuted/30 border rounded-lg text-textPrimary text-sm focus:outline-none focus:border-white/[0.15]"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="name">Nome (A-Z)</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px] relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary" />
                <input
                  type="text"
                  placeholder="Buscar criativos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-white/[0.15] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                {selectedFolder !== 'all' && filteredAndSortedVideos.filter(v => v.status === 'ready' && v.video_url).length > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    className="px-4 py-3 bg-brandPrimary hover:bg-brandPrimary/80 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                    title="Baixar todos os vídeos desta pasta"
                  >
                    <DownloadCloud size={18} />
                    Baixar Todos
                  </button>
                )}
                <button
                  onClick={() => loadData(false)}
                  disabled={isPolling}
                  className={`p-3 rounded-xl transition-colors ${
                    isPolling
                      ? 'bg-surfaceMuted/30 text-textSecondary cursor-not-allowed'
                      : 'bg-surfaceMuted/30 text-textSecondary hover:bg-surfaceMuted/50'
                  }`}
                  title={lastUpdate ? `Última atualização: ${lastUpdate.toLocaleTimeString('pt-BR')}` : 'Atualizar'}
                >
                  <RefreshCw size={18} className={isPolling ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`p-3 rounded-xl transition-colors ${
                    view === 'grid' ? 'bg-white text-black' : 'bg-surfaceMuted/30 text-textSecondary hover:bg-surfaceMuted/50'
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-3 rounded-xl transition-colors ${
                    view === 'list' ? 'bg-white text-black' : 'bg-surfaceMuted/30 text-textSecondary hover:bg-surfaceMuted/50'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={48} className="text-brandPrimary animate-spin mb-4" />
                <p className="text-textSecondary">Carregando sua biblioteca...</p>
              </div>
            ) : filteredAndSortedVideos.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-textPrimary mb-2">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Nenhum vídeo encontrado'
                    : 'Você ainda não criou nenhum criativo'}
                </h3>
                <p className="text-textSecondary mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando seu primeiro vídeo na aba Sora Manual'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button
                    onClick={() => window.location.href = '/sora-manual'}
                    variant="primary"
                  >
                    Criar novo vídeo
                  </Button>
                )}
              </div>
            ) : view === 'grid' ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredAndSortedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      view="grid"
                      openVideoDetails={openVideoDetails}
                      onDelete={handleDelete}
                      onGenerateVariations={handleOpenVariationsModal}
                      onPointerDown={handlePointerDown}
                      isDragging={isDragging && draggedItem?.id === video.id}
                    />
                  ))}
                </div>
                {hasMore && !searchQuery && statusFilter === 'all' && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl transition-colors flex items-center gap-2 text-textPrimary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          Carregar mais vídeos
                          <span className="text-textSecondary text-sm">({videos.length} de {totalVideos})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  {filteredAndSortedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      view="list"
                      openVideoDetails={openVideoDetails}
                      onDelete={handleDelete}
                      onGenerateVariations={handleOpenVariationsModal}
                      onPointerDown={handlePointerDown}
                      isDragging={isDragging && draggedItem?.id === video.id}
                    />
                  ))}
                </div>
                {hasMore && !searchQuery && statusFilter === 'all' && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl transition-colors flex items-center gap-2 text-textPrimary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          Carregar mais vídeos
                          <span className="text-textSecondary text-sm">({videos.length} de {totalVideos})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      <VideoDetailsModal
        video={selectedVideo}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onRetry={handleRetry}
        onDelete={handleDelete}
      />

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      <ShareFolderModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setFolderToShare(null);
        }}
        folder={folderToShare}
      />

      <GenerateVariationsModal
        video={videoForVariations}
        isOpen={showVariationsModal}
        onClose={() => {
          setShowVariationsModal(false);
          setVideoForVariations(null);
        }}
        onGenerate={handleGenerateVariations}
      />

      <DragPreview
        video={draggedItem}
        position={dragPosition}
        isActive={isDragging}
      />
    </div>
  );
}
