import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InfluencerImageRequest {
  influencer_id?: string;
  influencerId?: string;
  model?: string;
  prompt?: string;
  referenceImage?: string;
  type?: 'profile' | 'bodymap' | 'post';
  payload?: {
    model: string;
    callBackUrl: string;
    input: {
      prompt: string;
      image_urls?: string[];
      image_input?: string[];
      aspect_ratio?: string;
      resolution?: string;
      output_format?: string;
      quality?: string;
    };
  };
  mode?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestData: InfluencerImageRequest = await req.json();

    const influencer_id = requestData.influencer_id || requestData.influencerId;
    const type = requestData.type || 'post';
    const mode = requestData.mode || 'safe';

    let model: string;
    let payload: any;
    let promptText: string;
    let imageUrls: string[] = [];

    if (requestData.payload) {
      model = requestData.model || requestData.payload.model;
      payload = requestData.payload;
      promptText = payload.input.prompt;
      imageUrls = payload.input.image_urls || [];
    } else {
      // Use nano-banana-pro for profile and bodymap creation (no reference), seedream for posts
      if (type === 'profile') {
        model = requestData.model || 'nano-banana-pro';
      } else if (type === 'bodymap') {
        model = requestData.model || 'nano-banana-pro';
      } else {
        model = requestData.model || 'seedream/4.5-edit';
      }

      promptText = requestData.prompt || '';

      if (requestData.referenceImage) {
        imageUrls = [requestData.referenceImage];
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const callbackUrl = `${supabaseUrl}/functions/v1/check-influencer-post?influencer_id=${influencer_id}&type=${type}`;

      const inputPayload: any = {
        prompt: promptText,
        aspect_ratio: type === 'profile' ? '1:1' : (type === 'bodymap' ? '16:9' : '9:16'),
        quality: 'high'
      };

      // Add 4K resolution for bodymaps
      if (type === 'bodymap') {
        inputPayload.resolution = '4K';
        inputPayload.output_format = 'png';
      }

      // For bodymap with reference, use image_input (nano-banana-pro format)
      if (type === 'bodymap' && imageUrls.length > 0) {
        inputPayload.image_input = imageUrls;
      } else if (imageUrls.length > 0) {
        inputPayload.image_urls = imageUrls;
      }

      payload = {
        model: model,
        callBackUrl: callbackUrl,
        input: inputPayload
      };
    }

    console.log('📥 Received request:', { influencer_id, model, mode, type });
    console.log('📥 Payload input:', {
      hasPrompt: !!promptText,
      hasImageUrls: imageUrls.length > 0,
      imageUrlsCount: imageUrls.length
    });

    if (!influencer_id || !promptText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: influencer_id, prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image_urls for Seedream (only for non-creation flows)
    if (model === 'seedream/4.5-edit' && type === 'post') {
      if (!payload.input.image_urls || payload.input.image_urls.length === 0) {
        return new Response(
          JSON.stringify({
            error: "Seedream requires at least one image_url. Make sure the influencer has an image_url set.",
            details: "The 'image_urls' field is required for seedream/4.5-edit model"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate image_input for Nano Banana Pro
    if (model === 'nano-banana-pro') {
      if (!payload.input.image_input || payload.input.image_input.length === 0) {
        console.warn('⚠️ Nano Banana Pro called without image_input - this is optional but recommended');
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const kieApiKey = Deno.env.get("KIE_API_KEY");
    if (!kieApiKey) {
      console.error("KIE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "KIE API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and truncate prompt if needed (Seedream max is 3000 chars according to KIE docs)
    let finalPrompt = payload.input.prompt;
    const MAX_PROMPT_LENGTH = 3000;

    if (finalPrompt.length > MAX_PROMPT_LENGTH) {
      console.warn(`⚠️ Prompt too long (${finalPrompt.length} chars). Truncating to ${MAX_PROMPT_LENGTH} chars.`);

      // Keep the most important parts: beginning (subject/style) and end (negatives)
      const lines = finalPrompt.split('\n');
      const negativeIndex = lines.findIndex(line => line.includes('Negative Constraints') || line.includes('RESTRICTIONS'));

      if (negativeIndex > 0) {
        // Keep first 70% of budget for main content, 30% for negatives
        const mainBudget = Math.floor(MAX_PROMPT_LENGTH * 0.7);
        const negativeBudget = Math.floor(MAX_PROMPT_LENGTH * 0.3);

        const mainContent = lines.slice(0, negativeIndex).join('\n');
        const negativeContent = lines.slice(negativeIndex).join('\n');

        const truncatedMain = mainContent.length > mainBudget
          ? mainContent.substring(0, mainBudget) + '...'
          : mainContent;

        const truncatedNegative = negativeContent.length > negativeBudget
          ? negativeContent.substring(0, negativeBudget)
          : negativeContent;

        finalPrompt = truncatedMain + '\n\n' + truncatedNegative;
      } else {
        // No negatives section, just truncate
        finalPrompt = finalPrompt.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
      }
    }

    // Build KIE payload in correct format per API documentation
    const kiePayload = {
      model: model,
      callBackUrl: payload.callBackUrl, // Include callback URL for completion notifications
      input: {
        ...payload.input,
        prompt: finalPrompt
      }
    };

    console.log('🌐 Calling KIE API for influencer image:', {
      model: kiePayload.model,
      callBackUrl: kiePayload.callBackUrl,
      aspectRatio: kiePayload.input.aspect_ratio,
      quality: kiePayload.input.quality,
      mode,
      originalPromptLength: payload.input.prompt.length,
      finalPromptLength: finalPrompt.length
    });

    const kieResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(kiePayload)
    });

    if (!kieResponse.ok) {
      const errorText = await kieResponse.text();
      console.error('KIE API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create image generation task', details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kieResult = await kieResponse.json();

    console.log('KIE API response:', kieResult);

    if (kieResult.code !== 200) {
      throw new Error(kieResult.msg || 'Failed to create image task');
    }

    if (!kieResult.data?.taskId) {
      throw new Error('No taskId returned from KIE API');
    }

    const taskId = kieResult.data.taskId;

    console.log('✅ Image generation task created:', taskId);

    // Get user from auth header to insert in generated_images
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // If no auth header or user, try to get from influencer
    if (!userId && influencer_id) {
      const { data: influencer } = await supabase
        .from("influencers")
        .select("user_id")
        .eq("id", influencer_id)
        .maybeSingle();

      userId = influencer?.user_id || null;
    }

    if (!userId) {
      console.error('No user_id found for image generation');
      throw new Error('Could not determine user_id for image generation');
    }

    // Map type to image_type for generated_images table
    let imageType: string;
    if (type === 'profile') {
      imageType = 'influencer_profile';
    } else if (type === 'bodymap') {
      imageType = 'influencer_bodymap';
    } else {
      imageType = 'influencer_post';
    }

    // Insert into generated_images table (reusing existing infrastructure)
    const { data: imageRecord, error: insertError } = await supabase
      .from("generated_images")
      .insert({
        user_id: userId,
        influencer_id: influencer_id,
        image_type: imageType,
        status: 'generating',
        task_id: taskId,
        prompt: promptText,
        original_prompt: promptText,
        aspect_ratio: payload.input.aspect_ratio || '1:1',
        image_model: model === 'nano-banana-pro' ? 'nano_banana' : (model.includes('seedream') ? 'seedream_4_5' : model),
        kie_model: model,
        generation_mode: imageUrls.length > 0 ? 'image-to-image' : 'text-to-image',
        source_image_url: imageUrls[0] || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert into generated_images:', insertError);
      throw insertError;
    }

    console.log('✅ Image record created in generated_images:', imageRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        task_id: taskId,
        taskId: taskId,
        image_id: imageRecord.id,
        kieResponse: kieResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in influencer-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});