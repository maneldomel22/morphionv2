import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function buildProfileImagePrompt(influencer: any): string {
  const identity = influencer.identity_profile || {};

  return `Professional portrait photo.

SUBJECT:
${identity.ethnicity || 'woman'} woman, ${influencer.age || '25'} years old.
Face: ${identity.facial_traits || 'attractive features'}
Hair: ${identity.hair || 'long hair'}
Body: ${identity.body || 'natural physique'}

FRAMING:
Close-up portrait. Head and shoulders only. No body below shoulders visible.

POSE:
Neutral relaxed expression. Direct eye contact with camera. Slight natural smile.

BACKGROUND:
Solid neutral background. Soft gradient or plain wall. No objects. No context.

LIGHTING:
Soft even lighting. No harsh shadows. Professional but natural.

STYLE:
Natural skin texture. No heavy filters. Realistic but polished. Professional headshot quality.

STRICT RULES:
- No body visible below shoulders
- No text or watermarks
- No props or objects
- Clean professional portrait only`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const kieApiKey = Deno.env.get("KIE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !kieApiKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { influencer_id } = await req.json();

    if (!influencer_id) {
      throw new Error("Missing influencer_id");
    }

    const { data: influencer, error: fetchError } = await supabase
      .from("influencers")
      .select("*")
      .eq("id", influencer_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !influencer) {
      throw new Error("Influencer not found");
    }

    if (!influencer.intro_video_task_id) {
      throw new Error("No video task ID found");
    }

    console.log("Checking video status for task:", influencer.intro_video_task_id);

    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${influencer.intro_video_task_id}`,
      {
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error("Failed to check video status");
    }

    const statusData = await statusResponse.json();

    if (statusData.code !== 200) {
      throw new Error(`KIE API error: ${statusData.msg || 'Unknown error'}`);
    }

    const taskState = statusData.data?.state;
    console.log("Video status:", taskState);

    if (taskState !== "success") {
      return new Response(
        JSON.stringify({
          success: true,
          status: taskState,
          message: "Video still processing"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let videoUrl: string | undefined;
    if (statusData.data?.resultJson) {
      try {
        const parsedResult = typeof statusData.data.resultJson === 'string'
          ? JSON.parse(statusData.data.resultJson)
          : statusData.data.resultJson;
        videoUrl = parsedResult.resultUrls?.[0];
      } catch (error) {
        console.error("Failed to parse resultJson:", error);
      }
    }

    if (!videoUrl) {
      throw new Error("No video URL in completed task");
    }
    console.log("Video completed, URL:", videoUrl);

    await supabase
      .from("influencers")
      .update({
        intro_video_url: videoUrl,
        creation_status: 'creating_profile_image'
      })
      .eq("id", influencer_id);

    console.log("Starting profile image generation...");

    const profilePrompt = buildProfileImagePrompt(influencer);

    const profileImageResponse = await fetch(
      `${supabaseUrl}/functions/v1/influencer-image`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          influencerId: influencer_id,
          prompt: profilePrompt,
          type: 'profile'
        }),
      }
    );

    if (!profileImageResponse.ok) {
      const errorText = await profileImageResponse.text();
      console.error("Failed to create profile image task:", errorText);
      throw new Error(`Profile image generation failed: ${errorText}`);
    }

    const profileData = await profileImageResponse.json();

    console.log("Profile image response:", profileData);

    const taskId = profileData.task_id || profileData.taskId;

    if (!taskId) {
      console.error("No task_id in response:", profileData);
      throw new Error("Profile image task created but no task_id returned");
    }

    console.log("Profile task created:", taskId);

    await supabase
      .from("influencers")
      .update({
        profile_image_task_id: taskId,
      })
      .eq("id", influencer_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'creating_profile_image',
        profile_task_id: taskId,
        message: 'Video ready. Creating profile image.'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in process-influencer-intro-video:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});