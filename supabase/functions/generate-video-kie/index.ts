import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProjectData {
  videoId: string;
  model?: string;
  quality?: string;
  selectedAvatar: any;
  creativeStyle: any;
  dialogue: string;
  language?: string;
  duration: string;
  aspectRatio: string;
  mainEnvironment: string;
  visibleElements?: string;
  lighting: string;
  framing?: string;
  cameraAngle?: string;
  movement?: string;
  depthOfField?: string;
  storyboardMode?: boolean;
  sourceMode?: string;
  scenes?: Array<{
    description: string;
    duration: string;
  }>;
  productData?: {
    name?: string;
    action?: string;
    image_url?: string;
  };
}

function mapSoraSize(quality: string | undefined, isPro: boolean): string {
  if (!isPro) return "standard";
  return quality === "high" ? "high" : "standard";
}

function parseDuration(durationStr: string): number {
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 5;
}

function splitDialogueByScenes(dialogue: string, scenes: Array<{ description: string; duration: string }>): string[] {
  if (!dialogue || dialogue.trim() === '') {
    return scenes.map(() => '');
  }

  const dialogueTrimmed = dialogue.trim();
  const words = dialogueTrimmed.split(/\s+/);
  const totalDuration = scenes.reduce((sum, scene) => sum + parseDuration(scene.duration), 0);

  const dialogues: string[] = [];
  let startWordIndex = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sceneDuration = parseDuration(scenes[i].duration);
    const fraction = sceneDuration / totalDuration;
    const wordCount = Math.round(words.length * fraction);

    const endWordIndex = (i === scenes.length - 1) 
      ? words.length 
      : Math.min(startWordIndex + wordCount, words.length);

    const sceneDialogue = words.slice(startWordIndex, endWordIndex).join(' ');
    dialogues.push(sceneDialogue);
    startWordIndex = endWordIndex;
  }

  return dialogues;
}

function buildStoryboardShots(data: ProjectData): Array<any> {
  if (!data.scenes || data.scenes.length === 0) {
    throw new Error('Storyboard mode requires at least one scene');
  }

  const lightingMap: Record<string, string> = {
    natural: 'natural lighting',
    artificial: 'artificial lighting',
    mixed: 'mixed lighting',
    daylight: 'daylight',
    golden_hour: 'golden hour lighting',
    night: 'night lighting',
    studio: 'studio lighting',
  };

  const avatar = data.selectedAvatar;
  const age = avatar?.age || '25-35';
  const gender = avatar?.gender || 'female';
  const lightingDesc = lightingMap[data.lighting] || data.lighting || 'natural lighting';
  const mainEnvironment = data.mainEnvironment?.trim() || 'an indoor setting';
  const visibleElements = data.visibleElements?.trim();

  const dialogues = splitDialogueByScenes(data.dialogue, data.scenes);

  const shots = data.scenes.map((scene, index) => {
    const sceneDuration = parseDuration(scene.duration);
    const sceneDialogue = dialogues[index] || '';

    const shotParts: string[] = [];

    shotParts.push(`TECHNICAL HEADER:`);
    shotParts.push(`A casual, selfie-style front-camera vertical video, recorded handheld at arm's length, with subtle micro-jitters, natural exposure shifts, and realistic stabilization artifacts.`);
    shotParts.push(``);

    shotParts.push(`ENVIRONMENT:`);
    shotParts.push(`Location: ${mainEnvironment}`);
    if (visibleElements) {
      shotParts.push(`Visible elements: ${visibleElements}`);
    }
    shotParts.push(`Lighting: ${lightingDesc}`);
    shotParts.push(``);

    shotParts.push(`CHARACTER:`);
    shotParts.push(`Name: ${avatar.name}`);
    shotParts.push(`Age: ${age} years old`);
    shotParts.push(`Gender: ${gender}`);
    if (avatar.customAvatarDescription) {
      shotParts.push(`Description: ${avatar.customAvatarDescription}`);
    }
    shotParts.push(``);

    shotParts.push(`SCENE ${index + 1}:`);
    shotParts.push(scene.description);
    shotParts.push(``);

    if (sceneDialogue && sceneDialogue.trim()) {
      shotParts.push(`DIALOGUE:`);
      shotParts.push(`Say: "${sceneDialogue.trim()}"`);
    }

    return {
      prompt: shotParts.join('\n'),
      duration: sceneDuration,
    };
  });

  return shots;
}

function calculateSpeechDuration(videoDuration: string): number {
  const duration = parseInt(videoDuration);
  if (duration === 10) return 8;
  if (duration === 15) return 14;
  if (duration === 25) return 23;
  return Math.floor(duration * 0.9);
}

function getLanguageInfo(languageCode?: string): { code: string; name: string } {
  const languages: Record<string, string> = {
    'pt-BR': 'Portuguese (pt-BR)',
    'en-US': 'English (en-US)',
    'es-ES': 'Spanish (es-ES)',
    'fr-FR': 'French (fr-FR)',
    'de-DE': 'German (de-DE)',
    'it-IT': 'Italian (it-IT)',
    'ja-JP': 'Japanese (ja-JP)',
    'ko-KR': 'Korean (ko-KR)',
    'zh-CN': 'Chinese (zh-CN)',
    'ru-RU': 'Russian (ru-RU)',
    'pl-PL': 'Polish (pl-PL)',
  };

  if (!languageCode || !languages[languageCode]) {
    throw new Error('Language not specified or invalid. Please select a language before generating the video.');
  }

  return {
    code: languageCode,
    name: languages[languageCode],
  };
}

async function validateImageUrl(imageUrl: string): Promise<void> {
  console.log('Validating image URL:', imageUrl);

  const headResponse = await fetch(imageUrl, { method: 'HEAD' });
  if (!headResponse.ok) {
    console.error('Image validation failed: HTTP', headResponse.status);
    throw new Error(`Image URL not accessible (HTTP ${headResponse.status})`);
  }

  const contentType = headResponse.headers.get('content-type');
  const validContentTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!contentType || !validContentTypes.includes(contentType)) {
    console.error('Invalid content type:', contentType);
    throw new Error(`Image format not supported: ${contentType}. Use JPEG, PNG, or WEBP.`);
  }

  const contentLength = headResponse.headers.get('content-length');
  if (contentLength) {
    const sizeMB = Number(contentLength) / 1024 / 1024;
    if (sizeMB > 10) {
      console.error('Image too large:', sizeMB, 'MB');
      throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB (max 10MB)`);
    }
  }

  console.log('Image validation successful:', { contentType, sizeMB: contentLength ? (Number(contentLength) / 1024 / 1024).toFixed(2) : 'unknown' });
}

function buildPrompt(data: ProjectData): string {
  const lightingMap: Record<string, string> = {
    natural: 'natural lighting',
    artificial: 'artificial lighting',
    mixed: 'mixed lighting',
    daylight: 'daylight',
    golden_hour: 'golden hour lighting',
    night: 'night lighting',
    studio: 'studio lighting',
  };

  const avatar = data.selectedAvatar;
  const age = avatar?.age || '25-35';
  const gender = avatar?.gender || 'female';

  const lightingDesc = lightingMap[data.lighting] || data.lighting || 'natural lighting';
  const mainEnvironment = data.mainEnvironment?.trim() || 'an indoor setting';
  const visibleElements = data.visibleElements?.trim();

  const speechDuration = calculateSpeechDuration(data.duration);
  const dialogue = data.dialogue.trim();
  const language = getLanguageInfo(data.language);

  const aspectRatioFormatted = data.aspectRatio || '9:16';

  const hasProductImage = data.productData?.image_url;
  const hasCustomCinematography = !!(
    data.framing?.trim() ||
    data.cameraAngle?.trim() ||
    data.movement?.trim() ||
    data.depthOfField?.trim()
  );

  const promptParts: string[] = [];

  promptParts.push(`TECHNICAL HEADER:`);
  promptParts.push(`A casual, selfie-style front-camera vertical video, recorded handheld at arm's length, with subtle micro-jitters, natural exposure shifts, and realistic stabilization artifacts.`);
  promptParts.push(``);

  promptParts.push(`ENVIRONMENT (LOCKED — MUST FOLLOW EXACTLY):`);
  promptParts.push(`Location: ${mainEnvironment}`);
  if (visibleElements) {
    promptParts.push(`Visible elements: ${visibleElements}`);
  }
  promptParts.push(`Lighting: ${lightingDesc}`);
  promptParts.push(``);
  promptParts.push(`This environment is FIXED.`);
  promptParts.push(`Do NOT replace it.`);
  promptParts.push(`Do NOT simplify it.`);
  promptParts.push(`Do NOT generalize it.`);
  promptParts.push(`Do NOT use any default or generic environment.`);
  promptParts.push(`The entire video must take place in this exact environment.`);
  promptParts.push(``);

  if (hasProductImage) {
    promptParts.push(`PRODUCT (CRITICAL — MUST BE VISIBLE):`);
    promptParts.push(`The image provided represents the PRODUCT: ${data.productData?.name || 'the product'}.`);
    promptParts.push(`The character MUST hold the product in hand.`);
    promptParts.push(`The product MUST remain visible for the ENTIRE video.`);
    if (data.productData?.action?.trim()) {
      promptParts.push(`The character MUST perform this action with the product:`);
      promptParts.push(`${data.productData.action}`);
    } else {
      promptParts.push(`The character MUST gesture naturally with the product while speaking.`);
    }
    promptParts.push(`The product MUST NOT be placed on surfaces or left in the background.`);
    promptParts.push(``);
  }

  promptParts.push(`CHARACTER:`);
  promptParts.push(`Name: ${avatar.name}`);
  promptParts.push(`Age: ${age} years old`);
  promptParts.push(`Gender: ${gender}`);
  if (avatar.customAvatarDescription) {
    promptParts.push(`Description: ${avatar.customAvatarDescription}`);
  }
  promptParts.push(``);
  promptParts.push(`The character has a realistic appearance with visible skin texture and natural micro-expressions.`);
  promptParts.push(`Maintains direct eye contact with the camera.`);
  promptParts.push(``);

  promptParts.push(`CINEMATOGRAPHY:`);
  if (hasCustomCinematography) {
    if (data.framing?.trim()) {
      promptParts.push(`Framing: ${data.framing}`);
    } else {
      promptParts.push(`Framing: Medium close-up (head and shoulders)`);
    }
    if (data.cameraAngle?.trim()) {
      promptParts.push(`Camera angle: ${data.cameraAngle}`);
    } else {
      promptParts.push(`Camera angle: Eye-level`);
    }
    promptParts.push(`Front camera (~24mm equivalent).`);
    if (data.movement?.trim()) {
      promptParts.push(`Camera movement: ${data.movement}`);
    } else {
      promptParts.push(`Camera movement: Slight handheld sway only`);
    }
    if (data.depthOfField?.trim()) {
      promptParts.push(`Depth of field: ${data.depthOfField}`);
    }
    promptParts.push(`No tripod.`);
  } else {
    promptParts.push(`Medium close-up framing (head and shoulders).`);
    promptParts.push(`Eye-level angle.`);
    promptParts.push(`Front camera (~24mm equivalent).`);
    promptParts.push(`Slight handheld sway only.`);
    promptParts.push(`No tripod.`);
  }
  promptParts.push(``);

  promptParts.push(`ACTION & PERFORMANCE:`);
  promptParts.push(`Creative style: ${data.creativeStyle?.name || 'Natural conversation'}`);
  promptParts.push(`The character speaks directly to the camera as if recording a personal message for social media.`);
  promptParts.push(`Natural micro-movements: slight head tilts, subtle gestures, realistic blinks.`);
  promptParts.push(`Authentic casual filming aesthetic.`);
  promptParts.push(``);

  promptParts.push(`LANGUAGE RULE (CRITICAL):`);
  promptParts.push(`The character MUST speak ONLY in ${language.name}.`);
  promptParts.push(`Do NOT translate.`);
  promptParts.push(`Do NOT mix languages.`);
  promptParts.push(`The spoken language MUST exactly match the dialogue provided.`);
  promptParts.push(`Pronunciation must be natural and native for ${language.name}.`);
  promptParts.push(``);

  promptParts.push(`DIALOGUE (LOCKED — DO NOT CHANGE):`);
  promptParts.push(`Say EXACTLY the following text, word for word:`);
  promptParts.push(`"${dialogue}"`);
  promptParts.push(``);
  promptParts.push(`Character MUST say these exact words.`);
  promptParts.push(`Do NOT paraphrase.`);
  promptParts.push(`Do NOT shorten.`);
  promptParts.push(`Do NOT add extra words.`);
  promptParts.push(`Do NOT change the order.`);
  promptParts.push(`Say ONLY this text, nothing more.`);
  promptParts.push(``);

  promptParts.push(`TIMING RULES:`);
  promptParts.push(`The speech must fit within ${speechDuration} seconds.`);
  promptParts.push(`Natural pacing with realistic pauses.`);
  promptParts.push(`Allow brief moments for emphasis.`);
  promptParts.push(``);

  promptParts.push(`AUDIO:`);
  promptParts.push(`Clear, natural speaking voice.`);
  promptParts.push(`Slight audio compression.`);
  promptParts.push(`Minimal background noise.`);
  promptParts.push(`Realistic room acoustics.`);
  promptParts.push(``);

  promptParts.push(`QUALITY & AUTHENTICITY MODIFIERS:`);
  promptParts.push(`High detail on facial features and skin texture.`);
  promptParts.push(`Realistic video quality with authentic compression artifacts.`);
  promptParts.push(`Natural color grading with characteristic color processing.`);
  promptParts.push(`Aspect ratio: ${aspectRatioFormatted} (vertical format).`);
  promptParts.push(`Authentic social media aesthetic.`);
  promptParts.push(`Maintain realism throughout — avoid overly polished or cinematic look.`);
  promptParts.push(``);

  promptParts.push(`NEGATIVE CONSTRAINTS:`);
  promptParts.push(`NO tripod or stabilized footage.`);
  promptParts.push(`NO studio lighting setups.`);
  promptParts.push(`NO overly produced or commercial look.`);
  promptParts.push(`NO dialogue changes or substitutions.`);
  promptParts.push(`NO language changes — MUST use ${language.name} ONLY.`);

  return promptParts.join('\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const kieApiKey = Deno.env.get('KIE_API_KEY');

    if (!kieApiKey) {
      throw new Error('KIE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const projectData: ProjectData = await req.json();

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', projectData.videoId)
      .maybeSingle();

    if (videoError || !video) {
      throw new Error('Video not found');
    }

    const prompt = buildPrompt(projectData);

    const baseModel = projectData.model || 'sora-2';
    const durationSeconds = parseInt(projectData.duration);
    let nFrames = "15";
    if (durationSeconds === 10) {
      nFrames = "10";
    } else if (durationSeconds === 15) {
      nFrames = "15";
    } else if (durationSeconds === 25) {
      if (baseModel !== 'sora-2-pro') {
        throw new Error('25s duration is only supported with Sora 2 Pro model');
      }
      nFrames = "25";
    }

    const hasProductImage = projectData.productData?.image_url;
    const isStoryboard = projectData.storyboardMode === true;

    let model: string;
    let generationMode: string;

    if (isStoryboard) {
      model = `${baseModel}-storyboard`;
      generationMode = 'storyboard';
    } else {
      model = hasProductImage ? `${baseModel}-image-to-video` : `${baseModel}-text-to-video`;
      generationMode = hasProductImage ? 'image-to-video' : 'text-to-video';
    }

    const uiRatio = projectData.aspectRatio || '9:16';
    const mappedAspectRatio = uiRatio === '9:16' ? 'portrait' : 'landscape';

    const isPro = baseModel === 'sora-2-pro';
    const mappedSize = mapSoraSize(projectData.quality, isPro);

    console.log('Video generation config:', {
      baseModel,
      model,
      uiRatio,
      mappedAspectRatio,
      nFrames,
      quality: projectData.quality,
      mappedSize,
      isPro,
      isStoryboard,
    });

    const callbackUrl = `${supabaseUrl}/functions/v1/kie-callback`;

    const kiePayload: any = {
      model,
      callBackUrl: callbackUrl,
      input: {
        aspect_ratio: mappedAspectRatio,
        n_frames: nFrames,
      },
    };

    if (isStoryboard) {
      const shots = buildStoryboardShots(projectData);
      kiePayload.input.shots = shots;

      const totalShotsDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);
      const expectedDuration = parseInt(nFrames);

      console.log('Storyboard validation:', {
        numShots: shots.length,
        totalShotsDuration,
        expectedDuration: expectedDuration,
        difference: Math.abs(totalShotsDuration - expectedDuration),
      });

      if (Math.abs(totalShotsDuration - expectedDuration) > 2) {
        console.warn('Warning: Total shots duration differs from expected duration by more than 2 seconds');
      }
    } else {
      kiePayload.input.prompt = prompt;
      kiePayload.input.size = mappedSize;
      kiePayload.input.remove_watermark = true;

      if (hasProductImage) {
        kiePayload.input.image_urls = [projectData.productData!.image_url!];
      }
    }

    if (hasProductImage && !isStoryboard) {
      const imageUrls = kiePayload.input.image_urls;
      if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        throw new Error('image_urls must be a non-empty array');
      }
      if (!imageUrls[0].startsWith('http')) {
        throw new Error('image_urls must contain valid HTTP(S) URLs');
      }

      try {
        await validateImageUrl(imageUrls[0]);
      } catch (validationError) {
        await supabase
          .from('video_generation_logs')
          .insert({
            video_id: projectData.videoId,
            kie_task_id: null,
            event_type: 'image_validation_failed',
            event_data: {
              image_url: imageUrls[0],
              error: validationError.message,
              validation_timestamp: new Date().toISOString(),
            },
          });

        throw validationError;
      }
    }

    if (!isStoryboard && prompt.length > 10000) {
      throw new Error(`Prompt too long: ${prompt.length} characters (max 10000)`);
    }

    const validFrames = ['10', '15', '25'];
    if (!validFrames.includes(kiePayload.input.n_frames)) {
      throw new Error(`Invalid n_frames: ${kiePayload.input.n_frames}. Must be "10", "15", or "25"`);
    }

    const validAspectRatios = ['portrait', 'landscape'];
    if (!validAspectRatios.includes(kiePayload.input.aspect_ratio)) {
      throw new Error(`Invalid aspect_ratio: ${kiePayload.input.aspect_ratio}. Must be "portrait" or "landscape"`);
    }

    if (!isStoryboard) {
      const validSizes = ['standard', 'high'];
      if (!validSizes.includes(kiePayload.input.size)) {
        throw new Error(`Invalid size: ${kiePayload.input.size}. Must be "standard" or "high"`);
      }

      if (!isPro && kiePayload.input.size === 'high') {
        throw new Error('High quality (size: "high") is only available with Sora 2 Pro model');
      }
    }

    console.log('Sending KIE API request:', {
      model,
      ui_aspect_ratio: uiRatio,
      mapped_aspect_ratio: mappedAspectRatio,
      n_frames: kiePayload.input.n_frames,
      is_storyboard: isStoryboard,
      num_shots: isStoryboard ? kiePayload.input.shots.length : undefined,
      has_image_urls: hasProductImage && !isStoryboard,
      image_urls: (hasProductImage && !isStoryboard) ? kiePayload.input.image_urls : undefined,
      prompt_length: isStoryboard ? undefined : prompt.length,
    });

    const kieResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify(kiePayload),
    });

    const kieResult = await kieResponse.json();

    console.log('KIE API response:', {
      http_status: kieResponse.status,
      response_code: kieResult.code,
      has_data: !!kieResult.data,
      has_taskId: !!kieResult.data?.taskId,
    });

    if (kieResult.code !== 200) {
      const errorMessage = kieResult.msg || kieResult.message || 'Unknown error';
      console.error('KIE API error response:', {
        code: kieResult.code,
        message: errorMessage,
        data: kieResult.data,
        full_response: kieResult,
      });

      await supabase
        .from('video_generation_logs')
        .insert({
          video_id: projectData.videoId,
          kie_task_id: null,
          event_type: 'kie_api_error',
          event_data: {
            kie_code: kieResult.code,
            kie_message: errorMessage,
            request_payload: {
              model,
              has_image: hasProductImage,
              image_urls: hasProductImage ? kiePayload.input.image_urls : undefined,
            },
            full_response: kieResult,
          },
        });

      let userMessage = errorMessage;
      if (errorMessage.includes('File type not supported')) {
        userMessage = 'Formato de imagem não suportado. Use JPG, PNG ou WEBP.';
      } else if (errorMessage.includes('image_url')) {
        userMessage = 'Erro na imagem enviada. Tente fazer upload novamente.';
      }

      throw new Error(`KIE API Error (${kieResult.code}): ${userMessage}`);
    }

    const taskId = kieResult?.data?.taskId;

    if (!taskId) {
      console.error('KIE response without taskId:', kieResult);

      await supabase
        .from('video_generation_logs')
        .insert({
          video_id: projectData.videoId,
          kie_task_id: null,
          event_type: 'error_occurred',
          event_data: {
            error: 'No taskId in response',
            full_response: kieResult,
          },
        });

      throw new Error('KIE API did not return a taskId');
    }

    const videoModel = baseModel.replace(/-/g, '_');

    if (!taskId || !videoModel || !generationMode) {
      throw new Error(`Missing required fields: taskId=${!!taskId}, videoModel=${!!videoModel}, generationMode=${!!generationMode}`);
    }

    const updateData: any = {
      kie_task_id: taskId,
      video_model: videoModel,
      kie_model: model,
      generation_mode: generationMode,
      source_mode: projectData.sourceMode || 'manual',
      kie_prompt: prompt,
      status: 'queued',
      queued_at: new Date().toISOString(),
    };

    if (hasProductImage && !isStoryboard) {
      updateData.image_url = projectData.productData!.image_url!;
    }

    console.log('Attempting to update video:', {
      videoId: projectData.videoId,
      updateFields: Object.keys(updateData),
      videoModel,
      generationMode,
      sourceMode: updateData.source_mode,
      hasImageUrl: !!updateData.image_url,
    });

    const { error: updateError } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', projectData.videoId);

    if (updateError) {
      console.error('Supabase update error:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        videoId: projectData.videoId,
        updateData: {
          ...updateData,
          kie_prompt: updateData.kie_prompt?.substring(0, 100) + '...',
          base_prompt: updateData.base_prompt?.substring(0, 100) + '...',
        },
      });
      throw new Error(`Database update failed: ${updateError.message || updateError.details || updateError.hint || 'Unknown database error'}`);
    }

    await supabase
      .from('video_generation_logs')
      .insert({
        video_id: projectData.videoId,
        kie_task_id: taskId,
        event_type: 'request_sent',
        event_data: {
          base_model: baseModel,
          video_model: videoModel,
          kie_model: model,
          prompt: isStoryboard ? undefined : prompt.substring(0, 500),
          shots_count: isStoryboard ? kiePayload.input.shots.length : undefined,
          ui_aspect_ratio: uiRatio,
          mapped_aspect_ratio: mappedAspectRatio,
          generation_mode: generationMode,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        model,
        generationMode,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-video-kie:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      errorMessage = (error as any).message || (error as any).details || (error as any).hint || JSON.stringify(error);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});