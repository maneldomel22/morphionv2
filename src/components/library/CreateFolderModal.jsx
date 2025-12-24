import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const FOLDER_COLORS = [
  '#9A5AE3',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4'
];

export default function CreateFolderModal({ isOpen, onClose, onCreateFolder }) {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      setError('O nome da pasta não pode estar vazio');
      return;
    }

    if (trimmedName.length > 50) {
      setError('O nome da pasta não pode ter mais de 50 caracteres');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreateFolder(trimmedName, selectedColor);
      setFolderName('');
      setSelectedColor(FOLDER_COLORS[0]);
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao criar pasta');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFolderName('');
      setSelectedColor(FOLDER_COLORS[0]);
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Pasta">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            Nome da pasta
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Ex: Campanha Verão 2024"
            className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-white/[0.15] transition-colors"
            disabled={isCreating}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-3">
            Cor da pasta
          </label>
          <div className="grid grid-cols-8 gap-2">
            {FOLDER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  selectedColor === color
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                disabled={isCreating}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            variant="primary"
            className="flex-1"
            disabled={isCreating || !folderName.trim()}
          >
            {isCreating ? 'Criando...' : 'Criar Pasta'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
