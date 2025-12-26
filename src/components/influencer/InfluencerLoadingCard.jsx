import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { influencerCreationService } from '../../services/influencerCreationService';

const statusLabels = {
  'creating_video': 'Criando vídeo de apresentação',
  'creating_profile_image': 'Gerando foto de perfil',
  'profile_ready_for_bodymap': 'Preparando bodymap',
  'creating_bodymap': 'Gerando bodymap',
  'ready': 'Concluído',
  'failed': 'Falhou'
};

export default function InfluencerLoadingCard({ influencerId, onComplete, onError, onDelete }) {
  const [status, setStatus] = useState('creating_video');
  const [progress, setProgress] = useState(0);
  const [influencer, setInfluencer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollInterval;

    const checkStatus = async () => {
      try {
        const result = await influencerCreationService.checkCreationStatus(influencerId);

        if (!isMounted) return;

        setStatus(result.status);
        setProgress(result.progress || 0);
        setInfluencer(result.influencer);

        if (result.status === 'ready' || result.status === 'completed') {
          clearInterval(pollInterval);
          onComplete(result.influencer);
        } else if (result.status === 'failed') {
          clearInterval(pollInterval);
          onError?.(new Error('Falha na criação'));
        }
      } catch (error) {
        console.error('Error checking influencer status:', error);
        if (!isMounted) return;

        // Continue polling even on error (might be temporary network issue)
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds
    pollInterval = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [influencerId, onComplete, onError]);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.(influencerId);
    } else {
      setShowDeleteConfirm(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg">
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
            showDeleteConfirm
              ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
              : 'bg-white/80 dark:bg-gray-700/80 hover:bg-red-500 text-gray-600 dark:text-gray-400 hover:text-white'
          }`}
          title={showDeleteConfirm ? 'Clique novamente para confirmar' : 'Cancelar criação'}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Animated shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="relative aspect-[3/4] flex flex-col items-center justify-center p-6">
        {/* Avatar placeholder with spinning ring */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
          <svg
            className="absolute inset-0 w-24 h-24 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-300 dark:text-gray-700"
              opacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${progress * 2.83} 283`}
              className="text-blue-500 transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {influencer?.name || 'Criando...'}
          </h3>
          {showDeleteConfirm ? (
            <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-pulse">
              Clique no X novamente para cancelar
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusLabels[status] || 'Processando...'}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {progress}%
              </div>
            </>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-6">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 rounded-full bg-blue-500"
              style={{
                animation: `pulse 1.5s ease-in-out ${dot * 0.2}s infinite`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
