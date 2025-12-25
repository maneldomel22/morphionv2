import { supabase } from '../lib/supabase';

const TTS_MODELS = {
  HD_2_6: 'speech-2.6-hd',
  TURBO_2_6: 'speech-2.6-turbo',
  HD_02: 'speech-02-hd',
  TURBO_02: 'speech-02-turbo',
};

export const voiceCloneService = {
  async uploadVoiceFile(file, purpose = 'voice_clone') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);

      const { data, error } = await supabase.functions.invoke('upload-voice-file', {
        body: formData,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw error;
    }
  },

  async createVoiceClone(options) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const {
        fileId,
        voiceId,
        voiceName,
        clonePrompt,
        text,
        model = TTS_MODELS.HD_2_6,
        languageBoost,
        needNoiseReduction = false,
        needVolumeNormalization = false,
      } = options;

      const { data: existingVoices, error: countError } = await supabase
        .from('cloned_voices')
        .select('slot')
        .eq('user_id', user.id);

      if (countError) throw countError;

      if (existingVoices && existingVoices.length >= 3) {
        throw new Error('Você já atingiu o limite de 3 vozes clonadas. Delete uma voz existente para clonar uma nova.');
      }

      const usedSlots = existingVoices ? existingVoices.map(v => v.slot) : [];
      const availableSlot = [1, 2, 3].find(slot => !usedSlots.includes(slot)) || 1;

      const { data: voice, error: insertError } = await supabase
        .from('cloned_voices')
        .insert({
          user_id: user.id,
          voice_id: voiceId,
          name: voiceName,
          slot: availableSlot,
          audio_file_id: fileId,
          voice_status: 'processing',
          metadata: {
            clonePrompt,
            languageBoost,
            needNoiseReduction,
            needVolumeNormalization,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke('create-voice-clone', {
        body: {
          fileId,
          voiceId,
          clonePrompt,
          text,
          model,
          languageBoost,
          needNoiseReduction,
          needVolumeNormalization,
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('cloned_voices')
        .update({
          voice_status: 'completed',
          demo_audio_url: data.demoAudio,
          prompt_audio_file_id: clonePrompt?.prompt_audio,
          prompt_text: clonePrompt?.prompt_text,
        })
        .eq('id', voice.id);

      if (updateError) throw updateError;

      return {
        ...voice,
        voice_status: 'completed',
        demo_audio_url: data.demoAudio,
      };
    } catch (error) {
      console.error('Erro ao criar clone de voz:', error);
      throw error;
    }
  },

  async getClonedVoices() {
    try {
      const { data, error } = await supabase
        .from('cloned_voices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vozes clonadas:', error);
      throw error;
    }
  },

  async getClonedVoice(voiceId) {
    try {
      const { data, error } = await supabase
        .from('cloned_voices')
        .select('*')
        .eq('id', voiceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar voz clonada:', error);
      throw error;
    }
  },

  async deleteClonedVoice(voiceId) {
    try {
      const { error } = await supabase
        .from('cloned_voices')
        .delete()
        .eq('id', voiceId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar voz clonada:', error);
      throw error;
    }
  },

  async createTTSTask(options) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const {
        text,
        voiceId,
        model = TTS_MODELS.HD_2_6,
        speed = 1,
        volume = 1,
        pitch = 1,
        audioSampleRate = 32000,
        bitrate = 128000,
        format = 'mp3',
        channel = 2,
      } = options;

      const voiceSettings = voiceId ? {
        voice_id: voiceId,
        speed,
        vol: volume,
        pitch,
      } : undefined;

      const audioSettings = {
        audio_sample_rate: audioSampleRate,
        bitrate,
        format,
        channel,
      };

      const { data: task, error: insertError } = await supabase
        .from('tts_tasks')
        .insert({
          user_id: user.id,
          cloned_voice_id: options.clonedVoiceId,
          model,
          text,
          task_status: 'queued',
          audio_settings: { voiceSettings, audioSettings },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke('create-tts-task', {
        body: {
          model,
          text,
          voiceSettings,
          audioSettings,
          languageBoost: options.languageBoost,
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('tts_tasks')
        .update({
          task_id: data.taskId,
          file_id: data.fileId,
          task_status: 'processing',
          usage_characters: data.usageCharacters,
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      return {
        ...task,
        task_id: data.taskId,
        file_id: data.fileId,
        task_status: 'processing',
        usage_characters: data.usageCharacters,
      };
    } catch (error) {
      console.error('Erro ao criar tarefa TTS:', error);
      throw error;
    }
  },

  async checkTTSTaskStatus(taskDbId) {
    try {
      const { data: task, error: fetchError } = await supabase
        .from('tts_tasks')
        .select('*')
        .eq('id', taskDbId)
        .single();

      if (fetchError) throw fetchError;

      if (!task.task_id) {
        return {
          status: task.task_status,
          task,
        };
      }

      const { data, error } = await supabase.functions.invoke('query-tts-task', {
        body: {
          taskId: task.task_id,
        },
      });

      if (error) throw error;

      const normalizedStatus = data.status === 'success' ? 'completed' : data.status;

      if (data.status === 'success' || data.status === 'completed' || data.status === 'failed' || data.status === 'expired') {
        const updateData = {
          task_status: normalizedStatus,
          updated_at: new Date().toISOString(),
        };

        if ((data.status === 'success' || data.status === 'completed') && data.fileId) {
          updateData.file_id = data.fileId;
        }

        if ((data.status === 'success' || data.status === 'completed') && data.audioUrl) {
          updateData.audio_url = data.audioUrl;
        }

        if (data.status === 'failed') {
          updateData.error_message = data.statusMsg || 'Erro desconhecido';
        }

        const { error: updateError } = await supabase
          .from('tts_tasks')
          .update(updateData)
          .eq('id', taskDbId);

        if (updateError) throw updateError;

        return {
          status: normalizedStatus,
          task: {
            ...task,
            ...updateData,
          },
        };
      }

      return {
        status: normalizedStatus,
        task,
      };
    } catch (error) {
      console.error('Erro ao verificar status da tarefa TTS:', error);
      throw error;
    }
  },

  async getTTSTasks() {
    try {
      const { data, error } = await supabase
        .from('tts_tasks')
        .select('*, cloned_voices(name, voice_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar tarefas TTS:', error);
      throw error;
    }
  },

  async getTTSTask(taskId) {
    try {
      const { data, error } = await supabase
        .from('tts_tasks')
        .select('*, cloned_voices(name, voice_id)')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar tarefa TTS:', error);
      throw error;
    }
  },

  async deleteTTSTask(taskId) {
    try {
      const { error } = await supabase
        .from('tts_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar tarefa TTS:', error);
      throw error;
    }
  },

  async updateCompletedTasks() {
    try {
      const { data, error } = await supabase.functions.invoke('update-completed-tts-tasks', {
        body: {},
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar tarefas concluídas:', error);
      throw error;
    }
  },

  pollTTSStatus(taskId, onUpdate, interval = 3000, maxAttempts = 200) {
    let attempts = 0;
    let pollInterval;

    const poll = async () => {
      try {
        attempts++;
        console.log(`Verificando status TTS (tentativa ${attempts}/${maxAttempts})...`);

        const result = await this.checkTTSTaskStatus(taskId);
        onUpdate(result);

        if (result.status === 'completed' || result.status === 'failed' || result.status === 'expired') {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          return;
        }

        if (attempts >= maxAttempts) {
          console.error('Timeout: número máximo de tentativas atingido');
          onUpdate({
            status: 'expired',
            task: {
              ...result.task,
              error_message: 'Tempo limite excedido',
            },
          });
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Erro no polling TTS:', error);
        if (attempts >= 3) {
          onUpdate({
            status: 'failed',
            task: {
              error_message: error.message,
            },
          });
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

  generateVoiceId(name) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    return `Voice_${cleanName}_${timestamp}_${randomStr}`;
  },
};

export { TTS_MODELS };
