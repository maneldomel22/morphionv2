import Card from '../components/ui/Card';
import ToolInfo from '../components/ui/ToolInfo';
import { Sparkles, Send, Plus, Loader2, Trash2, Flame } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { morphyService } from '../services/morphyService';
import { toolsInfo } from '../data/toolsInfo';

export default function Morphy() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState(null);
  const [isBadMode, setIsBadMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [isBadMode]);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  const handleVideoLoadedData = () => {
    if (videoRef.current && !isTransitioning) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await morphyService.getConversations(isBadMode);
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await morphyService.getMessages(conversationId);
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        type: msg.role,
        text: msg.content,
        suggestions: msg.suggestions,
        created_at: msg.created_at
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const createNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
  };

  const toggleBadMode = () => {
    if (videoRef.current && !isTransitioning) {
      setIsTransitioning(true);
      const video = videoRef.current;

      // Troca o vídeo baseado no modo
      video.src = isBadMode ? '/videocorretoreverso.mp4' : '/teste.mp4';
      video.currentTime = 0;
      video.play();
    }
  };

  const handleVideoEnd = () => {
    setIsShaking(true);
    setIsBadMode(prev => !prev);
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);

    setTimeout(() => {
      setIsShaking(false);
      setIsTransitioning(false);
    }, 500);
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();

    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      await morphyService.deleteConversation(conversationId);

      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Erro ao excluir conversa');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      type: 'user',
      text: inputText.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const result = await morphyService.sendMessage({
        conversationId: currentConversationId,
        message: messageText,
        language: 'pt-BR',
        style: 'natural',
        tone: 'conversational',
        duration: 15,
        isBadMode
      });

      if (result.success) {
        if (!currentConversationId) {
          setCurrentConversationId(result.conversationId);
          await loadConversations();
        }
        await loadMessages(result.conversationId);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (err) {
      console.error('Erro ao chamar Morphy:', err);
      setError(err.message);

      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        text: `Desculpe, ocorreu um erro: ${err.message}\n\nVerifique se a chave da OpenAI está configurada corretamente.`,
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-[calc(100vh-12rem)] ${isShaking ? 'animate-shake' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className={`text-5xl font-bold tracking-tight transition-colors ${
            isBadMode ? 'text-red-500' : 'text-textPrimary'
          }`}>
            {isBadMode ? 'Bad Morphy' : 'Morphy'} — Assistente Criativo
          </h1>
          <ToolInfo tool={toolsInfo.morphy} icon={Sparkles} />
        </div>
        <button
          onClick={toggleBadMode}
          disabled={isTransitioning}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isBadMode
              ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
              : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/50 hover:bg-gray-500/30'
          }`}
        >
          <Flame size={18} className={isBadMode ? 'animate-pulse' : ''} />
          {isBadMode ? 'Bad Mode ON' : 'Ativar Bad Mode'}
        </button>
      </div>
      <p className={`mb-6 text-xl transition-colors ${
        isBadMode ? 'text-red-400/80' : 'text-textSecondary'
      }`}>
        {isBadMode ? 'Modo sem filtros. Criatividade sem limites.' : 'Gere ideias, roteiros e prompts para UGC e anúncios.'}
      </p>

      {error && error.includes('OPENAI_API_KEY') && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <p className="text-yellow-400 text-sm">
            A chave da OpenAI não está configurada. Configure a variável <code className="bg-black/30 px-2 py-1 rounded">OPENAI_API_KEY</code> no Supabase Dashboard em Settings → Edge Functions → Secrets.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-7rem)]">
        <div>
          <Card className={`h-full flex flex-col transition-all ${
            isBadMode ? 'border-red-900/50' : ''
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold transition-colors ${
                isBadMode ? 'text-red-400' : 'text-textPrimary'
              }`}>
                Conversas
              </h3>
              <button
                onClick={createNewConversation}
                className={`p-2 rounded-lg transition-colors ${
                  isBadMode ? 'hover:bg-red-900/30' : 'hover:bg-surfaceMuted/30'
                }`}
              >
                <Plus size={18} className={isBadMode ? 'text-red-400' : 'text-textSecondary'} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="text-textSecondary animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-textSecondary text-sm">Nenhuma conversa ainda</p>
                  <p className="text-textSecondary text-xs mt-2">Comece uma nova conversa</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`w-full rounded-xl transition-colors relative group ${
                      currentConversationId === conv.id
                        ? isBadMode
                          ? 'bg-red-900/30 border border-red-500/40'
                          : 'bg-white/10 border border-white/20'
                        : isBadMode
                        ? 'bg-red-950/20 hover:bg-red-900/20'
                        : 'bg-surfaceMuted/30 hover:bg-surfaceMuted/50'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentConversationId(conv.id)}
                      className="w-full p-3 text-left"
                    >
                      <p className={`font-medium text-sm truncate mb-1 pr-8 transition-colors ${
                        isBadMode ? 'text-red-300' : 'text-textPrimary'
                      }`}>
                        {conv.title}
                      </p>
                      <p className={`text-xs transition-colors ${
                        isBadMode ? 'text-red-500/60' : 'text-textSecondary'
                      }`}>
                        {formatDate(conv.updated_at)}
                      </p>
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                      title="Excluir conversa"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className={`h-full flex flex-col transition-all ${
            isBadMode ? 'border-red-900/50' : ''
          }`}>
            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <video
                      ref={videoRef}
                      src={isBadMode ? '/videocorretoreverso.mp4' : '/teste.mp4'}
                      muted
                      onEnded={handleVideoEnd}
                      onLoadedData={handleVideoLoadedData}
                      preload="auto"
                      className="w-[600px] h-[600px] mx-auto mb-3 pointer-events-none"
                      style={{
                        objectFit: 'contain'
                      }}
                    />
                    <h3 className={`font-bold text-3xl mb-3 transition-colors ${
                      isBadMode ? 'text-red-400' : 'text-textPrimary'
                    }`}>
                      {isBadMode ? 'Fala aí, sou o Bad Morphy' : 'Olá! Sou o Morphy'}
                    </h3>
                    <p className={`text-lg max-w-2xl mx-auto leading-relaxed transition-colors ${
                      isBadMode ? 'text-red-400/80' : 'text-textSecondary'
                    }`}>
                      {isBadMode
                        ? 'Transformo tua fantasia em frame, tua tara em timeline.'
                        : 'Peça sugestões de roteiros, ideias de diálogos ou variações criativas para seus vídeos UGC.'
                      }
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl transition-colors ${
                      message.type === 'user'
                        ? isBadMode
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-black'
                        : message.isError
                        ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                        : isBadMode
                        ? 'bg-red-950/40 border border-red-900/50 text-red-200'
                        : 'bg-surfaceMuted/30 border text-textPrimary'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        {isBadMode ? (
                          <Flame size={16} className="text-red-400" />
                        ) : (
                          <Sparkles size={16} className="text-textSecondary" />
                        )}
                        <span className={`text-xs font-medium ${
                          isBadMode ? 'text-red-400' : 'text-textSecondary'
                        }`}>
                          {isBadMode ? 'Bad Morphy' : 'Morphy'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className={`border rounded-2xl p-4 flex items-center gap-2 transition-colors ${
                    isBadMode
                      ? 'bg-red-950/40 border-red-900/50'
                      : 'bg-surfaceMuted/30'
                  }`}>
                    <Loader2 size={16} className={`animate-spin ${
                      isBadMode ? 'text-red-400' : 'text-textSecondary'
                    }`} />
                    <span className={`text-sm ${
                      isBadMode ? 'text-red-300' : 'text-textSecondary'
                    }`}>
                      {isBadMode ? 'Bad Morphy está pensando...' : 'Morphy está pensando...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isBadMode
                  ? "Pergunte ao Bad Morphy sobre ideias ousadas, sem filtros..."
                  : "Pergunte ao Morphy sobre roteiros, ideias, prompts..."
                }
                rows={3}
                className={`w-full px-4 py-4 pr-14 border rounded-2xl resize-none focus:outline-none transition-colors ${
                  isBadMode
                    ? 'bg-red-950/30 border-red-900/50 text-red-200 placeholder:text-red-500/50 focus:border-red-700/50'
                    : 'bg-surfaceMuted/30 border text-textPrimary placeholder:text-textSecondary focus:border-white/[0.15]'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                className={`absolute bottom-4 right-4 p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isBadMode
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-white hover:bg-white/90'
                }`}
                disabled={!inputText.trim() || loading}
              >
                <Send size={18} className={isBadMode ? 'text-white' : 'text-black'} />
              </button>
            </div>

            <p className={`text-xs mt-3 text-center transition-colors ${
              isBadMode ? 'text-red-500/60' : 'text-textSecondary'
            }`}>
              {isBadMode
                ? 'Bad Morphy não tem filtros. Use com responsabilidade.'
                : 'Morphy pode cometer erros. Considere verificar informações importantes.'
              }
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
