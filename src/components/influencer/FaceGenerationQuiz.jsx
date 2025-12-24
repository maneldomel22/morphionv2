import { useState } from 'react';
import Button from '../ui/Button';

const ethnicities = [
  'Caucasiana',
  'Africana',
  'Asiática',
  'Latina',
  'Oriente Médio',
  'Mista'
];

const hairColors = [
  'Loiro',
  'Castanho',
  'Preto',
  'Ruivo',
  'Acobreado',
  'Grisalho'
];

const hairStyles = [
  'Longo e liso',
  'Longo e ondulado',
  'Longo e cacheado',
  'Curto',
  'Chanel',
  'Joãozinho',
  'Trançado',
  'Preso'
];

const eyeColors = [
  'Azuis',
  'Verdes',
  'Castanhos',
  'Mel',
  'Cinzas',
  'Âmbar'
];

export default function FaceGenerationQuiz({ onGenerate, onCancel }) {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    ethnicity: '',
    hairColor: '',
    hairStyle: '',
    eyeColor: ''
  });

  const handleSelect = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onGenerate(selections);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    if (step === 1) return selections.ethnicity;
    if (step === 2) return selections.hairColor;
    if (step === 3) return selections.hairStyle;
    if (step === 4) return selections.eyeColor;
    return false;
  };

  const renderOptions = (options, key) => (
    <div className="grid grid-cols-2 gap-3">
      {options.map(option => (
        <button
          key={option}
          onClick={() => handleSelect(key, option)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selections[key] === option
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <span className="font-medium text-gray-900 dark:text-white">
            {option}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                num === step
                  ? 'bg-blue-500 text-white'
                  : num < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {num}
            </div>
          ))}
        </div>
        <span className="text-sm text-gray-500">Passo {step} de 4</span>
      </div>

      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Selecione Etnia
          </h3>
          {renderOptions(ethnicities, 'ethnicity')}
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Selecione Cor do Cabelo
          </h3>
          {renderOptions(hairColors, 'hairColor')}
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Selecione Estilo do Cabelo
          </h3>
          {renderOptions(hairStyles, 'hairStyle')}
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Selecione Cor dos Olhos
          </h3>
          {renderOptions(eyeColors, 'eyeColor')}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
          className="flex-1"
        >
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1"
        >
          {step === 4 ? 'Gerar Rosto' : 'Próximo'}
        </Button>
      </div>
    </div>
  );
}
