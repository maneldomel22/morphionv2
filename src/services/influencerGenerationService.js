import { supabase } from '../lib/supabase';
import { imageService } from './imageService';

export async function createInfluencerImage({
  influencer,
  model,
  prompt,
  aspectRatio,
  resolution,
  outputFormat,
  quality,
  mode,
  userId,
  onProgress
}) {
  try {
    console.log('🎨 Starting influencer image generation...');

    // Validate influencer has an image_url (required for Seedream, optional for Nano Banana Pro)
    const isSeedream = model === 'seedream/4.5-edit';
    if (isSeedream && !influencer.image_url) {
      throw new Error('O modo HOT requer uma imagem de referência. Por favor, gere ou faça upload de uma imagem de referência primeiro.');
    }

    if (influencer.image_url) {
      console.log('✅ Using influencer image_url:', influencer.image_url);
    } else {
      console.log('ℹ️ No image_url - generating from text only (Nano Banana Pro)');
    }

    onProgress?.({ status: 'starting', attempts: 0, maxAttempts: 60 });

    // Create post record immediately with "generating" status
    const { data: post, error: postError } = await supabase
      .from('influencer_posts')
      .insert({
        influencer_id: influencer.id,
        user_id: userId,
        type: 'image',
        mode: mode,
        caption: prompt.substring(0, 200),
        prompt,
        status: 'generating',
        engine_used: model
      })
      .select()
      .single();

    if (postError) {
      console.error('❌ Error creating post:', postError);
      throw postError;
    }

    console.log('📝 Post created with ID:', post.id);

    // Start image generation
    const imageEngine = model === 'nano-banana-pro' ? 'nano_banana_pro' : 'seedream_4_5';

    // For Nano Banana Pro, image_input is optional (pass empty array if no image)
    // For Seedream, image_urls is required
    const imageUrls = influencer.image_url ? [influencer.image_url] : [];

    // Adicionar todas as imagens de referência BCTS sempre no modo hot
    if (mode === 'hot') {
      const baseUrl = 'https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/wan-images/reference/bcts/';
      const bctsReferenceUrls = [
        `${baseUrl}captura_de_tela_2025-12-25_033842.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034223.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034230.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034351.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034432.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034554.png`,
        `${baseUrl}captura_de_tela_2025-12-25_035819.png`,
        `${baseUrl}captura_de_tela_2025-12-25_035826.png`,
        `${baseUrl}captura_de_tela_2025-12-25_035840.png`,
        `${baseUrl}captura_de_tela_2025-12-25_040020.png`,
        `${baseUrl}captura_de_tela_2025-12-25_040037.png`,
        `${baseUrl}exemplobct.png`,
        `${baseUrl}captura_de_tela_2025-12-25_043231.png`,
        `${baseUrl}captura_de_tela_2025-12-25_043244.png`
      ];
      imageUrls.push(...bctsReferenceUrls);
      console.log(`🔥 Adicionando ${bctsReferenceUrls.length} imagens de referência BCTS`);
    }

    const result = await imageService.generateInfluencerImage(
      prompt,
      aspectRatio,
      resolution,
      outputFormat,
      imageUrls,
      influencer.id,
      imageEngine,
      quality
    );

    console.log('✅ Image generation started:', result.taskId);

    // Store taskId in post metadata for callback tracking
    await supabase
      .from('influencer_posts')
      .update({
        metadata: { taskId: result.taskId }
      })
      .eq('id', post.id);

    onProgress?.({
      status: 'generating',
      attempts: 0,
      maxAttempts: 60
    });

    // Return immediately - let background polling handle updates
    console.log('✅ Post created and generation started. Background polling will update status.');
    return post;
  } catch (error) {
    console.error('❌ Error in createInfluencerImage:', error);
    throw error;
  }
}

export async function createInfluencerVideo({
  influencer,
  prompt,
  duration,
  resolution,
  mode,
  userId,
  onProgress
}) {
  try {
    console.log('🎬 Starting influencer video generation...');

    onProgress?.({ status: 'starting', attempts: 0, maxAttempts: 180 });

    // Extract dialogue from prompt for storage
    const dialoguePattern = /DIALOGUE\s*\(LOCKED\s*—\s*DO NOT CHANGE\):\s*Say EXACTLY the following text,\s*word for word:\s*["']([\s\S]*?)["']/i;
    const dialogueMatch = prompt.match(dialoguePattern);
    const extractedDialogue = dialogueMatch ? dialogueMatch[1] : '';

    console.log('💾 Saving video with prompt and dialogue');
    console.log('  kie_prompt length:', prompt.length, 'chars');
    console.log('  dialogue length:', extractedDialogue.length, 'chars');

    // Create video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title: `${influencer.name} - ${new Date().toLocaleDateString()}`,
        thumbnail_url: influencer.image_url,
        avatar_name: influencer.name,
        avatar_gender: influencer.style || 'Influencer',
        duration: duration || '5',
        aspect_ratio: '9:16',
        creative_style: 'influencer-content',
        dialogue: extractedDialogue,
        kie_prompt: prompt,
        status: 'pending',
        video_model: 'wan_2_5',
        generation_mode: 'image-to-video',
        source_mode: 'influencer',
        metadata: {
          resolution: resolution || '2K',
          influencer_id: influencer.id
        }
      })
      .select()
      .single();

    if (videoError) throw videoError;

    console.log('📝 Video record created:', video.id);

    // Determine endpoint based on mode
    const endpoint = mode === 'safe'
      ? '/functions/v1/generate-video-wan'
      : '/functions/v1/wan-hot-create-task';

    // Preparar URLs de imagem
    let imageUrls = [influencer.image_url];

    // Adicionar todas as imagens de referência BCTS sempre no modo hot
    if (mode === 'hot') {
      const baseUrl = 'https://selmogfyeujesrayxrhs.supabase.co/storage/v1/object/public/wan-images/reference/bcts/';
      const bctsReferenceUrls = [
        `${baseUrl}captura_de_tela_2025-12-25_033842.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034223.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034230.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034351.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034432.png`,
        `${baseUrl}captura_de_tela_2025-12-25_034554.png`,
        `${baseUrl}captura_de_tela_2025-12-25_035819.png`,
        `${baseUrl}captura_de_tela_2025-12-25_035826.png`,
        `${baseUrl}captura_de_tela_2025-12-25_035840.png`,
        `${baseUrl}captura_de_tela_2025-12-25_040020.png`,
        `${baseUrl}captura_de_tela_2025-12-25_040037.png`,
        `${baseUrl}exemplobct.png`,
        `${baseUrl}captura_de_tela_2025-12-25_043231.png`,
        `${baseUrl}captura_de_tela_2025-12-25_043244.png`
      ];
      imageUrls.push(...bctsReferenceUrls);
      console.log(`🔥 Adicionando ${bctsReferenceUrls.length} imagens de referência BCTS ao vídeo`);
    }

    // Build payload
    const payload = {
      videoId: video.id,
      payload: {
        model: 'wan/2-5-image-to-video',
        callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
        input: {
          prompt: prompt,
          image_url: imageUrls[0],
          image_urls: imageUrls,
          duration: duration || '5',
          resolution: resolution || '2K',
          enable_prompt_expansion: true
        }
      },
      sourceMode: 'influencer'
    };

    console.log('📝 Influencer video prompt length:', prompt.length, 'chars');

    // Call video generation
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to start video generation');
    }

    const result = await response.json();

    if (!result.success || !result.taskId) {
      throw new Error('Failed to create video task');
    }

    console.log('✅ Video generation started:', result.taskId);

    // Poll for completion using check-video-status endpoint
    let attempts = 0;
    const maxAttempts = 180;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      attempts++;

      onProgress?.({
        status: 'generating',
        attempts,
        maxAttempts
      });

      console.log(`📊 Polling video [${attempts}/${maxAttempts}]`);

      try {
        // Use the check-video-status endpoint which queries KIE API
        const checkResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status?taskId=${result.taskId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!checkResponse.ok) {
          console.error('Error checking video status');
          continue;
        }

        const statusResult = await checkResponse.json();

        if (!statusResult.success) {
          console.error('Status check failed');
          continue;
        }

        const videoStatus = statusResult.video?.status;
        const kieState = statusResult.kieState;

        console.log(`Video status: ${videoStatus}, KIE state: ${kieState}`);

        if (videoStatus === 'ready' || videoStatus === 'completed') {
          console.log('✅ Video generation completed!');

          if (!statusResult.video.video_url) {
            throw new Error('Video completed but no URL available');
          }

          // Save to influencer_posts
          const { data: post, error: postError } = await supabase
            .from('influencer_posts')
            .insert({
              influencer_id: influencer.id,
              user_id: userId,
              type: 'video',
              mode: mode,
              video_url: statusResult.video.video_url,
              caption: prompt.substring(0, 200),
              prompt,
              status: 'completed'
            })
            .select()
            .single();

          if (postError) throw postError;

          onProgress?.({
            status: 'completed',
            attempts,
            maxAttempts
          });

          return post;
        }

        if (videoStatus === 'failed' || kieState === 'fail') {
          throw new Error(statusResult.video?.kie_fail_message || 'Video generation failed');
        }
      } catch (error) {
        console.error('Error in polling:', error);
        // Continue polling on errors (network issues, etc)
        if (attempts >= 3 && error.message.includes('failed')) {
          throw error;
        }
      }
    }

    throw new Error('Video generation timeout');
  } catch (error) {
    console.error('❌ Error in createInfluencerVideo:', error);
    throw error;
  }
}
