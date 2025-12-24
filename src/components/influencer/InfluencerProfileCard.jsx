import { useState } from 'react';
import { ExternalLink, Grid3x3, User, ChevronRight, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import SensitiveContentWrapper from '../ui/SensitiveContentWrapper';

export default function InfluencerProfileCard({ influencer, postCount, onViewFeed, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const isGenerating = influencer.image_url === 'generating';
  const hasError = influencer.image_url === 'error';
  const hasValidImage = influencer.image_url && !isGenerating && !hasError;

  return (
    <Card className="overflow-hidden hover:border-brandPrimary/50 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-4 p-4">
          <div className="relative flex-shrink-0">
            <SensitiveContentWrapper
              isHot={influencer.mode === 'hot'}
              showWarning={false}
              blurAmount="blur-lg"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brandPrimary/20">
                {hasValidImage ? (
                  <img
                    src={influencer.image_url + '?width=128&height=128&quality=80&format=webp'}
                    alt={influencer.name}
                    className="w-full h-full object-cover"
                  />
                ) : isGenerating ? (
                  <div className="w-full h-full bg-brandPrimary/10 flex items-center justify-center">
                    <Loader2 size={24} className="text-brandPrimary animate-spin" />
                  </div>
                ) : hasError ? (
                  <div className="w-full h-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle size={24} className="text-red-500" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-surfaceMuted flex items-center justify-center">
                    <User size={32} className="text-textTertiary" />
                  </div>
                )}
              </div>
            </SensitiveContentWrapper>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brandPrimary rounded-full border-2 border-surfaceDefault" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-textPrimary truncate">{influencer.name}</h3>
              {influencer.age && (
                <span className="text-sm text-textSecondary">• {influencer.age} anos</span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              {influencer.username && (
                <a
                  href={`https://instagram.com/${influencer.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-brandPrimary hover:text-brandPrimary/80 transition-colors flex items-center gap-1"
                >
                  @{influencer.username}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {influencer.style && (
                <Badge className="bg-surfaceMuted text-textSecondary border-borderColor text-xs">
                  {influencer.style}
                </Badge>
              )}
              {isGenerating && (
                <Badge className="bg-brandPrimary/10 text-brandPrimary border-brandPrimary/30 text-xs">
                  Gerando imagem...
                </Badge>
              )}
              {hasError && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">
                  Erro na imagem
                </Badge>
              )}
              {!isGenerating && !hasError && (
                <>
                  {influencer.mode === 'hot' ? (
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">
                      🔞 Hot
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                      ✓ Safe
                    </Badge>
                  )}
                  <Badge className="bg-brandPrimary/10 text-brandPrimary border-brandPrimary/30 text-xs">
                    Influencer Virtual
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-textPrimary">{postCount}</div>
              <div className="text-xs text-textSecondary">posts</div>
            </div>
            <ChevronRight
              size={20}
              className={`text-textTertiary transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-borderColor p-4 bg-surfaceMuted/30">
          {influencer.bio && (
            <p className="text-sm text-textSecondary mb-4">{influencer.bio}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewFeed(influencer);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brandPrimary text-white rounded-lg hover:bg-brandPrimary/90 transition-colors"
            >
              <Grid3x3 size={18} />
              Ver Feed Completo
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Tem certeza que deseja deletar ${influencer.name}? Todos os posts também serão removidos.`)) {
                    onDelete(influencer.id);
                  }
                }}
                className="px-4 py-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
