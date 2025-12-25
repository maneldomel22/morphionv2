import { User, Grid3x3, Flame, Trash2 } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

export default function InfluencerCard({ influencer, onSelect, onDelete, index = 0 }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(influencer);
  };

  return (
    <div className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
      <button
        onClick={onSelect}
        className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 group-hover:border-blue-500 dark:group-hover:border-blue-500 hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <div className="p-5 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-blue-500 dark:group-hover:ring-blue-500 group-hover:scale-105 transition-all duration-300">
              {influencer.image_url ? (
                <OptimizedImage
                  src={influencer.image_url}
                  alt={influencer.name}
                  className="w-full h-full object-cover"
                  aspectRatio="square"
                  thumbnail={true}
                  thumbnailSize={160}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <User className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>
            {influencer.mode && (
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                influencer.mode === 'hot'
                  ? 'bg-red-500'
                  : 'bg-green-500'
              } shadow-lg border-2 border-white dark:border-gray-800`}>
                {influencer.mode === 'hot' ? (
                  <Flame className="w-3.5 h-3.5 text-white" />
                ) : (
                  <span className="text-xs font-bold text-white">✓</span>
                )}
              </div>
            )}
          </div>

          <h3 className="font-bold text-base text-gray-900 dark:text-white mb-0.5 truncate w-full">
            {influencer.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate w-full">
            @{influencer.username}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full">
            <Grid3x3 className="w-3.5 h-3.5" />
            <span className="font-semibold">{influencer.post_count || 0}</span>
            <span>posts</span>
          </div>
        </div>
      </button>

      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
        title="Deletar influencer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
