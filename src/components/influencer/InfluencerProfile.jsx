import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Grid3x3, Trash2, Loader2, Download, RefreshCw, Flame, Play, Edit2, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { getInfluencerPosts, deleteInfluencerPost, checkPostStatus } from '../../services/influencerPostService';
import { influencerService } from '../../services/influencerService';
import PostDetailModal from './PostDetailModal';
import OptimizedImage from './OptimizedImage';
import CreateContentModal from './CreateContentModal';
import EditInfluencerModal from './EditInfluencerModal';
import { formatIdentityField } from '../../lib/identityFormatter';

export default function InfluencerProfile({ influencer: initialInfluencer, onBack, onCreateContent, refreshKey }) {
  const [influencer, setInfluencer] = useState(initialInfluencer);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageQuiz, setShowImageQuiz] = useState(false);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [showCharacteristics, setShowCharacteristics] = useState(false);

  useEffect(() => {
    setInfluencer(initialInfluencer);
  }, [initialInfluencer]);

  useEffect(() => {
    loadPosts(true);
  }, [influencer.id, refreshKey]);

  useEffect(() => {
    const hasGenerating = posts.some(p => p.status === 'generating');
    if (!hasGenerating) return;

    const interval = setInterval(() => {
      loadPosts();
    }, 5000);

    return () => clearInterval(interval);
  }, [posts]);

  const loadPosts = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad || posts.length === 0) {
        setLoading(true);
      }
      const data = await getInfluencerPosts(influencer.id);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      if (isInitialLoad || posts.length === 0) {
        setLoading(false);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;

    try {
      await deleteInfluencerPost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleDeleteAllFailed = async () => {
    const failedPosts = posts.filter(p => p.status === 'failed');
    if (failedPosts.length === 0) return;

    if (!confirm(`Deseja excluir ${failedPosts.length} post(s) com erro?`)) return;

    try {
      await Promise.all(failedPosts.map(post => deleteInfluencerPost(post.id)));
      setPosts(posts.filter(p => p.status !== 'failed'));
    } catch (error) {
      console.error('Error deleting failed posts:', error);
      alert('Failed to delete posts');
    }
  };

  const handleDeleteAllGenerating = async () => {
    const generatingPosts = posts.filter(p => p.status === 'generating');
    if (generatingPosts.length === 0) return;

    if (!confirm(`Deseja excluir ${generatingPosts.length} post(s) que estão carregando?`)) return;

    try {
      await Promise.all(generatingPosts.map(post => deleteInfluencerPost(post.id)));
      setPosts(posts.filter(p => p.status !== 'generating'));
    } catch (error) {
      console.error('Error deleting generating posts:', error);
      alert('Failed to delete posts');
    }
  };

  const handleCheckStatus = async (postId) => {
    setCheckingStatus(prev => ({ ...prev, [postId]: true }));

    try {
      const result = await checkPostStatus(postId);

      if (result.status === 'completed') {
        await loadPosts();
        alert('Post concluído! A imagem foi atualizada.');
      } else if (result.status === 'failed') {
        await loadPosts();
        alert(`Geração falhou: ${result.error || 'Erro desconhecido'}`);
      } else {
        alert(`Status atual: ${result.status}. Ainda processando...`);
      }
    } catch (error) {
      console.error('Error checking post status:', error);
      alert('Falha ao verificar status: ' + error.message);
    } finally {
      setCheckingStatus(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreateContent = (config) => {
    setShowCreateModal(false);
    onCreateContent(config);
  };

  const handleDeleteInfluencer = async () => {
    const hasCompletedPosts = posts.some(p => p.status === 'completed');

    const confirmMessage = hasCompletedPosts
      ? `ATENÇÃO: Isso irá excluir permanentemente o influencer "${influencer.name}" e TODOS os ${posts.length} posts.\n\nEssa ação não pode ser desfeita!\n\nDigite "${influencer.username}" para confirmar:`
      : `Tem certeza que deseja excluir "${influencer.name}"? Essa ação não pode ser desfeita.`;

    if (hasCompletedPosts) {
      const userInput = prompt(confirmMessage);
      if (userInput !== influencer.username) {
        if (userInput !== null) {
          alert('Confirmação incorreta. Exclusão cancelada.');
        }
        return;
      }
    } else {
      if (!confirm(confirmMessage)) return;
    }

    try {
      await influencerService.deleteInfluencer(influencer.id);
      alert('Influencer excluído com sucesso');
      onBack();
    } catch (error) {
      console.error('Error deleting influencer:', error);
      alert('Falha ao excluir influencer: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 animate-slide-in-left">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          @{influencer.username}
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 animate-scale-in">
        <div className="flex items-center gap-8 mb-6">
          <div className="relative flex-shrink-0 animate-bounce-in">
            <div
              className="w-36 h-36 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-200 dark:ring-gray-700 cursor-pointer transition-all hover:scale-105 hover:ring-blue-500 group"
              onClick={() => setShowFullscreenPhoto(true)}
            >
              <OptimizedImage
                src={influencer.image_url}
                alt={influencer.name}
                className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                aspectRatio="square"
              />
            </div>
            {influencer.mode && (
              <div className={`absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center ${
                influencer.mode === 'hot' ? 'bg-red-500' : 'bg-green-500'
              } shadow-lg border-4 border-white dark:border-gray-800 animate-bounce-in`} style={{ animationDelay: '200ms' }}>
                {influencer.mode === 'hot' ? (
                  <Flame className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-sm font-bold text-white">✓</span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 animate-slide-in-right">
            <div className="flex items-center justify-between mb-5">
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {influencer.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-2">@{influencer.username}</p>

                {influencer.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 max-w-md">
                    {influencer.description}
                  </p>
                )}

                <button
                  onClick={() => setShowCharacteristics(!showCharacteristics)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                >
                  {showCharacteristics ? 'Ocultar características' : 'Ver características'}
                  <ChevronRight className={`w-4 h-4 transition-transform ${showCharacteristics ? 'rotate-90' : ''}`} />
                </button>

                {showCharacteristics && influencer.identity_profile && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Características da Identidade</h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {influencer.identity_profile.face && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Rosto:</span> {formatIdentityField('face', influencer.identity_profile.face)}
                        </div>
                      )}
                      {influencer.identity_profile.body && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Corpo:</span> {formatIdentityField('body', influencer.identity_profile.body)}
                        </div>
                      )}
                      {influencer.identity_profile.skin && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Pele:</span> {formatIdentityField('skin', influencer.identity_profile.skin)}
                        </div>
                      )}
                      {influencer.identity_profile.hair && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Cabelo:</span> {formatIdentityField('hair', influencer.identity_profile.hair)}
                        </div>
                      )}
                      {(influencer.identity_profile.body_marks || influencer.identity_profile.distinctive_marks) && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Marcas distintivas:</span> {formatIdentityField('body_marks', influencer.identity_profile.body_marks || influencer.identity_profile.distinctive_marks)}
                        </div>
                      )}
                      {influencer.identity_profile.style && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Estilo:</span> {formatIdentityField('style', influencer.identity_profile.style)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {influencer.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 max-w-md">
                    {influencer.bio}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteInfluencer}
                  className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  title="Excluir Influencer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Criar Conteúdo
                </button>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{posts.length}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  influencer.mode === 'hot'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                }`}>
                  {influencer.mode === 'hot' ? 'Hot 18+' : 'Safe'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Posts
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {posts.some(p => p.status === 'generating') && (
              <button
                onClick={handleDeleteAllGenerating}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir carregando ({posts.filter(p => p.status === 'generating').length})
              </button>
            )}
            {posts.some(p => p.status === 'failed') && (
              <button
                onClick={handleDeleteAllFailed}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir erros ({posts.filter(p => p.status === 'failed').length})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border-3 border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <Grid3x3 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Compartilhe fotos e vídeos
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use os botões acima para criar seu primeiro post
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => post.status === 'completed' && setSelectedPost(post)}
              >
                {post.status === 'generating' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3">Gerando...</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckStatus(post.id);
                        }}
                        disabled={checkingStatus[post.id]}
                        className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${checkingStatus[post.id] ? 'animate-spin' : ''}`} />
                        {checkingStatus[post.id] ? 'Verificando' : 'Atualizar'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                ) : post.status === 'failed' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 text-center px-2 mb-2">
                      Falha
                    </p>
                    {post.error_message && (
                      <p className="text-xs text-red-500 dark:text-red-500 text-center px-2 mb-3 line-clamp-2">
                        {post.error_message}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                ) : (
                  <>
                    {post.type === 'video' && post.video_url ? (
                      <div className="relative w-full h-full">
                        <OptimizedImage
                          src={post.image_url || post.video_url}
                          alt={post.caption}
                          className="w-full h-full object-cover"
                          aspectRatio="square"
                        />
                        <div className="absolute top-2 right-2">
                          <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" />
                        </div>
                      </div>
                    ) : post.image_url ? (
                      <OptimizedImage
                        src={post.image_url}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                        aspectRatio="square"
                      />
                    ) : null}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {post.image_url && (
                        <a
                          href={post.image_url}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full hover:scale-110 transition-transform"
                        >
                          <Download className="w-4 h-4 text-gray-900 dark:text-white" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        className="p-2.5 bg-white/90 dark:bg-gray-800/90 rounded-full hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    {post.mode === 'hot' && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                        18+
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          influencer={influencer}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onCaptionGenerated={loadPosts}
        />
      )}

      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        influencer={influencer}
        onSubmit={handleCreateContent}
      />

      <EditInfluencerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        influencer={influencer}
        onUpdate={(updated) => {
          setInfluencer(updated);
        }}
        onGenerateNewPhoto={() => {
          setShowEditModal(false);
          setShowImageQuiz(true);
        }}
      />

      {showImageQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gerar Nova Foto de Perfil
              </h2>
              <button
                onClick={() => setShowImageQuiz(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gere uma nova foto para @{influencer.username} e ela será salva automaticamente como opção de foto de perfil.
            </p>
          </div>
        </div>
      )}

      {showFullscreenPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowFullscreenPhoto(false)}
        >
          <button
            onClick={() => setShowFullscreenPhoto(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110 z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div
            className="relative max-w-4xl max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={influencer.image_url}
                alt={influencer.name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />

              {influencer.mode && (
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-full flex items-center gap-2 ${
                  influencer.mode === 'hot' ? 'bg-red-500' : 'bg-green-500'
                } shadow-lg`}>
                  {influencer.mode === 'hot' ? (
                    <>
                      <Flame className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold">Hot 18+</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg text-white">✓</span>
                      <span className="text-white font-semibold">Safe</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-1">
                {influencer.name}
              </h3>
              <p className="text-gray-300">@{influencer.username}</p>
              {influencer.bio && (
                <p className="text-sm text-gray-400 mt-3 max-w-lg mx-auto">
                  {influencer.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
