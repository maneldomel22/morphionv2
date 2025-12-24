import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface HotWanData {
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

    const hotWanData: HotWanData = await req.json();

    if (!hotWanData.prompt) {
      throw new Error("Prompt is required");
    }

    console.log("📝 Received HOT prompt length:", hotWanData.prompt.length, "chars");
    console.log("📋 Source mode:", hotWanData.sourceMode || "adult-content");

    if (!hotWanData.imageUrl) {
      throw new Error("Image URL is required");
    }

    await validateImageUrl(hotWanData.imageUrl);

    const duration = hotWanData.duration || "5";
    const resolution = hotWanData.resolution || "1080p";

    if (!["5", "10"].includes(duration)) {
      throw new Error("Invalid duration. Must be 5 or 10");
    }

    if (!["720p", "1080p"].includes(resolution)) {
      throw new Error("Invalid resolution. Must be 720p or 1080p");
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/kie-callback`;

    const shouldEnableExpansion = hotWanData.prompt.length <= 800
      ? (hotWanData.enablePromptExpansion ?? true)
      : false;

    if (hotWanData.prompt.length > 800 && hotWanData.enablePromptExpansion) {
      console.warn("⚠️ HOT Prompt > 800 chars with expansion enabled. Disabling expansion automatically.");
    }

    const kiePayload = {
      model: "wan/2-5-image-to-video",
      callBackUrl: callbackUrl,
      input: {
        prompt: hotWanData.prompt,
        image_url: hotWanData.imageUrl,
        duration: duration,
        resolution: resolution,
        negative_prompt: hotWanData.negativePrompt || "exaggerated body proportions, cartoon, anime, CGI look, low resolution, blurry face, distorted face, extra limbs, unrealistic anatomy, artificial skin, plastic texture, over-sharpening, watermark, subtitles, text overlays, logos",
        enable_prompt_expansion: shouldEnableExpansion,
      },
    };

    console.log("Sending HOT WAN request to KIE.AI:", {
      model: kiePayload.model,
      promptLength: hotWanData.prompt.length,
      promptPreview: hotWanData.prompt.substring(0, 100),
      imageUrl: hotWanData.imageUrl,
      duration,
      resolution,
      contentType: "adult",
      enablePromptExpansion: shouldEnableExpansion,
      sourceMode: hotWanData.sourceMode || "adult-content",
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
        source_mode: hotWanData.sourceMode || "influencer",
        status: "queued",
        metadata: {
          content_type: "adult",
          mode: "hot-influencer"
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", hotWanData.videoId);

    if (updateError) {
      console.error("Failed to update video:", updateError);
      throw new Error("Failed to update video status");
    }

    console.log("HOT WAN video generation started:", {
      videoId: hotWanData.videoId,
      taskId,
      video_model: "wan_2_5",
      kie_model: "wan/2-5-image-to-video",
      generation_mode: "image-to-video",
      contentType: "adult",
    });

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        videoId: hotWanData.videoId,
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
    console.error("Error in wan-hot-create-task:", error);

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
