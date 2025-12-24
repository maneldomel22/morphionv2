import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { buildNanoBananaPrompt } from '../../services/influencerPromptBuilder';

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

export default function SafeImageQuiz({ isOpen, onClose, influencer, onGenerate }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    photoType: null,
    photographer: null,
    environment: null,
    lighting: null,
    outfit: '',
    expression: '',
    context: '',
    aspectRatio: '9:16',
    resolution: '2K',
    outputFormat: 'png'
  });

  const steps = [
    { title: 'Tipo de Foto', field: 'photoType', options: PHOTO_TYPES },
    { title: 'Quem Tira a Foto', field: 'photographer', options: PHOTOGRAPHERS },
    { title: 'Ambiente', field: 'environment', options: ENVIRONMENTS },
    { title: 'Iluminação', field: 'lighting', options: LIGHTING },
    { title: 'Roupa', field: 'outfit', type: 'text' },
    { title: 'Expressão', field: 'expression', type: 'text' },
    { title: 'Contexto Livre', field: 'context', type: 'textarea' },
    { title: 'Proporção', field: 'aspectRatio', options: ASPECT_RATIOS },
    { title: 'Resolução', field: 'resolution', options: RESOLUTIONS },
    { title: 'Formato', field: 'outputFormat', options: OUTPUT_FORMATS }
  ];

  const currentStep = steps[step];
  const canProceed = currentStep.type ? formData[currentStep.field] : formData[currentStep.field] !== null;

  const handleSelect = (value) => {
    setFormData({ ...formData, [currentStep.field]: value });
  };

  const handleTextChange = (value) => {
    setFormData({ ...formData, [currentStep.field]: value });
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

      await onGenerate({
        model: 'nano-banana-pro',
        prompt,
        aspectRatio: formData.aspectRatio,
        resolution: formData.resolution,
        outputFormat: formData.outputFormat
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
      photoType: null,
      photographer: null,
      environment: null,
      lighting: null,
      outfit: '',
      expression: '',
      context: '',
      aspectRatio: '9:16',
      resolution: '2K',
      outputFormat: 'png'
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
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                A identidade física é preservada automaticamente.
              </p>
            </div>
          )}

          {currentStep.type === 'textarea' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descreva o contexto da foto
              </label>
              <textarea
                value={formData[currentStep.field]}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Ex: Em um café aconchegante, tomando cappuccino, ambiente descontraído..."
                rows={6}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Descreva apenas o contexto e a cena. A identidade física é preservada automaticamente.
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
