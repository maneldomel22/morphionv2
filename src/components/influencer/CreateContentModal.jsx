import { useState } from 'react';
import { Image, Video, Sparkles, Flame } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function CreateContentModal({ isOpen, onClose, influencer, onSubmit }) {
  const [contentType, setContentType] = useState('image');
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState('safe');

  const handleSubmit = () => {
    onSubmit({
      type: contentType,
      quantity,
      mode
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Criar Conteúdo
          </h2>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            {influencer.image_url && (
              <img
                src={influencer.image_url + '?width=96&height=96&quality=80&format=webp'}
                alt={influencer.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{influencer.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{influencer.username}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Tipo de Conteúdo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setContentType('image')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  contentType === 'image'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Image className={`w-8 h-8 mx-auto mb-2 ${
                  contentType === 'image' ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  contentType === 'image' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Imagem
                </p>
              </button>

              <button
                onClick={() => setContentType('video')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  contentType === 'video'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Video className={`w-8 h-8 mx-auto mb-2 ${
                  contentType === 'video' ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  contentType === 'video' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Vídeo
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quantidade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuantity(num)}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    quantity === num
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Modo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('safe')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'safe'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Sparkles className={`w-6 h-6 mx-auto mb-2 ${
                  mode === 'safe' ? 'text-green-500' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  mode === 'safe' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Safe
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Conteúdo geral
                </p>
              </button>

              <button
                onClick={() => setMode('hot')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'hot'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Flame className={`w-6 h-6 mx-auto mb-2 ${
                  mode === 'hot' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  mode === 'hot' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Hot
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Adulto 18+
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
          >
            Criar {quantity} {quantity === 1 ? 'Post' : 'Posts'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
