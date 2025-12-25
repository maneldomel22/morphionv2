import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Camera, User, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const QUIZ_STEPS = [
  {
    id: 'profile',
    title: 'Perfil do Influencer',
    description: 'Nome e identificação',
    icon: User,
    fields: [
      {
        key: 'name',
        label: 'Nome do Influencer',
        type: 'text',
        placeholder: 'Ex: Ana Silva, João Santos...'
      },
      {
        key: 'username',
        label: 'Username (sem @)',
        type: 'text',
        placeholder: 'Ex: anasilva, joaosantos...',
        helpText: 'Este será usado como @username no Instagram'
      },
      {
        key: 'bio',
        label: 'Bio (opcional)',
        type: 'textarea',
        placeholder: 'Descrição breve do perfil...',
        rows: 2,
        optional: true
      }
    ]
  },
  {
    id: 'aspect_ratio',
    title: 'Formato da Imagem',
    description: 'Escolha a proporção',
    icon: Camera,
    fields: [
      {
        key: 'aspect_ratio',
        label: 'Formato',
        type: 'select',
        options: [
          { value: '9:16', label: '📱 Story (9:16)' },
          { value: '1:1', label: '⬛ Feed quadrado (1:1)' },
          { value: '3:4', label: '📐 Feed vertical (3:4)' }
        ]
      }
    ]
  },
  {
    id: 'appearance',
    title: 'Aparência Física',
    description: 'Características do influencer',
    icon: User,
    fields: [
      {
        key: 'gender',
        label: 'Gênero',
        type: 'select',
        options: [
          { value: 'female', label: 'Feminino' },
          { value: 'male', label: 'Masculino' },
          { value: 'non-binary', label: 'Não-binário' }
        ]
      },
      {
        key: 'age',
        label: 'Faixa Etária',
        type: 'select',
        options: [
          { value: '18-25', label: '18-25 anos' },
          { value: '26-35', label: '26-35 anos' },
          { value: '36-45', label: '36-45 anos' },
          { value: '46-55', label: '46-55 anos' },
          { value: '56+', label: '56+ anos' }
        ]
      },
      {
        key: 'skin_tone',
        label: 'Tom de Pele',
        type: 'select',
        options: [
          { value: 'very_fair', label: 'Muito clara' },
          { value: 'fair', label: 'Clara' },
          { value: 'medium', label: 'Média' },
          { value: 'tan', label: 'Morena' },
          { value: 'dark', label: 'Negra' }
        ]
      },
      {
        key: 'body_type',
        label: 'Tipo Físico',
        type: 'select',
        options: [
          { value: 'slim', label: 'Magro' },
          { value: 'average', label: 'Médio' },
          { value: 'athletic', label: 'Atlético' },
          { value: 'plus_size', label: 'Plus size' }
        ]
      },
      {
        key: 'hair_length',
        label: 'Comprimento do Cabelo',
        type: 'select',
        options: [
          { value: 'very_short', label: 'Muito curto' },
          { value: 'short', label: 'Curto' },
          { value: 'medium', label: 'Médio' },
          { value: 'long', label: 'Longo' },
          { value: 'very_long', label: 'Muito longo' },
          { value: 'bald', label: 'Careca' }
        ]
      },
      {
        key: 'hair_style',
        label: 'Estilo do Cabelo',
        type: 'select',
        options: [
          { value: 'straight', label: 'Liso' },
          { value: 'wavy', label: 'Ondulado' },
          { value: 'curly', label: 'Cacheado' },
          { value: 'coily', label: 'Crespo' },
          { value: 'dreadlocks', label: 'Dreadlocks' },
          { value: 'buzz_cut', label: 'Raspado' }
        ]
      },
      {
        key: 'distinct_features',
        label: 'Traços Marcantes (opcional)',
        type: 'text',
        placeholder: 'Ex: Tatuagens, piercings, óculos, barba...',
        optional: true
      },
      {
        key: 'breast_size',
        label: 'Tamanho dos Seios',
        type: 'select',
        options: [
          { value: 'small', label: 'Pequenos' },
          { value: 'medium', label: 'Médios' },
          { value: 'large', label: 'Grandes' },
          { value: 'very_large', label: 'Muito Grandes' }
        ]
      },
      {
        key: 'vulva_type',
        label: 'Tipo de Vulva',
        type: 'select',
        options: [
          { value: 'small', label: 'Pequena' },
          { value: 'medium', label: 'Média' },
          { value: 'plump', label: 'Carnuda' },
          { value: 'very_plump', label: 'Muito Carnuda' }
        ]
      }
    ]
  },
  {
    id: 'photo_type',
    title: 'Como a Foto Foi Tirada?',
    description: 'CRÍTICO: Define o estilo da foto',
    icon: Camera,
    fields: [
      {
        key: 'photo_type',
        label: 'Tipo de Foto',
        type: 'select',
        helpText: 'Esta escolha define completamente o estilo da imagem. NÃO será mirror selfie por padrão!',
        options: [
          { value: 'other_person', label: '📸 Foto tirada por outra pessoa' },
          { value: 'selfie', label: '📱 Selfie (braço esticado, câmera frontal)' },
          { value: 'selfie_spontaneous', label: '🤳 Selfie espontânea (ângulo torto)' },
          { value: 'casual_candid', label: '🚶‍♀️ Foto casual/espontânea (não posada)' },
          { value: 'video_frame', label: '🎥 Frame de vídeo (momento natural)' },
          { value: 'mirror', label: '🪞 Espelho (mirror selfie)' }
        ]
      },
      {
        key: 'photo_taker',
        label: 'Quem Tirou a Foto?',
        type: 'select',
        helpText: 'Afeta o ângulo e a naturalidade da foto',
        options: [
          { value: 'friend', label: '👥 Um amigo(a)' },
          { value: 'self', label: '🙋‍♀️ A própria influencer' },
          { value: 'partner', label: '💑 Um parceiro(a)' },
          { value: 'stranger', label: '🧑 Um desconhecido' },
          { value: 'tripod', label: '📷 Tripé / apoio improvisado' }
        ]
      },
      {
        key: 'camera_position',
        label: 'Posição da Câmera',
        type: 'select',
        helpText: 'Ângulo e posicionamento',
        options: [
          { value: 'eye_level', label: 'Altura do rosto (direto)' },
          { value: 'slightly_above', label: 'Um pouco acima' },
          { value: 'slightly_below', label: 'Um pouco abaixo' },
          { value: 'side_angle', label: 'Lateral / ¾' },
          { value: 'slightly_tilted', label: 'Levemente torta' },
          { value: 'totally_casual', label: 'Totalmente casual / imperfeita' }
        ]
      }
    ]
  },
  {
    id: 'expression',
    title: 'Expressão & Atitude',
    description: 'Como o influencer está se apresentando',
    icon: Sparkles,
    fields: [
      {
        key: 'expression_body_language',
        label: 'Expressão & Linguagem Corporal',
        type: 'select',
        helpText: 'O mood geral da foto',
        options: [
          { value: 'natural_smile', label: '😊 Sorriso natural' },
          { value: 'shy_smile', label: '🙂 Sorriso tímido' },
          { value: 'neutral_relaxed', label: '😐 Neutra / relaxada' },
          { value: 'eye_contact', label: '👀 Olhando direto pra câmera' },
          { value: 'looking_away', label: '👈 Olhando pro lado' },
          { value: 'laughing', label: '😂 Rindo no momento do clique' },
          { value: 'in_motion', label: '🚶 Em movimento (andando, virando)' }
        ]
      }
    ]
  },
  {
    id: 'scene_context',
    title: 'Contexto da Cena',
    description: 'Descreva o que está acontecendo',
    icon: Sparkles,
    fields: [
      {
        key: 'scene_context',
        label: 'Descreva a Cena com Suas Palavras',
        type: 'textarea',
        placeholder: 'Exemplo:\n"Bebendo café da manhã na varanda com o sol batendo"\n"Saindo da academia com a garrafa de água"\n"Experimentando roupa nova no provador"\n"Curtindo a praia com os amigos"',
        rows: 4,
        helpText: '⚠️ IMPORTANTE: Este texto será usado EXATAMENTE como você escrever no prompt. Seja descritivo e natural!',
        optional: true
      }
    ]
  },
  {
    id: 'environment',
    title: 'Ambiente & Localização',
    description: 'Onde a foto está sendo tirada',
    icon: Camera,
    fields: [
      {
        key: 'environment',
        label: 'Local',
        type: 'select',
        options: [
          { value: 'bedroom', label: '🛏️ Quarto' },
          { value: 'living_room', label: '🛋️ Sala' },
          { value: 'bathroom', label: '🚿 Banheiro' },
          { value: 'car', label: '🚗 Carro' },
          { value: 'beach', label: '🏖️ Praia' },
          { value: 'street', label: '🏙️ Rua' },
          { value: 'cafe', label: '☕ Café' },
          { value: 'gym', label: '💪 Academia' },
          { value: 'park', label: '🌳 Parque' },
          { value: 'event', label: '🎉 Evento / festa' },
          { value: 'other', label: '📍 Outro' }
        ]
      },
      {
        key: 'background_details',
        label: 'Detalhes do Fundo (opcional)',
        type: 'text',
        placeholder: 'Ex: Plantas, parede branca, prateleiras, pessoas ao fundo...',
        optional: true
      }
    ]
  },
  {
    id: 'lighting',
    title: 'Iluminação',
    description: 'Tipo de luz na cena',
    icon: Sparkles,
    fields: [
      {
        key: 'lighting',
        label: 'Iluminação',
        type: 'select',
        helpText: 'Afeta muito o mood da foto',
        options: [
          { value: 'soft_natural', label: '🌤️ Luz natural suave' },
          { value: 'direct_sun', label: '☀️ Luz direta do sol' },
          { value: 'golden_hour', label: '🌅 Golden hour (fim de tarde)' },
          { value: 'indoor_common', label: '💡 Luz interna comum' },
          { value: 'mixed', label: '🌗 Luz mista (natural + artificial)' },
          { value: 'poor', label: '🌑 Luz ruim (mais realista)' }
        ]
      }
    ]
  },
  {
    id: 'device',
    title: 'Qualidade da Imagem',
    description: 'CRÍTICO: A qualidade afeta cores, nitidez e processamento',
    icon: Camera,
    fields: [
      {
        key: 'device_type',
        label: 'Qual a Qualidade da Foto?',
        type: 'select',
        helpText: '⚠️ IMPORTANTE: Isso afeta cores, nitidez, HDR e processamento da imagem',
        options: [
          { value: 'high_quality', label: '📱 Alta qualidade (imagem limpa, HDR equilibrado)' },
          { value: 'standard_quality', label: '📸 Qualidade padrão (cores saturadas)' },
          { value: 'lower_quality', label: '📷 Qualidade básica (imagem lavada)' },
          { value: 'social_media', label: '📲 Qualidade social media (compressão forte)' }
        ]
      }
    ]
  },
  {
    id: 'wardrobe',
    title: 'Roupa',
    description: 'O que o influencer está vestindo',
    icon: Sparkles,
    fields: [
      {
        key: 'outfit_description',
        label: 'Descrição da Roupa',
        type: 'textarea',
        placeholder: 'Descreva a roupa completa:\n\nExemplo:\n"Camiseta branca oversized e shorts jeans"\n"Vestido floral midi com tênis branco"\n"Moletom preto e legging de academia"',
        rows: 3,
        helpText: 'Seja descritivo mas natural. Este texto entra direto no prompt.'
      }
    ]
  },
  {
    id: 'aesthetic',
    title: 'Estética Geral',
    description: 'Vibe da postagem',
    icon: Sparkles,
    fields: [
      {
        key: 'aesthetic_style',
        label: 'Estilo da Foto',
        type: 'select',
        helpText: 'Como essa foto seria postada no Instagram?',
        options: [
          { value: 'ugc', label: '📱 UGC real (mais autêntico)' },
          { value: 'feed_casual', label: '📸 Feed casual do Instagram' },
          { value: 'stories', label: '📲 Stories espontâneo' },
          { value: 'camera_roll', label: '🎲 Foto aleatória do rolo' },
          { value: 'no_thought', label: '🤷 "Não pensei muito, só postei"' }
        ]
      }
    ]
  },
  {
    id: 'quality',
    title: 'Qualidade & Formato',
    description: 'Configurações técnicas',
    icon: Camera,
    fields: [
      {
        key: 'resolution',
        label: 'Qualidade da Imagem',
        type: 'select',
        options: [
          { value: '1K', label: '⚡ Padrão - 1K' },
          { value: '2K', label: '💎 Alta Definição - 2K (recomendado)' },
          { value: '4K', label: '🔥 Ultra Realista - 4K' }
        ]
      },
      {
        key: 'output_format',
        label: 'Formato',
        type: 'select',
        options: [
          { value: 'png', label: 'PNG (melhor qualidade)' },
          { value: 'jpg', label: 'JPG (menor tamanho)' }
        ]
      }
    ]
  }
];

export default function InfluencerQuiz({ onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    aspect_ratio: '9:16',
    gender: 'female',
    photo_type: 'other_person',
    photo_taker: 'friend',
    camera_position: 'eye_level',
    expression_body_language: 'natural_smile',
    environment: 'bedroom',
    lighting: 'soft_natural',
    device_type: 'high_quality',
    aesthetic_style: 'ugc',
    resolution: '2K',
    output_format: 'png'
  });

  const currentStepData = QUIZ_STEPS[currentStep];
  const isLastStep = currentStep === QUIZ_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleFieldChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    return currentStepData.fields.every(field => {
      if (field.optional) return true;
      const value = answers[field.key];
      if (field.type === 'textarea') {
        return true;
      }
      return value && value.toString().trim().length > 0;
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(answers);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      onCancel();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const StepIcon = currentStepData.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3 flex-1">
          {StepIcon && (
            <div className="p-2.5 bg-brandPrimary/10 rounded-lg">
              <StepIcon size={24} className="text-brandPrimary" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-textPrimary mb-1">
              {currentStepData.title}
            </h3>
            <p className="text-textSecondary text-sm">
              {currentStepData.description}
            </p>
            <p className="text-textTertiary text-xs mt-1">
              Etapa {currentStep + 1} de {QUIZ_STEPS.length}
            </p>
          </div>
        </div>
        <div className="flex gap-1 ml-4">
          {QUIZ_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-brandPrimary'
                  : index < currentStep
                  ? 'bg-brandPrimary/50'
                  : 'bg-surfaceMuted'
              }`}
            />
          ))}
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          {currentStepData.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                {field.label}
                {field.optional && <span className="text-textTertiary ml-1">(opcional)</span>}
              </label>
              {field.helpText && (
                <p className="text-xs text-textSecondary mb-2 bg-surfaceMuted/50 p-2 rounded border border-borderColor">
                  {field.helpText}
                </p>
              )}
              {field.type === 'select' ? (
                <select
                  value={answers[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-4 py-2.5 bg-surfaceMuted border border-borderColor rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 focus:border-brandPrimary transition-all"
                >
                  <option value="">Selecione...</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={answers[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows || 3}
                  className="w-full px-4 py-2.5 bg-surfaceMuted border border-borderColor rounded-lg text-textPrimary placeholder-textTertiary focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 focus:border-brandPrimary transition-all resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={answers[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 bg-surfaceMuted border border-borderColor rounded-lg text-textPrimary placeholder-textTertiary focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 focus:border-brandPrimary transition-all"
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex-1"
        >
          <ChevronLeft size={18} className="mr-1" />
          {isFirstStep ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1"
        >
          {isLastStep ? (
            <>
              <Check size={18} className="mr-2" />
              Finalizar
            </>
          ) : (
            <>
              Próximo
              <ChevronRight size={18} className="ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
