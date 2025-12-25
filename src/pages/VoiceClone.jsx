import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ToolInfo from '../components/ui/ToolInfo';
import { Upload, Play, Sparkles, Download, Mic, Loader2, Trash2, Plus, Pause, Volume2, XCircle, CheckCircle2, FileAudio } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toolsInfo } from '../data/toolsInfo';
import { voiceCloneService, TTS_MODELS } from '../services/voiceCloneService';

const TTS_MODEL_OPTIONS = [
  { value: TTS_MODELS.HD_2_6, label: 'HD 2.6', description: 'Alta qualidade com excelente prosódia' },
  { value: TTS_MODELS.TURBO_2_6, label: 'Turbo 2.6', description: 'Rápido com suporte a 40 idiomas' },
];

export default function VoiceClone() {
  const [clonedVoices, setClonedVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  const [selectedVoiceId, setSelectedVoiceId] = useState(null);
  const [text, setText] = useState('');
  const [model, setModel] = useState(TTS_MODELS.HD_2_6);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [uploadingClone, setUploadingClone] = useState(false);
  const [cloneFile, setCloneFile] = useState(null);
  const [voiceName, setVoiceName] = useState('');
  const [promptFile, setPromptFile] = useState(null);
  const [promptText, setPromptText] = useState('');

  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [ttsTasks, setTtsTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  const cloneFileInputRef = useRef(null);
  const promptFileInputRef = useRef(null);
  const pollCleanupRef = useRef(null);

  useEffect(() => {
    loadClonedVoices();
    loadTTSTasks();

    return () => {
      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const loadClonedVoices = async () => {
    try {
      setLoadingVoices(true);
      const voices = await voiceCloneService.getClonedVoices();
      setClonedVoices(voices);
      if (voices.length > 0 && !selectedVoiceId) {
        setSelectedVoiceId(voices[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar vozes:', error);
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadTTSTasks = async () => {
    try {
      setLoadingTasks(true);
      const tasks = await voiceCloneService.getTTSTasks();
      setTtsTasks(tasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCloneFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCloneFile(file);
    }
  };

  const handlePromptFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPromptFile(file);
    }
  };

  const handleCreateVoiceClone = async () => {
    if (!cloneFile || !voiceName) {
      alert('Por favor, selecione um arquivo de áudio e dê um nome para a voz');
      return;
    }

    try {
      setUploadingClone(true);

      const uploadResult = await voiceCloneService.uploadVoiceFile(cloneFile, 'voice_clone');

      let clonePrompt = null;
      if (promptFile && promptText) {
        const promptUploadResult = await voiceCloneService.uploadVoiceFile(promptFile, 'prompt_audio');
        clonePrompt = {
          prompt_audio: promptUploadResult.fileId,
          prompt_text: promptText,
        };
      }

      const voiceId = voiceCloneService.generateVoiceId(voiceName);

      await voiceCloneService.createVoiceClone({
        fileId: uploadResult.fileId,
        voiceId,
        voiceName,
        clonePrompt,
        model: TTS_MODELS.HD_2_6,
      });

      alert('Voz clonada com sucesso!');
      setCloneFile(null);
      setVoiceName('');
      setPromptFile(null);
      setPromptText('');
      setShowCloneModal(false);
      await loadClonedVoices();
    } catch (error) {
      console.error('Erro ao clonar voz:', error);
      alert('Erro ao clonar voz: ' + error.message);
    } finally {
      setUploadingClone(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!text) {
      alert('Por favor, digite o texto para gerar a fala');
      return;
    }

    if (!selectedVoiceId) {
      alert('Por favor, selecione uma voz clonada');
      return;
    }

    try {
      setGeneratingTTS(true);

      const selectedVoice = clonedVoices.find(v => v.id === selectedVoiceId);

      const task = await voiceCloneService.createTTSTask({
        text,
        voiceId: selectedVoice.voice_id,
        clonedVoiceId: selectedVoiceId,
        model,
      });

      setCurrentTask(task);

      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }

      pollCleanupRef.current = voiceCloneService.pollTTSStatus(
        task.id,
        (result) => {
          if (result.status === 'completed') {
            setCurrentTask(result.task);
            setGeneratingTTS(false);
            loadTTSTasks();
          } else if (result.status === 'failed' || result.status === 'expired') {
            setCurrentTask(result.task);
            setGeneratingTTS(false);
            loadTTSTasks();
          } else {
            setCurrentTask(result.task);
          }
        }
      );
    } catch (error) {
      console.error('Erro ao gerar TTS:', error);
      alert('Erro ao gerar áudio: ' + error.message);
      setGeneratingTTS(false);
    }
  };

  const handlePlayAudio = (url) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(url);
      }
    }
  };

  const handleDownloadAudio = (url, filename = 'audio.mp3') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteVoice = async (voiceId) => {
    if (!confirm('Tem certeza que deseja excluir esta voz?')) {
      return;
    }

    try {
      await voiceCloneService.deleteClonedVoice(voiceId);
      await loadClonedVoices();
      if (selectedVoiceId === voiceId) {
        setSelectedVoiceId(null);
      }
    } catch (error) {
      console.error('Erro ao deletar voz:', error);
      alert('Erro ao deletar voz: ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return;
    }

    try {
      await voiceCloneService.deleteTTSTask(taskId);
      await loadTTSTasks();
      if (currentTask && currentTask.id === taskId) {
        setCurrentTask(null);
      }
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      alert('Erro ao deletar tarefa: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Concluído', className: 'bg-green-500/10 text-green-600', icon: CheckCircle2 };
      case 'failed':
        return { label: 'Falhou', className: 'bg-red-500/10 text-red-600', icon: XCircle };
      case 'processing':
        return { label: 'Processando', className: 'bg-blue-500/10 text-blue-600', icon: Loader2 };
      case 'expired':
        return { label: 'Expirado', className: 'bg-yellow-500/10 text-yellow-600', icon: XCircle };
      default:
        return { label: 'Pendente', className: 'bg-gray-500/10 text-gray-600', icon: Loader2 };
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Gerador de Voz UGC</h1>
        <ToolInfo tool={toolsInfo.voiceClone} icon={Mic} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl">Crie vozes naturais para anúncios, reviews e vídeos curtos.</p>

      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-textPrimary">Vozes Clonadas</h3>
              <Button onClick={() => setShowCloneModal(true)} variant="secondary" className="text-sm">
                <Plus size={16} className="mr-2" />
                Clonar Nova Voz
              </Button>
            </div>

            {loadingVoices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-textSecondary" size={32} />
              </div>
            ) : clonedVoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-textSecondary mb-4">Nenhuma voz clonada ainda</p>
                <Button onClick={() => setShowCloneModal(true)}>
                  <Plus size={18} className="mr-2" />
                  Clonar Primeira Voz
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clonedVoices.map((voice) => (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-colors ${
                      selectedVoiceId === voice.id
                        ? 'bg-brandPrimary/10 border-2 border-brandPrimary'
                        : 'bg-surfaceMuted/30 border-2 border hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Volume2 size={18} className="text-brandPrimary" />
                        <span className="text-textPrimary font-medium">{voice.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVoice(voice.id);
                        }}
                        className="p-1 text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded transition-smooth"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {voice.demo_audio_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(voice.demo_audio_url);
                        }}
                        className="text-xs text-textSecondary hover:text-brandPrimary flex items-center gap-1"
                      >
                        {playingAudio === voice.demo_audio_url ? (
                          <Pause size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                        Ouvir preview
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Texto para Fala</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-textPrimary mb-2">Modelo</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TTS_MODEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setModel(option.value)}
                    className={`p-3 rounded-xl text-left transition-colors ${
                      model === option.value
                        ? 'bg-brandPrimary/10 border-2 border-brandPrimary'
                        : 'bg-surfaceMuted/30 border-2 border hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="font-medium text-textPrimary text-sm">{option.label}</div>
                    <div className="text-xs text-textSecondary mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o texto que você quer transformar em voz..."
              rows={8}
              className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-white/[0.15] transition-colors resize-none mb-4"
            />

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-textSecondary">
                {text.length} caracteres
              </span>
            </div>

            <Button
              onClick={handleGenerateTTS}
              disabled={generatingTTS || !selectedVoiceId || !text}
              className="w-full"
            >
              {generatingTTS ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Gerando Fala...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Gerar Fala
                </>
              )}
            </Button>
          </Card>

          {currentTask && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-textPrimary">Áudio Atual</h3>
                <Badge className={getStatusBadge(currentTask.task_status).className}>
                  {getStatusBadge(currentTask.task_status).label}
                </Badge>
              </div>

              {currentTask.task_status === 'completed' && currentTask.audio_url ? (
                <div className="p-6 bg-surfaceMuted/30 rounded-xl border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-textPrimary">audio_gerado.mp3</span>
                    <button
                      onClick={() => handleDownloadAudio(currentTask.audio_url, 'voz_gerada.mp3')}
                      className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors"
                    >
                      <Download size={18} className="text-textSecondary" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlayAudio(currentTask.audio_url)}
                      className="p-3 bg-brandPrimary hover:bg-brandPrimary/80 rounded-xl transition-colors"
                    >
                      {playingAudio === currentTask.audio_url ? (
                        <Pause size={20} className="text-white" />
                      ) : (
                        <Play size={20} className="text-white" />
                      )}
                    </button>
                    <div className="flex-1 text-textSecondary text-sm">
                      Clique para reproduzir
                    </div>
                  </div>
                </div>
              ) : currentTask.task_status === 'processing' ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={32} className="text-brandPrimary animate-spin mb-4" />
                  <p className="text-textPrimary">Processando áudio...</p>
                </div>
              ) : currentTask.task_status === 'failed' ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <XCircle size={32} className="text-red-500 mb-4" />
                  <p className="text-red-500 text-center">
                    {currentTask.error_message || 'Erro ao gerar áudio'}
                  </p>
                </div>
              ) : null}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Histórico de Áudios</h3>

            {loadingTasks ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-textSecondary" size={32} />
              </div>
            ) : ttsTasks.length === 0 ? (
              <p className="text-textSecondary text-center py-8">Nenhum áudio gerado ainda</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {ttsTasks.map((task) => {
                  const statusBadge = getStatusBadge(task.task_status);
                  return (
                    <div
                      key={task.id}
                      className="bg-surfaceMuted/30 rounded-xl p-3 border hover:border-white/[0.15] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded transition-smooth"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <p className="text-textSecondary text-xs line-clamp-2 mb-2">
                        {task.text.substring(0, 100)}...
                      </p>

                      {task.task_status === 'completed' && task.audio_url && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePlayAudio(task.audio_url)}
                            className="flex-1 text-xs py-2 px-3 bg-surfaceMuted/50 hover:bg-surfaceMuted/70 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            {playingAudio === task.audio_url ? (
                              <Pause size={12} />
                            ) : (
                              <Play size={12} />
                            )}
                            Ouvir
                          </button>
                          <button
                            onClick={() => handleDownloadAudio(task.audio_url, `audio_${task.id}.mp3`)}
                            className="flex-1 text-xs py-2 px-3 bg-surfaceMuted/50 hover:bg-surfaceMuted/70 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Download size={12} />
                            Baixar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showCloneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-textPrimary">Clonar Nova Voz</h3>
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="text-textSecondary hover:text-textPrimary"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Nome da Voz *
                  </label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="Ex: Voz Feminina 1"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-white/[0.15] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Áudio para Clonagem * (10s - 5min, MP3/WAV/M4A, máx 20MB)
                  </label>
                  <input
                    ref={cloneFileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleCloneFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => cloneFileInputRef.current?.click()}
                    className="border-2 border-dashed border rounded-xl p-8 text-center hover:border-white/[0.15] transition-colors cursor-pointer"
                  >
                    {cloneFile ? (
                      <>
                        <FileAudio size={40} className="text-brandPrimary mx-auto mb-3" />
                        <p className="text-textPrimary mb-1">{cloneFile.name}</p>
                        <p className="text-textSecondary text-sm">
                          {(cloneFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload size={40} className="text-textSecondary mx-auto mb-3" />
                        <p className="text-textSecondary mb-1">Clique para selecionar</p>
                        <p className="text-textSecondary text-sm">Áudio com a voz a ser clonada</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Áudio Prompt (Opcional, menos de 8s)
                  </label>
                  <input
                    ref={promptFileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handlePromptFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => promptFileInputRef.current?.click()}
                    className="border-2 border-dashed border rounded-xl p-6 text-center hover:border-white/[0.15] transition-colors cursor-pointer"
                  >
                    {promptFile ? (
                      <>
                        <FileAudio size={32} className="text-brandPrimary mx-auto mb-2" />
                        <p className="text-textPrimary text-sm">{promptFile.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-textSecondary mx-auto mb-2" />
                        <p className="text-textSecondary text-sm">Áudio curto para melhorar similaridade</p>
                      </>
                    )}
                  </div>
                </div>

                {promptFile && (
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Transcrição do Áudio Prompt *
                    </label>
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Transcreva exatamente o que é dito no áudio prompt..."
                      rows={3}
                      className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-white/[0.15] transition-colors resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowCloneModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateVoiceClone}
                    disabled={uploadingClone || !cloneFile || !voiceName}
                    className="flex-1"
                  >
                    {uploadingClone ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={18} />
                        Clonando...
                      </>
                    ) : (
                      <>
                        <Mic size={18} className="mr-2" />
                        Clonar Voz
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
