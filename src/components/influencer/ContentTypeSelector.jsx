import { useState } from 'react';
import { Image, Video, Shield, Flame } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function ContentTypeSelector({ isOpen, onClose, influencer, onSelectType }) {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState(null);
  const [contentMode, setContentMode] = useState(null);

  const handleTypeSelect = (type) => {
    setContentType(type);
    setStep(2);
  };

  const handleModeSelect = (mode) => {
    setContentMode(mode);
    onSelectType({ type: contentType, mode });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setContentType(null);
    setContentMode(null);
    onClose();
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setContentType(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              O que você quer criar?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Escolha o tipo de conteúdo para {influencer?.name || 'seu influencer'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelect('image')}
                className="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all group"
              >
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Imagem
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerar foto ou imagem estática
                </p>
              </button>

              <button
                onClick={() => handleTypeSelect('video')}
                className="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all group"
              >
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Vídeo
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerar vídeo curto animado
                </p>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-6">
              <Button variant="outline" size="sm" onClick={handleBack}>
                Voltar
              </Button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Modo do conteúdo?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Escolha o estilo de conteúdo que deseja criar
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleModeSelect('safe')}
                className="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all group"
              >
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  SAFE
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Conteúdo apropriado para todas as idades
                </p>
                {contentType === 'image' && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Engine: nano-banana-pro
                  </p>
                )}
              </button>

              <button
                onClick={() => handleModeSelect('hot')}
                className="p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-400 transition-all group"
              >
                <Flame className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  HOT
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Conteúdo adulto explícito +18
                </p>
                {contentType === 'image' && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Engine: seedream/4.5-edit
                  </p>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
