import { supabase } from '../lib/supabase';

export const imageService = {
  async generateImage(imageData) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-image`;

      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        description: imageData.description,
        productImageUrl: imageData.productImage,
        characterImageUrl: imageData.characterImage,
        aspectRatio: imageData.aspectRatio || '4:5',
        imageEngine: imageData.imageEngine,
        resolution: imageData.resolution,
        outputFormat: imageData.outputFormat,
        quality: imageData.quality
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();

      if (!data.success || !data.taskId) {
        throw new Error('Invalid response from image generation service');
      }

      return {
        taskId: data.taskId,
        visualPrompt: data.visualPrompt,
        kieResponse: data.kieResponse
      };
    } catch (error) {
      console.error('Error in generateImage:', error);
      throw error;
    }
  },

  async generateInfluencerImage(promptText, aspectRatio, resolution, outputFormat, imageInputUrls, influencerId = null, imageEngine = 'nano_banana_pro', quality = null) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/influencer-image`;

      console.log('🌐 Calling influencer-image edge function');
      console.log('📋 API URL:', apiUrl);
      console.log('📝 Prompt length:', promptText.length, 'chars');

      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      // Validate prompt length (SeeDream supports up to 3000 chars)
      const MAX_PROMPT_LENGTH = 3000;
      if (promptText.length > MAX_PROMPT_LENGTH) {
        console.warn(`⚠️ Prompt exceeds ${MAX_PROMPT_LENGTH} chars (${promptText.length}). It will be truncated by the server.`);
      }

      // Determine model name and mode
      const isSeedream = imageEngine === 'seedream_4_5';
      const hasImage = imageInputUrls && imageInputUrls.length > 0;

      let modelName, mode;
      if (isSeedream) {
        if (hasImage) {
          modelName = 'seedream/4.5-edit';
          mode = 'hot';
        } else {
          modelName = 'seedream/4.5-text-to-image';
          mode = 'safe';
        }
      } else {
        modelName = 'nano-banana-pro';
        mode = 'safe';
      }

      // Build nested payload structure expected by edge function
      let kiePayload;
      if (isSeedream) {
        if (hasImage) {
          kiePayload = {
            model: 'seedream/4.5-edit',
            callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
            input: {
              prompt: promptText,
              image_urls: imageInputUrls,
              aspect_ratio: aspectRatio || '1:1',
              quality: quality || 'basic'
            }
          };
        } else {
          kiePayload = {
            model: 'seedream/4.5-text-to-image',
            callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
            input: {
              prompt: promptText,
              aspect_ratio: aspectRatio || '1:1',
              quality: quality || 'basic'
            }
          };
        }
      } else {
        kiePayload = {
          model: 'nano-banana-pro',
          callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
          input: {
            prompt: promptText,
            image_input: imageInputUrls || [],
            aspect_ratio: aspectRatio || '9:16',
            resolution: resolution || '2K',
            output_format: outputFormat || 'png'
          }
        };
      }

      // Wrap in the structure expected by influencer-image edge function
      const requestPayload = {
        influencer_id: influencerId,
        model: modelName,
        payload: kiePayload,
        mode
      };

      console.log('📦 Request payload:', JSON.stringify(requestPayload, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate influencer image');
      }

      const data = await response.json();
      console.log('✅ API success response:', data);

      if (!data.success || !data.taskId) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from influencer image generation service');
      }

      return {
        taskId: data.taskId,
        kieResponse: data.kieResponse
      };
    } catch (error) {
      console.error('❌ Error in generateInfluencerImage:', error);
      throw error;
    }
  },

  async checkImageStatus(taskId) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-image-status`;

      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        taskId
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Status check error:', errorData);
        throw new Error(errorData.error || 'Failed to check image status');
      }

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Invalid status check response:', data);
        throw new Error('Invalid response from status check service');
      }

      return {
        status: data.status,
        result: data.result
      };
    } catch (error) {
      console.error('❌ Error in checkImageStatus:', error);
      throw error;
    }
  },

  async pollImageStatus(taskId, maxAttempts = 60, onUpdate = null) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const result = await this.checkImageStatus(taskId);

        if (onUpdate) {
          onUpdate({
            status: result.status,
            result: result.result,
            attempts,
            maxAttempts
          });
        }

        if (result.status === 'success') {
          return result.result;
        }

        if (result.status === 'fail') {
          throw new Error('Image generation failed');
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error polling image status:', error);
        throw error;
      }
    }

    throw new Error('Image generation timeout');
  }
};
