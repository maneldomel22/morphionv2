import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const lipSyncService = {
  async startLipSync(srcVideoUrl, audioUrl, videoParams = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/start-lipsync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          srcVideoUrl,
          audioUrl,
          videoParams: {
            video_width: videoParams.video_width ?? 0,
            video_height: videoParams.video_height ?? 0,
            video_enhance: videoParams.video_enhance ?? 0,
            fps: videoParams.fps ?? 'original',
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao iniciar LipSync');
      }

      return {
        taskId: data.taskId,
        newportTaskId: data.newportTaskId,
      };
    } catch (error) {
      console.error('Erro ao iniciar LipSync:', error);
      throw error;
    }
  },

  async checkStatus(taskId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/check-lipsync-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao verificar status');
      }

      return {
        status: data.status,
        resultVideoUrl: data.resultVideoUrl,
        errorMessage: data.errorMessage,
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  },

  async getTasks() {
    try {
      const { data, error } = await supabase
        .from('lipsync_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      throw error;
    }
  },

  async getTask(taskId) {
    try {
      const { data, error } = await supabase
        .from('lipsync_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      throw error;
    }
  },

  async uploadFile(file, type = 'video') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const bucket = type === 'video' ? 'lipsync-videos' : 'lipsync-audios';

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  },

  pollStatus(taskId, onUpdate, interval = 5000, maxAttempts = 180) {
    let attempts = 0;
    let pollInterval;

    const poll = async () => {
      try {
        attempts++;
        console.log(`Verificando status do LipSync (tentativa ${attempts}/${maxAttempts})...`);

        const status = await this.checkStatus(taskId);
        onUpdate(status);

        if (status.status === 'completed' || status.status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          return;
        }

        if (attempts >= maxAttempts) {
          console.error('Timeout: número máximo de tentativas atingido');
          onUpdate({
            status: 'failed',
            errorMessage: 'Tempo limite excedido. O vídeo pode ainda estar processando, tente verificar mais tarde.'
          });
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
        if (attempts >= 3) {
          onUpdate({ status: 'failed', errorMessage: error.message });
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      }
    };

    poll();
    pollInterval = setInterval(poll, interval);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  },
};
