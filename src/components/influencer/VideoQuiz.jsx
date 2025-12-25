import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, Shield, Flame } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { buildIdentityPromptSection } from '../../services/influencerIdentityBuilder';

const MOVEMENTS = [
  { id: 'subtle', label: 'Sutil', description: 'Movimentos sutis e naturais' },
  { id: 'moderate', label: 'Moderado', description: 'Movimentos moderados' },
  { id: 'dynamic', label: 'Dinâmico', description: 'Movimentos dinâmicos' },
  { id: 'intense', label: 'Intenso', description: 'Movimentos intensos' }
];

const CAMERA_ANGLES = [
  { id: 'static', label: 'Estático', description: 'Câmera parada' },
  { id: 'slow-pan', label: 'Pan Lento', description: 'Movimento lento horizontal' },
  { id: 'zoom-in', label: 'Aproximação', description: 'Aproximação gradual' },
  { id: 'handheld', label: 'Manual', description: 'Câmera na mão, orgânico' }
];

const DURATIONS = [
  { id: '5', label: '5 segundos', description: 'Curto e direto' },
  { id: '10', label: '10 segundos', description: 'Médio, mais detalhado' }
];

const RESOLUTIONS = [
  { id: '720p', label: '720p', description: 'HD - Rápido' },
  { id: '1080p', label: '1080p', description: 'Full HD - Alta qualidade' }
];

export default function VideoQuiz({ isOpen, onClose, influencer, mode, onGenerate }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    dialogue: '',
    environment: '',
    movement: null,
    cameraAngle: null,
    duration: '5',
    resolution: '1080p'
  });

  const steps = [
    { title: 'Texto Falado ou Ação', field: 'dialogue', type: 'textarea', placeholder: 'O que o influencer fala ou faz? Seja específico...' },
    { title: 'Ambiente', field: 'environment', type: 'textarea', placeholder: 'Descreva o ambiente, cenário, localização...' },
    { title: 'Tipo de Movimento', field: 'movement', options: MOVEMENTS },
    { title: 'Ângulo de Câmera', field: 'cameraAngle', options: CAMERA_ANGLES },
    { title: 'Duração', field: 'duration', options: DURATIONS },
    { title: 'Resolução', field: 'resolution', options: RESOLUTIONS }
  ];

  const currentStep = steps[step];
  const canProceed = currentStep.type ? formData[currentStep.field]?.trim() : formData[currentStep.field] !== null;

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
      const movementLabel = MOVEMENTS.find(m => m.id === formData.movement)?.label;
      const cameraLabel = CAMERA_ANGLES.find(c => c.id === formData.cameraAngle)?.label;

      const identitySection = buildIdentityPromptSection(influencer.identity_profile);
      let promptText = `${identitySection}

${formData.dialogue}. ${formData.environment}. Movement: ${movementLabel}. Camera: ${cameraLabel}.`;

      if (promptText.length > 1200) {
        console.warn('Prompt exceeds 1200 characters, truncating...');
        promptText = promptText.substring(0, 1200);
      }

      await onGenerate({
        model: 'wan/2-5-image-to-video',
        prompt: promptText,
        duration: formData.duration,
        resolution: formData.resolution,
        mode
      });

      handleClose();
    } catch (error) {
      console.error('Error generating video:', error);
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setGenerating(false);
    setFormData({
      dialogue: '',
      environment: '',
      movement: null,
      cameraAngle: null,
      duration: '5',
      resolution: '1080p'
    });
    onClose();
  };

  const isSafe = mode === 'safe';

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
              {isSafe ? (
                <>
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    SAFE Mode
                  </span>
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    HOT Mode +18
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isSafe ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="min-h-[300px]">
          <div className={`mb-4 p-3 rounded-lg border ${
            isSafe
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <p className={`text-xs ${
              isSafe
                ? 'text-green-800 dark:text-green-200'
                : 'text-orange-800 dark:text-orange-200'
            }`}>
              <strong>Identidade Fixa:</strong> As características físicas do influencer (rosto, corpo, marcas) são preservadas automaticamente. Você controla apenas a ação, diálogo e cenário.
            </p>
          </div>

          {currentStep.type === 'textarea' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {currentStep.title}
              </label>
              <textarea
                value={formData[currentStep.field]}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={currentStep.placeholder}
                rows={8}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 ${
                  isSafe ? 'focus:ring-green-500' : 'focus:ring-orange-500'
                } text-gray-900 dark:text-white resize-none`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Descreva apenas ações e contexto. A identidade física é incluída automaticamente.
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
                      ? `${isSafe ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'}`
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
            {step === steps.length - 1 ? (
              <>
                <Video className="w-4 h-4 mr-2" />
                Gerar Vídeo
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
