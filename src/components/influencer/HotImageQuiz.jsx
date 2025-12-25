import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { getMorphyHotSuggestion, translateToEnglish } from '../../services/morphyHotService';
import { buildSeedreamPrompt } from '../../services/influencerPromptBuilder';

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16', description: 'Vertical - Stories' },
  { id: '1:1', label: '1:1', description: 'Quadrado - Feed' },
  { id: '16:9', label: '16:9', description: 'Horizontal - Landscape' }
];

const RESOLUTIONS = [
  { id: '2K', label: '2K', description: 'Alta qualidade' },
  { id: '4K', label: '4K', description: 'Ultra qualidade' }
];

const OUTPUT_FORMATS = [
  { id: 'png', label: 'PNG', description: 'Melhor qualidade' },
  { id: 'jpg', label: 'JPG', description: 'Menor tamanho' }
];

const QUALITY = [
  { id: 'basic', label: 'Básica', description: 'Qualidade padrão' },
  { id: 'high', label: 'Alta', description: 'Alta qualidade' }
];

export default function HotImageQuiz({ isOpen, onClose, influencer, onGenerate }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [formData, setFormData] = useState({
    action: '',
    attire: '',
    pose: '',
    environment: '',
    lighting: '',
    expression: '',
    aspectRatio: '9:16',
    resolution: '2K',
    outputFormat: 'png',
    quality: 'high'
  });
  const [translations, setTranslations] = useState({
    action: '',
    attire: '',
    pose: '',
    environment: '',
    lighting: '',
    expression: ''
  });

  const translationTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (translationTimeout.current) {
        clearTimeout(translationTimeout.current);
      }
    };
  }, []);

  const steps = [
    {
      title: 'Ação / Interação',
      field: 'action',
      type: 'textarea',
      placeholder: 'O que está fazendo? Ex: Taking a mirror selfie, lying on bed with phone above, leaning against wall, sitting on edge of bathtub, etc.',
      rows: 4
    },
    {
      title: 'Vestimenta',
      field: 'attire',
      type: 'textarea',
      placeholder: 'Ex: Completely nude\n\nOu descreva roupas: Red lace lingerie partially removed, tight jeans unbuttoned and pulled down, oversized t-shirt lifted, black stockings, etc.',
      rows: 4
    },
    {
      title: 'Pose / Posição',
      field: 'pose',
      type: 'textarea',
      placeholder: 'Ex: Legs spread wide, sitting with knees up to chest, lying on side with one leg bent, bent over showing ass, hands behind head, arching back, etc.',
      rows: 4
    },
    {
      title: 'Ambiente',
      field: 'environment',
      type: 'textarea',
      placeholder: 'Ex: Bright bathroom with white tiles and large mirror, messy bedroom with unmade bed and clothes on floor, dimly lit living room with couch, etc.',
      rows: 4
    },
    {
      title: 'Iluminação',
      field: 'lighting',
      type: 'textarea',
      placeholder: 'Ex: Harsh overhead fluorescent light, soft warm bedside lamp glow, natural sunlight streaming through window, ring light from phone screen, etc.',
      rows: 3
    },
    {
      title: 'Expressão / Atitude',
      field: 'expression',
      type: 'textarea',
      placeholder: 'Ex: Seductive gaze directly at camera, biting lower lip, playful smirk, eyes half-closed, confident smile, looking over shoulder, etc.',
      rows: 3
    },
    { title: 'Proporção', field: 'aspectRatio', options: ASPECT_RATIOS },
    { title: 'Resolução', field: 'resolution', options: RESOLUTIONS },
    { title: 'Formato', field: 'outputFormat', options: OUTPUT_FORMATS },
    { title: 'Qualidade', field: 'quality', options: QUALITY }
  ];

  const currentStep = steps[step];
  const canProceed = currentStep.type ? formData[currentStep.field]?.trim() : formData[currentStep.field] !== null;

  const handleSelect = (value) => {
    setFormData({ ...formData, [currentStep.field]: value });
  };

  const handleTextChange = async (value) => {
    const limitedValue = value.slice(0, 300);
    setFormData({ ...formData, [currentStep.field]: limitedValue });

    if (translationTimeout.current) {
      clearTimeout(translationTimeout.current);
    }

    if (limitedValue.trim() === '') {
      setTranslations({ ...translations, [currentStep.field]: '' });
      return;
    }

    translationTimeout.current = setTimeout(async () => {
      try {
        const translated = await translateToEnglish(limitedValue);
        setTranslations(prev => ({ ...prev, [currentStep.field]: translated }));
      } catch (error) {
        console.error('Translation error:', error);
      }
    }, 1000);
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
      const fieldOrder = ['action', 'attire', 'pose', 'environment', 'lighting', 'expression'];
      const currentFieldIndex = fieldOrder.indexOf(currentStep.field);

      const sceneContext = {};
      for (let i = 0; i < currentFieldIndex; i++) {
        const field = fieldOrder[i];
        if (formData[field]) {
          sceneContext[field] = formData[field];
        }
      }

      const identityProfile = influencer.identity_profile || null;

      const suggestion = await getMorphyHotSuggestion(
        currentStep.field,
        influencer.name,
        influencer.age,
        formData[currentStep.field],
        sceneContext,
        identityProfile
      );
      setFormData({ ...formData, [currentStep.field]: suggestion });

      try {
        const translated = await translateToEnglish(suggestion);
        setTranslations({ ...translations, [currentStep.field]: translated });
      } catch (error) {
        console.error('Translation error:', error);
      }
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
      const scene = {
        scene_context: translations.action || formData.action,
        environment: translations.environment || formData.environment,
        wardrobe: translations.attire || formData.attire,
        action_pose: translations.pose || formData.pose,
        expression_attitude: translations.expression || formData.expression,
        additional_notes: `Lighting: ${translations.lighting || formData.lighting}`
      };

      const camera = {
        capture_type: 'High-quality UGC selfie',
        photographer: 'Self',
        quality: 'high',
        processing: 'natural'
      };

      const prompt = await buildSeedreamPrompt({ influencer, scene, camera });

      handleClose();

      await onGenerate({
        model: 'seedream/4.5-edit',
        prompt,
        aspectRatio: formData.aspectRatio,
        resolution: formData.resolution,
        outputFormat: formData.outputFormat,
        quality: formData.quality
      });
    } catch (error) {
      console.error('Error generating image:', error);
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setGenerating(false);
    setFormData({
      action: '',
      attire: '',
      pose: '',
      environment: '',
      lighting: '',
      expression: '',
      aspectRatio: '9:16',
      resolution: '2K',
      outputFormat: 'png',
      quality: 'high'
    });
    setTranslations({
      action: '',
      attire: '',
      pose: '',
      environment: '',
      lighting: '',
      expression: ''
    });
    if (translationTimeout.current) {
      clearTimeout(translationTimeout.current);
    }
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
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                HOT Mode +18
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="min-h-[300px]">
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              <strong>Identidade Fixa:</strong> As características corporais do influencer (rosto, corpo, marcas) são fixas e não podem ser alteradas. Você controla apenas a cena, pose e interação.
            </p>
          </div>

          {currentStep.type === 'textarea' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentStep.title}
                </label>
                <button
                  onClick={handleMorphySuggest}
                  disabled={loadingSuggestion}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className={`w-4 h-4 ${loadingSuggestion ? 'animate-spin' : ''}`} />
                  {loadingSuggestion ? 'Pensando...' : (formData[currentStep.field]?.trim() ? 'Melhorar com Morphy' : 'Sugerir com Morphy')}
                </button>
              </div>
              <textarea
                value={formData[currentStep.field]}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={currentStep.placeholder}
                rows={currentStep.rows || 8}
                maxLength={300}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white resize-none"
                disabled={loadingSuggestion}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData[currentStep.field]?.length || 0}/300 caracteres
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
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
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
