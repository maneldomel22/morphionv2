import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, Settings } from 'lucide-react';

export default function SensitiveContentWrapper({
  children,
  isHot = false,
  showWarning = true,
  className = '',
  blurAmount = 'blur-2xl',
  safeViewEnabled = true
}) {
  const [revealed, setRevealed] = useState(false);

  if (!isHot || !safeViewEnabled) {
    return children;
  }

  return (
    <div className={`relative ${className}`}>
      <div className={revealed ? '' : blurAmount}>
        {children}
      </div>

      {!revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mb-2 px-3 py-1.5 bg-blue-500/90 text-white rounded-lg text-xs flex items-center gap-1.5 shadow-lg">
            <Settings className="w-3.5 h-3.5" />
            <span>Desativar em Configurações → Privacidade → Safe View</span>
          </div>

          {showWarning && (
            <div className="mb-3 px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>18+</span>
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(true);
            }}
            className="px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
          >
            <Eye className="w-4 h-4" />
            Revelar Conteúdo
          </button>
        </div>
      )}

      {revealed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRevealed(false);
          }}
          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110 shadow-lg z-10"
          title="Ocultar conteúdo"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
