import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function DeleteInfluencerModal({ isOpen, onClose, influencer, onConfirm }) {
  const [inputName, setInputName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isNameCorrect = inputName === influencer?.name;

  const handleConfirm = async () => {
    if (!isNameCorrect) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting influencer:', error);
      alert('Erro ao deletar influencer: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setInputName('');
    onClose();
  };

  if (!influencer) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Deletar Influencer
            </h2>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Esta ação é irreversível. Todos os posts e conteúdos relacionados a{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {influencer.name}
            </span>{' '}
            serão permanentemente excluídos.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Para confirmar, digite o nome do influencer:
            </p>
            <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 mt-1">
              {influencer.name}
            </p>
          </div>

          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Digite o nome do influencer"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={!isNameCorrect || isDeleting}
          >
            {isDeleting ? (
              'Deletando...'
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
