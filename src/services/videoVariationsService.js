import { supabase } from '../lib/supabase';

export const videoVariationsService = {
  async previewVariations({ videoId, quantity, variations }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const { data: originalVideo, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (videoError || !originalVideo) {
      throw new Error('Vídeo original não encontrado');
    }

    const context = {
      originalDialogue: originalVideo.dialogue,
      creativeStyle: originalVideo.creative_style,
      avatarName: originalVideo.avatar_name,
      avatarGender: originalVideo.avatar_gender,
      environment: {
        location: originalVideo.metadata?.scene_settings?.location,
        lighting: originalVideo.metadata?.scene_settings?.lighting,
      },
      product: originalVideo.metadata?.product_data,
      variations,
      quantity,
    };

    console.log('Requesting variations preview from Morphy:', context);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-generate-variations`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(context),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao gerar variações');
    }

    if (!result.variations || !Array.isArray(result.variations)) {
      throw new Error('Resposta inválida do Morphy');
    }

    console.log(`Morphy gerou ${result.variations.length} variações para preview`);

    return {
      variations: result.variations,
      originalVideo,
    };
  },

  async generateVariations({ videoId, quantity, variations }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const { data: originalVideo, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (videoError || !originalVideo) {
      throw new Error('Vídeo original não encontrado');
    }

    const context = {
      originalDialogue: originalVideo.dialogue,
      creativeStyle: originalVideo.creative_style,
      avatarName: originalVideo.avatar_name,
      avatarGender: originalVideo.avatar_gender,
      environment: {
        location: originalVideo.metadata?.scene_settings?.location,
        lighting: originalVideo.metadata?.scene_settings?.lighting,
      },
      product: originalVideo.metadata?.product_data,
      variations,
      quantity,
    };

    console.log('Requesting variations from Morphy:', context);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-generate-variations`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(context),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao gerar variações');
    }

    if (!result.variations || !Array.isArray(result.variations)) {
      throw new Error('Resposta inválida do Morphy');
    }

    console.log(`Morphy gerou ${result.variations.length} variações`);

    const createdVideos = [];

    for (let i = 0; i < result.variations.length; i++) {
      const variation = result.variations[i];

      const newGender = variation.changes?.gender === 'unchanged'
        ? originalVideo.avatar_gender
        : (variation.changes?.gender || originalVideo.avatar_gender);

      const newLocation = variation.changes?.environment?.location === 'unchanged'
        ? originalVideo.metadata?.scene_settings?.location
        : (variation.changes?.environment?.location || originalVideo.metadata?.scene_settings?.location);

      const newLighting = variation.changes?.environment?.lighting === 'unchanged'
        ? originalVideo.metadata?.scene_settings?.lighting
        : (variation.changes?.environment?.lighting || originalVideo.metadata?.scene_settings?.lighting);

      const newMetadata = {
        ...originalVideo.metadata,
        scene_settings: {
          ...originalVideo.metadata?.scene_settings,
          location: newLocation,
          lighting: newLighting,
        },
        variation_info: {
          original_video_id: videoId,
          variation_number: i + 1,
          morphy_notes: variation.notes,
        },
      };

      const newVideoData = {
        user_id: originalVideo.user_id,
        title: `${originalVideo.title} - Variação ${i + 1}`,
        status: 'pending',
        avatar_name: originalVideo.avatar_name,
        avatar_gender: newGender,
        duration: originalVideo.duration,
        aspect_ratio: originalVideo.aspect_ratio,
        creative_style: originalVideo.creative_style,
        dialogue: variation.full_dialogue,
        credits_used: 0,
        metadata: newMetadata,
        source_mode: 'variation',
        folder_id: originalVideo.folder_id,
      };

      console.log(`Criando vídeo ${i + 1}/${result.variations.length}:`, {
        title: newVideoData.title,
        dialogue_preview: newVideoData.dialogue.substring(0, 50),
        gender: newVideoData.avatar_gender,
        location: newLocation,
      });

      const { data: newVideo, error: createError } = await supabase
        .from('videos')
        .insert(newVideoData)
        .select()
        .single();

      if (createError) {
        console.error(`Erro ao criar vídeo ${i + 1}:`, createError);
        throw new Error(`Erro ao criar variação ${i + 1}`);
      }

      createdVideos.push(newVideo);
    }

    console.log(`${createdVideos.length} vídeos criados, enviando para geração...`);

    for (const video of createdVideos) {
      try {
        await this.sendToGeneration(video, originalVideo);
      } catch (error) {
        console.error(`Erro ao enviar vídeo ${video.id} para geração:`, error);

        await supabase
          .from('videos')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', video.id);
      }
    }

    return {
      success: true,
      createdCount: createdVideos.length,
      videos: createdVideos,
    };
  },

  async createVideosFromVariations({ videoId, variations }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const { data: originalVideo, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (videoError || !originalVideo) {
      throw new Error('Vídeo original não encontrado');
    }

    const createdVideos = [];

    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];

      const newGender = variation.changes?.gender === 'unchanged'
        ? originalVideo.avatar_gender
        : (variation.changes?.gender || originalVideo.avatar_gender);

      const newLocation = variation.changes?.environment?.location === 'unchanged'
        ? originalVideo.metadata?.scene_settings?.location
        : (variation.changes?.environment?.location || originalVideo.metadata?.scene_settings?.location);

      const newLighting = variation.changes?.environment?.lighting === 'unchanged'
        ? originalVideo.metadata?.scene_settings?.lighting
        : (variation.changes?.environment?.lighting || originalVideo.metadata?.scene_settings?.lighting);

      const newMetadata = {
        ...originalVideo.metadata,
        scene_settings: {
          ...originalVideo.metadata?.scene_settings,
          location: newLocation,
          lighting: newLighting,
        },
        variation_info: {
          original_video_id: videoId,
          variation_number: i + 1,
          morphy_notes: variation.notes,
        },
      };

      const newVideoData = {
        user_id: originalVideo.user_id,
        title: `${originalVideo.title} - Variação ${i + 1}`,
        status: 'pending',
        avatar_name: originalVideo.avatar_name,
        avatar_gender: newGender,
        duration: originalVideo.duration,
        aspect_ratio: originalVideo.aspect_ratio,
        creative_style: originalVideo.creative_style,
        dialogue: variation.full_dialogue,
        credits_used: 0,
        metadata: newMetadata,
        source_mode: 'variation',
        folder_id: originalVideo.folder_id,
      };

      console.log(`Criando vídeo ${i + 1}/${variations.length}:`, {
        title: newVideoData.title,
        dialogue_preview: newVideoData.dialogue.substring(0, 50),
        gender: newVideoData.avatar_gender,
        location: newLocation,
      });

      const { data: newVideo, error: createError } = await supabase
        .from('videos')
        .insert(newVideoData)
        .select()
        .single();

      if (createError) {
        console.error(`Erro ao criar vídeo ${i + 1}:`, createError);
        throw new Error(`Erro ao criar variação ${i + 1}`);
      }

      createdVideos.push(newVideo);
    }

    console.log(`${createdVideos.length} vídeos criados, enviando para geração...`);

    for (const video of createdVideos) {
      try {
        await this.sendToGeneration(video, originalVideo);
      } catch (error) {
        console.error(`Erro ao enviar vídeo ${video.id} para geração:`, error);

        await supabase
          .from('videos')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', video.id);
      }
    }

    return {
      success: true,
      createdCount: createdVideos.length,
      videos: createdVideos,
    };
  },

  async sendToGeneration(video, originalVideo) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const projectData = {
      videoId: video.id,
      model: originalVideo.video_model?.replace(/_/g, '-') || 'sora-2',
      quality: 'standard',
      selectedAvatar: {
        name: video.avatar_name,
        gender: video.avatar_gender,
        age: '25-35',
      },
      creativeStyle: {
        name: video.creative_style,
      },
      dialogue: video.dialogue,
      language: originalVideo.metadata?.language || 'pt-BR',
      duration: video.duration,
      aspectRatio: video.aspect_ratio,
      mainEnvironment: video.metadata?.scene_settings?.location || 'indoor setting',
      lighting: video.metadata?.scene_settings?.lighting || 'natural',
      framing: video.metadata?.style_settings?.framing,
      cameraAngle: video.metadata?.style_settings?.cameraAngle,
      movement: video.metadata?.style_settings?.movement,
      depthOfField: video.metadata?.style_settings?.depthOfField,
      productData: video.metadata?.product_data,
      sourceMode: 'variation',
    };

    console.log('Enviando para KIE:', {
      videoId: video.id,
      title: video.title,
      dialogue_length: projectData.dialogue.length,
    });

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video-kie`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(projectData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao enviar para geração');
    }

    console.log(`Vídeo ${video.id} enviado com sucesso. TaskId: ${result.taskId}`);

    return result;
  },
};
