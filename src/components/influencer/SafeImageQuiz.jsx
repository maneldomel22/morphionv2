import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { buildNanoBananaPrompt } from '../../services/influencerPromptBuilder';
import { IMAGE_ENGINES } from '../../types/imageEngines';
import { improveSafePrompt } from '../../services/morphySafeService';

const PHOTO_TYPES = [
  { id: 'selfie', label: 'Selfie', description: 'Foto tirada pela própria pessoa' },
  { id: 'candid', label: 'Espontânea', description: 'Momento natural espontâneo' },
  { id: 'third-person', label: 'Terceira Pessoa', description: 'Foto tirada por outra pessoa' }
];

const PHOTOGRAPHERS = [
  { id: 'friend', label: 'Amigo(a)', description: 'Foto casual entre amigos' },
  { id: 'partner', label: 'Parceiro(a)', description: 'Foto tirada pelo namorado/namorada' },
  { id: 'professional', label: 'Profissional', description: 'Fotógrafo profissional' }
];

const ENVIRONMENTS = [
  { id: 'indoor', label: 'Interior', description: 'Dentro de casa ou prédio' },
  { id: 'outdoor', label: 'Exterior', description: 'Ao ar livre' },
  { id: 'urban', label: 'Urbano', description: 'Cidade, ruas, prédios' },
  { id: 'nature', label: 'Natureza', description: 'Praia, parque, montanha' }
];

const LIGHTING = [
  { id: 'natural', label: 'Natural', description: 'Luz do dia' },
  { id: 'golden-hour', label: 'Hora Dourada', description: 'Pôr do sol' },
  { id: 'indoor-light', label: 'Luz de Ambiente', description: 'Luz artificial interna' },
  { id: 'night', label: 'Noturna', description: 'Foto à noite' }
];

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16', description: 'Instagram Stories/Reels' },
  { id: '1:1', label: '1:1', description: 'Instagram Feed' },
  { id: '16:9', label: '16:9', description: 'Landscape' }
];

const RESOLUTIONS = [
  { id: '2K', label: '2K', description: 'Alta qualidade' },
  { id: '4K', label: '4K', description: 'Ultra qualidade' }
];

const OUTPUT_FORMATS = [
  { id: 'png', label: 'PNG', description: 'Melhor qualidade' },
  { id: 'jpg', label: 'JPG', description: 'Menor tamanho' }
];

const MODELS = [
  {
    id: IMAGE_ENGINES.NANO_BANANA,
    label: 'Nano Banana Pro',
    description: 'Mais controle de resolução e formato',
    kieModel: 'nano-banana-pro'
  },
  {
    id: IMAGE_ENGINES.SEEDREAM,
    label: 'Seedream',
    description: 'Realista e automático',
    kieModel: 'seedream/4.5-text-to-image'
  }
];

const QUALITY = [
  { id: 'basic', label: 'Básica (2K)', description: 'Qualidade padrão' },
  { id: 'high', label: 'Alta (4K)', description: 'Alta qualidade' }
];

export default function SafeImageQuiz({ isOpen, onClose, influencer, onGenerate }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [formData, setFormData] = useState({
    model: IMAGE_ENGINES.NANO_BANANA,
    photoType: null,
    photographer: null,
    environment: null,
    lighting: null,
    outfit: '',
    expression: '',
    context: '',
    aspectRatio: '9:16',
    resolution: '2K',
    outputFormat: 'png',
    quality: 'basic'
  });

  const baseSteps = [
    { title: 'Escolha o Modelo', field: 'model', options: MODELS },
    { title: 'Tipo de Foto', field: 'photoType', options: PHOTO_TYPES },
    { title: 'Quem Tira a Foto', field: 'photographer', options: PHOTOGRAPHERS },
    { title: 'Ambiente', field: 'environment', options: ENVIRONMENTS },
    { title: 'Iluminação', field: 'lighting', options: LIGHTING },
    { title: 'Roupa', field: 'outfit', type: 'text' },
    { title: 'Expressão', field: 'expression', type: 'text' },
    { title: 'Contexto Livre', field: 'context', type: 'textarea' },
    { title: 'Proporção', field: 'aspectRatio', options: ASPECT_RATIOS }
  ];

  const isNanoBanana = formData.model === IMAGE_ENGINES.NANO_BANANA;
  const isSeedream = formData.model === IMAGE_ENGINES.SEEDREAM;

  const conditionalSteps = isNanoBanana
    ? [
        { title: 'Resolução', field: 'resolution', options: RESOLUTIONS },
        { title: 'Formato', field: 'outputFormat', options: OUTPUT_FORMATS }
      ]
    : [
        { title: 'Qualidade', field: 'quality', options: QUALITY }
      ];

  const steps = [...baseSteps, ...conditionalSteps];

  const currentStep = steps[step];
  const canProceed = currentStep.type ? formData[currentStep.field] : formData[currentStep.field] !== null;

  const handleSelect = (value) => {
    setFormData({ ...formData, [currentStep.field]: value });
  };

  const handleTextChange = (value) => {
    const limitedValue = value.slice(0, 300);
    setFormData({ ...formData, [currentStep.field]: limitedValue });
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleMorphySuggest = async () => {
    setLoadingSuggestion(true);
    try {
      const photoTypeLabel = PHOTO_TYPES.find(t => t.id === formData.photoType)?.label || '';
      const photographerLabel = PHOTOGRAPHERS.find(p => p.id === formData.photographer)?.label || '';
      const environmentLabel = ENVIRONMENTS.find(e => e.id === formData.environment)?.label || '';
      const lightingLabel = LIGHTING.find(l => l.id === formData.lighting)?.label || '';

      const currentDescription = formData.context || '';
      const outfitInfo = formData.outfit ? ` Wearing: ${formData.outfit}.` : '';
      const expressionInfo = formData.expression ? ` Expression: ${formData.expression}.` : '';

      const contextBuilder = [
        currentDescription,
        photoTypeLabel && `Photo type: ${photoTypeLabel}.`,
        photographerLabel && `Photographer: ${photographerLabel}.`,
        environmentLabel && `Environment: ${environmentLabel}.`,
        lightingLabel && `Lighting: ${lightingLabel}.`,
        outfitInfo,
        expressionInfo
      ].filter(Boolean).join(' ');

      const description = contextBuilder || 'Casual lifestyle photo of the influencer';

      console.log('🎨 Improving prompt with Morphy Safe...');

      const enhancedPrompt = await improveSafePrompt(description, {
        characterImageUrl: influencer.image_url,
        aspectRatio: formData.aspectRatio
      });

      setFormData({ ...formData, context: enhancedPrompt });
    } catch (error) {
      console.error('Error getting Morphy suggestion:', error);
      alert('Erro ao obter sugestão do Morphy: ' + error.message);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const photoTypeLabel = PHOTO_TYPES.find(t => t.id === formData.photoType)?.label;
      const photographerLabel = PHOTOGRAPHERS.find(p => p.id === formData.photographer)?.label;
      const environmentLabel = ENVIRONMENTS.find(e => e.id === formData.environment)?.label;
      const lightingLabel = LIGHTING.find(l => l.id === formData.lighting)?.label;

      const scene = {
        scene_context: formData.context,
        environment: environmentLabel,
        wardrobe: formData.outfit,
        action_pose: 'Natural pose',
        expression_attitude: formData.expression,
        additional_notes: `Lighting: ${lightingLabel}`
      };

      const camera = {
        capture_type: photoTypeLabel,
        photographer: photographerLabel,
        quality: 'high',
        processing: 'natural'
      };

      const prompt = await buildNanoBananaPrompt({ influencer, scene, camera });

      handleClose();

      const selectedModel = MODELS.find(m => m.id === formData.model);

      const payload = {
        model: selectedModel.kieModel,
        prompt,
        aspectRatio: formData.aspectRatio
      };

      if (isNanoBanana) {
        payload.resolution = formData.resolution;
        payload.outputFormat = formData.outputFormat;
      } else {
        payload.quality = formData.quality;
      }

      await onGenerate(payload);
    } catch (error) {
      console.error('Error generating image:', error);
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setGenerating(false);
    setFormData({
      model: IMAGE_ENGINES.NANO_BANANA,
      photoType: null,
      photographer: null,
      environment: null,
      lighting: null,
      outfit: '',
      expression: '',
      context: '',
      aspectRatio: '9:16',
      resolution: '2K',
      outputFormat: 'png',
      quality: 'basic'
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStep.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Passo {step + 1} de {steps.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                SAFE Mode
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="min-h-[300px]">
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Identidade Fixa:</strong> As características físicas do influencer (rosto, corpo, marcas) são fixas e preservadas. Você controla apenas a cena, ambiente e contexto.
            </p>
          </div>

          {currentStep.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descreva {currentStep.title.toLowerCase()}
              </label>
              <input
                type="text"
                value={formData[currentStep.field]}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Ex: ${currentStep.field === 'outfit' ? 'jeans e camiseta branca' : 'sorrindo naturalmente'}`}
                maxLength={300}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formData[currentStep.field]?.length || 0}/300 caracteres - A identidade física é preservada automaticamente.
              </p>
            </div>
          )}

          {currentStep.type === 'textarea' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descreva o contexto da foto
                </label>
                <button
                  onClick={handleMorphySuggest}
                  disabled={loadingSuggestion}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`w-4 h-4 ${loadingSuggestion ? 'animate-spin' : ''}`} />
                  {loadingSuggestion ? 'Melhorando...' : 'Melhorar com Morphy'}
                </button>
              </div>
              <textarea
                value={formData[currentStep.field]}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Ex: Em um café aconchegante, tomando cappuccino, ambiente descontraído..."
                rows={6}
                maxLength={300}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                disabled={loadingSuggestion}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formData[currentStep.field]?.length || 0}/300 caracteres - Descreva apenas o contexto e a cena. A identidade física é preservada automaticamente.
              </p>
            </div>
          )}

          {currentStep.options && (
            <div className="grid grid-cols-2 gap-4">
              {currentStep.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    formData[currentStep.field] === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            isLoading={generating}
          >
            {step === steps.length - 1 ? 'Gerar Imagem' : 'Próximo'}
            {step < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
