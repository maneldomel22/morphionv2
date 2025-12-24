import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Sparkles, Loader2, ArrowLeft, Eye, Video } from 'lucide-react';

export default function GenerateVariationsModal({ video, isOpen, onClose, onGenerate }) {
  const [quantity, setQuantity] = useState(3);
  const [varyDialogue, setVaryDialogue] = useState(true);
  const [varyHook, setVaryHook] = useState(true);
  const [varyCTA, setVaryCTA] = useState(true);
  const [varyGender, setVaryGender] = useState(false);
  const [varyEnvironment, setVaryEnvironment] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('config');
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setViewMode('config');
      setPreviewData(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      const result = await onGenerate({
        videoId: video.id,
        quantity,
        variations: {
          dialogue: varyDialogue,
          hook: varyHook,
          cta: varyCTA,
          gender: varyGender,
          environment: varyEnvironment,
        },
        previewOnly: true,
      });
      setPreviewData(result);
      setViewMode('preview');
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmGeneration = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({
        videoId: video.id,
        variations: previewData.variations,
        previewOnly: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    setViewMode('config');
    setPreviewData(null);
  };

  const extractHook = (dialogue) => {
    const sentences = dialogue.split(/[.!?]+/).filter(s => s.trim());
    return sentences[0]?.trim() || '';
  };

  const extractCTA = (dialogue) => {
    const sentences = dialogue.split(/[.!?]+/).filter(s => s.trim());
    return sentences[sentences.length - 1]?.trim() || '';
  };

  const hasSelectedVariation = varyDialogue || varyHook || varyCTA || varyGender || varyEnvironment;

  if (viewMode === 'preview' && previewData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Preview das Variações">
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
            <p className="text-blue-400 text-sm">
              <Eye size={16} className="inline mr-2" />
              Revise as variações abaixo antes de gerar os vídeos
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {previewData.variations.map((variation, index) => {
              const hook = extractHook(variation.full_dialogue);
              const cta = extractCTA(variation.full_dialogue);

              return (
                <div
                  key={index}
                  className="bg-surfaceMuted/30 p-4 rounded-xl border border-border/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-textPrimary font-semibold">
                      Variação {index + 1}
                    </h4>
                    {variation.changes?.gender && variation.changes.gender !== 'unchanged' && (
                      <span className="text-xs px-2 py-1 bg-brandPrimary/20 text-brandPrimary rounded-full">
                        {variation.changes.gender === 'female' ? 'Feminino' : 'Masculino'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                      <p className="text-green-400 text-xs font-semibold mb-1">HOOK (Início)</p>
                      <p className="text-textSecondary text-sm italic">"{hook}"</p>
                    </div>

                    <div className="bg-surfaceMuted/50 border border-border/30 p-3 rounded-lg">
                      <p className="text-textPrimary text-xs font-semibold mb-1">DIÁLOGO COMPLETO</p>
                      <p className="text-textSecondary text-sm leading-relaxed">
                        "{variation.full_dialogue}"
                      </p>
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
                      <p className="text-orange-400 text-xs font-semibold mb-1">CTA (Final)</p>
                      <p className="text-textSecondary text-sm italic">"{cta}"</p>
                    </div>
                  </div>

                  {variation.notes && (
                    <div className="text-textSecondary text-xs pt-2 border-t border-border/30">
                      <span className="font-semibold">Observações:</span> {variation.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/30">
            <Button
              onClick={handleBack}
              variant="secondary"
              className="flex-1"
              disabled={isGenerating}
            >
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <Button
              onClick={handleConfirmGeneration}
              className="flex-1"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando vídeos...
                </>
              ) : (
                <>
                  <Video size={16} />
                  Gerar {previewData.variations.length} vídeo{previewData.variations.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerar Variações">
      <div className="space-y-6">
        <div className="bg-surfaceMuted/30 p-4 rounded-xl border border-border/30">
          <p className="text-textSecondary text-sm">
            Vídeo original: <span className="text-textPrimary font-medium">{video?.title}</span>
          </p>
          {video?.dialogue && (
            <p className="text-textSecondary text-xs mt-2 italic">
              "{video.dialogue.substring(0, 100)}{video.dialogue.length > 100 ? '...' : ''}"
            </p>
          )}
        </div>

        <div>
          <label className="block text-textPrimary font-semibold text-sm mb-3">
            Quantidade de variações
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 3, 5, 10].map((num) => (
              <button
                key={num}
                onClick={() => setQuantity(num)}
                className={`
                  py-3 px-4 rounded-xl font-medium text-sm transition-all
                  ${quantity === num
                    ? 'bg-brandPrimary text-white shadow-lg shadow-brandPrimary/30'
                    : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted border border-border/30'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-textPrimary font-semibold text-sm mb-3">
            O que variar
          </label>
          <div className="space-y-2.5">
            <label className="flex items-center gap-3 p-3.5 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl border border-border/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={varyDialogue}
                onChange={(e) => setVaryDialogue(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 text-brandPrimary focus:ring-brandPrimary focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-textPrimary font-medium text-sm block">
                  Variar diálogo
                </span>
                <span className="text-textSecondary text-xs">
                  Gerar versões alternativas do texto principal
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl border border-border/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={varyHook}
                onChange={(e) => setVaryHook(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 text-brandPrimary focus:ring-brandPrimary focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-textPrimary font-medium text-sm block">
                  Variar hook (início)
                </span>
                <span className="text-textSecondary text-xs">
                  Criar diferentes ganchos iniciais para capturar atenção
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl border border-border/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={varyCTA}
                onChange={(e) => setVaryCTA(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 text-brandPrimary focus:ring-brandPrimary focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-textPrimary font-medium text-sm block">
                  Variar CTA (final)
                </span>
                <span className="text-textSecondary text-xs">
                  Gerar diferentes chamadas para ação no encerramento
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl border border-border/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={varyGender}
                onChange={(e) => setVaryGender(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 text-brandPrimary focus:ring-brandPrimary focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-textPrimary font-medium text-sm block">
                  Variar gênero do personagem
                </span>
                <span className="text-textSecondary text-xs">
                  Alternar entre masculino e feminino
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-surfaceMuted/30 hover:bg-surfaceMuted/50 rounded-xl border border-border/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={varyEnvironment}
                onChange={(e) => setVaryEnvironment(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 text-brandPrimary focus:ring-brandPrimary focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-textPrimary font-medium text-sm block">
                  Variar ambiente
                </span>
                <span className="text-textSecondary text-xs">
                  Mudar localização e iluminação do cenário
                </span>
              </div>
            </label>
          </div>
        </div>

        {!hasSelectedVariation && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
            <p className="text-yellow-500 text-xs text-center">
              Selecione pelo menos uma opção para variar
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border/30">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePreview}
            className="flex-1"
            disabled={!hasSelectedVariation || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gerando preview...
              </>
            ) : (
              <>
                <Eye size={16} />
                Ver Preview com Morphy
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
