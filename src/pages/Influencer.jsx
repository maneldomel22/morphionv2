import { useState, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import CreateInfluencerModal from '../components/influencer/CreateInfluencerModal';
import SelectInfluencerModal from '../components/influencer/SelectInfluencerModal';
import InfluencerProfile from '../components/influencer/InfluencerProfile';
import InfluencerCard from '../components/influencer/InfluencerCard';
import InfluencerCardSkeleton from '../components/influencer/InfluencerCardSkeleton';
import ContentTypeSelector from '../components/influencer/ContentTypeSelector';
import SafeImageQuiz from '../components/influencer/SafeImageQuiz';
import HotImageQuiz from '../components/influencer/HotImageQuiz';
import VideoQuiz from '../components/influencer/VideoQuiz';
import { influencerService } from '../services/influencerService';
import { createInfluencerImage, createInfluencerVideo } from '../services/influencerGenerationService';
import { supabase } from '../lib/supabase';

export default function Influencer() {
  const [view, setView] = useState('grid');
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [showCreateInfluencerModal, setShowCreateInfluencerModal] = useState(false);
  const [showSelectInfluencerModal, setShowSelectInfluencerModal] = useState(false);
  const [showContentTypeSelector, setShowContentTypeSelector] = useState(false);
  const [showSafeImageQuiz, setShowSafeImageQuiz] = useState(false);
  const [showHotImageQuiz, setShowHotImageQuiz] = useState(false);
  const [showVideoQuiz, setShowVideoQuiz] = useState(false);
  const [contentMode, setContentMode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadInfluencers();
  }, []);

  const loadInfluencers = async () => {
    try {
      setLoading(true);
      const data = await influencerService.getInfluencersWithPostCount();
      setInfluencers(data);
    } catch (error) {
      console.error('Error loading influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = () => {
    if (influencers.length === 0) {
      setShowCreateInfluencerModal(true);
    } else {
      setShowSelectInfluencerModal(true);
    }
  };

  const handleInfluencerCreated = (influencer) => {
    loadInfluencers();
    setSelectedInfluencer(influencer);
    setShowSelectInfluencerModal(false);
    setShowContentTypeSelector(true);
  };

  const handleInfluencerSelected = (influencer) => {
    setSelectedInfluencer(influencer);
    setShowSelectInfluencerModal(false);
    setShowContentTypeSelector(true);
  };

  const handleSelectInfluencer = (influencer) => {
    setSelectedInfluencer(influencer);
    setView('profile');
  };

  const handleBackToGrid = () => {
    setView('grid');
    setSelectedInfluencer(null);
    loadInfluencers();
  };

  const handleContentTypeSelect = ({ type, mode }) => {
    setContentMode(mode);

    if (type === 'image') {
      if (mode === 'safe') {
        setShowSafeImageQuiz(true);
      } else {
        setShowHotImageQuiz(true);
      }
    } else if (type === 'video') {
      setShowVideoQuiz(true);
    }
  };

  const handleGenerateImage = async (config) => {
    if (!selectedInfluencer) {
      console.error('No influencer selected');
      return;
    }

    setGenerating(true);
    setProgress({ status: 'starting', attempts: 0 });

    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;

      await createInfluencerImage({
        influencer: selectedInfluencer,
        model: config.model,
        prompt: config.prompt,
        aspectRatio: config.aspectRatio,
        resolution: config.resolution,
        outputFormat: config.outputFormat,
        quality: config.quality,
        mode: config.model === 'nano-banana-pro' ? 'safe' : 'hot',
        userId,
        onProgress: setProgress
      });

      // Close quizzes and return to profile to show generating post
      setShowSafeImageQuiz(false);
      setShowHotImageQuiz(false);
      setView('profile');
      loadInfluencers();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Erro ao gerar imagem: ' + error.message);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  const handleGenerateVideo = async (config) => {
    if (!selectedInfluencer) {
      console.error('No influencer selected');
      return;
    }

    setGenerating(true);
    setProgress({ status: 'starting', attempts: 0 });

    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;

      await createInfluencerVideo({
        influencer: selectedInfluencer,
        prompt: config.prompt,
        duration: config.duration,
        resolution: config.resolution,
        mode: config.mode,
        userId,
        onProgress: setProgress
      });

      loadInfluencers();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Erro ao gerar vídeo: ' + error.message);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8 animate-slide-in-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Modo Influencer
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Crie e gerencie influencers virtuais
            </p>
          </div>

          {view === 'grid' && (
            <Button onClick={handleCreateContent} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Criar Novo Conteúdo</span>
            </Button>
          )}
        </div>
      </div>

      {generating && progress && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Gerando conteúdo...
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                Status: {progress.status} | Tentativa {progress.attempts}/{progress.maxAttempts || '?'}
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'grid' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <InfluencerCardSkeleton key={i} />
              ))}
            </div>
          ) : influencers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 px-4">
                Nenhum influencer criado ainda
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                Comece criando seu primeiro influencer virtual
              </p>
              <Button onClick={() => setShowCreateInfluencerModal(true)} className="w-full max-w-xs mx-auto sm:w-auto">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Criar Primeiro Influencer</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {influencers.map((influencer, index) => (
                <InfluencerCard
                  key={influencer.id}
                  influencer={influencer}
                  onSelect={() => handleSelectInfluencer(influencer)}
                  index={index}
                />
              ))}

              <button
                onClick={() => setShowCreateInfluencerModal(true)}
                className="group relative aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col items-center justify-center gap-3 cursor-pointer"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-500 dark:group-hover:bg-blue-500 flex items-center justify-center transition-colors duration-300">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  Criar Influencer
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'profile' && selectedInfluencer && (
        <InfluencerProfile
          influencer={selectedInfluencer}
          onBack={handleBackToGrid}
          onCreateContent={(config) => {
            setContentMode(config.mode);
            if (config.type === 'image') {
              if (config.mode === 'safe') {
                setShowSafeImageQuiz(true);
              } else {
                setShowHotImageQuiz(true);
              }
            } else if (config.type === 'video') {
              setShowVideoQuiz(true);
            }
          }}
          refreshKey={refreshKey}
        />
      )}

      <SelectInfluencerModal
        isOpen={showSelectInfluencerModal}
        onClose={() => setShowSelectInfluencerModal(false)}
        influencers={influencers}
        onSelectInfluencer={handleInfluencerSelected}
        onCreateNew={() => {
          setShowSelectInfluencerModal(false);
          setShowCreateInfluencerModal(true);
        }}
      />

      <CreateInfluencerModal
        isOpen={showCreateInfluencerModal}
        onClose={() => setShowCreateInfluencerModal(false)}
        onSuccess={handleInfluencerCreated}
      />

      {selectedInfluencer && (
        <>
          <ContentTypeSelector
            isOpen={showContentTypeSelector}
            onClose={() => setShowContentTypeSelector(false)}
            influencer={selectedInfluencer}
            onSelectType={handleContentTypeSelect}
          />

          <SafeImageQuiz
            isOpen={showSafeImageQuiz}
            onClose={() => setShowSafeImageQuiz(false)}
            influencer={selectedInfluencer}
            onGenerate={handleGenerateImage}
          />

          <HotImageQuiz
            isOpen={showHotImageQuiz}
            onClose={() => setShowHotImageQuiz(false)}
            influencer={selectedInfluencer}
            onGenerate={handleGenerateImage}
          />

          <VideoQuiz
            isOpen={showVideoQuiz}
            onClose={() => setShowVideoQuiz(false)}
            influencer={selectedInfluencer}
            mode={contentMode}
            onGenerate={handleGenerateVideo}
          />
        </>
      )}
    </div>
  );
}
