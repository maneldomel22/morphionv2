import { supabase } from '../lib/supabase';

const statusLabels = {
  creating_video: 'Criando vídeo de apresentação...',
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
      // Query directly from Supabase instead of using custom edge function
      const { data: influencer, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('id', influencerId)
        .maybeSingle();

      if (error) throw error;
      if (!influencer) throw new Error('Influencer não encontrado');

      // Get associated media from generated_images and videos tables
      const { data: profileImage } = await supabase
        .from('generated_images')
        .select('*')
        .eq('influencer_id', influencerId)
        .eq('image_type', 'influencer_profile')
        .maybeSingle();

      const { data: bodymapImage } = await supabase
        .from('generated_images')
        .select('*')
        .eq('influencer_id', influencerId)
        .eq('image_type', 'influencer_bodymap')
        .maybeSingle();

      const { data: presentationVideo } = await supabase
        .from('videos')
        .select('*')
        .eq('influencer_id', influencerId)
        .eq('video_type', 'influencer_presentation')
        .maybeSingle();

      // Determine current status based on media completion
      // Now video and profile are created together, so check both
      let status = 'creating_video';
      let progress = 25;

      const videoReady = presentationVideo?.status === 'ready';
      const profileReady = profileImage?.status === 'completed';

      // Both are being created simultaneously
      if (videoReady && profileReady) {
        // Both complete, now creating bodymap
        status = 'creating_bodymap';
        progress = 65;

        if (bodymapImage?.status === 'completed') {
          status = 'ready';
          progress = 100;
        }
      } else if (videoReady || profileReady) {
        // At least one is ready
        status = 'creating_profile_image';
        progress = 40;
      }

      // Check for failures
      if (presentationVideo?.status === 'failed' ||
          profileImage?.status === 'failed' ||
          bodymapImage?.status === 'failed') {
        status = 'failed';
        progress = 0;
      }

      return {
        success: true,
        status,
        progress,
        influencer,
        media: {
          video: presentationVideo,
          profile: profileImage,
          bodymap: bodymapImage
        }
      };
    } catch (error) {
      console.error('Error checking creation status:', error);
      throw error;
    }
  },

  async triggerMediaUpdate() {
    // Call update-pending-images to check all generating images
    // Call check-all-pending-videos implicitly via individual video status checks
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-pending-images`;
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error('Error triggering media update:', error);
    }
  },

  async monitorCreation(influencerId, onProgress) {
    let attempts = 0;
    const maxAttempts = 180; // Reduced from 300 since we're using existing infrastructure
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    const pollInterval = 10000; // Fixed 10s interval, matching existing infrastructure

    const checkStatus = async () => {
      try {
        // Trigger update-pending-images on each check (like ImageGeneration.jsx does)
        await this.triggerMediaUpdate();

        const result = await this.checkCreationStatus(influencerId);
        consecutiveErrors = 0;

        const statusLabel = statusLabels[result.status] || result.status;
        onProgress({
          status: result.status,
          label: statusLabel,
          influencer: result.influencer,
          progress: result.progress || 0,
          media: result.media
        });

        if (result.status === 'completed' || result.status === 'ready') {
          return result.influencer;
        }

        if (result.status === 'failed') {
          throw new Error('Criação falhou');
        }

        // Trigger bodymap creation when both video and profile are ready
        if (result.status === 'creating_bodymap' && !result.media.bodymap) {
          // Both video and profile are ready, but bodymap not created yet
          console.log('Triggering bodymap creation automatically...');
          try {
            await this.triggerBodymapCreation(influencerId);
          } catch (error) {
            console.error('Failed to trigger bodymap creation:', error);
          }
        }

        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Tempo limite excedido');
        }

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

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return checkStatus();
      }
    };

    return checkStatus();
  },

  async triggerBodymapCreation(influencerId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-profile-image`,
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
        throw new Error(error.error || 'Falha ao criar bodymap');
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering bodymap creation:', error);
      throw error;
    }
  },

  getStatusLabel(status) {
    return statusLabels[status] || status;
  }
};
