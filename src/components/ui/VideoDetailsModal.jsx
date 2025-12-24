import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { Clock, AlertCircle, CheckCircle, Loader2, RefreshCw, Copy, ExternalLink, Play, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { kieApiService } from '../../services/kieApiService';

export default function VideoDetailsModal({ video, isOpen, onClose, onRetry, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [kiePayload, setKiePayload] = useState(null);
  const [kiePrompt, setKiePrompt] = useState(null);
  const [loadingPayload, setLoadingPayload] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen && video?.kie_task_id && !kiePayload) {
      fetchKiePayload();
    }

    if (!isOpen) {
      setKiePayload(null);
      setKiePrompt(null);
      setShowPayload(false);
      setIsPlaying(false);
    }
  }, [isOpen, video?.kie_task_id]);

  const fetchKiePayload = async () => {
    if (!video?.kie_task_id) return;

    console.log('🔍 Buscando payload da KIE para taskId:', video.kie_task_id);
    setLoadingPayload(true);
    try {
      const result = await kieApiService.checkVideoStatus(video.kie_task_id);
      console.log('✅ Resultado da KIE:', result);
      setKiePayload(result);

      // Extrair o prompt do payload
      if (result?.data?.param) {
        console.log('📦 Param encontrado:', result.data.param);
        try {
          const paramData = JSON.parse(result.data.param);
          console.log('📄 Param parseado:', paramData);
          if (paramData?.input?.prompt) {
            console.log('✨ Prompt extraído:', paramData.input.prompt);
            setKiePrompt(paramData.input.prompt);
          } else {
            console.log('⚠️ Prompt não encontrado em paramData.input.prompt');
          }
        } catch (e) {
          console.error('❌ Erro ao fazer parse do param:', e);
        }
      } else {
        console.log('⚠️ result.data.param não encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar payload da KIE:', error);
    } finally {
      setLoadingPayload(false);
    }
  };

  if (!video) return null;

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const getStatusIcon = () => {
    switch (video.status) {
      case 'ready':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'processing':
        return <Loader2 size={20} className="text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock size={20} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = () => {
    const statusMap = {
      'ready': 'Pronto',
      'failed': 'Falhou',
      'processing': 'Processando',
      'queued': 'Na Fila'
    };
    return statusMap[video.status] || video.status;
  };

  const getStatusColor = () => {
    const colorMap = {
      'ready': 'green',
      'failed': 'red',
      'processing': 'blue',
      'queued': 'yellow'
    };
    return colorMap[video.status] || 'gray';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Vídeo">
      <div className="flex flex-col-reverse md:flex-col gap-6">
        {/* Preview do Vídeo - Em mobile aparece primeiro */}
        {video.video_url && video.status === 'ready' && (
          <div className="space-y-3">
            <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden mx-auto max-w-[280px] sm:max-w-xs relative">
              <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-full object-contain"
                controls={isPlaying}
                preload="metadata"
                playsInline
                onPause={handlePause}
              />
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-colors"
                  onClick={handlePlayClick}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
                    <Play size={32} sm:size={40} className="text-black ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>
            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl transition-colors text-sm"
            >
              <ExternalLink size={14} sm:size={16} className="text-textSecondary" />
              <span className="text-textPrimary text-xs sm:text-sm">Abrir Vídeo em Nova Aba</span>
            </a>
          </div>
        )}

        {/* Informações do Vídeo */}
        <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-textPrimary truncate">{video.title}</h3>
              <Badge variant={getStatusColor()}>{getStatusLabel()}</Badge>
            </div>
          </div>
          {video.status === 'ready' && video.video_url && (
            <a
              href={video.video_url}
              download
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brandPrimary hover:bg-brandPrimary/90 rounded-lg transition-colors flex-shrink-0"
            >
              <Download size={14} sm:size={16} className="text-white" />
              <span className="text-white font-medium text-xs sm:text-sm">Baixar</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-textSecondary text-sm mb-1">Avatar</p>
            <p className="text-textPrimary font-medium">{video.avatar_name}</p>
          </div>
          <div>
            <p className="text-textSecondary text-sm mb-1">Gênero</p>
            <p className="text-textPrimary font-medium">{video.avatar_gender}</p>
          </div>
          <div>
            <p className="text-textSecondary text-sm mb-1">Duração</p>
            <p className="text-textPrimary font-medium">{video.duration}</p>
          </div>
          <div>
            <p className="text-textSecondary text-sm mb-1">Proporção</p>
            <p className="text-textPrimary font-medium">{video.aspect_ratio}</p>
          </div>
          <div>
            <p className="text-textSecondary text-sm mb-1">Estilo</p>
            <p className="text-textPrimary font-medium">{video.creative_style}</p>
          </div>
          <div>
            <p className="text-textSecondary text-sm mb-1">Créditos</p>
            <p className="text-textPrimary font-medium">{video.credits_used}</p>
          </div>
        </div>

        {video.dialogue && (
          <div>
            <p className="text-textSecondary text-sm mb-2">Diálogo</p>
            <div className="bg-surfaceMuted/30 p-3 rounded-xl">
              <p className="text-textPrimary text-sm italic">"{video.dialogue}"</p>
            </div>
          </div>
        )}

        {video.metadata && (
          <>
            {video.metadata.scene_settings && (
              <div>
                <p className="text-textSecondary text-sm mb-2">Cenário</p>
                <div className="bg-surfaceMuted/30 p-3 rounded-xl space-y-2">
                  {video.metadata.scene_settings.location && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Local</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.scene_settings.location}</span>
                    </div>
                  )}
                  {video.metadata.scene_settings.lighting && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Iluminação</span>
                      <span className="text-textPrimary text-xs font-medium">{video.metadata.scene_settings.lighting}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {video.metadata.style_settings && (
              <div>
                <p className="text-textSecondary text-sm mb-2">Estilo de Gravação</p>
                <div className="bg-surfaceMuted/30 p-3 rounded-xl space-y-2">
                  {video.metadata.style_settings.framing && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Enquadramento</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.style_settings.framing}</span>
                    </div>
                  )}
                  {video.metadata.style_settings.cameraAngle && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Ângulo</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.style_settings.cameraAngle}</span>
                    </div>
                  )}
                  {video.metadata.style_settings.movement && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Movimento</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.style_settings.movement}</span>
                    </div>
                  )}
                  {video.metadata.style_settings.depthOfField && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Profundidade</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.style_settings.depthOfField}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {video.metadata.product_data && (
              <div>
                <p className="text-textSecondary text-sm mb-2">Produto</p>
                <div className="bg-surfaceMuted/30 p-3 rounded-xl space-y-2">
                  {video.metadata.product_data.name && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Nome</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.product_data.name}</span>
                    </div>
                  )}
                  {video.metadata.product_data.action && (
                    <div className="flex justify-between">
                      <span className="text-textSecondary text-xs">Ação</span>
                      <span className="text-textPrimary text-xs font-medium text-right">{video.metadata.product_data.action}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {video.kie_task_id && (
          <div>
            <p className="text-textSecondary text-sm mb-2">Prompt da KIE</p>
            <div className="bg-surfaceMuted/30 p-3 rounded-xl">
              {loadingPayload ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 size={16} className="text-textSecondary animate-spin mr-2" />
                  <span className="text-textSecondary text-sm">Carregando prompt...</span>
                </div>
              ) : kiePrompt ? (
                <p className="text-textPrimary text-sm whitespace-pre-wrap break-words">
                  {kiePrompt}
                </p>
              ) : (
                <p className="text-textSecondary text-sm text-center py-2">
                  Prompt não disponível
                </p>
              )}
            </div>
          </div>
        )}

        {video.generation_mode && (
          <div>
            <p className="text-textSecondary text-sm mb-1">Modo de Geração</p>
            <Badge variant="gray">
              {video.generation_mode === 'text-to-video' ? 'Texto → Vídeo' : 'Imagem → Vídeo'}
            </Badge>
          </div>
        )}

        {video.kie_model && (
          <div>
            <p className="text-textSecondary text-sm mb-1">Modelo</p>
            <p className="text-textPrimary font-mono text-xs bg-surfaceMuted/30 p-2 rounded">
              {video.kie_model}
            </p>
          </div>
        )}

        {video.kie_task_id && (
          <div>
            <p className="text-textSecondary text-sm mb-1">Task ID</p>
            <div className="flex items-center gap-2">
              <p className="text-textPrimary font-mono text-xs bg-surfaceMuted/30 p-2 rounded flex-1 truncate">
                {video.kie_task_id}
              </p>
              <button
                onClick={() => copyToClipboard(video.kie_task_id)}
                className="p-2 hover:bg-surfaceMuted/30 rounded transition-colors"
                title="Copiar Task ID"
              >
                {copied ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className="text-textSecondary" />
                )}
              </button>
            </div>
          </div>
        )}

        {video.kie_task_id && (
          <div>
            <button
              onClick={() => setShowPayload(!showPayload)}
              className="w-full flex items-center justify-between p-3 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl transition-colors"
            >
              <span className="text-textSecondary text-sm font-medium">Payload da KIE</span>
              <div className="flex items-center gap-2">
                {loadingPayload && <Loader2 size={16} className="text-textSecondary animate-spin" />}
                {showPayload ? <ChevronUp size={16} className="text-textSecondary" /> : <ChevronDown size={16} className="text-textSecondary" />}
              </div>
            </button>

            {showPayload && (
              <div className="mt-2 bg-surfaceMuted/30 p-3 rounded-xl">
                {loadingPayload ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="text-textSecondary animate-spin" />
                    <span className="ml-2 text-textSecondary text-sm">Carregando payload...</span>
                  </div>
                ) : kiePayload ? (
                  <pre className="text-xs text-textPrimary font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {JSON.stringify(kiePayload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-textSecondary text-sm text-center py-4">
                    Nenhum payload disponível
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-textSecondary text-sm mb-1">Criado em</p>
            <p className="text-textPrimary text-xs">{formatDate(video.created_at)}</p>
          </div>
          {video.completed_at && (
            <div>
              <p className="text-textSecondary text-sm mb-1">Completado em</p>
              <p className="text-textPrimary text-xs">{formatDate(video.completed_at)}</p>
            </div>
          )}
        </div>

        {video.status === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 sm:p-4 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} sm:size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-500 font-semibold text-xs sm:text-sm mb-1">Erro na Geração</p>
                {video.kie_fail_code && (
                  <p className="text-textSecondary text-xs mb-1">
                    Código: <span className="font-mono">{video.kie_fail_code}</span>
                  </p>
                )}
                {video.kie_fail_message && (
                  <p className="text-textPrimary text-xs sm:text-sm">{video.kie_fail_message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-white/[0.08]">
          {video.status === 'failed' && onRetry && (
            <Button onClick={() => onRetry(video.id)} className="flex-1">
              <RefreshCw size={16} className="mr-2" />
              Tentar Novamente
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir este vídeo?')) {
                  onDelete(video.id);
                }
              }}
              variant="secondary"
              className="flex-1 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
            >
              <Trash2 size={16} className="mr-2" />
              Excluir
            </Button>
          )}
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Fechar
          </Button>
        </div>
        </div>
      </div>
    </Modal>
  );
}
