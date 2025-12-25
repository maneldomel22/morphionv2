import { Loader2 } from 'lucide-react';

export function GeneratingImagePlaceholder({ prompt, imageModel }) {
  const engineBadge = imageModel === 'seedream_4_5' ? 'Seedream 4.5' : 'Nano Banana Pro';

  return (
    <div className="relative aspect-square bg-surfaceMuted/30 rounded-xl overflow-hidden border border-brandPrimary/30 group">
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-brandPrimary/20 rounded-full animate-ping" />
          <Loader2 size={48} className="text-brandPrimary animate-spin relative" />
        </div>
        <p className="text-textSecondary text-sm text-center line-clamp-2 px-2">
          {prompt}
        </p>
      </div>

      <div className="absolute top-2 left-2">
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
          Gerando...
        </span>
      </div>

      <div className="absolute top-2 right-2">
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300">
          {engineBadge}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surfaceMuted/50 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brandPrimary to-brandSecondary animate-progress" />
      </div>
    </div>
  );
}
