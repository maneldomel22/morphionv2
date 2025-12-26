import { useState } from 'react';
import Modal from '../ui/Modal';
import CreateInfluencerQuiz from './CreateInfluencerQuiz';
import { influencerCreationService } from '../../services/influencerCreationService';

export default function CreateInfluencerModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');

  const buildIdentityStrings = (quizData) => {
    const facialTraits = [
      quizData.ethnicity,
      `${quizData.skin_tone} skin`,
      `${quizData.eye_color} ${quizData.eye_shape} eyes`,
      `${quizData.face_shape} face shape`,
      `${quizData.nose} nose`,
      `${quizData.lips} lips`,
      `${quizData.base_expression} expression`
    ].filter(Boolean).join(', ');

    const hair = [
      quizData.hair_color,
      quizData.hair_length,
      quizData.hair_texture,
      quizData.hair_style
    ].filter(Boolean).join(' ');

    const body = [
      quizData.body_type,
      quizData.height,
      `${quizData.proportions} proportions`,
      `${quizData.shoulders} shoulders`,
      `${quizData.waist} waist`,
      `${quizData.hips} hips`,
      `${quizData.legs} legs`,
      `${quizData.posture} posture`
    ].filter(Boolean).join(', ');

    const marks = [];
    if (quizData.has_tattoos && quizData.tattoos?.length > 0) {
      marks.push(...quizData.tattoos.map(t => `${t.size} tattoo on ${t.location}`));
    }
    if (quizData.has_moles && quizData.moles?.length > 0) {
      marks.push(...quizData.moles.map(m => `mole on ${m.location}`));
    }
    if (quizData.has_scars && quizData.scars?.length > 0) {
      marks.push(...quizData.scars.map(s => `${s.visibility} scar on ${s.location}`));
    }

    return {
      facialTraits,
      hair,
      body,
      marks: marks.join(', ') || 'No distinctive marks'
    };
  };

  const handleComplete = async (quizData) => {
    try {
      setLoading(true);
      setStatusLabel('Iniciando criação...');

      const identity = buildIdentityStrings(quizData);

      const result = await influencerCreationService.createInfluencerWithIntro({
        name: quizData.name,
        age: quizData.age,
        ethnicity: quizData.ethnicity,
        facialTraits: identity.facialTraits,
        hair: identity.hair,
        body: identity.body,
        marks: identity.marks,
        language: 'pt-BR',
        mode: quizData.mode
      });

      console.log('Influencer creation started:', result);

      // Close modal immediately and let the list handle polling
      onSuccess(result.influencer_id);
      handleClose();
    } catch (error) {
      console.error('Error creating influencer:', error);
      alert('Falha ao criar influencer. Por favor, tente novamente.');
      setLoading(false);
      setStatusLabel('');
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Novo Influencer">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {statusLabel || 'Iniciando...'}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 text-center">
            Este processo pode levar alguns minutos
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
