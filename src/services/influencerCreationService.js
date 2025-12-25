import { supabase } from '../lib/supabase';

const statusLabels = {
  creating_video: 'Criando vídeo de apresentação...',
  extracting_frame: 'Extraindo frame de referência...',
  creating_profile_image: 'Gerando foto de perfil...',
  creating_bodymap: 'Gerando mapa corporal...',
  optimizing_identity: 'Otimizando identidade visual...',
  ready: 'Influencer pronta!',
  failed: 'Falha na criação'
};

export const influencerCreationService = {
  async createInfluencerWithIntro(data) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-influencer-with-intro`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar influencer');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating influencer:', error);
      throw error;
    }
  },

  async processIntroVideo(influencerId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-influencer-intro-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ influencer_id: influencerId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao processar vídeo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing intro video:', error);
      throw error;
    }
  },

  async checkCreationStatus(influencerId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-influencer-creation-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ influencer_id: influencerId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao verificar status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking creation status:', error);
      throw error;
    }
  },

  async monitorCreation(influencerId, onProgress) {
    let attempts = 0;
    const maxAttempts = 180;
    const pollInterval = 10000;

    const checkStatus = async () => {
      try {
        const result = await this.checkCreationStatus(influencerId);

        const statusLabel = statusLabels[result.status] || result.status;
        onProgress({
          status: result.status,
          label: statusLabel,
          influencer: result.influencer,
          progress: result.progress
        });

        if (result.status === 'ready') {
          return result.influencer;
        }

        if (result.status === 'failed') {
          throw new Error('Criação falhou');
        }

        if (result.status === 'creating_video') {
          await this.processIntroVideo(influencerId);
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Tempo limite excedido');
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return checkStatus();
      } catch (error) {
        console.error('Error monitoring creation:', error);
        throw error;
      }
    };

    return checkStatus();
  },

  getStatusLabel(status) {
    return statusLabels[status] || status;
  }
};
