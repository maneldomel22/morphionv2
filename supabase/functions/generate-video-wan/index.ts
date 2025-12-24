import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WanData {
  videoId: string;
  prompt: string;
  imageUrl: string;
  duration?: string;
  resolution?: string;
  negativePrompt?: string;
  enablePromptExpansion?: boolean;
  sourceMode?: string;
}

async function validateImageUrl(imageUrl: string): Promise<void> {
  try {
    const headResponse = await fetch(imageUrl, { method: 'HEAD' });

    if (!headResponse.ok) {
      throw new Error(`Image URL not accessible (HTTP ${headResponse.status})`);
    }

    const contentType = headResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to an image');
    }

    const contentLength = headResponse.headers.get('content-length');
    if (contentLength) {
      const sizeMB = Number(contentLength) / 1024 / 1024;
      if (sizeMB > 10) {
        throw new Error('Image too large. Maximum size is 10MB');
      }
    }
  } catch (error) {
    console.error('Image validation failed:', error);
    throw new Error(`Invalid image url: ${error.message}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const kieApiKey = Deno.env.get("KIE_API_KEY");

    if (!kieApiKey) {
      throw new Error("KIE_API_KEY not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const wanData: WanData = await req.json();

    if (!wanData.prompt) {
      throw new Error("Prompt is required");
    }

    console.log("📝 Received prompt length:", wanData.prompt.length, "chars");
    console.log("📋 Source mode:", wanData.sourceMode || "standard");

    if (!wanData.imageUrl) {
      throw new Error("Image URL is required");
    }

    await validateImageUrl(wanData.imageUrl);

    const duration = wanData.duration || "5";
    const resolution = wanData.resolution || "1080p";

    if (!["5", "10"].includes(duration)) {
      throw new Error("Invalid duration. Must be 5 or 10");
    }

    if (!["720p", "1080p"].includes(resolution)) {
      throw new Error("Invalid resolution. Must be 720p or 1080p");
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/kie-callback`;

    const shouldEnableExpansion = wanData.prompt.length <= 800
      ? (wanData.enablePromptExpansion ?? true)
      : false;

    if (wanData.prompt.length > 800 && wanData.enablePromptExpansion) {
      console.warn("⚠️ Prompt > 800 chars with expansion enabled. Disabling expansion automatically.");
    }

    const kiePayload = {
      model: "wan/2-5-image-to-video",
      callBackUrl: callbackUrl,
      input: {
        prompt: wanData.prompt,
        image_url: wanData.imageUrl,
        duration: duration,
        resolution: resolution,
        ...(wanData.negativePrompt && { negative_prompt: wanData.negativePrompt }),
        enable_prompt_expansion: shouldEnableExpansion,
      },
    };

    console.log("Sending WAN request to KIE.AI:", {
      model: kiePayload.model,
      promptLength: wanData.prompt.length,
      promptPreview: wanData.prompt.substring(0, 100),
      imageUrl: wanData.imageUrl,
      duration,
      resolution,
      enablePromptExpansion: shouldEnableExpansion,
      sourceMode: wanData.sourceMode || "standard",
    });

    const kieResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify(kiePayload),
    });

    const kieData = await kieResponse.json();

    console.log("KIE.AI response:", {
      status: kieResponse.status,
      code: kieData.code,
      hasTaskId: !!kieData.data?.taskId,
    });

    if (kieData.code !== 200) {
      throw new Error(kieData.msg || "Failed to create video task");
    }

    if (!kieData.data?.taskId) {
      throw new Error("No taskId returned from KIE.AI");
    }

    const taskId = kieData.data.taskId;

    const { error: updateError } = await supabase
      .from("videos")
      .update({
        kie_task_id: taskId,
        video_model: "wan_2_5",
        kie_model: "wan/2-5-image-to-video",
        generation_mode: "image-to-video",
        source_mode: wanData.sourceMode || "manual",
        kie_prompt: wanData.prompt,
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", wanData.videoId);

    if (updateError) {
      console.error("Failed to update video:", updateError);
      throw new Error("Failed to update video status");
    }

    console.log("WAN video generation started:", {
      videoId: wanData.videoId,
      taskId,
      video_model: "wan_2_5",
      kie_model: "wan/2-5-image-to-video",
      generation_mode: "image-to-video",
    });

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        videoId: wanData.videoId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-video-wan:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
