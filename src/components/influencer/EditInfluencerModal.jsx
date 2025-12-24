import { useState, useEffect } from 'react';
import { X, Camera, Image, Sparkles, Loader2, Flame } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import OptimizedImage from './OptimizedImage';
import { influencerService } from '../../services/influencerService';
import { getGeneratedImages } from '../../services/generatedImagesService';

export default function EditInfluencerModal({ isOpen, onClose, influencer, onUpdate, onGenerateNewPhoto }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: ''
  });
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);

  useEffect(() => {
    if (influencer) {
      setFormData({
        name: influencer.name || '',
        username: influencer.username || '',
        bio: influencer.bio || ''
      });
      setSelectedPhoto(influencer.image_url);
    }
  }, [influencer]);

  const loadExistingPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const images = await getGeneratedImages();
      const influencerImages = images.filter(img =>
        img.influencer_id === influencer.id &&
        img.image_url
      );
      setExistingPhotos(influencerImages);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleShowPhotoSelector = () => {
    setShowPhotoSelector(true);
    loadExistingPhotos();
  };

  const handleGenerateNew = () => {
    onClose();
    onGenerateNewPhoto();
  };

  const handleGenerateBio = async (mode) => {
    try {
      setGeneratingBio(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-influencer-bio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name || influencer.name,
            username: formData.username || influencer.username,
            age: influencer.age,
            style: influencer.style,
            mode: mode
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate bio');
      }

      const data = await response.json();

      if (data.bio) {
        setFormData({ ...formData, bio: data.bio });
      }
    } catch (error) {
      console.error('Error generating bio:', error);
      alert('Erro ao gerar bio. Tente novamente.');
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = {
        ...formData,
        image_url: selectedPhoto,
        updated_at: new Date().toISOString()
      };

      const updated = await influencerService.updateInfluencer(influencer.id, updates);
      onUpdate(updated);
      onClose();
    } catch (error) {
      console.error('Error updating influencer:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (!influencer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Perfil
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Foto de Perfil
            </label>

            {!showPhotoSelector ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                  <img
                    src={selectedPhoto}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Button
                    onClick={handleShowPhotoSelector}
                    variant="outline"
                    className="w-full"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Escolher Foto Existente
                  </Button>
                  <Button
                    onClick={handleGenerateNew}
                    variant="outline"
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Nova Foto
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selecione uma foto
                  </p>
                  <button
                    onClick={() => setShowPhotoSelector(false)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Voltar
                  </button>
                </div>

                {loadingPhotos ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : existingPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Nenhuma foto encontrada
                    </p>
                    <Button onClick={handleGenerateNew} size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Primeira Foto
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {existingPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          setSelectedPhoto(photo.image_url);
                          setShowPhotoSelector(false);
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          selectedPhoto === photo.image_url
                            ? 'border-blue-500 ring-2 ring-blue-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <OptimizedImage
                          src={photo.image_url}
                          alt="Profile option"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome da influencer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                @
              </span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="flex-1 px-4 py-2 rounded-r-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateBio('safe')}
                  disabled={generatingBio}
                  className="px-3 py-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar Safe
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateBio('hot')}
                  disabled={generatingBio}
                  className="px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Gerar Hot
                </button>
              </div>
            </div>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              disabled={generatingBio}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              placeholder={generatingBio ? "Gerando bio..." : "Escreva uma bio para a influencer..."}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.bio.length} caracteres
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={saving || !formData.name || !formData.username}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
