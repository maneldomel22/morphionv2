import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ToolInfo from '../components/ui/ToolInfo';
import { Upload, Copy, Download, FileText, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Trash2, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toolsInfo } from '../data/toolsInfo';
import { transcriptionService } from '../services/transcriptionService';

const SPEECH_MODELS = [
  { value: 'universal', label: 'Universal', description: 'Modelo robusto com suporte a múltiplos idiomas' },
  { value: 'slam-1', label: 'Slam-1 (Beta)', description: 'Modelo customizável (apenas Inglês)' },
];

export default function Transcription() {
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('universal');
  const [elapsedTime, setElapsedTime] = useState(0);

  const fileInputRef = useRef(null);
  const pollCleanupRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTranscriptions();

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

  const loadTranscriptions = async () => {
    try {
      setLoading(true);
      const data = await transcriptionService.getTranscriptions();
      setTranscriptions(data);
    } catch (error) {
      console.error('Erro ao carregar transcrições:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleProcess = async () => {
    if (!audioFile) {
      alert('Por favor, selecione um arquivo de áudio ou vídeo');
      return;
    }

    try {
      setUploading(true);
      const audioUrl = await transcriptionService.uploadAudioFile(audioFile);
      setUploading(false);

      setProcessing(true);
      const transcription = await transcriptionService.createTranscription(
        audioUrl,
        [selectedModel, 'universal']
      );

      setCurrentTranscription(transcription);

      if (pollCleanupRef.current) {
        pollCleanupRef.current();
      }

      pollCleanupRef.current = transcriptionService.pollStatus(
        transcription.id,
        (result) => {
          if (result.status === 'completed') {
            setCurrentTranscription(result.transcription);
            setProcessing(false);
            loadTranscriptions();
          } else if (result.status === 'failed') {
            setCurrentTranscription(result.transcription);
            setProcessing(false);
            loadTranscriptions();
          } else {
            setCurrentTranscription(result.transcription);
          }
        }
      );
    } catch (error) {
      console.error('Erro ao processar:', error);
      alert('Erro ao processar transcrição: ' + error.message);
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleCheckStatus = async (transcriptionId) => {
    try {
      const result = await transcriptionService.checkStatus(transcriptionId);
      await loadTranscriptions();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      alert('Erro ao verificar status: ' + error.message);
    }
  };

  const handleDelete = async (transcriptionId) => {
    if (!confirm('Tem certeza que deseja excluir esta transcrição?')) {
      return;
    }

    try {
      await transcriptionService.deleteTranscription(transcriptionId);
      await loadTranscriptions();

      if (currentTranscription && currentTranscription.id === transcriptionId) {
        setCurrentTranscription(null);
      }
    } catch (error) {
      console.error('Erro ao deletar transcrição:', error);
      alert('Erro ao deletar transcrição: ' + error.message);
    }
  };

  const handleCopyText = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Texto copiado!');
    }
  };

  const handleDownloadText = (text, filename = 'transcricao.txt') => {
    if (text) {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const getLanguageName = (code) => {
    const languages = {
      'pt': 'Português',
      'en': 'Inglês',
      'es': 'Espanhol',
      'fr': 'Francês',
      'de': 'Alemão',
      'it': 'Italiano',
    };
    return languages[code] || code || 'Desconhecido';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Transcrição e Roteiros UGC</h1>
        <ToolInfo tool={toolsInfo.transcription} icon={FileText} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl">Transforme áudio em texto e roteiros prontos para anúncios.</p>

      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Upload de Arquivo</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border rounded-xl p-10 text-center hover:border-white/[0.15] transition-colors cursor-pointer"
          >
            {audioFile ? (
              <>
                <FileText size={48} className="text-brandPrimary mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-textPrimary text-lg mb-2 font-medium">{audioFile.name}</p>
                <p className="text-textSecondary">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <Upload size={48} className="text-textSecondary mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-textSecondary text-lg mb-2">Arraste um áudio ou vídeo</p>
                <p className="text-textSecondary">MP3, WAV, MP4 até 200MB</p>
              </>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-textPrimary mb-3">Modelo de Transcrição</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPEECH_MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => setSelectedModel(model.value)}
                  className={`p-4 rounded-xl text-left transition-colors ${
                    selectedModel === model.value
                      ? 'bg-brandPrimary/10 border-2 border-brandPrimary'
                      : 'bg-surfaceMuted/30 border-2 border hover:border-white/[0.15]'
                  }`}
                >
                  <div className="font-medium text-textPrimary mb-1">{model.label}</div>
                  <div className="text-xs text-textSecondary">{model.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleProcess}
            disabled={uploading || processing || !audioFile}
            className="w-full mt-6"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={18} />
                Enviando arquivo...
              </>
            ) : processing ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={18} />
                Transcrevendo...
              </>
            ) : (
              'Iniciar Transcrição'
            )}
          </Button>
        </Card>

        {currentTranscription && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-textPrimary">Transcrição Atual</h3>
                <Badge className={getStatusBadge(currentTranscription.status).className}>
                  {getStatusBadge(currentTranscription.status).label}
                </Badge>
                {processing && (
                  <span className="text-xs text-textSecondary">
                    {formatTime(elapsedTime)}
                  </span>
                )}
              </div>
            </div>

            {currentTranscription.status === 'completed' && currentTranscription.text ? (
              <>
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={() => handleCopyText(currentTranscription.text)}
                    variant="secondary"
                    className="text-sm"
                  >
                    <Copy size={16} className="mr-2" />
                    Copiar Texto
                  </Button>
                  <Button
                    onClick={() => handleDownloadText(currentTranscription.text)}
                    variant="secondary"
                    className="text-sm"
                  >
                    <Download size={16} className="mr-2" />
                    Baixar
                  </Button>
                </div>

                <textarea
                  value={currentTranscription.text}
                  readOnly
                  rows={12}
                  className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary focus:outline-none focus:border-white/[0.15] transition-colors resize-none"
                />

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-textSecondary block mb-1">Palavras</span>
                    <span className="text-textPrimary font-semibold">{currentTranscription.words_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-textSecondary block mb-1">Duração</span>
                    <span className="text-textPrimary font-semibold">
                      {currentTranscription.audio_duration
                        ? formatTime(Math.floor(currentTranscription.audio_duration / 1000))
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-textSecondary block mb-1">Confiança</span>
                    <span className="text-textPrimary font-semibold">
                      {currentTranscription.confidence
                        ? `${(currentTranscription.confidence * 100).toFixed(0)}%`
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-textSecondary block mb-1">Idioma</span>
                    <Badge variant="success" className="text-xs">
                      {getLanguageName(currentTranscription.language_code)}
                    </Badge>
                  </div>
                </div>

                {currentTranscription.speech_model_used && (
                  <div className="mt-3 text-xs text-textSecondary">
                    Modelo usado: {currentTranscription.speech_model_used}
                  </div>
                )}
              </>
            ) : currentTranscription.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={32} className="text-brandPrimary animate-spin mb-4" />
                <p className="text-textPrimary mb-2">Processando transcrição...</p>
                <p className="text-textSecondary text-sm">Tempo decorrido: {formatTime(elapsedTime)}</p>
              </div>
            ) : currentTranscription.status === 'failed' ? (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle size={32} className="text-red-500 mb-4" />
                <p className="text-red-500 text-center">
                  {currentTranscription.error_message || 'Erro ao processar transcrição'}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Clock size={32} className="text-textSecondary" />
              </div>
            )}
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-textPrimary">Histórico de Transcrições</h3>
            <Button variant="secondary" className="text-sm" onClick={loadTranscriptions}>
              <RefreshCw size={14} className="mr-2" />
              Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-textSecondary" size={32} />
            </div>
          ) : transcriptions.length === 0 ? (
            <p className="text-textSecondary text-center py-8">Nenhuma transcrição encontrada</p>
          ) : (
            <div className="space-y-3">
              {transcriptions.map((transcription) => {
                const statusBadge = getStatusBadge(transcription.status);
                return (
                  <div
                    key={transcription.id}
                    className="bg-surfaceMuted/30 rounded-xl p-4 border hover:border-white/[0.15] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                        {transcription.language_code && (
                          <span className="text-textSecondary text-sm">
                            {getLanguageName(transcription.language_code)}
                          </span>
                        )}
                      </div>
                      <span className="text-textSecondary text-sm">
                        {formatDate(transcription.created_at)}
                      </span>
                    </div>

                    {transcription.text && (
                      <p className="text-textSecondary text-sm line-clamp-2 mb-3">
                        {transcription.text.substring(0, 150)}...
                      </p>
                    )}

                    {transcription.status === 'completed' && transcription.text && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrentTranscription(transcription)}
                          variant="secondary"
                          className="text-sm flex-1"
                        >
                          <Eye size={14} className="mr-2" />
                          Visualizar
                        </Button>
                        <Button
                          onClick={() => handleCopyText(transcription.text)}
                          variant="secondary"
                          className="text-sm flex-1"
                        >
                          <Copy size={14} className="mr-2" />
                          Copiar
                        </Button>
                        <button
                          onClick={() => handleDelete(transcription.id)}
                          className="px-3 text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    {transcription.status === 'processing' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCheckStatus(transcription.id)}
                          variant="secondary"
                          className="text-sm flex-1"
                        >
                          <RefreshCw size={14} className="mr-2" />
                          Verificar Status
                        </Button>
                        <button
                          onClick={() => handleDelete(transcription.id)}
                          className="px-3 text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    {transcription.status === 'failed' && (
                      <div className="flex gap-2 items-start">
                        <p className="text-red-500 text-sm flex-1">
                          {transcription.error_message || 'Erro ao processar'}
                        </p>
                        <button
                          onClick={() => handleDelete(transcription.id)}
                          className="px-3 text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth"
                        >
                          <Trash2 size={14} />
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
  );
}
