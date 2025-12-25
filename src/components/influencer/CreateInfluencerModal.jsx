import { useState } from 'react';
import Modal from '../ui/Modal';
import CreateInfluencerQuiz from './CreateInfluencerQuiz';
import { influencerService } from '../../services/influencerService';
import { buildInitialInfluencerPrompt } from '../../services/influencerIdentityBuilder';
import { imageService } from '../../services/imageService';
import { translateIdentityProfile } from '../../services/identityTranslationService';

export default function CreateInfluencerModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleComplete = async (quizData) => {
    try {
      setLoading(true);

      const identityProfilePT = {
        face: {
          ethnicity: quizData.ethnicity,
          skin_tone: quizData.skin_tone,
          skin_tone_detail: quizData.skin_tone_detail || '',
          eyes: {
            color: quizData.eye_color,
            shape: quizData.eye_shape
          },
          face_shape: quizData.face_shape,
          nose: quizData.nose,
          lips: quizData.lips,
          base_expression: quizData.base_expression
        },
        hair: {
          color: quizData.hair_color,
          style: quizData.hair_style,
          length: quizData.hair_length,
          texture: quizData.hair_texture
        },
        body: {
          type: quizData.body_type,
          height: quizData.height,
          proportions: quizData.proportions,
          shoulders: quizData.shoulders,
          waist: quizData.waist,
          hips: quizData.hips,
          legs: quizData.legs,
          posture: quizData.posture,
          breast_size: quizData.breast_size,
          vulva_type: quizData.vulva_type
        },
        body_marks: {
          tattoos: quizData.has_tattoos ? quizData.tattoos : [],
          moles: quizData.has_moles ? quizData.moles : [],
          scars: quizData.has_scars ? quizData.scars : []
        }
      };

      const identityProfile = await translateIdentityProfile(identityProfilePT);

      const influencer = await influencerService.createInfluencer({
        name: quizData.name,
        username: quizData.username,
        age: quizData.age,
        style: quizData.style,
        mode: quizData.mode,
        image_url: '',
        identity_profile: identityProfile
      });

      setLoading(false);
      setGeneratingImage(true);

      try {
        const prompt = buildInitialInfluencerPrompt(influencer);

        const { taskId } = await imageService.generateInfluencerImage(
          prompt,
          '16:9',
          '4K',
          'png',
          [],
          influencer.id,
          'nano_banana_pro',
          null
        );

        const result = await imageService.pollImageStatus(taskId);

        if (result?.images?.[0]) {
          const imageUrl = result.images[0];

          await influencerService.updateInfluencer(influencer.id, {
            image_url: imageUrl,
            identity_map_image_url: imageUrl
          });

          influencer.image_url = imageUrl;
          influencer.identity_map_image_url = imageUrl;
        }
      } catch (imageError) {
        console.warn('Failed to generate identity map, but influencer was created:', imageError);
      }

      onSuccess(influencer);
      handleClose();
    } catch (error) {
      console.error('Error creating influencer:', error);
      alert('Falha ao criar influencer. Por favor, tente novamente.');
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Novo Influencer">
      {loading || generatingImage ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {generatingImage ? 'Gerando imagem de perfil...' : 'Criando influencer...'}
          </p>
        </div>
      ) : (
        <CreateInfluencerQuiz
          onComplete={handleComplete}
          onCancel={handleClose}
        />
      )}
    </Modal>
  );
}
