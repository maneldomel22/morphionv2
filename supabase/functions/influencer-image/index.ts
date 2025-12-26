import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InfluencerImageRequest {
  influencer_id: string;
  model: string;
  payload: {
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
  mode: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { influencer_id, model, payload, mode }: InfluencerImageRequest = await req.json();

    console.log('📥 Received request:', { influencer_id, model, mode });
    console.log('📥 Payload input:', {
      hasPrompt: !!payload?.input?.prompt,
      hasImageUrls: !!payload?.input?.image_urls,
      hasImageInput: !!payload?.input?.image_input,
      imageUrlsCount: payload?.input?.image_urls?.length || 0,
      imageInputCount: payload?.input?.image_input?.length || 0
    });

    if (!influencer_id || !payload?.input?.prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: influencer_id, payload.input.prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image_urls for Seedream (required by KIE API)
    if (model === 'seedream/4.5-edit') {
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

    // Return immediately with taskId - let background polling handle the rest
    return new Response(
      JSON.stringify({
        success: true,
        taskId: taskId,
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