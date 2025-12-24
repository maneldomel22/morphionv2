import { useEffect, useState } from 'react';
import { X, ExternalLink, Grid3x3, Loader2, User, Plus, Layers, Play } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import SensitiveContentWrapper from '../ui/SensitiveContentWrapper';
import { influencerService } from '../../services/influencerService';

export default function InfluencerFeedModal({ isOpen, onClose, influencer, onPostClick, onDeletePost, onCreatePost, onCreateBulkPosts }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && influencer) {
      loadPosts();
    }
  }, [isOpen, influencer]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await influencerService.getInfluencerPosts(influencer.id);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await influencerService.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      if (onDeletePost) {
        onDeletePost(postId);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Erro ao deletar post');
    }
  };

  if (!influencer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-8">
        <div className="flex items-start gap-6 pb-6 border-b border-borderColor">
          <div className="relative flex-shrink-0">
            <SensitiveContentWrapper
              isHot={influencer.mode === 'hot'}
              showWarning={true}
              blurAmount="blur-2xl"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brandPrimary/30">
                {influencer.image_url === 'generating' ? (
                  <div className="w-full h-full bg-brandPrimary/10 flex items-center justify-center">
                    <Loader2 size={48} className="text-brandPrimary animate-spin" />
                  </div>
                ) : influencer.image_url && influencer.image_url !== 'error' ? (
                  <img
                    src={influencer.image_url + '?width=256&height=256&quality=80&format=webp'}
                    alt={influencer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-surfaceMuted flex items-center justify-center">
                    <User size={56} className="text-textTertiary" />
                  </div>
                )}
              </div>
            </SensitiveContentWrapper>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-bold text-textPrimary">{influencer.name}</h2>
              {influencer.age && (
                <span className="text-lg text-textSecondary">• {influencer.age} anos</span>
              )}
            </div>

            {influencer.username && (
              <a
                href={`https://instagram.com/${influencer.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-brandPrimary hover:text-brandPrimary/80 transition-colors flex items-center gap-2 mb-3"
              >
                @{influencer.username}
                <ExternalLink size={16} />
              </a>
            )}

            <div className="flex items-center gap-2 mb-4">
              {influencer.style && (
                <Badge className="bg-surfaceMuted text-textSecondary border-borderColor text-sm px-3 py-1">
                  {influencer.style}
                </Badge>
              )}
              {influencer.mode === 'hot' ? (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-sm px-3 py-1">
                  🔞 Hot
                </Badge>
              ) : (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-sm px-3 py-1">
                  ✓ Safe
                </Badge>
              )}
              <Badge className="bg-brandPrimary/10 text-brandPrimary border-brandPrimary/30 text-sm px-3 py-1">
                Influencer Virtual
              </Badge>
            </div>

            {influencer.bio && (
              <p className="text-base text-textSecondary">{influencer.bio}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Grid3x3 size={24} className="text-textSecondary" />
              <h3 className="text-2xl font-semibold text-textPrimary">
                Posts ({posts.length})
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {onCreatePost && (
                <Button
                  onClick={() => onCreatePost(influencer)}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Plus size={18} />
                  Criar Post
                </Button>
              )}
              {onCreateBulkPosts && (
                <Button
                  onClick={() => onCreateBulkPosts(influencer)}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Layers size={18} />
                  Criar em Massa
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={48} className="animate-spin mx-auto text-brandPrimary mb-4" />
              <p className="text-lg text-textSecondary">Carregando posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center">
              <Grid3x3 size={64} className="mx-auto text-textTertiary mb-4" />
              <p className="text-lg text-textSecondary">Nenhum post ainda</p>
              <p className="text-base text-textTertiary mt-2">
                Gere conteúdo para este influencer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                >
                  {post.type === 'video' ? (
                    <>
                      {post.video_url && (
                        <video
                          src={post.video_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-black/70 group-hover:scale-110 transition-all">
                          <Play size={28} className="text-white ml-1" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={post.image_url}
                      alt={post.caption || 'Post'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
