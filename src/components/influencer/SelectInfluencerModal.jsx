import { Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import InfluencerCard from './InfluencerCard';
import Button from '../ui/Button';

export default function SelectInfluencerModal({ isOpen, onClose, influencers, onSelectInfluencer, onCreateNew }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Escolha um influencer
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Selecione um influencer existente ou crie um novo
        </p>

        <div className="mb-6">
          <button
            onClick={onCreateNew}
            className="w-full p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all group"
          >
            <Plus className="w-12 h-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Criar Novo Influencer
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comece um novo influencer do zero
            </p>
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Influencers Existentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {influencers.map((influencer, index) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                onSelect={() => onSelectInfluencer(influencer)}
                index={index}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
