import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ToolInfo from '../components/ui/ToolInfo';
import { Upload, Play, Download, Video, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Trash2, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toolsInfo } from '../data/toolsInfo';
import { lipSyncService } from '../services/lipSyncService';

export default function LipSync() {
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [videoParams, setVideoParams] = useState({
    video_width: 0,
    video_height: 0,
    video_enhance: 0,
    fps: 'original',
  });

  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const resultVideoRef = useRef(null);
  const pollCleanupRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTasks();

    return () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (processing) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [processing]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await lipSyncService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const handleProcess = async () => {
    if (!videoFile || !audioFile) {
      alert('Por favor, selecione um vídeo e um áudio');
      return;
    }

    try {
      setProcessing(true);

      const videoUrl = await lipSyncService.uploadFile(videoFile, 'video');
      const audioUrl = await lipSyncService.uploadFile(audioFile, 'audio');

      const { taskId } = await lipSyncService.startLipSync(videoUrl, audioUrl, videoParams);

      const task = await lipSyncService.getTask(taskId);
      setCurrentTask(task);

      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }

      pollCleanupRef.current = lipSyncService.pollStatus(taskId, (status) => {
        if (status.status === 'completed') {
          setCurrentTask((prev) => ({
            ...prev,
            status: 'completed',
            result_video_url: status.resultVideoUrl,
          }));
          setProcessing(false);
          loadTasks();
        } else if (status.status === 'failed') {
          setCurrentTask((prev) => ({
            ...prev,
            status: 'failed',
            error_message: status.errorMessage,
          }));
          setProcessing(false);
          loadTasks();
        } else {
          setCurrentTask((prev) => ({
            ...prev,
            status: status.status,
          }));
        }
      });
    } catch (error) {
      console.error('Erro ao processar:', error);
      alert('Erro ao processar LipSync: ' + error.message);
      setProcessing(false);
    }
  };

  const handleCheckStatus = async (taskId) => {
    try {
      setCheckingStatus(true);
      const status = await lipSyncService.checkStatus(taskId);

      if (currentTask && currentTask.id === taskId) {
        setCurrentTask((prev) => ({
          ...prev,
          status: status.status,
          result_video_url: status.resultVideoUrl || prev.result_video_url,
          error_message: status.errorMessage || prev.error_message,
        }));
      }

      await loadTasks();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      alert('Erro ao verificar status: ' + error.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }

    try {
      await lipSyncService.deleteTask(taskId);
      await loadTasks();

      if (currentTask && currentTask.id === taskId) {
        setCurrentTask(null);
      }
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      alert('Erro ao deletar vídeo: ' + error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async (url, filename = 'lipsync-result.mp4') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao baixar:', error);
      alert('Erro ao baixar vídeo');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Concluído', className: 'bg-green-500/10 text-green-600' };
      case 'failed':
        return { label: 'Falhou', className: 'bg-red-500/10 text-red-600' };
      case 'processing':
        return { label: 'Processando', className: 'bg-blue-500/10 text-blue-600' };
      default:
        return { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Há ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'processing':
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Falhou';
      case 'processing':
        return 'Processando';
      default:
        return 'Pendente';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">
          Lip Sync para Criativos
        </h1>
        <ToolInfo tool={toolsInfo.lipSync} icon={Video} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl">
        Sincronize áudio e vídeo para criativos mais naturais e realistas.
      </p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Upload de Vídeo</h3>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/mov"
              onChange={handleVideoSelect}
              className="hidden"
            />
            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border rounded-xl p-8 text-center hover:border-white/[0.15] transition-colors cursor-pointer"
            >
              {videoPreview ? (
                <video src={videoPreview} className="w-full rounded-lg mb-3" controls />
              ) : (
                <>
                  <Upload size={40} className="text-textSecondary mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-textSecondary mb-1">Arraste o vídeo base</p>
                  <p className="text-textSecondary text-sm">MP4, MOV até 500MB</p>
                </>
              )}
            </div>
            {videoFile && (
              <p className="text-textSecondary text-sm mt-2">
                Arquivo: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Upload de Áudio</h3>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mp3,audio/wav,audio/mpeg"
              onChange={handleAudioSelect}
              className="hidden"
            />
            <div
              onClick={() => audioInputRef.current?.click()}
              className="border-2 border-dashed border rounded-xl p-8 text-center hover:border-white/[0.15] transition-colors cursor-pointer"
            >
              {audioPreview ? (
                <audio src={audioPreview} className="w-full mb-3" controls />
              ) : (
                <>
                  <Upload size={40} className="text-textSecondary mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-textSecondary mb-1">Arraste o áudio</p>
                  <p className="text-textSecondary text-sm">MP3, WAV até 50MB</p>
                </>
              )}
            </div>
            {audioFile && (
              <p className="text-textSecondary text-sm mt-2">
                Arquivo: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-textPrimary mb-6">Configurações</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-3">FPS</label>
              <div className="grid grid-cols-3 gap-2">
                {['25', '30', 'original'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setVideoParams({ ...videoParams, fps: f })}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      videoParams.fps === f
                        ? 'bg-white text-black'
                        : 'bg-surfaceMuted/30 text-textSecondary hover:bg-surfaceMuted/50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-xs text-textSecondary mt-2">
                Original mantém o FPS do vídeo original
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-3">
                Resolução
              </label>
              <select
                value={videoParams.video_width}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value === 0) {
                    setVideoParams({ ...videoParams, video_width: 0, video_height: 0 });
                  } else if (value === 1920) {
                    setVideoParams({ ...videoParams, video_width: 1920, video_height: 1080 });
                  } else if (value === 1080) {
                    setVideoParams({ ...videoParams, video_width: 1080, video_height: 1920 });
                  }
                }}
                className="w-full py-3 px-4 bg-surfaceMuted/30 border rounded-xl text-textPrimary focus:outline-none focus:border-white/[0.15] transition-colors"
              >
                <option value="0">Original</option>
                <option value="1920">1920x1080 (16:9)</option>
                <option value="1080">1080x1920 (9:16)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-3">
                Melhorar Qualidade
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 0, label: 'Não' },
                  { value: 1, label: 'Sim' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVideoParams({ ...videoParams, video_enhance: option.value })}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      videoParams.video_enhance === option.value
                        ? 'bg-white text-black'
                        : 'bg-surfaceMuted/30 text-textSecondary hover:bg-surfaceMuted/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleProcess}
            disabled={processing || !videoFile || !audioFile}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={18} />
                Processando...
              </>
            ) : (
              'Processar Lip Sync'
            )}
          </Button>
        </Card>

        {currentTask && (
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Preview Comparativo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-textSecondary text-sm mb-3">Original</p>
                <div className="aspect-video bg-surfaceMuted/30 rounded-xl overflow-hidden border">
                  {videoPreview ? (
                    <video src={videoPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={32} className="text-textSecondary" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-textSecondary text-sm">Com Lip Sync</p>
                    {getStatusIcon(currentTask.status)}
                    <span className="text-sm text-textSecondary">{getStatusText(currentTask.status)}</span>
                  </div>
                  {processing && (
                    <span className="text-xs text-textSecondary">
                      {formatTime(elapsedTime)}
                    </span>
                  )}
                </div>
                <div className="aspect-video bg-surfaceMuted/30 rounded-xl overflow-hidden border">
                  {currentTask.status === 'completed' && currentTask.result_video_url ? (
                    <video
                      ref={resultVideoRef}
                      src={currentTask.result_video_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : currentTask.status === 'processing' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <Loader2 size={32} className="text-textSecondary animate-spin mb-4" />
                      <p className="text-textSecondary text-sm mb-2">Processando vídeo...</p>
                      <p className="text-textSecondary text-xs">Tempo decorrido: {formatTime(elapsedTime)}</p>
                    </div>
                  ) : currentTask.status === 'failed' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <XCircle size={32} className="text-red-500 mb-2" />
                      <p className="text-red-500 text-sm text-center">
                        {currentTask.error_message || 'Erro ao processar'}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={32} className="text-textSecondary" />
                    </div>
                  )}
                </div>
                {currentTask.status === 'completed' && currentTask.result_video_url && (
                  <Button
                    onClick={() => handleDownload(currentTask.result_video_url)}
                    variant="secondary"
                    className="w-full mt-3"
                  >
                    <Download size={16} className="mr-2" />
                    Baixar Resultado
                  </Button>
                )}
                {currentTask.status === 'processing' && (
                  <Button
                    onClick={() => handleCheckStatus(currentTask.id)}
                    variant="secondary"
                    disabled={checkingStatus}
                    className="w-full mt-3"
                  >
                    {checkingStatus ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Verificar Status
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-textPrimary">Histórico</h3>
            <Button variant="secondary" className="text-sm" onClick={loadTasks}>
              <RefreshCw size={14} className="mr-2" />
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-textSecondary" size={32} />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-textSecondary text-center py-8">Nenhuma tarefa encontrada</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tasks.map((task) => {
                const statusBadge = getStatusBadge(task.status);
                return (
                  <Card key={task.id} className="group overflow-hidden">
                    <div className="relative bg-black">
                      {task.status === 'completed' && task.result_video_url ? (
                        <video
                          src={task.result_video_url}
                          className="w-full h-auto"
                          controls
                          preload="metadata"
                          playsInline
                        />
                      ) : task.status === 'processing' ? (
                        <div className="aspect-video w-full bg-surfaceMuted/30 flex flex-col items-center justify-center gap-3">
                          <Loader2 size={32} className="text-blue-500 animate-spin" />
                          <div className="text-sm text-textSecondary">Processando...</div>
                        </div>
                      ) : task.status === 'failed' ? (
                        <div className="aspect-video w-full bg-surfaceMuted/30 flex flex-col items-center justify-center gap-3 p-4">
                          <div className="text-5xl">⚠️</div>
                          <div className="text-sm text-red-400 text-center font-medium">Falha no processamento</div>
                          {task.error_message && (
                            <div className="text-xs text-textSecondary text-center line-clamp-2">
                              {task.error_message}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-surfaceMuted/30 flex items-center justify-center">
                          <Clock size={32} className="text-textSecondary" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <Badge className={`${statusBadge.className} border`}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-textSecondary">
                        <span>{formatDate(task.created_at)}</span>
                      </div>

                      <div className="space-y-2">
                        {task.status === 'completed' && task.result_video_url ? (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => {
                                  setCurrentTask(task);
                                  setTimeout(() => {
                                    resultVideoRef.current?.scrollIntoView({ behavior: 'smooth' });
                                  }, 100);
                                }}
                                className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-smooth flex items-center justify-center gap-1"
                              >
                                <Eye size={14} />
                                Ver
                              </button>
                              <a
                                href={task.result_video_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-smooth flex items-center justify-center gap-1"
                              >
                                <Download size={14} />
                                Baixar
                              </a>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-2 text-xs text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth flex items-center justify-center gap-1"
                              >
                                <Trash2 size={14} />
                                Apagar
                              </button>
                            </div>
                          </>
                        ) : task.status === 'processing' ? (
                          <>
                            <Button
                              onClick={() => handleCheckStatus(task.id)}
                              variant="secondary"
                              disabled={checkingStatus}
                              className="text-xs w-full"
                            >
                              {checkingStatus ? (
                                <>
                                  <Loader2 size={14} className="mr-2 animate-spin" />
                                  Verificando...
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={14} className="mr-2" />
                                  Verificar Status
                                </>
                              )}
                            </Button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="w-full p-2 text-xs text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth flex items-center justify-center gap-1"
                            >
                              <Trash2 size={14} />
                              Apagar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="w-full p-2 text-xs text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth flex items-center justify-center gap-1"
                          >
                            <Trash2 size={14} />
                            Apagar
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
