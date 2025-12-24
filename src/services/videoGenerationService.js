import { supabase } from '../lib/supabase';

const MAX_POLL_ATTEMPTS = 180;
const POLL_INTERVAL_MS = 10000;

export const VIDEO_GENERATION_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  GENERATING: 'generating',
  POLLING: 'polling',
  SUCCESS: 'success',
  ERROR: 'error',
};

export function translateKieError(code, msg) {
  switch (code) {
    case 401:
      return 'Falha de autenticação com o serviço de vídeo.';
    case 402:
      return 'Créditos insuficientes para gerar o vídeo.';
    case 422:
      return 'Configuração inválida do vídeo. Verifique formato e duração.';
    case 429:
      return 'Muitas requisições. Tente novamente em instantes.';
    case 500:
    case 501:
      return 'Erro interno na geração do vídeo. Tente novamente.';
    default:
      return msg || 'Erro inesperado ao gerar o vídeo.';
  }
}

export class VideoGenerationController {
  constructor(callbacks = {}) {
    this.state = VIDEO_GENERATION_STATES.IDLE;
    this.pollAttempts = 0;
    this.maxPollAttempts = MAX_POLL_ATTEMPTS;
    this.timeoutId = null;
    this.taskId = null;
    this.videoId = null;

    this.onStateChange = callbacks.onStateChange || (() => {});
    this.onError = callbacks.onError || (() => {});
    this.onSuccess = callbacks.onSuccess || (() => {});
    this.onPollUpdate = callbacks.onPollUpdate || (() => {});
  }

  getPollProgress() {
    return {
      attempts: this.pollAttempts,
      maxAttempts: this.maxPollAttempts,
    };
  }

  setState(newState) {
    console.log('State transition:', this.state, '->', newState);
    this.state = newState;
    this.onStateChange(newState);
  }

  async generateVideo(kiePayload) {
    try {
      this.setState(VIDEO_GENERATION_STATES.GENERATING);

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
        body: JSON.stringify(kiePayload),
      });

      const result = await response.json();

      console.log('Generate video response:', {
        ok: response.ok,
        status: response.status,
        success: result.success,
        hasTaskId: !!result.taskId,
      });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate video');
      }

      if (!result.success) {
        throw new Error(result.error || 'Video generation failed');
      }

      if (!result.taskId) {
        throw new Error('No taskId returned from video generation API');
      }

      this.taskId = result.taskId;
      this.videoId = kiePayload.videoId;

      await this.logEvent('generation_started', {
        taskId: result.taskId,
        videoId: kiePayload.videoId,
      });

      return result;
    } catch (error) {
      this.setState(VIDEO_GENERATION_STATES.ERROR);
      this.onError(error.message);
      throw error;
    }
  }

  async generateVideoWan(wanPayload) {
    try {
      this.setState(VIDEO_GENERATION_STATES.GENERATING);

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
        body: JSON.stringify(wanPayload),
      });

      const result = await response.json();

      console.log('Generate WAN video response:', {
        ok: response.ok,
        status: response.status,
        success: result.success,
        hasTaskId: !!result.taskId,
      });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate WAN video');
      }

      if (!result.success) {
        throw new Error(result.error || 'WAN video generation failed');
      }

      if (!result.taskId) {
        throw new Error('No taskId returned from WAN video generation API');
      }

      this.taskId = result.taskId;
      this.videoId = wanPayload.videoId;

      await this.logEvent('wan_generation_started', {
        taskId: result.taskId,
        videoId: wanPayload.videoId,
      });

      return result;
    } catch (error) {
      this.setState(VIDEO_GENERATION_STATES.ERROR);
      this.onError(error.message);
      throw error;
    }
  }

  async generateVideoHotWan(hotWanPayload) {
    try {
      this.setState(VIDEO_GENERATION_STATES.GENERATING);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wan-hot-create-task`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(hotWanPayload),
      });

      const result = await response.json();

      console.log('Generate HOT WAN video response:', {
        ok: response.ok,
        status: response.status,
        success: result.success,
        hasTaskId: !!result.taskId,
      });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate HOT WAN video');
      }

      if (!result.success) {
        throw new Error(result.error || 'HOT WAN video generation failed');
      }

      if (!result.taskId) {
        throw new Error('No taskId returned from HOT WAN video generation API');
      }

      this.taskId = result.taskId;
      this.videoId = hotWanPayload.videoId;

      await this.logEvent('hot_wan_generation_started', {
        taskId: result.taskId,
        videoId: hotWanPayload.videoId,
      });

      return result;
    } catch (error) {
      this.setState(VIDEO_GENERATION_STATES.ERROR);
      this.onError(error.message);
      throw error;
    }
  }

  async startPolling(taskId, videoId) {
    this.taskId = taskId;
    this.videoId = videoId;
    this.pollAttempts = 0;

    const result = await this.checkVideoStatus(taskId);

    if (result.video?.status === 'ready' || result.video?.status === 'completed') {
      console.log('Video already ready/completed at polling start');
      this.setState(VIDEO_GENERATION_STATES.SUCCESS);
      this.onSuccess(result.video);
      this.cleanup();
      return;
    }

    if (result.video?.status === 'failed' || result.kieState === 'fail') {
      console.log('Video already failed at polling start');
      this.setState(VIDEO_GENERATION_STATES.ERROR);
      this.onError(result.video?.kie_fail_message || 'Erro ao gerar vídeo');
      this.cleanup();
      return;
    }

    this.setState(VIDEO_GENERATION_STATES.POLLING);
    await this.poll();
  }

  async poll() {
    if (this.state === VIDEO_GENERATION_STATES.ERROR || this.state === VIDEO_GENERATION_STATES.SUCCESS) {
      console.log('Polling stopped: final state reached');
      return;
    }

    this.pollAttempts++;

    console.log('Polling attempt:', {
      attempt: this.pollAttempts,
      maxAttempts: MAX_POLL_ATTEMPTS,
      taskId: this.taskId,
    });

    if (this.pollAttempts > MAX_POLL_ATTEMPTS) {
      this.setState(VIDEO_GENERATION_STATES.ERROR);
      const errorMsg = 'Tempo limite excedido para geração do vídeo';
      this.onError(errorMsg);
      await this.logEvent('timeout_exceeded', {
        attempts: this.pollAttempts,
      });
      return;
    }

    try {
      const result = await this.checkVideoStatus(this.taskId);

      console.log('Poll result:', {
        videoStatus: result.video?.status,
        kieState: result.kieState,
      });

      this.onPollUpdate(result, this.getPollProgress());

      const videoStatus = result.video?.status;
      const kieState = result.kieState;

      if (videoStatus === 'ready' || videoStatus === 'completed') {
        this.setState(VIDEO_GENERATION_STATES.SUCCESS);
        await this.logEvent('video_ready', {
          videoUrl: result.video.video_url,
          attempts: this.pollAttempts,
          finalStatus: videoStatus,
        });
        this.onSuccess(result.video);
        this.cleanup();
        return;
      }

      if (videoStatus === 'failed' || kieState === 'fail') {
        this.setState(VIDEO_GENERATION_STATES.ERROR);
        const errorMsg = result.video?.kie_fail_message || 'Erro ao gerar vídeo';
        await this.logEvent('video_failed', {
          failCode: result.video?.kie_fail_code,
          failMessage: errorMsg,
          attempts: this.pollAttempts,
        });
        this.onError(errorMsg);
        this.cleanup();
        return;
      }

      this.timeoutId = setTimeout(() => this.poll(), POLL_INTERVAL_MS);

    } catch (error) {
      console.error('Polling error:', error);

      if (this.pollAttempts >= 3) {
        this.setState(VIDEO_GENERATION_STATES.ERROR);
        this.onError('Erro ao verificar status do vídeo');
        await this.logEvent('polling_failed', {
          error: error.message,
          attempts: this.pollAttempts,
        });
        this.cleanup();
        return;
      }

      this.timeoutId = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
    }
  }

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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to check video status');
    }

    if (!result.success) {
      throw new Error(result.error || 'Status check failed');
    }

    return result;
  }

  async logEvent(eventType, eventData) {
    if (!this.videoId) return;

    try {
      await supabase
        .from('video_generation_logs')
        .insert({
          video_id: this.videoId,
          kie_task_id: this.taskId,
          event_type: eventType,
          event_data: eventData,
        });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  cancel() {
    console.log('Cancelling video generation');
    this.cleanup();
    this.setState(VIDEO_GENERATION_STATES.IDLE);
  }
}
