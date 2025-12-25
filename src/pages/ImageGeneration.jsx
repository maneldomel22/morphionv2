import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ToolInfo from '../components/ui/ToolInfo';
import Badge from '../components/ui/Badge';
import { Sparkles, Download, Upload, X, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { imageService } from '../services/imageService';
import { generatedImagesService } from '../services/generatedImagesService';
import { supabase } from '../lib/supabase';
import { prepareImageForUpload } from '../lib/imageUtils';
import { toolsInfo } from '../data/toolsInfo';
import { IMAGE_ENGINES, IMAGE_ENGINE_CONFIGS } from '../types/imageEngines';

export default function ImageGeneration() {
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [imageEngine, setImageEngine] = useState(IMAGE_ENGINES.NANO_BANANA);
  const [quality, setQuality] = useState('basic');
  const [resolution, setResolution] = useState('2K');
  const [outputFormat, setOutputFormat] = useState('png');
  const [productImage, setProductImage] = useState(null);
  const [characterImage, setCharacterImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [viewingImage, setViewingImage] = useState(null);

  const engineConfig = IMAGE_ENGINE_CONFIGS[imageEngine];

  const productImageInputRef = useRef(null);
  const characterImageInputRef = useRef(null);

  useEffect(() => {
    loadGeneratedImages();
  }, []);

  const loadGeneratedImages = async () => {
    try {
      const images = await generatedImagesService.getUserImages();
      const formattedImages = images.map(img => ({
        id: img.id,
        url: img.image_url,
        prompt: img.prompt,
        aspectRatio: img.aspect_ratio,
        timestamp: img.created_at,
        imageModel: img.image_model,
        generationMode: img.generation_mode
      }));
      setGeneratedImages(formattedImages);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const getLoadingMessages = (engine) => {
    if (engine === IMAGE_ENGINES.SEEDREAM) {
      return [
        'Analisando imagem de referência...',
        'Processando edição realista...',
        'Aplicando transformações...',
        'Mantendo estrutura original...',
        'Gerando resultado final...',
        'Finalizando...'
      ];
    }

    if (engine === IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE) {
      return [
        'Analisando sua descrição...',
        'Gerando imagem realista...',
        'Processando detalhes...',
        'Aplicando qualidade...',
        'Finalizando...'
      ];
    }

    return [
      'Analisando sua descrição...',
      'Montando o prompt visual...',
      'Processando criação...',
      'Gerando sua imagem...',
      'Processando detalhes...',
      'Finalizando...'
    ];
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      const publicUrl = await prepareImageForUpload(file, 'images');

      if (field === 'product') {
        setProductImage(publicUrl);
      } else {
        setCharacterImage(publicUrl);
      }
    } catch (error) {
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      alert('Por favor, descreva a imagem que deseja criar.');
      return;
    }

    if (engineConfig.requiresSourceImage && !productImage && !characterImage) {
      alert(`${engineConfig.name} requer pelo menos uma imagem de referência. Por favor, faça upload de uma imagem.`);
      return;
    }

    if (description.length > engineConfig.maxPromptLength) {
      alert(`O prompt deve ter no máximo ${engineConfig.maxPromptLength} caracteres.`);
      return;
    }

    setGenerating(true);
    const LOADING_MESSAGES = getLoadingMessages(imageEngine);
    let messageIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);

    const messageInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < LOADING_MESSAGES.length) {
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }
    }, 3000);

    try {
      const imageData = {
        description,
        productImage,
        characterImage,
        aspectRatio,
        imageEngine,
        resolution: imageEngine === IMAGE_ENGINES.NANO_BANANA ? resolution : undefined,
        outputFormat: imageEngine === IMAGE_ENGINES.NANO_BANANA ? outputFormat : undefined,
        quality: (imageEngine === IMAGE_ENGINES.SEEDREAM || imageEngine === IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE) ? quality : undefined
      };

      const result = await imageService.generateImage(imageData);

      const finalResult = await imageService.pollImageStatus(result.taskId);

      clearInterval(messageInterval);

      if (finalResult.images && finalResult.images.length > 0) {
        const savedImages = [];

        for (const imageUrl of finalResult.images) {
          const savedImage = await generatedImagesService.saveGeneratedImage({
            imageUrl,
            prompt: description,
            aspectRatio,
            productImageUrl: productImage,
            characterImageUrl: characterImage,
            taskId: result.taskId,
            visualPrompt: result.visualPrompt,
            imageModel: imageEngine,
            kieModel: engineConfig.kieModel,
            generationMode: (productImage || characterImage) ? 'image-to-image' : 'text-to-image',
            sourceImageUrl: productImage || characterImage || null
          });

          savedImages.push({
            id: savedImage.id,
            url: savedImage.image_url,
            prompt: savedImage.prompt,
            aspectRatio: savedImage.aspect_ratio,
            timestamp: savedImage.created_at,
            imageModel: savedImage.image_model,
            generationMode: savedImage.generation_mode
          });
        }

        setGeneratedImages(prev => [...savedImages, ...prev]);
        setHistory(prev => [{
          id: Date.now(),
          prompt: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10));

        setDescription('');
        setProductImage(null);
        setCharacterImage(null);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      clearInterval(messageInterval);
      alert('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setGenerating(false);
      setLoadingMessage('');
    }
  };

  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });

      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image via fetch, opening in new tab:', error);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Gerador de Imagens UGC</h1>
        <ToolInfo tool={toolsInfo.images} icon={ImageIcon} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl">Crie imagens realistas com Morphy Image Engine v2</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Configuração da Imagem</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-textSecondary mb-2">Engine de Geração</label>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setImageEngine(IMAGE_ENGINES.NANO_BANANA)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    imageEngine === IMAGE_ENGINES.NANO_BANANA
                      ? 'border-brandPrimary bg-brandPrimary/5'
                      : 'border-surfaceMuted hover:border-brandPrimary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-textPrimary">
                      {IMAGE_ENGINE_CONFIGS[IMAGE_ENGINES.NANO_BANANA].name}
                    </span>
                    {imageEngine === IMAGE_ENGINES.NANO_BANANA && (
                      <Badge variant="primary">Ativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-textSecondary">
                    {IMAGE_ENGINE_CONFIGS[IMAGE_ENGINES.NANO_BANANA].description}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImageEngine(IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    imageEngine === IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE
                      ? 'border-brandPrimary bg-brandPrimary/5'
                      : 'border-surfaceMuted hover:border-brandPrimary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-textPrimary">
                      {IMAGE_ENGINE_CONFIGS[IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE].name}
                    </span>
                    {imageEngine === IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE && (
                      <Badge variant="primary">Ativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-textSecondary">
                    {IMAGE_ENGINE_CONFIGS[IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE].description}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImageEngine(IMAGE_ENGINES.SEEDREAM)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    imageEngine === IMAGE_ENGINES.SEEDREAM
                      ? 'border-brandPrimary bg-brandPrimary/5'
                      : 'border-surfaceMuted hover:border-brandPrimary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-textPrimary">
                      {IMAGE_ENGINE_CONFIGS[IMAGE_ENGINES.SEEDREAM].name}
                    </span>
                    {imageEngine === IMAGE_ENGINES.SEEDREAM && (
                      <Badge variant="primary">Ativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-textSecondary">
                    {IMAGE_ENGINE_CONFIGS[IMAGE_ENGINES.SEEDREAM].description}
                  </p>
                </button>
              </div>

              {engineConfig.tooltip && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300">{engineConfig.tooltip}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-textSecondary mb-3">
                Descrição da Imagem
                {engineConfig.maxPromptLength && (
                  <span className="text-textTertiary text-xs ml-2">
                    ({description.length}/{engineConfig.maxPromptLength})
                  </span>
                )}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Mulher de 30 anos segurando produto de skincare em ambiente de casa, luz natural..."
                rows={4}
                className="w-full px-4 py-3 bg-surfaceMuted/50 border rounded-xl text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-3">
                  Imagem do Produto {engineConfig.requiresSourceImage ? '(Obrigatório)' : '(Opcional)'}
                  {engineConfig.requiresSourceImage && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                <input
                  ref={productImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'product');
                  }}
                />
                <div
                  onClick={() => !uploadingImage && productImageInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-6 text-center hover:border-brandPrimary/50 transition-colors cursor-pointer"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 size={32} className="text-brandPrimary mx-auto mb-2 animate-spin" strokeWidth={1.5} />
                      <p className="text-textSecondary text-sm">Enviando...</p>
                    </>
                  ) : productImage ? (
                    <>
                      <div className="relative inline-block mb-2">
                        <img src={productImage} alt="Produto" className="w-20 h-20 object-cover rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-textSecondary text-sm">Clique para alterar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-textTertiary mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-textSecondary text-sm">Clique para enviar</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-3">
                  Imagem do Personagem {engineConfig.requiresSourceImage ? '(Obrigatório)' : '(Opcional)'}
                  {engineConfig.requiresSourceImage && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                </label>
                <input
                  ref={characterImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'character');
                  }}
                />
                <div
                  onClick={() => !uploadingImage && characterImageInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-6 text-center hover:border-brandPrimary/50 transition-colors cursor-pointer"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 size={32} className="text-brandPrimary mx-auto mb-2 animate-spin" strokeWidth={1.5} />
                      <p className="text-textSecondary text-sm">Enviando...</p>
                    </>
                  ) : characterImage ? (
                    <>
                      <div className="relative inline-block mb-2">
                        <img src={characterImage} alt="Personagem" className="w-20 h-20 object-cover rounded-lg" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCharacterImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-textSecondary text-sm">Clique para alterar</p>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-textTertiary mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-textSecondary text-sm">Clique para enviar</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-textSecondary mb-3">Proporção</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '1:1', label: 'Quadrado' },
                  { value: '4:5', label: 'Vertical' },
                  { value: '16:9', label: 'Horizontal' }
                ].map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      aspectRatio === ratio.value
                        ? 'bg-brandPrimary text-white'
                        : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
                    }`}
                  >
                    {ratio.label}
                    <div className="text-xs opacity-70 mt-1">{ratio.value}</div>
                  </button>
                ))}
              </div>
            </div>

            {imageEngine === IMAGE_ENGINES.NANO_BANANA && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-3">Resolução</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-3 bg-surfaceMuted/50 border rounded-xl text-textPrimary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  >
                    {engineConfig.resolutions.map((res) => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-3">Formato</label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full px-4 py-3 bg-surfaceMuted/50 border rounded-xl text-textPrimary focus:outline-none focus:border-brandPrimary/50 transition-colors"
                  >
                    {engineConfig.outputFormats.map((format) => (
                      <option key={format} value={format}>{format.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(imageEngine === IMAGE_ENGINES.SEEDREAM || imageEngine === IMAGE_ENGINES.SEEDREAM_TEXT_TO_IMAGE) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-textSecondary mb-3">Qualidade</label>
                <div className="grid grid-cols-2 gap-3">
                  {engineConfig.qualities.map((qual) => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => setQuality(qual)}
                      className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                        quality === qual
                          ? 'bg-brandPrimary text-white'
                          : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
                      }`}
                    >
                      {qual === 'basic' ? 'Básica (2K)' : 'Alta (4K)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating || !description.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Gerar Imagem
                </>
              )}
            </Button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-6">Imagens Geradas</h3>
            {generatedImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon size={48} className="text-textTertiary mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-textSecondary">Suas imagens geradas aparecerão aqui</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img) => {
                  const isEdited = img.generationMode === 'image-to-image';
                  const engineBadge = isEdited ? 'Editada' : 'Criada';
                  const badgeColor = isEdited ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300';

                  return (
                    <div
                      key={img.id}
                      className="relative aspect-square bg-surfaceMuted/30 rounded-xl overflow-hidden border hover:border-brandPrimary/50 transition-colors group cursor-pointer"
                      onClick={() => setViewingImage(img)}
                    >
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${badgeColor}`}>
                          {engineBadge}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(img.url);
                          }}
                          className="text-sm"
                        >
                          <Download size={14} className="mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <h3 className="text-lg font-semibold text-textPrimary mb-6">Histórico</h3>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-textSecondary text-sm">Seu histórico aparecerá aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-surfaceMuted/30 rounded-xl hover:bg-surfaceMuted/50 transition-colors cursor-pointer"
                  >
                    <p className="text-textSecondary text-sm truncate">{item.prompt}</p>
                    <p className="text-textTertiary text-xs mt-1">
                      {new Date(item.timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={viewingImage !== null}
        onClose={() => setViewingImage(null)}
        maxWidth="max-w-4xl"
      >
        {viewingImage && (
          <div className="space-y-4">
            <img
              src={viewingImage.url}
              alt={viewingImage.prompt}
              className="w-full rounded-xl"
            />
            <div className="flex items-start gap-3 pt-2">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {viewingImage.generationMode && (
                    <Badge variant={viewingImage.generationMode === 'image-to-image' ? 'warning' : 'success'}>
                      {viewingImage.generationMode === 'image-to-image' ? 'Imagem Editada' : 'Imagem Criada'}
                    </Badge>
                  )}
                </div>
                <p className="text-textSecondary text-sm">{viewingImage.prompt}</p>
                <p className="text-textTertiary text-xs mt-1">
                  {new Date(viewingImage.timestamp).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Button
                onClick={() => handleDownload(viewingImage.url)}
                className="ml-4"
              >
                <Download size={16} className="mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
