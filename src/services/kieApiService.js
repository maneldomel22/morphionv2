import { supabase } from '../lib/supabase';
import { VIDEO_MODELS, translateWanError } from '../types/videoModels';

export const kieApiService = {
  async generateVideo(projectData) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video-kie`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetails = await response.text();
      }
      throw new Error(`Failed to generate video: ${errorDetails}`);
    }

    const result = await response.json();

    if (!result.success) {
      const errorMsg = result.error || 'Unknown error from API';
      throw new Error(`Video generation failed: ${errorMsg}`);
    }

    if (!result.taskId) {
      throw new Error('No taskId returned from video generation API');
    }

    return result;
  },

  async generateVideoWan(wanData) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video-wan`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(wanData),
    });

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetails = await response.text();
      }
      throw new Error(`Failed to generate video: ${translateWanError(errorDetails)}`);
    }

    const result = await response.json();

    if (!result.success) {
      const errorMsg = result.error || 'Unknown error from API';
      throw new Error(`Video generation failed: ${translateWanError(errorMsg)}`);
    }

    if (!result.taskId) {
      throw new Error('No taskId returned from video generation API');
    }

    return result;
  },

  async checkVideoStatus(taskId) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status?taskId=${taskId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetails = await response.text();
      }
      throw new Error(`Polling failed: ${errorDetails}`);
    }

    const result = await response.json();

    if (!result.success) {
      const errorMsg = result.error || 'Unknown error from status check';
      throw new Error(`Status check failed: ${errorMsg}`);
    }

    return result;
  },

  async checkAllPendingVideos() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-all-pending-videos`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        errorDetails = await response.text();
      }
      throw new Error(`Failed to check pending videos: ${errorDetails}`);
    }

    const result = await response.json();

    if (!result.success) {
      const errorMsg = result.error || 'Unknown error from bulk status check';
      throw new Error(`Bulk status check failed: ${errorMsg}`);
    }

    return result;
  },

  startPolling(taskId, onUpdate, onError, options = {}) {
    const {
      intervalMs = 10000,
      maxAttempts = 180,
      onComplete = null,
    } = options;

    let attempts = 0;
    let intervalId = null;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const poll = async () => {
      attempts++;

      console.log({
        taskId,
        attempt: attempts,
        maxAttempts,
        consecutiveErrors,
      });

      if (attempts > maxAttempts) {
        stopPolling();
        const timeoutError = new Error('Tempo limite excedido para geração do vídeo');
        onError?.(timeoutError);
        return;
      }

      try {
        const result = await this.checkVideoStatus(taskId);
        consecutiveErrors = 0;

        console.log({
          taskId,
          kieState: result.kieState,
          videoStatus: result.video?.status,
        });

        onUpdate(result);

        const videoStatus = result.video?.status;
        const kieState = result.kieState;

        if (videoStatus === 'ready') {
          stopPolling();
          onComplete?.('success', result);
        } else if (videoStatus === 'failed') {
          stopPolling();
          onComplete?.('failed', result);
        } else if (kieState === 'fail') {
          stopPolling();
          onComplete?.('failed', result);
        }

      } catch (error) {
        console.error('Polling error:', error);
        consecutiveErrors++;

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling();
          onError?.(new Error('Muitos erros consecutivos ao verificar status do vídeo'));
        }
      }
    };

    intervalId = setInterval(poll, intervalMs);
    poll();

    return stopPolling;
  },

  subscribeToVideoUpdates(videoId, callback) {
    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async retryFailedVideo(videoId) {
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (error || !video) {
      throw new Error('Video not found');
    }

    if (video.status !== 'failed') {
      throw new Error('Only failed videos can be retried');
    }

    const projectData = {
      videoId: video.id,
      selectedAvatar: video.metadata?.avatar_data || {},
      creativeStyle: { name: video.creative_style },
      dialogue: video.dialogue,
      duration: video.duration,
      aspectRatio: video.aspect_ratio,
      mainEnvironment: video.metadata?.scene_settings?.mainEnvironment || 'indoor setting',
      visibleElements: video.metadata?.scene_settings?.visibleElements || '',
      lighting: video.metadata?.scene_settings?.lighting || 'Natural (janela / luz do dia)',
      framing: video.metadata?.style_settings?.framing || '',
      cameraAngle: video.metadata?.style_settings?.cameraAngle || '',
      movement: video.metadata?.style_settings?.movement || '',
      depthOfField: video.metadata?.style_settings?.depthOfField || '',
      productData: video.metadata?.product_data || null,
    };

    await supabase
      .from('videos')
      .update({
        status: 'queued',
        kie_fail_code: null,
        kie_fail_message: null,
        completed_at: null,
      })
      .eq('id', videoId);

    return this.generateVideo(projectData);
  },
};
