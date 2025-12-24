import { useState } from 'react';
import { Image, Video, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { createInfluencerPost } from '../../services/influencerPostService';

export default function CreatePostModal({ isOpen, onClose, influencer, quantity = 1, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });

  const [config, setConfig] = useState({
    type: 'image',
    mode: 'safe',
    quantity
  });

  const [scene, setScene] = useState({
    scene_context: '',
    environment: '',
    wardrobe: '',
    action_pose: '',
    expression_attitude: '',
    additional_notes: ''
  });

  const [camera, setCamera] = useState({
    capture_type: 'selfie',
    photographer: 'self',
    quality: 'high',
    processing: 'natural',
    aspect_ratio: '9:16',
    resolution: '2K',
    duration: '5'
  });

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSceneChange = (field, value) => {
    setScene(prev => ({ ...prev, [field]: value }));
  };

  const handleCameraChange = (field, value) => {
    setCamera(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setProgress({ current: 0, total: config.quantity, status: 'Iniciando...' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      console.log('🎬 Iniciando geração de posts:', {
        quantity: config.quantity,
        type: config.type,
        mode: config.mode
      });

      for (let i = 0; i < config.quantity; i++) {
        setProgress({
          current: i + 1,
          total: config.quantity,
          status: `Criando ${i + 1} de ${config.quantity}...`
        });

        await createInfluencerPost({
          influencer,
          type: config.type,
          mode: config.mode,
          scene,
          camera,
          userId: session.user.id
        });
      }

      console.log('✅ Posts criados, gerando em background');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('❌ Erro ao criar posts:', error);
      alert(`Erro ao criar posts: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  const handleClose = () => {
    setStep(1);
    setConfig({ type: 'image', mode: 'safe', quantity });
    setScene({
      scene_context: '',
      environment: '',
      wardrobe: '',
      action_pose: '',
      expression_attitude: '',
      additional_notes: ''
    });
    setCamera({
      capture_type: 'selfie',
      photographer: 'self',
      quality: 'high',
      processing: 'natural',
      aspect_ratio: '9:16',
      resolution: '2K',
      duration: '5'
    });
    onClose();
  };

  const canProceedStep2 = scene.scene_context && scene.environment && scene.wardrobe && scene.action_pose && scene.expression_attitude;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Criar Post - ${influencer.name}`}
      size="large"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map(num => (
            <div
              key={num}
              className={`flex-1 h-1 rounded-full transition-colors ${
                num <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuração Básica
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleConfigChange('type', 'image')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.type === 'image'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Image className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium text-gray-900 dark:text-white">Imagem</div>
                </button>

                <button
                  onClick={() => handleConfigChange('type', 'video')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.type === 'video'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Video className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium text-gray-900 dark:text-white">Vídeo</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleConfigChange('mode', 'safe')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.mode === 'safe'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Seguro</div>
                  <div className="text-xs text-gray-500 mt-1">Conteúdo familiar</div>
                </button>

                <button
                  onClick={() => handleConfigChange('mode', 'hot')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.mode === 'hot'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Adulto</div>
                  <div className="text-xs text-gray-500 mt-1">Conteúdo adulto</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Descrição da Cena
            </h3>
            <p className="text-sm text-gray-500">
              Descreva a cena exatamente como você quer. Nenhuma interpretação de IA será adicionada.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contexto da Cena
              </label>
              <textarea
                value={scene.scene_context}
                onChange={(e) => handleSceneChange('scene_context', e.target.value)}
                placeholder="Descreva a cena..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ambiente
              </label>
              <input
                type="text"
                value={scene.environment}
                onChange={(e) => handleSceneChange('environment', e.target.value)}
                placeholder="Ex: Quarto moderno com iluminação suave"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Roupa
              </label>
              <input
                type="text"
                value={scene.wardrobe}
                onChange={(e) => handleSceneChange('wardrobe', e.target.value)}
                placeholder="Ex: Top branco e shorts jeans"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ação / Pose
              </label>
              <input
                type="text"
                value={scene.action_pose}
                onChange={(e) => handleSceneChange('action_pose', e.target.value)}
                placeholder="Ex: Tirando uma selfie casual deitada na cama"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expressão / Atitude
              </label>
              <input
                type="text"
                value={scene.expression_attitude}
                onChange={(e) => handleSceneChange('expression_attitude', e.target.value)}
                placeholder="Ex: Sorriso relaxado, natural e confiante"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas Adicionais (Opcional)
              </label>
              <textarea
                value={scene.additional_notes}
                onChange={(e) => handleSceneChange('additional_notes', e.target.value)}
                placeholder="Outros detalhes..."
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Câmera e Estética
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Captura
                </label>
                <select
                  value={camera.capture_type}
                  onChange={(e) => handleCameraChange('capture_type', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="selfie">Selfie</option>
                  <option value="candid">Espontâneo</option>
                  <option value="pov">POV</option>
                  <option value="tripod">Tripé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fotógrafo
                </label>
                <select
                  value={camera.photographer}
                  onChange={(e) => handleCameraChange('photographer', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="self">Própria pessoa</option>
                  <option value="third_person">Terceira pessoa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Qualidade da Imagem
                </label>
                <select
                  value={camera.quality}
                  onChange={(e) => handleCameraChange('quality', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="high">Alta Qualidade</option>
                  <option value="standard">Qualidade Padrão</option>
                  <option value="basic">Qualidade Básica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Processamento
                </label>
                <select
                  value={camera.processing}
                  onChange={(e) => handleCameraChange('processing', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="natural">Natural</option>
                  <option value="enhanced">Melhorado</option>
                  <option value="minimal">Mínimo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proporção
                </label>
                <select
                  value={camera.aspect_ratio}
                  onChange={(e) => handleCameraChange('aspect_ratio', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="9:16">9:16 (Story)</option>
                  <option value="4:5">4:5 (Feed)</option>
                  <option value="1:1">1:1 (Quadrado)</option>
                  <option value="16:9">16:9 (Paisagem)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolução
                </label>
                <select
                  value={camera.resolution}
                  onChange={(e) => handleCameraChange('resolution', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            </div>

            {config.type === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duração (segundos)
                </label>
                <select
                  value={camera.duration}
                  onChange={(e) => handleCameraChange('duration', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="5">5 segundos</option>
                  <option value="10">10 segundos</option>
                </select>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Confirmação
            </h3>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{config.type === 'image' ? 'Imagem' : 'Vídeo'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Modo:</span>
                <span className={`font-medium capitalize ${config.mode === 'hot' ? 'text-red-500' : 'text-green-500'}`}>
                  {config.mode === 'safe' ? 'Seguro' : 'Adulto'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Quantidade:</span>
                <span className="font-medium text-gray-900 dark:text-white">{config.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Proporção:</span>
                <span className="font-medium text-gray-900 dark:text-white">{camera.aspect_ratio}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Resolução:</span>
                <span className="font-medium text-gray-900 dark:text-white">{camera.resolution}</span>
              </div>
            </div>

            {loading && progress.status && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {progress.status}
                    </p>
                    <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Pronto para gerar {config.quantity} {config.type === 'image' ? 'imagem' : 'vídeo'}(s) no modo {config.mode === 'safe' ? 'seguro' : 'adulto'}.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
            className="flex-1"
            disabled={loading}
          >
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={(step === 2 && !canProceedStep2) || loading}
              className="flex-1"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando...</span>
                </div>
              ) : (
                `Gerar ${config.quantity > 1 ? `${config.quantity} Posts` : 'Post'}`
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
