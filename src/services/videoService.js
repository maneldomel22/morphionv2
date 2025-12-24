import { supabase } from '../lib/supabase';

const normalizeLegacyVideo = (video) => {
  if (!video) return video;

  return {
    ...video,
    title: video.title || 'Sem título',
    source_mode: video.source_mode || 'manual',
    video_model: video.video_model || 'unknown',
    folder_id: video.folder_id || null,
    metadata: video.metadata && typeof video.metadata === 'object' ? video.metadata : {},
    updated_at: video.updated_at || video.created_at,
  };
};

const normalizeLegacyVideos = (videos) => {
  if (!videos || !Array.isArray(videos)) return [];
  return videos.map(normalizeLegacyVideo);
};

export const videoService = {
  async createVideo(videoData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('videos')
      .insert([{
        user_id: user.id,
        ...videoData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getVideos(filters = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return normalizeLegacyVideos(data);
  },

  async getVideoById(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return normalizeLegacyVideo(data);
  },

  async updateVideo(id, updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVideo(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  },

  async generateVideo(projectData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    if (!projectData.videoModel) {
      throw new Error('video_model obrigatório');
    }

    const videoData = {
      user_id: user.id,
      project_id: projectData.projectId || null,
      title: `Video - ${projectData.creativeStyle?.name || 'UGC'}`,
      thumbnail_url: null,
      status: 'queued',
      avatar_name: projectData.selectedAvatar?.name || 'Avatar',
      avatar_gender: projectData.selectedAvatar?.gender || 'Não especificado',
      duration: projectData.duration || '15s',
      aspect_ratio: projectData.aspectRatio || '9:16',
      creative_style: projectData.creativeStyle?.name || 'UGC',
      dialogue: projectData.dialogue || '',
      video_model: projectData.videoModel || null,
      credits_used: this.calculateCredits(projectData.duration),
      metadata: {
        format_settings: {
          aspectRatio: projectData.aspectRatio,
          duration: projectData.duration,
          storyboardMode: projectData.storyboardMode
        },
        scene_settings: {
          location: projectData.location,
          lighting: projectData.lighting
        },
        style_settings: {
          framing: projectData.framing,
          cameraAngle: projectData.cameraAngle,
          movement: projectData.movement,
          depthOfField: projectData.depthOfField
        },
        avatar_data: projectData.selectedAvatar,
        product_data: projectData.productData,
        storyboard: projectData.scenes,
        language: projectData.language
      }
    };

    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  calculateCredits(duration) {
    const durationMultiplier = { '10s': 30, '15s': 50, '25s': 70 };
    return durationMultiplier[duration] || 50;
  },

  async getUserVideos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return normalizeLegacyVideos(data || []);
  },

  async uploadThumbnail(videoId, thumbnailBlob) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileName = `${videoId}-thumbnail-${Date.now()}.jpg`;
    const filePath = `${user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('video-thumbnails')
      .upload(filePath, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('video-thumbnails')
      .getPublicUrl(filePath);

    const { data: updateData, error: updateError } = await supabase
      .from('videos')
      .update({ thumbnail_url: publicUrl })
      .eq('id', videoId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return updateData;
  },

  async generateAndUploadThumbnail(videoId, videoUrl) {
    try {
      const { extractThumbnailFromVideoUrl } = await import('../lib/videoUtils');

      const thumbnailBlob = await extractThumbnailFromVideoUrl(videoUrl);

      const updatedVideo = await this.uploadThumbnail(videoId, thumbnailBlob);

      return updatedVideo;
    } catch (error) {
      console.error('Failed to generate and upload thumbnail:', error);
      throw error;
    }
  }
};
