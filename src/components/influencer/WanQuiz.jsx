import { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ChevronLeft, ChevronRight, Upload, X, Sparkles, Info } from 'lucide-react';
import { PROMPT_LIMITS } from '../../services/wanPromptService';

const STEPS = {
  UPLOAD_IMAGE: 0,
  ACTION_ENVIRONMENT: 1,
  DURATION_RESOLUTION: 2,
};

const STEP_TITLES = {
  [STEPS.UPLOAD_IMAGE]: 'Imagem de Referência',
  [STEPS.ACTION_ENVIRONMENT]: 'Ação e Ambiente',
  [STEPS.DURATION_RESOLUTION]: 'Duração e Resolução',
};

export default function WanQuiz({ onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD_IMAGE);
  const [answers, setAnswers] = useState({
    imageFile: null,
    imagePreview: null,
    actionText: '',
    environmentText: '',
    duration: 5,
    resolution: '720p',
  });

  const updateAnswer = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      updateAnswer('imageFile', file);
      updateAnswer('imagePreview', URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    updateAnswer('imageFile', null);
    updateAnswer('imagePreview', null);
  };

  const canProceed = () => {
    switch (currentStep) {
      case STEPS.UPLOAD_IMAGE:
        return answers.imageFile !== null;
      case STEPS.ACTION_ENVIRONMENT:
        return answers.actionText.trim() !== '' && answers.environmentText.trim() !== '';
      case STEPS.DURATION_RESOLUTION:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.DURATION_RESOLUTION) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > STEPS.UPLOAD_IMAGE) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.UPLOAD_IMAGE:
        return (
          <div className="space-y-4">
            <p className="text-textSecondary mb-6">
              Faça upload de uma imagem que será usada como referência facial.
            </p>

            {answers.imagePreview ? (
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden border border-borderColor">
                <img
                  src={answers.imagePreview}
                  alt="Preview"
                  className="w-full h-auto"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-borderColor rounded-lg cursor-pointer hover:border-brandPrimary transition-colors">
                <Upload size={48} className="text-textTertiary mb-4" />
                <span className="text-textSecondary mb-2">Clique para fazer upload</span>
                <span className="text-textTertiary text-sm">PNG, JPG até 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        );

      case STEPS.ACTION_ENVIRONMENT:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-600 mb-1">Limite de 800 caracteres</h4>
                  <p className="text-sm text-textSecondary">
                    O WAN possui limite técnico de 800 caracteres. O sistema prioriza identidade facial e trunca automaticamente se necessário.
                    Máximo recomendado: Ação {PROMPT_LIMITS.MAX_ACTION_CHARS} chars, Ambiente {PROMPT_LIMITS.MAX_ENV_CHARS} chars.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-2">
                Ação da Cena
              </label>
              <p className="text-xs text-textSecondary mb-3">
                Descreva o que a pessoa está fazendo (ex: "falando para a câmera com entusiasmo sobre um produto", "caminhando devagar enquanto olha para a câmera")
              </p>
              <textarea
                value={answers.actionText}
                onChange={(e) => updateAnswer('actionText', e.target.value)}
                placeholder="Ex: speaking naturally to the camera in a conversational style, maintaining eye contact, smiling authentically"
                rows={4}
                className="w-full px-4 py-3 bg-surfaceMuted border border-borderColor rounded-lg text-textPrimary placeholder-textTertiary focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 focus:border-brandPrimary transition-all resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-textTertiary">
                  {answers.actionText.length} caracteres
                </span>
                {answers.actionText.length > PROMPT_LIMITS.MAX_ACTION_CHARS && (
                  <span className="text-xs text-yellow-600">
                    Texto será truncado para {PROMPT_LIMITS.MAX_ACTION_CHARS} caracteres
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-2">
                Ambiente
              </label>
              <p className="text-xs text-textSecondary mb-3">
                Descreva o ambiente onde a cena acontece (ex: "em casa em uma sala aconchegante", "ao ar livre em uma praia ensolarada")
              </p>
              <textarea
                value={answers.environmentText}
                onChange={(e) => updateAnswer('environmentText', e.target.value)}
                placeholder="Ex: at home in a cozy living room with natural daylight through windows, comfortable furniture"
                rows={4}
                className="w-full px-4 py-3 bg-surfaceMuted border border-borderColor rounded-lg text-textPrimary placeholder-textTertiary focus:outline-none focus:ring-2 focus:ring-brandPrimary/50 focus:border-brandPrimary transition-all resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-textTertiary">
                  {answers.environmentText.length} caracteres
                </span>
                {answers.environmentText.length > PROMPT_LIMITS.MAX_ENV_CHARS && (
                  <span className="text-xs text-yellow-600">
                    Texto será truncado para {PROMPT_LIMITS.MAX_ENV_CHARS} caracteres
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case STEPS.DURATION_RESOLUTION:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-textSecondary mb-4">
                Escolha a duração do vídeo
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateAnswer('duration', 5)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    answers.duration === 5
                      ? 'border-brandPrimary bg-brandPrimary/10'
                      : 'border-borderColor hover:border-brandPrimary/50'
                  }`}
                >
                  <span className="text-2xl font-bold text-textPrimary block mb-1">5s</span>
                  <span className="text-sm text-textSecondary">Curto</span>
                </button>
                <button
                  onClick={() => updateAnswer('duration', 10)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    answers.duration === 10
                      ? 'border-brandPrimary bg-brandPrimary/10'
                      : 'border-borderColor hover:border-brandPrimary/50'
                  }`}
                >
                  <span className="text-2xl font-bold text-textPrimary block mb-1">10s</span>
                  <span className="text-sm text-textSecondary">Médio</span>
                </button>
              </div>
            </div>

            <div>
              <p className="text-textSecondary mb-4">
                Escolha a resolução
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateAnswer('resolution', '720p')}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    answers.resolution === '720p'
                      ? 'border-brandPrimary bg-brandPrimary/10'
                      : 'border-borderColor hover:border-brandPrimary/50'
                  }`}
                >
                  <span className="text-2xl font-bold text-textPrimary block mb-1">720p</span>
                  <span className="text-sm text-textSecondary">HD</span>
                </button>
                <button
                  onClick={() => updateAnswer('resolution', '1080p')}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    answers.resolution === '1080p'
                      ? 'border-brandPrimary bg-brandPrimary/10'
                      : 'border-borderColor hover:border-brandPrimary/50'
                  }`}
                >
                  <span className="text-2xl font-bold text-textPrimary block mb-1">1080p</span>
                  <span className="text-sm text-textSecondary">Full HD</span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brandPrimary/10">
              <Sparkles size={24} className="text-brandPrimary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-textPrimary">{STEP_TITLES[currentStep]}</h2>
              <p className="text-sm text-textSecondary mt-1">
                Etapa {currentStep + 1} de {Object.keys(STEPS).length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Object.keys(STEPS).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-brandPrimary'
                      : index < currentStep
                      ? 'bg-brandPrimary/50'
                      : 'bg-borderColor'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={currentStep === STEPS.UPLOAD_IMAGE ? onCancel : handleBack}
            className="flex-1"
          >
            <ChevronLeft size={18} className="mr-2" />
            {currentStep === STEPS.UPLOAD_IMAGE ? 'Cancelar' : 'Voltar'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            {currentStep === STEPS.DURATION_RESOLUTION ? 'Finalizar' : 'Próximo'}
            {currentStep !== STEPS.DURATION_RESOLUTION && <ChevronRight size={18} className="ml-2" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
