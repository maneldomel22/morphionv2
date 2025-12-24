import { supabase } from '../lib/supabase';
import { buildInfluencerPrompt } from './influencerPromptBuilder';

export async function createInfluencerPost({ influencer, type, mode, scene, camera, userId }) {
  console.log('🎬 Creating influencer post...');

  const prompt = await buildInfluencerPrompt({
    influencer,
    mode,
    scene,
    camera
  });

  const post = {
    influencer_id: influencer.id,
    user_id: userId,
    type,
    mode,
    caption: scene.scene_context || `Post by ${influencer.name}`,
    prompt_data: { scene, camera, prompt },
    status: 'generating',
    prompt
  };

  const { data, error } = await supabase
    .from('influencer_posts')
    .insert([post])
    .select()
    .single();

  if (error) throw error;
  console.log('📝 Post created in database:', data.id);

  if (type === 'image') {
    generateInfluencerImageBackground(influencer, data, prompt, camera, mode);
  } else {
    generateInfluencerVideoBackground(influencer, data, prompt, camera, userId);
  }

  return data;
}

async function generateInfluencerImageBackground(influencer, post, prompt, camera, mode) {
  try {
    const model = mode === 'hot' ? 'seedream/4.5-edit' : 'nano-banana-pro';

    let payload;
    if (model === 'nano-banana-pro') {
      payload = {
        model: 'nano-banana-pro',
        callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
        input: {
          prompt,
          image_input: [influencer.image_url],
          aspect_ratio: camera.aspect_ratio || '9:16',
          resolution: camera.resolution || '2K',
          output_format: 'png'
        }
      };
    } else {
      payload = {
        model: 'seedream/4.5-edit',
        callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
        input: {
          prompt,
          image_urls: [influencer.image_url],
          aspect_ratio: camera.aspect_ratio || '9:16',
          quality: 'high'
        }
      };
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/influencer-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        influencer_id: influencer.id,
        model,
        payload,
        mode
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao iniciar geração');
    }

    const result = await response.json();
    if (!result.taskId) {
      throw new Error('Nenhum taskId retornado');
    }

    await supabase
      .from('influencer_posts')
      .update({
        metadata: { taskId: result.taskId },
        engine_used: model
      })
      .eq('id', post.id);

    console.log('✅ TaskId saved to post metadata:', result.taskId);

    console.log('✅ Post image completed:', post.id);
  } catch (error) {
    console.error('❌ Error generating image:', error);
    await supabase
      .from('influencer_posts')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', post.id);
  }
}

async function generateInfluencerVideoBackground(influencer, post, prompt, camera, userId) {
  try {
    // Extract dialogue from prompt for storage
    const dialoguePattern = /DIALOGUE\s*\(LOCKED\s*—\s*DO NOT CHANGE\):\s*Say EXACTLY the following text,\s*word for word:\s*["']([\s\S]*?)["']/i;
    const dialogueMatch = prompt.match(dialoguePattern);
    const extractedDialogue = dialogueMatch ? dialogueMatch[1] : post.dialogue || '';

    console.log('💾 Saving video with prompt and dialogue');
    console.log('  kie_prompt length:', prompt.length, 'chars');
    console.log('  dialogue length:', extractedDialogue.length, 'chars');

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title: `${influencer.name} - ${new Date().toLocaleDateString()}`,
        thumbnail_url: influencer.image_url,
        avatar_name: influencer.name,
        avatar_gender: influencer.style || 'Influencer',
        duration: camera.duration || '5',
        aspect_ratio: camera.aspect_ratio || '9:16',
        creative_style: 'influencer-content',
        dialogue: extractedDialogue,
        kie_prompt: prompt,
        status: 'pending',
        video_model: 'wan_2_5',
        generation_mode: 'image-to-video',
        source_mode: 'influencer',
        metadata: {
          resolution: camera.resolution,
          influencer_id: influencer.id,
          influencer_post_id: post.id
        }
      })
      .select()
      .single();

    if (videoError) throw videoError;

    const endpoint = post.mode === 'safe'
      ? '/functions/v1/generate-video-wan'
      : '/functions/v1/wan-hot-create-task';

    const payload = {
      model: 'wan/2-5-image-to-video',
      callBackUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kie-callback`,
      input: {
        prompt: prompt,
        image_url: influencer.image_url,
        duration: camera.duration || '5',
        resolution: camera.resolution || '2K',
        enable_prompt_expansion: true
      }
    };

    console.log('📝 Influencer post prompt length:', prompt.length, 'chars');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoId: video.id,
        payload,
        sourceMode: 'influencer'
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao iniciar geração de vídeo');
    }

    const result = await response.json();
    if (!result.success || !result.taskId) {
      throw new Error('Falha ao criar tarefa de vídeo');
    }

    await supabase
      .from('influencer_posts')
      .update({
        metadata: { videoId: video.id }
      })
      .eq('id', post.id);

    console.log('✅ Post video completed:', post.id);
  } catch (error) {
    console.error('❌ Error generating video:', error);
    await supabase
      .from('influencer_posts')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', post.id);
  }
}

export async function getInfluencerPosts(influencerId) {
  const { data, error } = await supabase
    .from('influencer_posts')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteInfluencerPost(postId) {
  const { error } = await supabase
    .from('influencer_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function checkPostStatus(postId) {
  console.log('🔍 Checking post status manually:', postId);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-influencer-post`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ postId })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check post status');
  }

  const result = await response.json();
  console.log('✅ Post status check result:', result);

  return result;
}

async function pollImageStatus(taskId, postId, maxAttempts = 180) {
  console.log('⏳ Polling image status for task:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5000);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-image-status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      }
    );

    if (!response.ok) {
      console.error('❌ Polling error');
      continue;
    }

    const result = await response.json();
    const status = result.status || 'unknown';
    console.log(`📊 Image Polling [${attempt + 1}/${maxAttempts}]:`, status);

    if (status === 'success') {
      if (result.result?.resultUrls && result.result.resultUrls.length > 0) {
        console.log('✅ Image generation completed:', result.result.resultUrls[0]);
        return result.result.resultUrls[0];
      } else if (result.result?.images && result.result.images.length > 0) {
        console.log('✅ Image generation completed:', result.result.images[0]);
        return result.result.images[0];
      } else {
        throw new Error('Nenhuma URL de resultado');
      }
    }

    if (status === 'fail' || status === 'failed') {
      throw new Error('Geração de imagem falhou');
    }
  }

  throw new Error('Timeout ao aguardar geração de imagem');
}

async function pollVideoStatus(videoId, postId, maxAttempts = 180) {
  console.log('⏳ Polling video status for video:', videoId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(5000);

    const { data: video, error } = await supabase
      .from('videos')
      .select('status, video_url')
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('❌ Error checking video status:', error);
      continue;
    }

    console.log(`📊 Video Polling [${attempt + 1}/${maxAttempts}]:`, video.status);

    if (video.status === 'completed' && video.video_url) {
      console.log('✅ Video generation completed:', video.video_url);
      return video.video_url;
    }

    if (video.status === 'failed') {
      throw new Error('Geração de vídeo falhou');
    }
  }

  throw new Error('Timeout ao aguardar geração de vídeo');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
