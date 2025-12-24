import { Loader2, Users } from 'lucide-react';
import InfluencerCard from './InfluencerCard';

export default function InfluencersList({ influencers, loading, onSelectInfluencer }) {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Carregando influencers...</p>
      </div>
    );
  }

  if (influencers.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum influencer ainda
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Crie seu primeiro influencer para começar
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {influencers.map(influencer => (
        <InfluencerCard
          key={influencer.id}
          influencer={influencer}
          onSelect={() => onSelectInfluencer(influencer)}
        />
      ))}
    </div>
  );
}
