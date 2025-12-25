import { supabase } from '../lib/supabase';

export const generatedImagesService = {
  async saveGeneratedImage(imageData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id,
          image_url: imageData.imageUrl,
          prompt: imageData.prompt,
          aspect_ratio: imageData.aspectRatio,
          product_image_url: imageData.productImageUrl,
          character_image_url: imageData.characterImageUrl,
          task_id: imageData.taskId,
          visual_prompt: imageData.visualPrompt,
          image_model: imageData.imageModel || 'nano_banana_pro',
          kie_model: imageData.kieModel || 'nano-banana-pro',
          generation_mode: imageData.generationMode || 'text-to-image',
          source_image_url: imageData.sourceImageUrl || null,
          status: imageData.status || 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error saving generated image:', error);
      throw error;
    }
  },

  async createPendingImage(imageData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id,
          image_url: null,
          prompt: imageData.prompt,
          original_prompt: imageData.originalPrompt || null,
          aspect_ratio: imageData.aspectRatio,
          product_image_url: imageData.productImageUrl,
          character_image_url: imageData.characterImageUrl,
          task_id: imageData.taskId,
          visual_prompt: imageData.visualPrompt,
          image_model: imageData.imageModel || 'nano_banana_pro',
          kie_model: imageData.kieModel || 'nano-banana-pro',
          generation_mode: imageData.generationMode || 'text-to-image',
          source_image_url: imageData.sourceImageUrl || null,
          status: 'generating'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating pending image:', error);
      throw error;
    }
  },

  async updateImageStatus(imageId, status, imageUrl = null, errorMessage = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData = { status };
      if (imageUrl) updateData.image_url = imageUrl;
      if (errorMessage) updateData.error_message = errorMessage;

      const { data, error } = await supabase
        .from('generated_images')
        .update(updateData)
        .eq('id', imageId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating image status:', error);
      throw error;
    }
  },

  async getGeneratingImages() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'generating')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading generating images:', error);
      throw error;
    }
  },

  subscribeToImageUpdates(userId, callback) {
    const channel = supabase
      .channel('generated_images_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_images',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  },

  async getUserImages(limit = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading user images:', error);
      throw error;
    }
  },

  async deleteImage(imageId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
};

export const getGeneratedImages = generatedImagesService.getUserImages;
