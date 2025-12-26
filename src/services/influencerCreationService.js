import { supabase } from '../lib/supabase';

const statusLabels = {
  creating_video: 'Criando vídeo de apresentação...',
  extracting_frame: 'Extraindo referência do vídeo...',
  optimizing_identity: 'Processando referência...',
  creating_profile_image: 'Gerando foto de perfil...',
  creating_bodymap: 'Gerando mapa corporal...',
  completed: 'Influencer pronta!',
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
    const maxAttempts = 300;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    const startTime = Date.now();
    let lastStatus = null;
    let statusChangeBoost = false;

    const getAdaptiveInterval = (elapsedMinutes) => {
      if (statusChangeBoost) {
        return 2000;
      }

      if (elapsedMinutes < 5) {
        return 3000;
      } else if (elapsedMinutes < 10) {
        return 5000;
      } else {
        return 8000;
      }
    };

    const checkStatus = async () => {
      try {
        const result = await this.checkCreationStatus(influencerId);
        consecutiveErrors = 0;

        if (lastStatus !== null && lastStatus !== result.status) {
          console.log(`Status changed from ${lastStatus} to ${result.status} - activating boost`);
          statusChangeBoost = true;
          setTimeout(() => {
            statusChangeBoost = false;
          }, 15000);
        }
        lastStatus = result.status;

        const statusLabel = statusLabels[result.status] || result.status;
        onProgress({
          status: result.status,
          label: statusLabel,
          influencer: result.influencer,
          progress: result.progress || 0
        });

        if (result.status === 'completed' || result.status === 'ready') {
          return result.influencer;
        }

        if (result.status === 'failed') {
          throw new Error('Criação falhou');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Tempo limite excedido');
        }

        const elapsedMs = Date.now() - startTime;
        const elapsedMinutes = elapsedMs / 60000;
        const pollInterval = getAdaptiveInterval(elapsedMinutes);

        console.log(`Polling in ${pollInterval}ms (elapsed: ${elapsedMinutes.toFixed(1)} min, boost: ${statusChangeBoost})`);

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return checkStatus();
      } catch (error) {
        console.error('Error monitoring creation:', error);
        consecutiveErrors++;

        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error('Muitos erros consecutivos ao verificar status');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }

        const elapsedMs = Date.now() - startTime;
        const elapsedMinutes = elapsedMs / 60000;
        const pollInterval = getAdaptiveInterval(elapsedMinutes);

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return checkStatus();
      }
    };

    return checkStatus();
  },

  getStatusLabel(status) {
    return statusLabels[status] || status;
  }
};
