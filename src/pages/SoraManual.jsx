import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ToolInfo from '../components/ui/ToolInfo';
import VideoEngineSelector, { ENGINE_TYPES } from '../components/ui/VideoEngineSelector';
import GenerateVariationsModal from '../components/video/GenerateVariationsModal';
import { Upload, Sparkles, ChevronLeft, ChevronRight, Check, X, Loader2, Zap, CreditCard as Edit, RefreshCw, Play, Copy, Eye, Trash2, Layers, Download, Image, Languages } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { projectService } from '../services/projectService';
import { autopilotService } from '../services/autopilotService';
import { morphyService } from '../services/morphyService';
import { videoVariationsService } from '../services/videoVariationsService';
import { translationService, LANGUAGES } from '../services/translationService';
import { supabase } from '../lib/supabase';
import { prepareImageForUpload } from '../lib/imageUtils';
import { VideoGenerationController } from '../services/videoGenerationService';
import { toolsInfo } from '../data/toolsInfo';
import { VIDEO_MODELS, MODEL_LABELS, WAN_DURATIONS, WAN_RESOLUTIONS } from '../types/videoModels';

const MOCK_AVATARS = [
  { id: 1, name: 'Lucas', gender: 'Masculino', age: '28 anos', image: '👨' },
  { id: 2, name: 'Ana', gender: 'Feminino', age: '32 anos', image: '👩' },
  { id: 3, name: 'Marcos', gender: 'Masculino', age: '40 anos', image: '👨‍💼' },
  { id: 4, name: 'Julia', gender: 'Feminino', age: '25 anos', image: '👩‍💼' },
  { id: 'custom', name: 'Criar Próprio', gender: '', age: '', image: '✨', isCustom: true }
];

const CREATIVE_STYLES = [
  { id: 1, name: 'Review de Produto', description: 'Avaliação honesta e direta' },
  { id: 2, name: 'Depoimento', description: 'Experiência pessoal e prova social' },
  { id: 3, name: 'Anúncio Direto', description: 'Mensagem curta e persuasiva' },
  { id: 4, name: 'Hook Agressivo', description: 'Chamada forte nos primeiros segundos' },
  { id: 5, name: 'Conteúdo Casual', description: 'Estilo natural de redes sociais' }
];

const MOCK_SUGGESTIONS = [
  {
    id: 1,
    title: 'Versão Curta',
    text: 'Comecei a usar esse produto há 30 dias. Resultado? Incrível. Não acreditei quando vi a diferença.'
  },
  {
    id: 2,
    title: 'Versão Persuasiva',
    text: 'Olha, eu era cético. Mas depois de 30 dias usando esse produto, entendi por que todo mundo fala tanto dele. Os resultados realmente surpreendem.'
  },
  {
    id: 3,
    title: 'Versão Casual',
    text: 'Gente, faz 30 dias que tô usando isso aqui e preciso contar pra vocês. Sério, os resultados me surpreenderam demais!'
  }
];

const MOCK_AUTOPILOT_RESULT = {
  avatar: {
    name: 'Marina Silva',
    age: '32 anos',
    gender: 'Feminino',
    appearance: 'Mulher de aparência confiante, cabelo castanho médio, sorriso natural',
    personality: 'Comunicativa, autêntica e confiável. Tom profissional mas acessível.'
  },
  style: {
    name: 'Review de Produto',
    reason: 'Ideal para gerar confiança e conversão. O produto se beneficia de uma apresentação honesta e detalhada.'
  },
  dialogue: 'Olha, eu testei esse produto nos últimos 30 dias e preciso compartilhar com vocês. A diferença foi impressionante desde a primeira semana. Se você está em dúvida como eu estava, vale muito a pena experimentar.',
  summary: {
    type: 'UGC Review',
    tone: 'Confiante / Natural',
    approach: 'Quarto com iluminação natural, ambiente simples',
    duration: '15s',
    productAction: 'Produto será segurado próximo ao rosto durante a fala',
    language: 'Português (Brasil)',
    observations: 'O diálogo deve manter tom neutro e evitar linguagem jovem demais.'
  }
};

const AUTOPILOT_LOADING_MESSAGES = [
  'Analisando produto...',
  'Analisando personagem...',
  'Definindo estilo do criativo...',
  'Criando diálogo...',
  'Finalizando detalhes...'
];

const MOCK_VIDEOS = [
  {
    id: 1,
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Ana',
    avatarGender: 'Feminino',
    style: 'Review de Produto',
    dialogue: 'Olha, eu testei esse produto nos últimos 30 dias e preciso compartilhar com vocês...',
    aspectRatio: '9:16',
    duration: '15s',
    createdAt: '2024-03-15',
    timestamp: 'Há 2 dias',
    credits: 50,
    location: 'Escritório Moderno',
    lighting: 'Natural'
  },
  {
    id: 2,
    thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'processing',
    avatar: 'Lucas',
    avatarGender: 'Masculino',
    style: 'Depoimento',
    dialogue: 'Comecei a usar há uma semana e já notei a diferença...',
    aspectRatio: '1:1',
    duration: '10s',
    createdAt: '2024-03-14',
    timestamp: 'Há 3 dias',
    credits: 30,
    location: 'Quarto',
    lighting: 'Suave'
  },
  {
    id: 3,
    thumbnail: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Marcos',
    avatarGender: 'Masculino',
    style: 'Hook Agressivo',
    dialogue: 'Você precisa ver isso antes de comprar qualquer coisa...',
    aspectRatio: '9:16',
    duration: '15s',
    createdAt: '2024-03-13',
    timestamp: 'Há 4 dias',
    credits: 50,
    location: 'Estúdio',
    lighting: 'Dramática'
  },
  {
    id: 4,
    thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Julia',
    avatarGender: 'Feminino',
    style: 'Conteúdo Casual',
    dialogue: 'Gente, acabei de descobrir uma coisa incrível e preciso contar...',
    aspectRatio: '16:9',
    duration: '25s',
    createdAt: '2024-03-12',
    timestamp: 'Há 5 dias',
    credits: 70,
    location: 'Sala de Estar',
    lighting: 'Natural'
  },
  {
    id: 5,
    thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Ana',
    avatarGender: 'Feminino',
    style: 'Review de Produto',
    dialogue: 'Testei por 30 dias e os resultados me surpreenderam...',
    aspectRatio: '9:16',
    duration: '15s',
    createdAt: '2024-03-11',
    timestamp: 'Há 6 dias',
    credits: 50,
    location: 'Home Office',
    lighting: 'Natural'
  },
  {
    id: 6,
    thumbnail: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Lucas',
    avatarGender: 'Masculino',
    style: 'Anúncio Direto',
    dialogue: 'Black Friday chegou! Desconto de 50% em todos os produtos...',
    aspectRatio: '9:16',
    duration: '12s',
    timestamp: 'Há 1 dia',
    credits: 40,
    location: 'Varanda',
    lighting: 'Golden Hour'
  },
  {
    id: 7,
    thumbnail: 'https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Julia',
    avatarGender: 'Feminino',
    style: 'Review de Produto',
    dialogue: 'Aproveitei a Black Friday e não me arrependo...',
    aspectRatio: '9:16',
    duration: '18s',
    timestamp: 'Há 2 horas',
    credits: 55,
    location: 'Cozinha',
    lighting: 'Suave'
  },
  {
    id: 8,
    thumbnail: 'https://images.pexels.com/photos/3184611/pexels-photo-3184611.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'processing',
    avatar: 'Marcos',
    avatarGender: 'Masculino',
    style: 'Depoimento',
    dialogue: 'Esse é o produto X que todo mundo está falando...',
    aspectRatio: '1:1',
    duration: '20s',
    timestamp: 'Há 30 minutos',
    credits: 60,
    location: 'Escritório',
    lighting: 'Natural'
  },
  {
    id: 9,
    thumbnail: 'https://images.pexels.com/photos/3769114/pexels-photo-3769114.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Ana',
    avatarGender: 'Feminino',
    style: 'Hook Agressivo',
    dialogue: 'Espera! Antes de fechar essa página, você precisa saber...',
    aspectRatio: '9:16',
    duration: '14s',
    timestamp: 'Há 1 semana',
    credits: 45,
    location: 'Estúdio',
    lighting: 'Dramática'
  },
  {
    id: 10,
    thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Lucas',
    avatarGender: 'Masculino',
    style: 'Conteúdo Casual',
    dialogue: 'Se você já comprou antes, precisa ver essa oportunidade...',
    aspectRatio: '16:9',
    duration: '22s',
    timestamp: 'Há 1 semana',
    credits: 65,
    location: 'Jardim',
    lighting: 'Natural'
  },
  {
    id: 11,
    thumbnail: 'https://images.pexels.com/photos/3184635/pexels-photo-3184635.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Julia',
    avatarGender: 'Feminino',
    style: 'Review de Produto',
    dialogue: 'Essa promoção é imperdível para quem já é cliente...',
    aspectRatio: '9:16',
    duration: '16s',
    timestamp: 'Há 5 dias',
    credits: 50,
    location: 'Café',
    lighting: 'Ambiente'
  },
  {
    id: 12,
    thumbnail: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'ready',
    avatar: 'Marcos',
    avatarGender: 'Masculino',
    style: 'Depoimento',
    dialogue: 'Comprei na última Black Friday e voltei para aproveitar de novo...',
    aspectRatio: '9:16',
    duration: '17s',
    location: 'Loja',
    lighting: 'Comercial',
    timestamp: 'Há 3 horas',
    credits: 52
  }
];

function VideoCard({ video, statusBadge, index, openPreviewModal, formatDate, onDelete, onGenerateVariations }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <Card className="group overflow-hidden card-hover stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="relative aspect-[9/16] bg-black">
        {video.status === 'ready' && video.video_url ? (
          <>
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
                <div className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
                  <Play size={40} className="text-black ml-1" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : video.status === 'processing' || video.status === 'queued' ? (
          <div className="w-full h-full bg-surfaceMuted/30 flex flex-col items-center justify-center gap-3">
            {video.status === 'processing' ? (
              <Loader2 size={32} className="text-blue-500 animate-spin" />
            ) : (
              <div className="text-5xl">⏱️</div>
            )}
            <div className="text-sm text-textSecondary">
              {video.status === 'queued' ? 'Na fila...' : 'Gerando vídeo...'}
            </div>
          </div>
        ) : video.status === 'failed' ? (
          <div className="w-full h-full bg-surfaceMuted/30 flex flex-col items-center justify-center gap-3 p-4">
            <div className="text-5xl">⚠️</div>
            <div className="text-sm text-red-400 text-center font-medium">Falha na geração</div>
            {video.kie_fail_message && (
              <div className="text-xs text-textSecondary text-center line-clamp-3">
                {video.kie_fail_message}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-surfaceMuted/30 flex items-center justify-center">
            <div className="text-5xl">🎬</div>
          </div>
        )}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <Badge className={`${statusBadge.className} border`}>
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-textPrimary font-semibold text-sm">
                {video.avatar_name || video.avatar || 'Avatar'} • {video.creative_style || video.style || 'UGC'}
              </p>
            </div>
            <p className="text-textSecondary text-xs line-clamp-2 italic">
              {video.dialogue ? `"${video.dialogue}"` : video.kie_prompt ? `"${video.kie_prompt.substring(0, 100)}..."` : 'Gerando...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-textSecondary pt-2 border-t">
          <span>{video.aspect_ratio || video.aspectRatio || '9:16'}</span>
          <span>•</span>
          <span>{video.duration || '15s'}</span>
          <span>•</span>
          <span>{formatDate(video.created_at || video.createdAt)}</span>
        </div>

        <div className="space-y-2 pt-2">
          {video.status === 'ready' && video.video_url ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openPreviewModal(video)}
                  className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-smooth flex items-center justify-center gap-1 active-press"
                >
                  <Eye size={14} />
                  Ver
                </button>
                <a
                  href={video.video_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-smooth flex items-center justify-center gap-1 active-press"
                >
                  <Download size={14} />
                  Baixar
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja excluir este vídeo?')) {
                      onDelete(video.id);
                    }
                  }}
                  className="p-2 text-xs text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth flex items-center justify-center gap-1 active-press"
                >
                  <Trash2 size={14} />
                  Apagar
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGenerateVariations) {
                    onGenerateVariations(video);
                  }
                }}
                className="w-full p-2 text-xs bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-smooth flex items-center justify-center gap-1 active-press font-medium"
              >
                <Layers size={14} />
                Gerar Variações
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => openPreviewModal(video)}
                  className="p-2 text-xs text-textSecondary hover:text-brandPrimary hover:bg-brandPrimary/5 rounded-lg transition-smooth flex items-center justify-center gap-1 active-press"
                >
                  <Eye size={14} />
                  Ver
                </button>
                <button
                  disabled
                  className="p-2 text-xs text-textSecondary/30 cursor-not-allowed rounded-lg flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  Baixar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja excluir este vídeo?')) {
                      onDelete(video.id);
                    }
                  }}
                  className="p-2 text-xs text-textSecondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-smooth flex items-center justify-center gap-1 active-press"
                >
                  <Trash2 size={14} />
                  Apagar
                </button>
              </div>
              <button
                disabled
                className="w-full p-2 text-xs bg-purple-500/5 text-purple-400/50 border border-purple-500/10 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed font-medium"
              >
                <Layers size={14} />
                Gerar Variações
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SoraManual() {
  const navigate = useNavigate();
  const productImageInputRef = useRef(null);
  const characterImageInputRef = useRef(null);
  const autopilotProductImageInputRef = useRef(null);
  const autopilotCharacterImageInputRef = useRef(null);

  const [showOverview, setShowOverview] = useState(true);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [mode, setMode] = useState(null);
  const [autopilotStage, setAutopilotStage] = useState('input');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [autopilotResult, setAutopilotResult] = useState(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [morphySuggestions, setMorphySuggestions] = useState([]);
  const [showCustomAvatarForm, setShowCustomAvatarForm] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState(null);

  const [showVariationsModal, setShowVariationsModal] = useState(false);
  const [videoForVariations, setVideoForVariations] = useState(null);

  const [translatingDialogue, setTranslatingDialogue] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [autopilotData, setAutopilotData] = useState({
    productImage: null,
    characterImage: null,
    description: ''
  });

  const generationControllerRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Preset Steps
    selectedAvatar: null,
    creativeStyle: null,
    dialogue: '',
    language: translationService.getDefaultLanguage(),

    // Custom Avatar
    customAvatarName: '',
    customAvatarGender: '',
    customAvatarAge: '',
    customAvatarDescription: '',

    // Etapa 4: Formato
    engineType: 'sora-2',
    videoModel: 'veo3',
    model: 'sora-2',
    quality: 'standard',
    aspectRatio: '9:16',
    duration: '10s',
    storyboardMode: false,

    // WAN 2.5 specific fields
    wanImageUrl: null,
    wanPrompt: '',
    wanDuration: '5',
    wanResolution: '720p',
    wanNegativePrompt: '',
    wanEnablePromptExpansion: true,

    // Veo 3.1 specific fields
    veoMode: 'fast',

    // Etapa 5: Produto
    productImage: null,
    productName: '',
    productAction: '',

    // Etapa 6: Cenário
    mainEnvironment: '',
    visibleElements: '',
    lighting: 'Natural (janela / luz do dia)',

    // Etapa 7: Estilo de Gravação (opcional - sobrescreve preset padrão)
    framing: '',
    cameraAngle: '',
    movement: '',
    depthOfField: '',

    // Etapa 8: Cenas
    scenes: [{ description: '', duration: '5s' }]
  });

  const totalSteps = formData.storyboardMode ? 9 : 8;
  const stepsConfig = [
    { number: 1, title: 'Escolha do Avatar', required: true },
    { number: 2, title: 'Estilo de Criativo', required: true },
    { number: 3, title: 'Diálogo & Sugestões', required: true },
    { number: 4, title: 'Formato do Vídeo', required: true },
    { number: 5, title: 'Produto', required: false },
    { number: 6, title: 'Cenário', required: true },
    { number: 7, title: 'Estilo de Gravação', required: true },
    ...(formData.storyboardMode ? [{ number: 8, title: 'Cenas', required: true }] : []),
    { number: formData.storyboardMode ? 9 : 8, title: 'Revisão Final', required: false }
  ];

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    return () => {
      if (generationControllerRef.current) {
        generationControllerRef.current.cancel();
      }
    };
  }, []);

  const loadVideos = async () => {
    try {
      setLoadingVideos(true);
      const response = await videoService.getVideos({ limit: 1000 });
      setVideos(response.videos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleDelete = async (videoId) => {
    try {
      await videoService.deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Erro ao deletar vídeo');
    }
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const publicUrl = await prepareImageForUpload(file, 'images');
      updateFormData(field, publicUrl);
    } catch (error) {
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAutopilotImageUpload = async (file, field) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const publicUrl = await prepareImageForUpload(file, 'images');
      updateAutopilotData(field, publicUrl);
    } catch (error) {
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addScene = () => {
    setFormData(prev => ({
      ...prev,
      scenes: [...prev.scenes, { description: '', duration: '5s' }]
    }));
  };

  const updateScene = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      scenes: prev.scenes.map((scene, i) =>
        i === index ? { ...scene, [field]: value } : scene
      )
    }));
  };

  const removeScene = (index) => {
    if (formData.scenes.length > 1) {
      setFormData(prev => ({
        ...prev,
        scenes: prev.scenes.filter((_, i) => i !== index)
      }));
    }
  };

  const generateSuggestions = async () => {
    setGeneratingSuggestions(true);
    setMorphySuggestions([]);

    try {
      const avatar = formData.selectedAvatar?.isCustom
        ? {
            name: formData.customAvatarName,
            age: parseInt(formData.customAvatarAge),
            gender: formData.customAvatarGender
          }
        : formData.selectedAvatar
          ? {
              name: formData.selectedAvatar.name,
              age: parseInt(formData.selectedAvatar.age),
              gender: formData.selectedAvatar.gender
            }
          : undefined;

      const creativeStyleName = CREATIVE_STYLES.find(s => s.id === formData.creativeStyle)?.name || 'Natural';

      const result = await morphyService.getSuggestions({
        language: translationService.getLanguageLabel(formData.language),
        style: creativeStyleName,
        duration: formData.duration || 15,
        avatar,
        product: formData.productName ? {
          name: formData.productName,
          action: 'usando'
        } : undefined,
        scenario: formData.scenario || undefined,
        tone: 'natural',
        dialogueIdea: formData.dialogue
      });

      if (result.success && result.suggestionsWithLabels) {
        const formattedSuggestions = result.suggestionsWithLabels.map((item, index) => ({
          id: index + 1,
          title: item.label,
          text: item.dialogue
        }));
        setMorphySuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else if (result.success && result.suggestions) {
        const formattedSuggestions = result.suggestions.map((text, index) => ({
          id: index + 1,
          title: `Opção ${index + 1}`,
          text: text
        }));
        setMorphySuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      alert('Erro ao gerar sugestões do Morphy. Verifique se a chave OPENAI_API_KEY está configurada.');
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    updateFormData('dialogue', suggestion.text);
  };

  const translateDialogue = async () => {
    if (!formData.dialogue || formData.dialogue.length < 5) {
      return;
    }

    setTranslatingDialogue(true);
    try {
      const result = await translationService.translateDialogue(
        formData.dialogue,
        formData.language,
        `Video dialogue for ${formData.selectedAvatar?.name || 'avatar'}`
      );

      updateFormData('dialogue', result.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      alert('Erro ao traduzir o diálogo. Tente novamente.');
    } finally {
      setTranslatingDialogue(false);
    }
  };

  const handleLanguageChange = (languageCode) => {
    const previousLanguage = formData.language;
    updateFormData('language', languageCode);
    translationService.setDefaultLanguage(languageCode);
    setShowLanguageDropdown(false);

    if (formData.dialogue && formData.dialogue.length > 5 && previousLanguage !== languageCode) {
      const shouldTranslate = confirm(
        `Deseja traduzir o diálogo atual para ${translationService.getLanguageLabel(languageCode)}?`
      );

      if (shouldTranslate) {
        translateDialogue();
      }
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (formData.selectedAvatar?.isCustom) {
          return (
            formData.customAvatarName &&
            formData.customAvatarGender &&
            formData.customAvatarAge &&
            formData.customAvatarDescription
          );
        }
        return formData.selectedAvatar !== null;
      case 2:
        return formData.creativeStyle !== null;
      case 3:
        return formData.dialogue.length > 10;
      case 4:
        if (!formData.engineType) return false;
        if (formData.engineType === 'wan-2.5') {
          return formData.wanImageUrl && formData.wanPrompt && formData.wanPrompt.trim().length > 0;
        }
        return true;
      case 5:
        return true;
      case 6:
        return formData.mainEnvironment && formData.mainEnvironment.trim().length > 0;
      case 7:
        return true;
      case 8:
        if (formData.storyboardMode) {
          return formData.scenes.every(scene => scene.description);
        }
        return true;
      default:
        return true;
    }
  };

  const handleAvatarSelect = (avatar) => {
    if (avatar.isCustom) {
      setShowCustomAvatarForm(true);
      updateFormData('selectedAvatar', avatar);
    } else {
      setShowCustomAvatarForm(false);
      updateFormData('selectedAvatar', avatar);
    }
  };

  const startAutopilot = async () => {
    setAutopilotStage('loading');
    let messageIdx = 0;

    const interval = setInterval(() => {
      messageIdx++;
      setLoadingMessageIndex(messageIdx);

      if (messageIdx >= AUTOPILOT_LOADING_MESSAGES.length - 1) {
        clearInterval(interval);
      }
    }, 600);

    try {
      console.log('Current autopilotData:', autopilotData);
      const result = await autopilotService.generateAutopilot(autopilotData);
      setAutopilotResult(result);
      clearInterval(interval);
      setAutopilotStage('result');
    } catch (error) {
      console.error('Error generating autopilot:', error);
      clearInterval(interval);
      setAutopilotStage('input');
    }
  };

  const useAutopilotResult = () => {
    if (!autopilotResult) return;

    const customAvatar = {
      id: 'autopilot-custom',
      name: autopilotResult.avatar.name,
      gender: autopilotResult.avatar.gender,
      age: autopilotResult.avatar.age,
      image: '👩‍💼'
    };

    const selectedStyle = CREATIVE_STYLES.find(s => s.name === autopilotResult.style.name) || CREATIVE_STYLES[0];

    setFormData(prev => ({
      ...prev,
      selectedAvatar: customAvatar,
      creativeStyle: selectedStyle,
      dialogue: autopilotResult.dialogue,
      customAvatarName: autopilotResult.avatar.name,
      customAvatarGender: autopilotResult.avatar.gender,
      customAvatarAge: autopilotResult.avatar.age,
      customAvatarDescription: autopilotResult.avatar.appearance + '. ' + autopilotResult.avatar.personality
    }));

    setMode('guided');
    setCurrentStep(4);
  };

  const updateAutopilotData = (field, value) => {
    setAutopilotData(prev => ({ ...prev, [field]: value }));
  };

  const canStartAutopilot = () => {
    return autopilotData.description.length > 20;
  };

  const handleGenerateVideo = async () => {
    try {
      setIsSubmitting(true);

      if (formData.videoModel === VIDEO_MODELS.WAN_2_5) {
        if (!formData.wanImageUrl) {
          alert('Por favor, faça upload de uma imagem base.');
          setIsSubmitting(false);
          return;
        }
        if (!formData.wanPrompt || formData.wanPrompt.length === 0) {
          alert('Por favor, insira um prompt de movimento.');
          setIsSubmitting(false);
          return;
        }
        if (formData.wanPrompt.length > 800) {
          alert('O prompt deve ter no máximo 800 caracteres.');
          setIsSubmitting(false);
          return;
        }
      }

      const project = await projectService.createProject(formData);

      const videoData = {
        projectId: project.id,
        videoModel: formData.videoModel,
        selectedAvatar: formData.selectedAvatar,
        creativeStyle: formData.creativeStyle,
        dialogue: formData.dialogue,
        language: formData.language,
        duration: formData.duration,
        aspectRatio: formData.aspectRatio,
        storyboardMode: formData.storyboardMode,
        mainEnvironment: formData.mainEnvironment,
        visibleElements: formData.visibleElements,
        lighting: formData.lighting,
        framing: formData.framing,
        cameraAngle: formData.cameraAngle,
        movement: formData.movement,
        depthOfField: formData.depthOfField,
        productData: formData.productImage ? {
          name: formData.productName,
          action: formData.productAction,
          image_url: formData.productImage
        } : null,
        scenes: formData.storyboardMode ? formData.scenes : null,
        wanImageUrl: formData.wanImageUrl,
        wanPrompt: formData.wanPrompt,
        wanDuration: formData.wanDuration,
        wanResolution: formData.wanResolution,
        wanNegativePrompt: formData.wanNegativePrompt,
        wanEnablePromptExpansion: formData.wanEnablePromptExpansion,
      };

      const video = await videoService.generateVideo(videoData);

      const controller = new VideoGenerationController({
        onStateChange: (state) => {
        },
        onError: (error) => {
          loadVideos();
        },
        onSuccess: (video) => {
          loadVideos();
        },
        onPollUpdate: (result) => {
          if (result.video?.status === 'processing') {
            loadVideos();
          }
        },
      });

      generationControllerRef.current = controller;

      if (formData.videoModel === VIDEO_MODELS.WAN_2_5) {
        const wanPayload = {
          videoId: video.id,
          prompt: formData.wanPrompt,
          imageUrl: formData.wanImageUrl,
          duration: formData.wanDuration,
          resolution: formData.wanResolution,
          negativePrompt: formData.wanNegativePrompt || undefined,
          enablePromptExpansion: formData.wanEnablePromptExpansion,
          sourceMode: 'sora',
        };

        const result = await controller.generateVideoWan(wanPayload);
        await controller.startPolling(result.taskId, video.id);
      } else {
        const kiePayload = {
          videoId: video.id,
          model: formData.model,
          quality: formData.quality,
          selectedAvatar: formData.selectedAvatar,
          creativeStyle: formData.creativeStyle,
          dialogue: formData.dialogue,
          language: formData.language,
          duration: formData.duration,
          aspectRatio: formData.aspectRatio,
          mainEnvironment: formData.mainEnvironment,
          visibleElements: formData.visibleElements,
          sourceMode: 'sora',
          lighting: formData.lighting,
          framing: formData.framing,
          cameraAngle: formData.cameraAngle,
          movement: formData.movement,
          depthOfField: formData.depthOfField,
          storyboardMode: formData.storyboardMode,
          scenes: formData.storyboardMode ? formData.scenes : null,
          productData: formData.productImage ? {
            name: formData.productName,
            action: formData.productAction,
            image_url: formData.productImage
          } : null
        };

        const result = await controller.generateVideo(kiePayload);
        await controller.startPolling(result.taskId, video.id);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      resetForm();
      loadVideos();
      setIsSubmitting(false);

    } catch (error) {
      console.error('Error generating video:', error);
      setIsSubmitting(false);
      alert(error.message || 'Erro ao gerar vídeo. Por favor, tente novamente.');
    }
  };

  const resetForm = () => {
    setShowOverview(true);
    setMode(null);
    setCurrentStep(1);
    setFormData({
      selectedAvatar: null,
      creativeStyle: null,
      dialogue: '',
      customAvatarName: '',
      customAvatarGender: '',
      customAvatarAge: '',
      customAvatarDescription: '',
      model: 'sora-2',
      quality: 'standard',
      aspectRatio: '9:16',
      duration: '15s',
      storyboardMode: false,
      productImage: null,
      productName: '',
      productAction: '',
      mainEnvironment: '',
      visibleElements: '',
      lighting: 'Natural (janela / luz do dia)',
      framing: '',
      cameraAngle: '',
      movement: '',
      depthOfField: '',
      scenes: [{ description: '', duration: '5s' }]
    });
  };


  const nextStep = () => {
    if (validateStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const calculateCredits = () => {
    if (formData.storyboardMode) {
      return formData.scenes.length * 50;
    }
    const durationMultiplier = { '10s': 30, '15s': 50, '25s': 70 };
    return durationMultiplier[formData.duration] || 50;
  };

  const getTotalDuration = () => {
    return formData.scenes.reduce((total, scene) => {
      return total + parseInt(scene.duration);
    }, 0);
  };

  const startNewVideo = (modeType) => {
    setShowOverview(false);
    setMode(modeType);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ready: { label: 'Pronto', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
      processing: { label: 'Processando', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      queued: { label: 'Na Fila', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      failed: { label: 'Falhou', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
      error: { label: 'Erro', className: 'bg-red-500/10 text-red-600 border-red-500/20' }
    };
    return statusConfig[status] || statusConfig.ready;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recém-criado';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recém-criado';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (error) {
      return 'Recém-criado';
    }
  };

  const openPreviewModal = (video) => {
    setSelectedVideoForPreview(video);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedVideoForPreview(null);
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

      await loadVideos();
    } catch (error) {
      console.error('Erro ao gerar variações:', error);
      alert(`Erro: ${error.message}`);
      throw error;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Crie Vídeos UGC Sem Complicação</h1>
        <ToolInfo tool={toolsInfo.sora2} icon={Sparkles} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl font-medium">Siga um passo a passo simples e gere vídeos com o Sora 2 mais atual.</p>

      {/* Overview State */}
      {showOverview && (
        <div className="space-y-8 fade-in-scale">
          {/* Action Buttons */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => startNewVideo('guided')}
                className="p-8 rounded-2xl border-2 border transition-smooth hover:border-brandPrimary/50 hover:scale-102 text-left group active-press hover-lift"
              >
                <div className="w-14 h-14 bg-brandPrimary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brandPrimary/20 transition-smooth">
                  <ChevronRight size={28} className="text-brandPrimary" />
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-2">Criar novo vídeo</h3>
                <p className="text-textSecondary mb-4">Escolha cada detalhe passo a passo. Controle total sobre o criativo.</p>
                <div className="flex items-center text-brandPrimary text-sm font-medium">
                  Começar passo a passo
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </button>

              <button
                onClick={() => startNewVideo('autopilot')}
                className="p-8 rounded-2xl border-2 border transition-smooth hover:border-brandPrimary/50 hover:scale-102 text-left group relative active-press hover-lift"
              >
                <div className="absolute top-4 right-4">
                  <Badge variant="default" className="bg-brandPrimary text-white">IA</Badge>
                </div>
                <div className="w-14 h-14 bg-brandPrimary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brandPrimary/20 transition-smooth">
                  <Zap size={28} className="text-brandPrimary" />
                </div>
                <h3 className="text-xl font-bold text-textPrimary mb-2">Criar com Morphy (Autopilot)</h3>
                <p className="text-textSecondary mb-4">Envie referências e a IA cuida de tudo. Rápido e inteligente.</p>
                <div className="flex items-center text-brandPrimary text-sm font-medium">
                  Deixar a IA criar
                  <Sparkles size={16} className="ml-1" />
                </div>
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-textSecondary/60 text-sm">Sempre usando a versão mais recente do Sora 2.</p>
            </div>
          </div>

          {/* Videos Gallery or Empty State */}
          {videos.length > 0 ? (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-textPrimary">Vídeos Recentes</h2>
                <span className="text-textSecondary text-sm">{videos.length} vídeo{videos.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video, index) => {
                  const statusBadge = getStatusBadge(video.status);
                  return (
                    <VideoCard
                      key={video.id}
                      video={video}
                      statusBadge={statusBadge}
                      index={index}
                      openPreviewModal={openPreviewModal}
                      formatDate={formatDate}
                      onDelete={handleDelete}
                      onGenerateVariations={handleOpenVariationsModal}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-surfaceMuted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={40} className="text-textSecondary" />
                </div>
                <h3 className="text-2xl font-bold text-textPrimary mb-3">Você ainda não criou vídeos com o Sora 2</h3>
                <p className="text-textSecondary mb-8 text-lg">Comece agora e veja como é fácil criar conteúdo profissional.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => startNewVideo('guided')} size="lg">
                    <ChevronRight size={18} className="mr-2" />
                    Criar meu primeiro vídeo
                  </Button>
                  <Button onClick={() => startNewVideo('autopilot')} variant="outline" size="lg">
                    <Sparkles size={18} className="mr-2" />
                    Deixar o Morphy criar pra mim
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Autopilot Flow */}
      {mode === 'autopilot' && autopilotStage === 'input' && (
        <div className="max-w-4xl mx-auto slide-in-right">
          <Card className="p-8">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setMode(null);
                    setShowOverview(true);
                  }}
                  className="text-textSecondary hover:text-textPrimary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-3xl font-bold text-textPrimary">Deixe o Morphy criar o vídeo para você</h2>
              </div>
              <p className="text-textSecondary text-lg">Envie referências e descreva sua ideia. O Morphy cuida do resto.</p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-3">Imagem do Produto</label>
                  <input
                    ref={autopilotProductImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAutopilotImageUpload(file, 'productImage');
                    }}
                  />
                  <div
                    onClick={() => !uploadingImage && autopilotProductImageInputRef.current?.click()}
                    className="border-2 border-dashed border rounded-xl p-8 text-center hover:border-brandPrimary/50 transition-colors cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 size={40} className="text-brandPrimary mx-auto mb-3 animate-spin" strokeWidth={1.5} />
                        <p className="text-textPrimary font-medium text-sm mb-1">Enviando...</p>
                      </>
                    ) : autopilotData.productImage ? (
                      <>
                        <div className="relative inline-block mb-3">
                          <img src={autopilotData.productImage} alt="Produto" className="w-24 h-24 object-cover rounded-lg" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAutopilotData('productImage', null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-textPrimary font-medium text-sm mb-1">Imagem carregada</p>
                        <p className="text-textSecondary text-xs">Clique para alterar</p>
                      </>
                    ) : (
                      <>
                        <Upload size={40} className="text-textSecondary mx-auto mb-3" strokeWidth={1.5} />
                        <p className="text-textPrimary font-medium text-sm mb-1">Upload da imagem</p>
                        <p className="text-textSecondary text-xs">PNG, JPG até 10MB</p>
                      </>
                    )}
                  </div>
                  <p className="text-textSecondary text-xs mt-2">Imagem do produto que será apresentado no vídeo.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-3">Imagem do Personagem</label>
                  <input
                    ref={autopilotCharacterImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAutopilotImageUpload(file, 'characterImage');
                    }}
                  />
                  <div
                    onClick={() => !uploadingImage && autopilotCharacterImageInputRef.current?.click()}
                    className="border-2 border-dashed border rounded-xl p-8 text-center hover:border-brandPrimary/50 transition-colors cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 size={40} className="text-brandPrimary mx-auto mb-3 animate-spin" strokeWidth={1.5} />
                        <p className="text-textPrimary font-medium text-sm mb-1">Enviando...</p>
                      </>
                    ) : autopilotData.characterImage ? (
                      <>
                        <div className="relative inline-block mb-3">
                          <img src={autopilotData.characterImage} alt="Personagem" className="w-24 h-24 object-cover rounded-lg" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAutopilotData('characterImage', null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-textPrimary font-medium text-sm mb-1">Imagem carregada</p>
                        <p className="text-textSecondary text-xs">Clique para alterar</p>
                      </>
                    ) : (
                      <>
                        <Upload size={40} className="text-textSecondary mx-auto mb-3" strokeWidth={1.5} />
                        <p className="text-textPrimary font-medium text-sm mb-1">Upload da referência</p>
                        <p className="text-textSecondary text-xs">PNG, JPG até 10MB</p>
                      </>
                    )}
                  </div>
                  <p className="text-textSecondary text-xs mt-2">Referência do personagem que aparecerá no vídeo.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-3">
                  Descreva sua ideia
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={autopilotData.description}
                  onChange={(e) => updateAutopilotData('description', e.target.value)}
                  placeholder="Quero um vídeo UGC estilo review, mostrando benefícios principais, com tom confiante e natural."
                  rows={6}
                  className="w-full px-4 py-4 bg-surfaceMuted/30 border rounded-xl text-textPrimary text-lg placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-textSecondary text-xs">Quanto mais claro, melhor será o resultado.</p>
                  <span className="text-sm text-textSecondary">
                    {autopilotData.description.length} caracteres
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={startAutopilot}
                disabled={!canStartAutopilot()}
                size="lg"
                className="disabled:opacity-40"
              >
                <Sparkles size={18} className="mr-2" />
                Deixar o Morphy Pensar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Autopilot Loading */}
      {mode === 'autopilot' && autopilotStage === 'loading' && (
        <div className="max-w-2xl mx-auto">
          <Card className="p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-brandPrimary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={40} className="text-brandPrimary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-textPrimary mb-2">Morphy está criando seu vídeo</h2>
              <p className="text-textSecondary mb-8">Isso levará apenas alguns instantes...</p>

              <div className="space-y-3">
                {AUTOPILOT_LOADING_MESSAGES.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-center gap-3 transition-all ${
                      index <= loadingMessageIndex ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    {index < loadingMessageIndex && (
                      <Check size={18} className="text-green-500" />
                    )}
                    {index === loadingMessageIndex && (
                      <Loader2 size={18} className="text-brandPrimary animate-spin" />
                    )}
                    {index > loadingMessageIndex && (
                      <div className="w-4 h-4 rounded-full border-2 border" />
                    )}
                    <span className={`text-sm ${index <= loadingMessageIndex ? 'text-textPrimary font-medium' : 'text-textSecondary'}`}>
                      {message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Autopilot Result */}
      {mode === 'autopilot' && autopilotStage === 'result' && (
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={24} className="text-brandPrimary" />
              <h2 className="text-3xl font-bold text-textPrimary">Resumo do Vídeo Planejado</h2>
            </div>
            <p className="text-textSecondary text-lg">Revise o plano criado pelo Morphy antes de gerar o vídeo.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary mb-1">Avatar Definido</h3>
                  <Badge variant="default" className="text-xs">Gerado por IA</Badge>
                </div>
                <button className="p-2 hover:bg-surfaceMuted rounded-lg transition-colors">
                  <Edit size={18} className="text-textSecondary" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-textSecondary mb-1">Nome</p>
                  <p className="text-textPrimary font-medium">{(autopilotResult || MOCK_AUTOPILOT_RESULT).avatar.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-textSecondary mb-1">Idade</p>
                    <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).avatar.age}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-textSecondary mb-1">Gênero</p>
                    <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).avatar.gender}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-textSecondary mb-1">Aparência</p>
                  <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).avatar.appearance}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-textSecondary mb-1">Personalidade</p>
                  <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).avatar.personality}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary mb-1">Estilo de Criativo</h3>
                  <Badge variant="default" className="text-xs">Gerado por IA</Badge>
                </div>
                <button className="p-2 hover:bg-surfaceMuted rounded-lg transition-colors">
                  <RefreshCw size={18} className="text-textSecondary" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-textSecondary mb-1">Estilo Sugerido</p>
                  <p className="text-textPrimary font-semibold text-lg">{(autopilotResult || MOCK_AUTOPILOT_RESULT).style.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-textSecondary mb-1">Motivo da Escolha</p>
                  <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).style.reason}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-textPrimary mb-1">Diálogo Gerado</h3>
                <Badge variant="default" className="text-xs">Gerado por IA</Badge>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-surfaceMuted rounded-lg transition-colors">
                  <RefreshCw size={18} className="text-textSecondary" />
                </button>
                <button className="p-2 hover:bg-surfaceMuted rounded-lg transition-colors">
                  <Edit size={18} className="text-textSecondary" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-surfaceMuted/30 rounded-xl">
              <p className="text-textPrimary leading-relaxed italic">"{(autopilotResult || MOCK_AUTOPILOT_RESULT).dialogue}"</p>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="text-lg font-bold text-textPrimary mb-4">Resumo do Criativo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-textSecondary mb-1">Tipo de Vídeo</p>
                <p className="text-textPrimary font-medium">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-textSecondary mb-1">Tom</p>
                <p className="text-textPrimary font-medium">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.tone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-textSecondary mb-1">Duração Sugerida</p>
                <p className="text-textPrimary font-medium">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.duration}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-textSecondary mb-1">Cenário</p>
                <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.approach}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-textSecondary mb-1">Idioma</p>
                <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.language || 'Português (Brasil)'}</p>
              </div>
            </div>
            {(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.productAction && (
              <div className="mb-4">
                <p className="text-xs font-medium text-textSecondary mb-1">Ação com Produto</p>
                <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.productAction}</p>
              </div>
            )}
            {(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.observations && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs font-medium text-yellow-600 mb-1">Observações Importantes</p>
                <p className="text-textPrimary text-sm">{(autopilotResult || MOCK_AUTOPILOT_RESULT).summary.observations}</p>
              </div>
            )}
          </Card>

          <div className="bg-brandPrimary/10 border-2 border-brandPrimary/30 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-textPrimary font-medium mb-1">Plano de vídeo analisado pelo Morphy</p>
                <p className="text-textSecondary text-sm">Você pode gerar o vídeo agora ou ajustar os dados e gerar novamente.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setAutopilotStage('input');
                    setAutopilotResult(null);
                  }}
                  variant="outline"
                  size="lg"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Ajustar e Gerar Novamente
                </Button>
                <Button onClick={useAutopilotResult} size="lg">
                  <Play size={18} className="mr-2" />
                  Gerar Vídeo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guided Mode */}
      {mode === 'guided' && (
        <div className="slide-in-right">
          {/* Back Button */}
          {currentStep === 1 && (
            <div className="mb-4">
              <button
                onClick={() => {
                  setMode(null);
                  setShowOverview(true);
                  setCurrentStep(1);
                }}
                className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors text-sm"
              >
                <ChevronLeft size={16} />
                Voltar para overview
              </button>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-textPrimary">
                Etapa {currentStep} de {totalSteps}
              </span>
              <span className="text-sm text-textSecondary">
                {stepsConfig.find(s => s.number === currentStep)?.title}
              </span>
            </div>
            <div className="h-2 bg-surfaceMuted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-brandPrimary rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <Card className="min-h-[500px] flex flex-col">
          {/* Step Content */}
          <div className="flex-1 p-8">
            {/* Step 1: Avatar Selection */}
            {currentStep === 1 && (
              <div className="space-y-8 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Quem vai aparecer no vídeo?</h2>
                  <p className="text-textSecondary text-lg">Escolha um avatar para representar o criador do conteúdo.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {MOCK_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                        avatar.isCustom ? 'border-dashed' : ''
                      } ${
                        formData.selectedAvatar?.id === avatar.id
                          ? 'border-brandPrimary bg-brandPrimary/10 shadow-lg shadow-brandPrimary/20'
                          : 'border hover:border-brandPrimary/50'
                      }`}
                    >
                      <div className="text-6xl mb-4">{avatar.image}</div>
                      <div className="text-textPrimary font-semibold mb-1">{avatar.name}</div>
                      {!avatar.isCustom && (
                        <>
                          <div className="text-textSecondary text-sm">{avatar.gender}</div>
                          <div className="text-textSecondary text-xs">{avatar.age}</div>
                        </>
                      )}
                      {avatar.isCustom && (
                        <div className="text-textSecondary text-xs">Personalize do zero</div>
                      )}
                      {formData.selectedAvatar?.id === avatar.id && (
                        <div className="mt-3 flex items-center justify-center">
                          <div className="w-6 h-6 bg-brandPrimary rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {showCustomAvatarForm && (
                  <div className="space-y-6 mt-8 p-6 bg-surfaceMuted/30 rounded-xl border-2 border-brandPrimary/30">
                    <div>
                      <h3 className="text-xl font-bold text-textPrimary mb-2">Criar Avatar Personalizado</h3>
                      <p className="text-textSecondary text-sm">Preencha os detalhes do seu avatar customizado.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">Nome do Avatar</label>
                      <input
                        type="text"
                        value={formData.customAvatarName}
                        onChange={(e) => updateFormData('customAvatarName', e.target.value)}
                        placeholder="Ex: João Silva"
                        className="w-full px-4 py-3 bg-surface border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-textPrimary mb-2">Gênero</label>
                        <select
                          value={formData.customAvatarGender}
                          onChange={(e) => updateFormData('customAvatarGender', e.target.value)}
                          className="w-full px-4 py-3 bg-surface border rounded-xl text-textPrimary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                        >
                          <option value="">Selecione...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Não-binário">Não-binário</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-textPrimary mb-2">Idade</label>
                        <input
                          type="text"
                          value={formData.customAvatarAge}
                          onChange={(e) => updateFormData('customAvatarAge', e.target.value)}
                          placeholder="Ex: 25 anos"
                          className="w-full px-4 py-3 bg-surface border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">Descrição do Avatar</label>
                      <textarea
                        value={formData.customAvatarDescription}
                        onChange={(e) => updateFormData('customAvatarDescription', e.target.value)}
                        placeholder="Descreva as características físicas, estilo, personalidade, etc."
                        rows={4}
                        className="w-full px-4 py-3 bg-surface border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Creative Style */}
            {currentStep === 2 && (
              <div className="space-y-8 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Qual o estilo do criativo?</h2>
                  <p className="text-textSecondary text-lg">Escolha como o conteúdo será apresentado.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CREATIVE_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateFormData('creativeStyle', style)}
                      className={`p-6 rounded-xl border-2 transition-all text-left hover:scale-102 ${
                        formData.creativeStyle?.id === style.id
                          ? 'border-brandPrimary bg-brandPrimary/10 shadow-lg shadow-brandPrimary/20'
                          : 'border hover:border-brandPrimary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-textPrimary">{style.name}</h3>
                        {formData.creativeStyle?.id === style.id && (
                          <div className="w-6 h-6 bg-brandPrimary rounded-full flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-textSecondary text-sm">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Dialogue */}
            {currentStep === 3 && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">O que o avatar vai dizer?</h2>
                  <p className="text-textSecondary text-lg">Escreva a ideia principal do diálogo. O Morphy pode sugerir variações (opcional).</p>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Idioma do Diálogo
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary hover:border-brandPrimary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Languages size={20} className="text-brandPrimary" />
                      <span className="text-2xl">{translationService.getLanguageByCode(formData.language).flag}</span>
                      <span className="font-medium">{translationService.getLanguageByCode(formData.language).label}</span>
                    </div>
                    <ChevronRight size={20} className={`transition-transform ${showLanguageDropdown ? 'rotate-90' : ''}`} />
                  </button>

                  {showLanguageDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-[rgb(var(--surface-elevated))] backdrop-blur-xl border border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surfaceMuted/50 transition-colors ${
                            formData.language === lang.code ? 'bg-brandPrimary/10' : ''
                          }`}
                        >
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-medium text-textPrimary">{lang.label}</span>
                          {formData.language === lang.code && (
                            <Check size={16} className="ml-auto text-brandPrimary" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Diálogo
                  </label>
                  <textarea
                    value={formData.dialogue}
                    onChange={(e) => updateFormData('dialogue', e.target.value)}
                    placeholder="Ex: Eu comecei a usar esse produto há 30 dias e me surpreendi com os resultados..."
                    rows={6}
                    className="w-full px-4 py-4 bg-surfaceMuted/30 border rounded-xl text-textPrimary text-lg placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-textSecondary">
                      {formData.dialogue.length} caracteres
                    </span>
                    <div className="flex gap-2">
                      {formData.dialogue.length > 5 && (
                        <Button
                          onClick={translateDialogue}
                          disabled={translatingDialogue}
                          variant="ghost"
                          title="Traduzir diálogo para o idioma selecionado"
                        >
                          {translatingDialogue ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Traduzindo...
                            </>
                          ) : (
                            <>
                              <Languages size={16} className="mr-2" />
                              Traduzir
                            </>
                          )}
                        </Button>
                      )}
                      {formData.dialogue.length > 10 && !showSuggestions && (
                        <Button onClick={generateSuggestions} disabled={generatingSuggestions} variant="ghost">
                          {generatingSuggestions ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} className="mr-2" />
                              Gerar Sugestões do Morphy
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggestions appear below */}
                {generatingSuggestions && (
                  <div className="flex flex-col items-center justify-center py-8 bg-surfaceMuted/20 rounded-xl">
                    <Loader2 size={40} className="text-brandPrimary animate-spin mb-3" />
                    <p className="text-textPrimary font-medium">Morphy está pensando...</p>
                    <p className="text-textSecondary text-sm">Gerando variações do seu diálogo</p>
                  </div>
                )}

                {showSuggestions && !generatingSuggestions && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-textPrimary">Sugestões do Morphy</h3>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="text-textSecondary hover:text-textPrimary text-sm"
                      >
                        Ocultar
                      </button>
                    </div>
                    {(morphySuggestions.length > 0 ? morphySuggestions : MOCK_SUGGESTIONS).map((suggestion) => (
                      <Card
                        key={suggestion.id}
                        hover
                        className="cursor-pointer transition-all"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="default" className="text-xs">{suggestion.title}</Badge>
                        </div>
                        <p className="text-textPrimary leading-relaxed text-sm">{suggestion.text}</p>
                        <div className="mt-3 pt-3 border-t flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectSuggestion(suggestion);
                            }}
                          >
                            Usar esta versão
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Formato */}
            {currentStep === 4 && (
              <div className="space-y-8 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Formato do Vídeo</h2>
                  <p className="text-textSecondary text-lg">Escolha o motor de geração e suas configurações.</p>
                </div>

                <VideoEngineSelector
                  formData={formData}
                  updateFormData={updateFormData}
                  allowedEngines={[
                    ENGINE_TYPES.SORA_2,
                    ENGINE_TYPES.SORA_2_PRO,
                    ENGINE_TYPES.SORA_2_PRO_STORYBOARD
                  ]}
                />
              </div>
            )}

            {/* Step 5: Produto */}
            {currentStep === 5 && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Produto em destaque</h2>
                  <p className="text-textSecondary text-lg">Opcional. Use se o vídeo for promocional ou review.</p>
                </div>

                <input
                  ref={productImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'productImage');
                  }}
                />

                <div
                  onClick={() => !uploadingImage && productImageInputRef.current?.click()}
                  className="border-2 border-dashed border rounded-xl p-12 text-center hover:border-brandPrimary/50 transition-colors cursor-pointer"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 size={48} className="text-brandPrimary mx-auto mb-4 animate-spin" strokeWidth={1.5} />
                      <p className="text-textPrimary font-medium mb-2">Fazendo upload...</p>
                    </>
                  ) : formData.productImage ? (
                    <>
                      <div className="relative inline-block mb-4">
                        <img src={formData.productImage} alt="Produto" className="w-32 h-32 object-cover rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFormData('productImage', null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-textPrimary font-medium mb-2">Imagem carregada</p>
                      <p className="text-textSecondary text-sm">Clique para alterar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={48} className="text-textSecondary mx-auto mb-4" strokeWidth={1.5} />
                      <p className="text-textPrimary font-medium mb-2">Upload de imagem do produto</p>
                      <p className="text-textSecondary text-sm">PNG, JPG até 10MB</p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Nome do produto</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => updateFormData('productName', e.target.value)}
                    placeholder="Ex: Fone Bluetooth XYZ"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Ação com o produto</label>
                  <input
                    type="text"
                    value={formData.productAction}
                    onChange={(e) => updateFormData('productAction', e.target.value)}
                    placeholder="Ex: Segurando o produto próximo ao rosto"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-center pt-4">
                  <button
                    onClick={skipStep}
                    className="text-textSecondary hover:text-textPrimary transition-colors text-sm font-medium"
                  >
                    Pular esta etapa →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Cenário */}
            {currentStep === 6 && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Onde o vídeo acontece?</h2>
                  <p className="text-textSecondary text-lg">Defina o ambiente de forma clara e específica. O cenário será exatamente como você descrever.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Ambiente principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mainEnvironment}
                    onChange={(e) => updateFormData('mainEnvironment', e.target.value)}
                    placeholder="Ex: Quarto com esteira"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                  <p className="text-xs text-textSecondary mt-2">Seja específico. Este ambiente aparecerá literalmente no vídeo.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Elementos visíveis do cenário (opcional)</label>
                  <input
                    type="text"
                    value={formData.visibleElements}
                    onChange={(e) => updateFormData('visibleElements', e.target.value)}
                    placeholder="Ex: Esteira embaixo do personagem, parede branca ao fundo"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                  <p className="text-xs text-textSecondary mt-2">Detalhe objetos ou elementos importantes para adicionar contexto.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-4">Iluminação</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      'Natural (janela / luz do dia)',
                      'Suave interna',
                      'Estilo estúdio simples'
                    ].map((light) => (
                      <button
                        key={light}
                        onClick={() => updateFormData('lighting', light)}
                        className={`py-4 px-2 rounded-xl text-sm font-medium transition-colors ${
                          formData.lighting === light
                            ? 'bg-brandPrimary text-white'
                            : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
                        }`}
                      >
                        {light}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Estilo */}
            {currentStep === 7 && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Estilo de Gravação</h2>
                  <p className="text-textSecondary text-lg">Ajustes visuais opcionais. Se não preencher, o Morphion usará o preset padrão de selfie de alta qualidade realista.</p>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-sm text-textSecondary">
                    <strong className="text-textPrimary">Preset padrão:</strong> Enquadramento médio (cabeça e ombros), ângulo frontal na altura dos olhos, câmera de alta qualidade estática com leve movimento natural, profundidade de campo natural.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Enquadramento (opcional)</label>
                  <input
                    type="text"
                    value={formData.framing}
                    onChange={(e) => updateFormData('framing', e.target.value)}
                    placeholder="Ex: Close-up no rosto"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Ângulo de câmera (opcional)</label>
                  <input
                    type="text"
                    value={formData.cameraAngle}
                    onChange={(e) => updateFormData('cameraAngle', e.target.value)}
                    placeholder="Ex: Ângulo levemente baixo"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Movimento (opcional)</label>
                  <input
                    type="text"
                    value={formData.movement}
                    onChange={(e) => updateFormData('movement', e.target.value)}
                    placeholder="Ex: Zoom suave aproximando"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Profundidade de campo (opcional)</label>
                  <input
                    type="text"
                    value={formData.depthOfField}
                    onChange={(e) => updateFormData('depthOfField', e.target.value)}
                    placeholder="Ex: Fundo muito desfocado (bokeh)"
                    className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Step 8: Cenas (only if storyboard) */}
            {currentStep === 8 && formData.storyboardMode && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Cenas do Vídeo</h2>
                  <p className="text-textSecondary text-lg">Descreva cada cena do seu vídeo.</p>
                </div>

                <div className="space-y-4">
                  {formData.scenes.map((scene, index) => (
                    <div key={index} className="p-4 bg-surfaceMuted/30 rounded-xl border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-textPrimary">Cena {index + 1}</span>
                        {formData.scenes.length > 1 && (
                          <button
                            onClick={() => removeScene(index)}
                            className="p-1 hover:bg-surfaceMuted rounded-lg transition-colors"
                          >
                            <X size={16} className="text-textSecondary" />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={scene.description}
                        onChange={(e) => updateScene(index, 'description', e.target.value)}
                        placeholder="Descreva o que acontece nesta cena..."
                        rows={3}
                        className="w-full px-4 py-3 bg-surface border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none mb-3"
                      />
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-2">Duração</label>
                        <select
                          value={scene.duration}
                          onChange={(e) => updateScene(index, 'duration', e.target.value)}
                          className="w-full px-3 py-2 bg-surface border rounded-lg text-textPrimary text-sm focus:outline-none focus:border-brandPrimary/50 transition-colors"
                        >
                          <option value="5s">5 segundos</option>
                          <option value="10s">10 segundos</option>
                          <option value="15s">15 segundos</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={addScene}
                    className="text-brandPrimary hover:text-brandPrimaryHover transition-colors text-sm font-medium"
                  >
                    + Adicionar cena
                  </button>
                  <span className="text-sm text-textSecondary">
                    Duração total: <span className="font-semibold text-textPrimary">{getTotalDuration()}s</span>
                  </span>
                </div>
              </div>
            )}

            {/* Final Step: Review */}
            {currentStep === totalSteps && (
              <div className="space-y-6 fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-textPrimary mb-2">Revisão Final</h2>
                  <p className="text-textSecondary text-lg">Confira todos os detalhes antes de gerar.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-textPrimary mb-2">Avatar & Estilo</h4>
                    <p className="text-textSecondary text-sm">
                      {formData.selectedAvatar?.name} • {formData.creativeStyle?.name}
                    </p>
                  </div>

                  <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-textPrimary mb-2">Diálogo</h4>
                    <p className="text-textSecondary text-sm italic">"{formData.dialogue}"</p>
                  </div>

                  <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-textPrimary mb-2">Formato</h4>
                    <p className="text-textSecondary text-sm">
                      {formData.model === 'sora-2' ? 'Sora 2' : 'Sora 2 Pro'} • {formData.quality === 'high' ? 'Alta Qualidade' : 'Standard'} • {formData.aspectRatio} • {formData.duration} • {formData.storyboardMode ? 'Storyboard' : 'Vídeo único'}
                    </p>
                  </div>

                  {formData.productName && (
                    <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                      <h4 className="text-sm font-semibold text-textPrimary mb-2">Produto</h4>
                      <p className="text-textSecondary text-sm">{formData.productName}</p>
                    </div>
                  )}

                  <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-textPrimary mb-2">Cenário</h4>
                    <p className="text-textSecondary text-sm">
                      {formData.mainEnvironment}
                      {formData.visibleElements && ` • ${formData.visibleElements}`}
                      <br />
                      Iluminação: {formData.lighting}
                    </p>
                  </div>

                  <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-textPrimary mb-2">Estilo de Gravação</h4>
                    <p className="text-textSecondary text-sm">
                      {(formData.framing || formData.cameraAngle || formData.movement || formData.depthOfField) ? (
                        <>
                          {formData.framing && `Enquadramento: ${formData.framing}`}
                          {formData.framing && formData.cameraAngle && ' • '}
                          {formData.cameraAngle && `Ângulo: ${formData.cameraAngle}`}
                          {(formData.framing || formData.cameraAngle) && formData.movement && ' • '}
                          {formData.movement && `Movimento: ${formData.movement}`}
                          {(formData.framing || formData.cameraAngle || formData.movement) && formData.depthOfField && ' • '}
                          {formData.depthOfField && `Profundidade: ${formData.depthOfField}`}
                        </>
                      ) : (
                        'Preset padrão (selfie de alta qualidade realista)'
                      )}
                    </p>
                  </div>

                  {formData.storyboardMode && (
                    <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                      <h4 className="text-sm font-semibold text-textPrimary mb-2">Cenas ({formData.scenes.length})</h4>
                      <div className="space-y-2">
                        {formData.scenes.map((scene, index) => (
                          <div key={index} className="text-textSecondary text-sm">
                            Cena {index + 1}: {scene.description.substring(0, 60)}... ({scene.duration})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-6 bg-brandPrimary/10 border-2 border-brandPrimary/30 rounded-xl">
                  <div>
                    <div className="text-textPrimary font-semibold mb-1">Consumo de créditos</div>
                    <div className="text-textSecondary text-sm">
                      {formData.storyboardMode ? `${formData.scenes.length} cenas` : '1 vídeo'}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-brandPrimary">{calculateCredits()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="border-t p-6 flex items-center justify-between bg-surfaceMuted/20">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="disabled:opacity-30"
            >
              <ChevronLeft size={18} className="mr-1" />
              Voltar
            </Button>

            {currentStep === totalSteps ? (
              <Button onClick={handleGenerateVideo}>
                <Sparkles size={18} className="mr-2" />
                Gerar Vídeo UGC
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!validateStep()}
                className="disabled:opacity-40"
              >
                Continuar
                <ChevronRight size={18} className="ml-1" />
              </Button>
            )}
          </div>
        </Card>
          </div>
        </div>
      )}

      {/* Batch Generation Modal - REMOVED */}
      {false && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overlay-enter">
          <div className="bg-surface border rounded-2xl max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto modal-enter">
            <div className="sticky top-0 bg-surface border-b p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-bold text-textPrimary">Gerar Variações de Vídeo</h3>
                <p className="text-textSecondary mt-1">Crie múltiplas versões reutilizando o criativo base.</p>
              </div>
              <button
                onClick={closeBatchModal}
                className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-brandPrimary/10"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Base Video Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-lg font-semibold text-textPrimary">Vídeo Base</h4>
                  <Badge className="bg-brandPrimary/20 text-brandPrimary border-brandPrimary/30">
                    Este vídeo será usado como base
                  </Badge>
                </div>
                <Card className="bg-surfaceMuted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Video Preview */}
                    <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center relative max-w-[280px]">
                      {selectedVideoForBatch.status === 'ready' && selectedVideoForBatch.video_url ? (
                        <video
                          src={selectedVideoForBatch.video_url}
                          className="w-full h-full object-contain"
                          loop
                          muted
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={selectedVideoForBatch.thumbnail}
                          alt="Base video"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="space-y-6 divide-y divide-border/50">
                      {/* Character Info */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Personagem</p>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Nome</span>
                            <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForBatch.avatar_name || selectedVideoForBatch.avatar || 'Não informado'}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Estilo</span>
                            <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForBatch.creative_style || selectedVideoForBatch.style || 'UGC'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dialogue */}
                      {selectedVideoForBatch.dialogue && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Diálogo</p>
                          <p className="text-textPrimary text-sm leading-relaxed italic bg-surfaceMuted/50 p-3 rounded-lg border border-border/30">
                            "{selectedVideoForBatch.dialogue}"
                          </p>
                        </div>
                      )}

                      {/* Scene Settings */}
                      {selectedVideoForBatch.metadata?.scene_settings && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Cenário</p>
                          <div className="space-y-2.5">
                            {selectedVideoForBatch.metadata.scene_settings.location && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Local</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForBatch.metadata.scene_settings.location}</span>
                              </div>
                            )}
                            {selectedVideoForBatch.metadata.scene_settings.lighting && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-textSecondary text-sm">Iluminação</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForBatch.metadata.scene_settings.lighting}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Style Settings */}
                      {selectedVideoForBatch.metadata?.style_settings && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Estilo de Gravação</p>
                          <div className="space-y-2.5">
                            {selectedVideoForBatch.metadata.style_settings.framing && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Enquadramento</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForBatch.metadata.style_settings.framing}</span>
                              </div>
                            )}
                            {selectedVideoForBatch.metadata.style_settings.cameraAngle && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Ângulo</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForBatch.metadata.style_settings.cameraAngle}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Product Data */}
                      {selectedVideoForBatch.metadata?.product_data && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Produto</p>
                          <div className="space-y-2.5">
                            {selectedVideoForBatch.metadata.product_data.name && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Nome</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForBatch.metadata.product_data.name}</span>
                              </div>
                            )}
                            {selectedVideoForBatch.metadata.product_data.action && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Ação</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForBatch.metadata.product_data.action}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Configurations */}
                      <div className="pt-6 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Configurações</p>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Proporção</span>
                            <span className="text-textPrimary font-medium text-sm">{selectedVideoForBatch.aspect_ratio || selectedVideoForBatch.aspectRatio || '9:16'}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Duração</span>
                            <span className="text-textPrimary font-medium text-sm">{selectedVideoForBatch.duration || '15s'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Presets Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-textPrimary">Presets de Variação</h4>
                    <p className="text-textSecondary text-sm mt-0.5">Salve combinações para reutilizar em novos criativos</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPresetModal(true)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Sparkles size={14} />
                    Salvar Preset
                  </Button>
                </div>

                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`group relative px-3 py-2 rounded-lg border-2 cursor-pointer transition-smooth hover:border-brandPrimary/50 active-press ${
                          selectedPreset?.id === preset.id
                            ? 'border-brandPrimary bg-brandPrimary/10'
                            : 'border bg-surface-muted'
                        }`}
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-textPrimary font-medium">{preset.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded"
                          >
                            <X size={12} className="text-red-500" />
                          </button>
                        </div>
                        <div className="text-xs text-textSecondary mt-0.5">
                          {preset.quantity} vídeos • {preset.avatarMode === 'same' ? 'Mesmo avatar' : 'Avatar variado'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* A/B Testing Section */}
              <div className="p-5 bg-brandPrimary/5 border-2 border-brandPrimary/20 rounded-xl">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-textPrimary">Teste A/B Automático</h4>
                      <Badge className="bg-brandPrimary text-white text-xs">Recomendado</Badge>
                    </div>
                    <p className="text-textSecondary text-sm">
                      O Morphion gera variações focadas em comparar performance
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableABTest}
                      onChange={(e) => setEnableABTest(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brandPrimary checkbox-transition"></div>
                  </label>
                </div>

                {enableABTest && (
                  <div className="space-y-2 pl-1 fade-in-scale">
                    <p className="text-sm font-medium text-textPrimary mb-3">O que variar nos testes:</p>
                    {[
                      { key: 'varyHook', label: 'Variar hook inicial', desc: 'Primeiros 3 segundos diferentes' },
                      { key: 'varyTone', label: 'Variar tom de voz', desc: 'Casual vs. profissional' },
                      { key: 'varyAvatar', label: 'Variar avatar', desc: 'Testar diferentes apresentadores' },
                      { key: 'varyCTA', label: 'Variar CTA final', desc: 'Diferentes chamadas para ação' }
                    ].map((option) => (
                      <label
                        key={option.key}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-brandPrimary/10 cursor-pointer transition-smooth"
                      >
                        <input
                          type="checkbox"
                          checked={abTestConfig[option.key]}
                          onChange={() => toggleABTestOption(option.key)}
                          className="mt-0.5 w-4 h-4 text-brandPrimary bg-surface border-2 rounded focus:ring-brandPrimary focus:ring-2 checkbox-transition"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-textPrimary">{option.label}</div>
                          <div className="text-xs text-textSecondary mt-0.5">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Avatar Options */}
              <div>
                <h4 className="text-lg font-semibold text-textPrimary mb-3">Avatar</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => updateBatchConfig('avatarMode', 'same')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      batchConfig.avatarMode === 'same'
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        batchConfig.avatarMode === 'same' ? 'border-brandPrimary' : 'border'
                      }`}>
                        {batchConfig.avatarMode === 'same' && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold mb-1">Usar o mesmo estilo de avatar</p>
                        <p className="text-textSecondary text-sm">Mantém aparência, tom e energia do personagem.</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateBatchConfig('avatarMode', 'vary')}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      batchConfig.avatarMode === 'vary'
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        batchConfig.avatarMode === 'vary' ? 'border-brandPrimary' : 'border'
                      }`}>
                        {batchConfig.avatarMode === 'vary' && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold mb-1">Variar estilo de avatar</p>
                        <p className="text-textSecondary text-sm">IA gera personagens diferentes mantendo o contexto.</p>
                      </div>
                    </div>
                  </button>
                </div>
                <p className="text-textSecondary text-xs mt-2">Ideal para testar diferentes perfis de influenciador.</p>
              </div>

              {/* Dialogue Options */}
              <div>
                <h4 className="text-lg font-semibold text-textPrimary mb-3">Variação de Diálogo</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => updateDialogueOption('maintainStructure', !batchConfig.dialogueOptions.maintainStructure)}
                    className="w-full p-4 rounded-xl border transition-all text-left hover:border-brandPrimary/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        batchConfig.dialogueOptions.maintainStructure ? 'bg-brandPrimary border-brandPrimary' : 'border'
                      }`}>
                        {batchConfig.dialogueOptions.maintainStructure && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-medium">Manter estrutura do diálogo</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateDialogueOption('varyTone', !batchConfig.dialogueOptions.varyTone)}
                    className="w-full p-4 rounded-xl border transition-all text-left hover:border-brandPrimary/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        batchConfig.dialogueOptions.varyTone ? 'bg-brandPrimary border-brandPrimary' : 'border'
                      }`}>
                        {batchConfig.dialogueOptions.varyTone && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-medium">Variar palavras e tom</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateDialogueOption('createHooks', !batchConfig.dialogueOptions.createHooks)}
                    className="w-full p-4 rounded-xl border transition-all text-left hover:border-brandPrimary/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        batchConfig.dialogueOptions.createHooks ? 'bg-brandPrimary border-brandPrimary' : 'border'
                      }`}>
                        {batchConfig.dialogueOptions.createHooks && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-medium">Criar hooks diferentes</p>
                      </div>
                    </div>
                  </button>
                </div>
                <p className="text-textSecondary text-xs mt-2">A mensagem continua a mesma, mas com variações criativas.</p>
              </div>

              {/* Quantity Selection */}
              <div>
                <h4 className="text-lg font-semibold text-textPrimary mb-3">Quantidade de variações</h4>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[5, 10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => updateBatchConfig('quantity', qty)}
                      className={`py-4 px-3 rounded-xl font-semibold text-lg transition-all ${
                        batchConfig.quantity === qty
                          ? 'bg-brandPrimary text-white'
                          : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={batchConfig.quantity}
                  onChange={(e) => updateBatchConfig('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Quantidade personalizada"
                  className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                />
              </div>

              {/* Credits Summary */}
              <div className="p-6 bg-brandPrimary/10 border-2 border-brandPrimary/30 rounded-xl">
                <h4 className="text-sm font-semibold text-textPrimary mb-4">Resumo de créditos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Custo por vídeo</span>
                    <span className="text-textPrimary font-semibold">{selectedVideoForBatch.credits} créditos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Quantidade</span>
                    <span className="text-textPrimary font-semibold">{batchConfig.quantity} vídeos</span>
                  </div>
                  <div className="h-px bg-border"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-textPrimary font-semibold">Total</span>
                    <span className="text-brandPrimary font-bold text-2xl">{calculateBatchCredits()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-surface border-t p-6 flex items-center justify-between gap-4">
              <p className="text-textSecondary text-sm flex-1">As variações aparecerão automaticamente na sua galeria.</p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={closeBatchModal}>
                  Cancelar
                </Button>
                <Button onClick={generateBatchVideos}>
                  <Layers size={18} className="mr-2" />
                  Gerar variações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reuse Modal - REMOVED */}
      {false && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overlay-enter">
          <div className="bg-surface border rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto modal-enter">
            <div className="sticky top-0 bg-surface border-b p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-bold text-textPrimary">Reutilizar Criativo</h3>
                <p className="text-textSecondary mt-1">Use este vídeo como base para criar uma nova versão.</p>
              </div>
              <button
                onClick={closeReuseModal}
                className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-brandPrimary/10"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Base Video Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-lg font-semibold text-textPrimary">Criativo Base</h4>
                  <Badge className="bg-brandPrimary/20 text-brandPrimary border-brandPrimary/30">
                    Este criativo será reutilizado como base
                  </Badge>
                </div>
                <Card className="bg-surfaceMuted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Video Preview */}
                    <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center relative">
                      {selectedVideoForReuse.status === 'ready' && selectedVideoForReuse.video_url ? (
                        <video
                          src={selectedVideoForReuse.video_url}
                          className="w-full h-full object-contain"
                          loop
                          muted
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <>
                          <img
                            src={selectedVideoForReuse.thumbnail}
                            alt="Base video"
                            className="w-full h-full object-cover brightness-50"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 border-4 border-brandPrimary/30 border-t-brandPrimary rounded-full animate-spin"></div>
                              <p className="text-white text-sm font-medium">Processando vídeo...</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="space-y-6 divide-y divide-border/50">
                      {/* Character Info */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Personagem</p>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Nome</span>
                            <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForReuse.avatar_name || selectedVideoForReuse.avatar || 'Não informado'}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Estilo</span>
                            <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForReuse.creative_style || selectedVideoForReuse.style || 'UGC'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dialogue */}
                      {selectedVideoForReuse.dialogue && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Diálogo</p>
                          <p className="text-textPrimary text-sm leading-relaxed italic bg-surfaceMuted/50 p-3 rounded-lg border border-border/30">
                            "{selectedVideoForReuse.dialogue}"
                          </p>
                        </div>
                      )}

                      {/* Scene Settings */}
                      {selectedVideoForReuse.metadata?.scene_settings && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Cenário</p>
                          <div className="space-y-2.5">
                            {selectedVideoForReuse.metadata.scene_settings.location && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Local</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForReuse.metadata.scene_settings.location}</span>
                              </div>
                            )}
                            {selectedVideoForReuse.metadata.scene_settings.lighting && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-textSecondary text-sm">Iluminação</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForReuse.metadata.scene_settings.lighting}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Style Settings */}
                      {selectedVideoForReuse.metadata?.style_settings && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Estilo de Gravação</p>
                          <div className="space-y-2.5">
                            {selectedVideoForReuse.metadata.style_settings.framing && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Enquadramento</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForReuse.metadata.style_settings.framing}</span>
                              </div>
                            )}
                            {selectedVideoForReuse.metadata.style_settings.cameraAngle && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Ângulo</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForReuse.metadata.style_settings.cameraAngle}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Product Data */}
                      {selectedVideoForReuse.metadata?.product_data && (
                        <div className="pt-6 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Produto</p>
                          <div className="space-y-2.5">
                            {selectedVideoForReuse.metadata.product_data.name && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Nome</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForReuse.metadata.product_data.name}</span>
                              </div>
                            )}
                            {selectedVideoForReuse.metadata.product_data.action && (
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-textSecondary text-sm">Ação</span>
                                <span className="text-textPrimary font-medium text-sm text-right flex-1">{selectedVideoForReuse.metadata.product_data.action}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Configurations */}
                      <div className="pt-6 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-textSecondary">Configurações</p>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Proporção</span>
                            <span className="text-textPrimary font-medium text-sm">{selectedVideoForReuse.aspect_ratio || selectedVideoForReuse.aspectRatio || '9:16'}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-textSecondary text-sm">Duração</span>
                            <span className="text-textPrimary font-medium text-sm">{selectedVideoForReuse.duration || '15s'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Avatar Options */}
              <div>
                <h4 className="text-lg font-semibold text-textPrimary mb-3">Avatar</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => updateReuseConfig('avatarMode', 'same')}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth text-left active-press ${
                      reuseConfig.avatarMode === 'same'
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 radio-transition ${
                        reuseConfig.avatarMode === 'same' ? 'border-brandPrimary' : 'border'
                      }`}>
                        {reuseConfig.avatarMode === 'same' && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary radio-dot-enter"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold mb-1">Manter o mesmo avatar</p>
                        <p className="text-textSecondary text-sm">Reutiliza aparência, tom e energia.</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateReuseConfig('avatarMode', 'new')}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth text-left active-press ${
                      reuseConfig.avatarMode === 'new'
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 radio-transition ${
                        reuseConfig.avatarMode === 'new' ? 'border-brandPrimary' : 'border'
                      }`}>
                        {reuseConfig.avatarMode === 'new' && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary radio-dot-enter"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold mb-1">Gerar novo avatar</p>
                        <p className="text-textSecondary text-sm">Mantém o estilo do vídeo com um novo personagem.</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dialogue Options */}
              <div>
                <h4 className="text-lg font-semibold text-textPrimary mb-3">Diálogo</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => updateReuseDialogueOption('reuseSame', true)}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth text-left active-press ${
                      reuseConfig.dialogueOptions.reuseSame
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 radio-transition ${
                        reuseConfig.dialogueOptions.reuseSame ? 'border-brandPrimary' : 'border'
                      }`}>
                        {reuseConfig.dialogueOptions.reuseSame && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary radio-dot-enter"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold">Reutilizar o mesmo diálogo</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateReuseDialogueOption('adjustSlightly', true)}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth text-left active-press ${
                      reuseConfig.dialogueOptions.adjustSlightly
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 radio-transition ${
                        reuseConfig.dialogueOptions.adjustSlightly ? 'border-brandPrimary' : 'border'
                      }`}>
                        {reuseConfig.dialogueOptions.adjustSlightly && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary radio-dot-enter"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold">Ajustar levemente o texto</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => updateReuseDialogueOption('createNew', true)}
                    className={`w-full p-4 rounded-xl border-2 transition-smooth text-left active-press ${
                      reuseConfig.dialogueOptions.createNew
                        ? 'border-brandPrimary bg-brandPrimary/10'
                        : 'border hover:border-brandPrimary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 radio-transition ${
                        reuseConfig.dialogueOptions.createNew ? 'border-brandPrimary' : 'border'
                      }`}>
                        {reuseConfig.dialogueOptions.createNew && (
                          <div className="w-3 h-3 rounded-full bg-brandPrimary radio-dot-enter"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-textPrimary font-semibold">Criar novo diálogo a partir do original</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-surface border-t p-6 flex items-center justify-between gap-4">
              <p className="text-textSecondary text-sm flex-1">O novo vídeo aparecerá como um item separado na galeria.</p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={closeReuseModal}>
                  Cancelar
                </Button>
                <Button onClick={generateReusedVideo}>
                  <Copy size={18} className="mr-2" />
                  Criar novo vídeo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedVideoForPreview && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-6 overlay-enter"
          onClick={closePreviewModal}
        >
          <div
            className="w-full h-full max-w-7xl max-h-[90vh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Video Player */}
            <div className="flex-1 flex items-center justify-center bg-black p-8">
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                {selectedVideoForPreview.status === 'ready' && selectedVideoForPreview.video_url ? (
                  <video
                    src={selectedVideoForPreview.video_url}
                    controls
                    controlsList="nodownload"
                    autoPlay
                    className={`${
                      (selectedVideoForPreview.aspect_ratio || selectedVideoForPreview.aspectRatio) === '9:16'
                        ? 'h-[75vh] w-auto'
                        : (selectedVideoForPreview.aspect_ratio || selectedVideoForPreview.aspectRatio) === '1:1'
                        ? 'h-[65vh] w-[65vh]'
                        : 'w-[60vw] h-auto max-w-3xl'
                    }`}
                  />
                ) : (
                  <>
                    {selectedVideoForPreview.thumbnail_url ? (
                      <img
                        src={selectedVideoForPreview.thumbnail_url}
                        alt="Video preview"
                        className={`object-cover ${
                          (selectedVideoForPreview.aspect_ratio || selectedVideoForPreview.aspectRatio) === '9:16'
                            ? 'h-[75vh] w-auto'
                            : (selectedVideoForPreview.aspect_ratio || selectedVideoForPreview.aspectRatio) === '1:1'
                            ? 'h-[65vh] w-[65vh]'
                            : 'w-[60vw] h-auto max-w-3xl'
                        }`}
                      />
                    ) : (
                      <div className="w-[400px] h-[75vh] bg-surfaceMuted/30 flex items-center justify-center">
                        <Loader2 size={48} className="text-brandPrimary animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Information */}
            <div className="w-[420px] h-full bg-surface flex flex-col">
              <div className="border-b p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-textPrimary flex-1 pr-3">
                    {selectedVideoForPreview.avatar_name || selectedVideoForPreview.avatar || 'Avatar'} • {selectedVideoForPreview.creative_style || selectedVideoForPreview.style || 'UGC'}
                  </h3>
                  <button
                    onClick={closePreviewModal}
                    className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-surfaceMuted/50 flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${
                    selectedVideoForPreview.status === 'ready'
                      ? 'bg-green-500/20 text-green-600 border-green-500/30'
                      : selectedVideoForPreview.status === 'processing'
                      ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
                      : selectedVideoForPreview.status === 'queued'
                      ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-600 border-red-500/30'
                  }`}>
                    {selectedVideoForPreview.status === 'ready' ? 'Pronto' :
                     selectedVideoForPreview.status === 'processing' ? 'Processando' :
                     selectedVideoForPreview.status === 'queued' ? 'Na fila' : 'Erro'}
                  </Badge>
                  {selectedVideoForPreview.status === 'ready' && selectedVideoForPreview.video_url && (
                    <a
                      href={selectedVideoForPreview.video_url}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download size={12} />
                      Baixar
                    </a>
                  )}
                  {selectedVideoForPreview.isVariation && (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      Variação {selectedVideoForPreview.variationNumber}
                    </Badge>
                  )}
                  {selectedVideoForPreview.isReused && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                      Reutilizado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Avatar Info */}
                <div>
                  <h4 className="text-sm font-semibold text-textSecondary mb-3">Personagem</h4>
                  <Card className="bg-surfaceMuted/30">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Nome</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.avatar_name || selectedVideoForPreview.avatar || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Estilo</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.creative_style || selectedVideoForPreview.style || 'UGC'}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Dialogue */}
                {selectedVideoForPreview.dialogue && (
                  <div>
                    <h4 className="text-sm font-semibold text-textSecondary mb-3">Diálogo</h4>
                    <Card className="bg-surfaceMuted/30">
                      <p className="text-textPrimary text-sm leading-relaxed">
                        "{selectedVideoForPreview.dialogue}"
                      </p>
                    </Card>
                  </div>
                )}

                {/* Quiz Responses */}
                {selectedVideoForPreview.metadata && (
                  <>
                    {/* Scene Settings */}
                    {selectedVideoForPreview.metadata.scene_settings && (
                      <div>
                        <h4 className="text-sm font-semibold text-textSecondary mb-3">Cenário</h4>
                        <Card className="bg-surfaceMuted/30">
                          <div className="space-y-2">
                            {selectedVideoForPreview.metadata.scene_settings.location && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Local</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.scene_settings.location}</span>
                              </div>
                            )}
                            {selectedVideoForPreview.metadata.scene_settings.lighting && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Iluminação</span>
                                <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.metadata.scene_settings.lighting}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* Style Settings */}
                    {selectedVideoForPreview.metadata.style_settings && (
                      <div>
                        <h4 className="text-sm font-semibold text-textSecondary mb-3">Estilo de Gravação</h4>
                        <Card className="bg-surfaceMuted/30">
                          <div className="space-y-2">
                            {selectedVideoForPreview.metadata.style_settings.framing && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Enquadramento</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.style_settings.framing}</span>
                              </div>
                            )}
                            {selectedVideoForPreview.metadata.style_settings.cameraAngle && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Ângulo</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.style_settings.cameraAngle}</span>
                              </div>
                            )}
                            {selectedVideoForPreview.metadata.style_settings.movement && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Movimento</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.style_settings.movement}</span>
                              </div>
                            )}
                            {selectedVideoForPreview.metadata.style_settings.depthOfField && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Profundidade</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.style_settings.depthOfField}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* Product Data */}
                    {selectedVideoForPreview.metadata.product_data && (
                      <div>
                        <h4 className="text-sm font-semibold text-textSecondary mb-3">Produto</h4>
                        <Card className="bg-surfaceMuted/30">
                          <div className="space-y-2">
                            {selectedVideoForPreview.metadata.product_data.name && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Nome</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.product_data.name}</span>
                              </div>
                            )}
                            {selectedVideoForPreview.metadata.product_data.action && (
                              <div className="flex justify-between">
                                <span className="text-textSecondary text-sm">Ação</span>
                                <span className="text-textPrimary font-medium text-sm text-right">{selectedVideoForPreview.metadata.product_data.action}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    )}
                  </>
                )}

                {/* Configurations */}
                <div>
                  <h4 className="text-sm font-semibold text-textSecondary mb-3">Configurações</h4>
                  <Card className="bg-surfaceMuted/30">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Proporção</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.aspect_ratio || selectedVideoForPreview.aspectRatio || '9:16'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Duração</span>
                        <span className="text-textPrimary font-medium text-sm">{selectedVideoForPreview.duration || '15s'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Criado em</span>
                        <span className="text-textPrimary font-medium text-sm">{formatDate(selectedVideoForPreview.created_at || selectedVideoForPreview.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary text-sm">Créditos gastos</span>
                        <span className="text-brandPrimary font-semibold text-sm">{selectedVideoForPreview.credits_used || selectedVideoForPreview.credits || 0}</span>
                      </div>
                    </div>
                  </Card>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset Save Modal - REMOVED */}
      {false && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overlay-enter">
          <div className="bg-surface border rounded-2xl max-w-md w-full shadow-2xl modal-enter">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-textPrimary">Salvar Preset</h3>
                <button
                  onClick={() => {
                    setShowPresetModal(false);
                    setNewPresetName('');
                  }}
                  className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-brandPrimary/10"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-textSecondary text-sm mb-4">
                Dê um nome para esta combinação e reutilize em futuros criativos
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Nome do Preset
                  </label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Ex: Influencer Casual · Hook Forte"
                    className="w-full p-3 bg-surface-muted border rounded-lg text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-brandPrimary transition-smooth"
                  />
                </div>

                <div className="p-4 bg-surface-muted rounded-lg">
                  <p className="text-sm font-medium text-textPrimary mb-2">Este preset incluirá:</p>
                  <ul className="space-y-1 text-sm text-textSecondary">
                    <li>• Avatar: {batchConfig.avatarMode === 'same' ? 'Mesmo avatar' : 'Avatar variado'}</li>
                    <li>• Quantidade: {batchConfig.quantity} vídeos</li>
                    <li>• Opções de diálogo configuradas</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPresetModal(false);
                      setNewPresetName('');
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={saveAsPreset}
                    disabled={!newPresetName.trim()}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Salvar Preset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgPrimary/95 backdrop-blur-sm animate-fadeIn">
          <div className="text-center px-6 max-w-md">
            <div className="mb-6 flex justify-center">
              <Loader2 className="w-16 h-16 text-brandPrimary animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-textPrimary mb-3">
              Enviando para criação...
            </h3>
            <p className="text-sm text-textSecondary">
              Seu vídeo será processado em instantes
            </p>
          </div>
        </div>
      )}

      <GenerateVariationsModal
        video={videoForVariations}
        isOpen={showVariationsModal}
        onClose={() => {
          setShowVariationsModal(false);
          setVideoForVariations(null);
        }}
        onGenerate={handleGenerateVariations}
      />

    </div>
  );
}
