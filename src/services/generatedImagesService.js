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
          source_image_url: imageData.sourceImageUrl || null
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
