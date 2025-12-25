import { supabase } from '../lib/supabase';

export const transcriptionService = {
  async uploadAudioFile(file) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('transcription-audios')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('transcription-audios')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do áudio:', error);
      throw error;
    }
  },

  async createTranscription(audioUrl, speechModels = ['universal']) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: transcription, error: insertError } = await supabase
        .from('transcriptions')
        .insert({
          user_id: user.id,
          audio_url: audioUrl,
          status: 'queued',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke('start-transcription', {
        body: {
          transcriptionId: transcription.id,
          audioUrl: audioUrl,
          speechModels: speechModels,
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('transcriptions')
        .update({
          assembly_id: data.assemblyId,
          status: 'processing',
        })
        .eq('id', transcription.id);

      if (updateError) throw updateError;

      return {
        ...transcription,
        assembly_id: data.assemblyId,
        status: 'processing',
      };
    } catch (error) {
      console.error('Erro ao criar transcrição:', error);
      throw error;
    }
  },

  async checkStatus(transcriptionId) {
    try {
      const { data: transcription, error: fetchError } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();

      if (fetchError) throw fetchError;

      if (!transcription.assembly_id) {
        return {
          status: transcription.status,
          transcription,
        };
      }

      const { data, error } = await supabase.functions.invoke('check-transcription-status', {
        body: {
          assemblyId: transcription.assembly_id,
        },
      });

      if (error) throw error;

      if (data.status === 'completed' || data.status === 'error') {
        const updateData = {
          status: data.status === 'completed' ? 'completed' : 'failed',
          updated_at: new Date().toISOString(),
        };

        if (data.status === 'completed') {
          updateData.text = data.text;
          updateData.language_code = data.languageCode;
          updateData.audio_duration = data.audioDuration;
          updateData.words_count = data.wordsCount;
          updateData.confidence = data.confidence;
          updateData.speech_model_used = data.speechModelUsed;
        } else {
          updateData.error_message = data.errorMessage || 'Erro desconhecido';
        }

        const { error: updateError } = await supabase
          .from('transcriptions')
          .update(updateData)
          .eq('id', transcriptionId);

        if (updateError) throw updateError;

        return {
          status: updateData.status,
          transcription: {
            ...transcription,
            ...updateData,
          },
        };
      }

      return {
        status: data.status,
        transcription,
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  },

  async getTranscriptions() {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar transcrições:', error);
      throw error;
    }
  },

  async getTranscription(transcriptionId) {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao buscar transcrição:', error);
      throw error;
    }
  },

  async deleteTranscription(transcriptionId) {
    try {
      const { error } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar transcrição:', error);
      throw error;
    }
  },

  pollStatus(transcriptionId, onUpdate, interval = 3000, maxAttempts = 200) {
    let attempts = 0;
    let pollInterval;

    const poll = async () => {
      try {
        attempts++;
        console.log(`Verificando status da transcrição (tentativa ${attempts}/${maxAttempts})...`);

        const result = await this.checkStatus(transcriptionId);
        onUpdate(result);

        if (result.status === 'completed' || result.status === 'failed') {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          return;
        }

        if (attempts >= maxAttempts) {
          console.error('Timeout: número máximo de tentativas atingido');
          onUpdate({
            status: 'failed',
            transcription: {
              ...result.transcription,
              error_message: 'Tempo limite excedido. Tente verificar mais tarde.',
            },
          });
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
        if (attempts >= 3) {
          onUpdate({
            status: 'failed',
            transcription: {
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
};
