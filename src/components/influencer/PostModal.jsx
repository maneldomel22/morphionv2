import { X, Copy, Download, Trash2, Calendar, Maximize2, User, Sparkles, Flame } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useState } from 'react';

export default function PostModal({ post, onClose, onDelete, influencer }) {
  const [copying, setCopying] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(post?.hashtags || '');

  const handleCopyCaption = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(caption);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Error copying caption:', error);
      setCopying(false);
    }
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
    } catch (error) {
      console.error('Error generating caption:', error);
      alert('Erro ao gerar legenda: ' + error.message);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(post.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `influencer-post-${post.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja deletar este post?')) {
      onDelete(post.id);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAspectRatioLabel = (ratio) => {
    switch (ratio) {
      case '9:16': return 'Story';
      case '1:1': return 'Quadrado';
      case '4:5': return 'Feed';
      default: return ratio;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[90vh] w-full max-w-6xl bg-surface rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex items-center justify-center bg-black p-8">
          <div className="relative rounded-xl overflow-hidden shadow-xl">
            <img
              src={post.image_url}
              alt="Post"
              className={`object-contain ${
                post.aspect_ratio === '9:16'
                  ? 'h-[75vh] w-auto'
                  : post.aspect_ratio === '1:1'
                  ? 'h-[65vh] w-[65vh]'
                  : 'w-[60vw] h-auto max-w-3xl'
              }`}
            />
          </div>
        </div>

        <div className="w-[420px] h-full bg-surface flex flex-col">
          <div className="border-b border-borderColor p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-textPrimary flex-1 pr-3">
                Detalhes do Post
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors text-textSecondary hover:text-textPrimary hover:bg-surfaceMuted/50 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {influencer && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-surfaceMuted/30 rounded-lg border border-borderColor">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brandPrimary/30 flex-shrink-0">
                  {influencer.image_url && influencer.image_url !== 'generating' && influencer.image_url !== 'error' ? (
                    <img
                      src={influencer.image_url}
                      alt={influencer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surfaceMuted flex items-center justify-center">
                      <User size={20} className="text-textTertiary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-textPrimary truncate">{influencer.name}</p>
                  {influencer.username && (
                    <p className="text-xs text-textSecondary">@{influencer.username}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                {getAspectRatioLabel(post.aspect_ratio)}
              </Badge>
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                {post.resolution}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {caption && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-textSecondary">Legenda</h4>
                  <button
                    onClick={handleCopyCaption}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                  >
                    <Copy size={12} />
                    {copying ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <Card className="bg-surfaceMuted/30">
                  <p className="text-textPrimary text-sm leading-relaxed whitespace-pre-wrap">
                    {caption}
                  </p>
                </Card>
              </div>
            )}

            {hashtags && (
              <div>
                <h4 className="text-sm font-semibold text-textSecondary mb-3">Hashtags</h4>
                <Card className="bg-surfaceMuted/30">
                  <p className="text-blue-400 text-sm leading-relaxed">
                    {hashtags}
                  </p>
                </Card>
              </div>
            )}

            {post.prompt && (
              <div>
                <h4 className="text-sm font-semibold text-textSecondary mb-3">Prompt de Geração</h4>
                <Card className="bg-surfaceMuted/30">
                  <p className="text-textPrimary text-sm leading-relaxed">
                    {post.prompt}
                  </p>
                </Card>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-textSecondary mb-3">Informações</h4>
              <Card className="bg-surfaceMuted/30">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-textSecondary" />
                    <span className="text-textSecondary text-xs">Criado em</span>
                    <span className="text-textPrimary font-medium text-xs ml-auto">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize2 size={14} className="text-textSecondary" />
                    <span className="text-textSecondary text-xs">Formato</span>
                    <span className="text-textPrimary font-medium text-xs ml-auto">
                      {post.aspect_ratio}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="border-t border-borderColor p-6 space-y-3 bg-surfaceMuted/20">
            <div>
              <p className="text-xs font-semibold text-textSecondary mb-2">
                {caption ? 'Gerar nova legenda' : 'Gerar legenda'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateCaption('safe')}
                  disabled={generatingCaption}
                  className="flex-1 py-2 px-3 bg-green-500/10 hover:bg-green-500/20 disabled:bg-gray-400/10 text-green-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-green-500/20"
                >
                  <Sparkles className={`w-3 h-3 ${generatingCaption ? 'animate-spin' : ''}`} />
                  {generatingCaption ? 'Gerando...' : 'SAFE'}
                </button>

                <button
                  onClick={() => handleGenerateCaption('hot')}
                  disabled={generatingCaption}
                  className="flex-1 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 disabled:bg-gray-400/10 text-red-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
                >
                  <Flame className={`w-3 h-3 ${generatingCaption ? 'animate-pulse' : ''}`} />
                  {generatingCaption ? 'Gerando...' : 'HOT'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-borderColor/50 space-y-2">
              <Button
                onClick={handleDownload}
                className="w-full"
              >
                <Download size={16} className="mr-2" />
                Download Imagem
              </Button>
              <Button
                variant="secondary"
                onClick={handleDelete}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 size={16} className="mr-2" />
                Deletar Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
