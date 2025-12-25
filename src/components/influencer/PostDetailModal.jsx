import { useState } from 'react';
import { Download, Heart, MessageCircle, Send, Bookmark, Sparkles, Flame, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import SensitiveContentWrapper from '../ui/SensitiveContentWrapper';
import { useSafeView } from '../../hooks/useSafeView';

export default function PostDetailModal({ post, influencer, isOpen, onClose, onCaptionGenerated }) {
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(post?.hashtags || '');
  const { safeViewEnabled } = useSafeView();

  if (!post) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = post.image_url || post.video_url;
    link.download = `${influencer?.name || 'post'}_${post.id}.${post.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCaption = async (mode) => {
    setGeneratingCaption(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-post-caption`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            postId: post.id,
            influencer: influencer,
            mode: mode,
            imageUrl: post.image_url
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao gerar legenda');
      }

      const result = await response.json();
      setCaption(result.caption || '');
      setHashtags(result.hashtags || '');
      if (onCaptionGenerated) {
        onCaptionGenerated();
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      alert('Erro ao gerar legenda: ' + error.message);
    } finally {
      setGeneratingCaption(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 bg-black flex items-center justify-center animate-fade-in">
            <SensitiveContentWrapper
              isHot={post.mode === 'hot'}
              showWarning={true}
              blurAmount="blur-3xl"
              className="w-full h-full flex items-center justify-center"
              safeViewEnabled={safeViewEnabled}
            >
              {post.type === 'video' && post.video_url ? (
                <video
                  src={post.video_url}
                  controls
                  className="w-full h-full max-h-[90vh] object-contain"
                />
              ) : (
                <img
                  src={post.image_url}
                  alt={caption}
                  className="w-full h-full max-h-[90vh] object-contain"
                />
              )}
            </SensitiveContentWrapper>
          </div>

          <div className="w-96 flex flex-col bg-white dark:bg-gray-900 animate-slide-in-right">
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                {influencer.image_url && (
                  <img
                    src={influencer.image_url + '?width=80&height=80&quality=80&format=webp'}
                    alt={influencer.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {influencer.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{influencer.username}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {(caption || hashtags) ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {influencer.image_url && (
                          <img
                            src={influencer.image_url + '?width=64&height=64&quality=80&format=webp'}
                            alt={influencer.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold mr-2">{influencer.username}</span>
                          {caption}
                        </p>
                        {hashtags && (
                          <p className="text-sm text-blue-500 mt-2">
                            {hashtags}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Sem legenda ainda
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Gere uma legenda e hashtags para este post
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {caption ? 'Gerar nova legenda' : 'Gerar legenda'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateCaption('safe')}
                      disabled={generatingCaption}
                      className="flex-1 py-2 px-3 bg-green-500/10 hover:bg-green-500/20 disabled:bg-gray-400/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-green-500/20"
                    >
                      <Sparkles className={`w-3 h-3 ${generatingCaption ? 'animate-spin' : ''}`} />
                      {generatingCaption ? 'Gerando...' : 'SAFE'}
                    </button>

                    <button
                      onClick={() => handleGenerateCaption('hot')}
                      disabled={generatingCaption}
                      className="flex-1 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 disabled:bg-gray-400/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
                    >
                      <Flame className={`w-3 h-3 ${generatingCaption ? 'animate-pulse' : ''}`} />
                      {generatingCaption ? 'Gerando...' : 'HOT'}
                    </button>
                  </div>
                </div>
              </div>

              <details className="mt-6 group">
                <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2">
                  Ver detalhes técnicos
                </summary>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo</span>
                    <span className="text-gray-900 dark:text-white capitalize">{post.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modo</span>
                    <span className={post.mode === 'hot' ? 'text-red-500' : 'text-green-500'}>
                      {post.mode}
                    </span>
                  </div>
                  {post.aspect_ratio && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Proporção</span>
                      <span className="text-gray-900 dark:text-white">{post.aspect_ratio}</span>
                    </div>
                  )}
                  {post.resolution && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resolução</span>
                      <span className="text-gray-900 dark:text-white">{post.resolution}</span>
                    </div>
                  )}
                  {post.engine_used && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Engine</span>
                      <span className="text-gray-900 dark:text-white text-xs font-mono">
                        {post.engine_used === 'nano-banana-pro' ? 'Nano Banana Pro' :
                         post.engine_used === 'seedream/4.5-edit' ? 'Seedream Edit' :
                         post.engine_used === 'seedream/4.5-text-to-image' ? 'Seedream T2I' :
                         post.engine_used}
                      </span>
                    </div>
                  )}
                </div>
              </details>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button className="hover:scale-125 transition-all duration-200 hover:text-red-500">
                    <Heart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button className="hover:scale-125 transition-all duration-200">
                    <MessageCircle className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button className="hover:scale-125 transition-all duration-200">
                    <Send className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all hover:scale-110"
                >
                  <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
