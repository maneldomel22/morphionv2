import { useEffect, useState } from 'react';
import { Video, Film } from 'lucide-react';

export default function DragPreview({ video, position, isActive }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!mounted || !video) return null;

  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`
          bg-surface/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl
          transition-all duration-200 ease-out
          ${isActive ? 'opacity-100 scale-95' : 'opacity-0 scale-90'}
        `}
        style={{
          width: '280px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-brandPrimary/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-brandPrimary/30">
            {video.thumbnail_url || video.video_url ? (
              <div className="w-full h-full rounded-lg overflow-hidden">
                {video.status === 'ready' && video.video_url ? (
                  <video
                    src={video.video_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full bg-black/30 flex items-center justify-center">
                    <Film size={20} className="text-brandPrimary" />
                  </div>
                )}
              </div>
            ) : (
              <Video size={20} className="text-brandPrimary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-textPrimary font-medium text-sm truncate">
              {truncateText(video.title)}
            </p>
            <p className="text-textSecondary text-xs">
              Movendo criativo...
            </p>
          </div>

          <div className="w-6 h-6 rounded-full bg-brandPrimary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brandPrimary text-xs font-bold">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
