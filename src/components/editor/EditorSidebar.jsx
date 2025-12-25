import { useState, useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Type, Image, Video, Plus, Folder, Loader2 } from 'lucide-react';
import { videoService } from '../../services/videoService';
import { getVideoMetadata } from '../../lib/videoMetadata';
import Button from '../ui/Button';

export default function EditorSidebar() {
  const [activeTab, setActiveTab] = useState('media');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedVideo, setDraggedVideo] = useState(null);

  const { addTrack, currentTime, updateTimelineDuration } = useEditorStore();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await videoService.getVideos({ limit: 1000 });
      setVideos(response.videos.filter(v => v.status === 'ready' && v.video_url));
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, video) => {
    setDraggedVideo(video);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('video', JSON.stringify(video));

    const dragPreview = document.createElement('div');
    dragPreview.className = 'flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-2xl';
    dragPreview.innerHTML = `
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
      </svg>
      <span class="text-sm font-semibold">${video.title}</span>
    `;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    dragPreview.style.left = '-1000px';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 20, 20);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };

  const handleDragEnd = () => {
    setDraggedVideo(null);
  };

  const handleAddVideo = async (video) => {
    try {
      const metadata = await getVideoMetadata(video.video_url);

      const newTrack = {
        id: `video-${Date.now()}-${Math.random()}`,
        type: 'video',
        start: currentTime,
        end: currentTime + metadata.duration,
        layer: 0,
        visible: true,
        hasAudio: Boolean(metadata.hasAudio),
        properties: {
          src: video.video_url,
          x: 0,
          y: 0,
          scale: 1,
          trim: {
            start: 0,
            end: metadata.duration
          }
        }
      };

      addTrack(newTrack);
      updateTimelineDuration();
    } catch (error) {
      console.error('Error loading video metadata:', error);

      const fallbackDuration = 5;
      const newTrack = {
        id: `video-${Date.now()}-${Math.random()}`,
        type: 'video',
        start: currentTime,
        end: currentTime + fallbackDuration,
        layer: 0,
        visible: true,
        hasAudio: true,
        properties: {
          src: video.video_url,
          x: 0,
          y: 0,
          scale: 1,
          trim: {
            start: 0,
            end: fallbackDuration
          }
        }
      };
      addTrack(newTrack);
      updateTimelineDuration();
    }
  };

  const handleAddText = () => {
    const newTrack = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      start: currentTime,
      end: currentTime + 3,
      layer: 10,
      visible: true,
      properties: {
        text: 'Text Layer',
        font: 'Inter',
        size: 64,
        color: '#FFFFFF',
        x: 960,
        y: 540,
        align: 'center',
        animation: 'none',
        bold: true
      }
    };
    addTrack(newTrack);
    updateTimelineDuration();
  };

  const handleAddTextPreset = (preset) => {
    const sizes = { 'Título Principal': 80, 'Subtítulo': 48, 'CTA': 56, 'Legenda': 32 };
    const newTrack = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: 'text',
      start: currentTime,
      end: currentTime + 3,
      layer: 10,
      visible: true,
      properties: {
        text: preset,
        font: 'Inter',
        size: sizes[preset],
        color: '#FFFFFF',
        x: 960,
        y: preset === 'Título Principal' ? 400 : preset === 'Subtítulo' ? 500 : preset === 'CTA' ? 600 : 900,
        align: 'center',
        animation: 'fade-in',
        bold: preset === 'Título Principal' || preset === 'CTA'
      }
    };
    addTrack(newTrack);
    updateTimelineDuration();
  };

  const tabs = [
    { id: 'media', label: 'Mídia', icon: Folder },
    { id: 'text', label: 'Texto', icon: Type },
  ];

  return (
    <div className="h-full bg-surfaceDark flex flex-col">
      <div className="flex border-b border-borderSubtle flex-shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-brandPrimary/10 text-brandPrimary border-b-2 border-brandPrimary'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceMuted/30'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-textPrimary">Vídeos</h3>
              <button
                onClick={loadVideos}
                className="p-1.5 hover:bg-surfaceMuted/50 rounded transition-colors"
                title="Refresh"
              >
                <Loader2 size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-textSecondary text-sm">
                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8 text-textSecondary text-sm">
                <Video size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum vídeo encontrado</p>
                <p className="text-xs mt-1">Gere vídeos primeiro</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, video)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAddVideo(video)}
                    className={`group relative aspect-video bg-black rounded-lg overflow-hidden border border-borderSubtle hover:border-brandPrimary transition-all cursor-grab active:cursor-grabbing ${
                      draggedVideo?.id === video.id ? 'opacity-50' : ''
                    }`}
                  >
                    {video.video_url ? (
                      <video
                        src={video.video_url}
                        className="w-full h-full object-contain"
                        preload="metadata"
                        playsInline
                        muted
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surfaceMuted">
                        <Video size={24} className="text-textSecondary" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <span className="text-xs text-white truncate font-medium">{video.title}</span>
                      <span className="text-xs text-white/70">Click or drag</span>
                    </div>
                    <div className="absolute top-1 right-1 bg-black/80 rounded px-1.5 py-0.5 text-xs text-white font-mono">
                      {video.duration || '5s'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-textPrimary mb-4">Adicionar Texto</h3>

            <Button onClick={handleAddText} className="w-full">
              <Plus size={16} />
              Adicionar Texto
            </Button>

            <div className="space-y-3 mt-6">
              <p className="text-xs text-textSecondary uppercase font-semibold tracking-wider">Presets</p>

              {['Título Principal', 'Subtítulo', 'CTA', 'Legenda'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleAddTextPreset(preset)}
                  className="w-full p-3 bg-surfaceMuted hover:bg-surfaceMuted/70 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <p className="text-sm text-textPrimary font-medium">{preset}</p>
                  <p className="text-xs text-textSecondary mt-1">Clique para adicionar à timeline</p>
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 bg-brandPrimary/10 border border-brandPrimary/30 rounded-lg">
              <p className="text-xs text-textPrimary font-medium mb-1">Dica</p>
              <p className="text-xs text-textSecondary">
                Textos serão adicionados no tempo atual da timeline. Mova a agulha para escolher quando aparecer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
