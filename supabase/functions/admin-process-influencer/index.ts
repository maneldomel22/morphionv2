import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function checkKieTaskStatus(taskId: string, kieApiKey: string) {
  const response = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
    {
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to check task ${taskId}`);
  }

  const data = await response.json();
  return data;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { influencer_id } = await req.json();

    if (!influencer_id) {
      throw new Error("Missing influencer_id");
    }

    console.log("Admin processing influencer:", influencer_id);

    const { data: influencer, error: fetchError } = await supabase
      .from("influencers")
      .select("*")
      .eq("id", influencer_id)
      .single();

    if (fetchError || !influencer) {
      throw new Error("Influencer not found");
    }

    console.log("Influencer status:", influencer.creation_status);
    console.log("Video task ID:", influencer.intro_video_task_id);

    if (!influencer.intro_video_task_id) {
      throw new Error("No intro video task ID found");
    }

    const videoResult = await checkKieTaskStatus(influencer.intro_video_task_id, kieApiKey);

    if (videoResult.code !== 200) {
      throw new Error(`KIE API error: ${videoResult.msg || 'Unknown error'}`);
    }

    const videoState = videoResult.data?.state;
    console.log("Video state:", videoState);

    if (videoState !== 'success') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Video not ready yet. Current state: ${videoState}`,
          state: videoState
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let resultUrls: string[] = [];
    if (videoResult.data?.resultJson) {
      try {
        const parsedResult = typeof videoResult.data.resultJson === 'string'
          ? JSON.parse(videoResult.data.resultJson)
          : videoResult.data.resultJson;
        resultUrls = parsedResult.resultUrls || [];
      } catch (error) {
        console.error("Failed to parse resultJson:", error);
      }
    }

    if (resultUrls.length === 0) {
      throw new Error("No video URL found in result");
    }

    const videoUrl = resultUrls[0];
    console.log("Video URL:", videoUrl);

    await supabase
      .from("influencers")
      .update({
        intro_video_url: videoUrl,
        creation_status: 'creating_profile_image'
      })
      .eq("id", influencer_id);

    const identity = influencer.identity_profile || {};
    const profilePrompt = `Professional portrait photo.

SUBJECT:
${identity.ethnicity || 'woman'} woman, ${identity.age || '25'} years old.
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

    const bodymapPrompt = `Full body reference photo for character consistency.

SUBJECT:
${identity.ethnicity || 'woman'} woman, ${identity.age || '25'} years old.
Face: ${identity.facial_traits || 'attractive features'}
Hair: ${identity.hair || 'long hair'}
Body: ${identity.body || 'fit body'}
Body marks: ${identity.marks || 'none'}

POSE:
Standing straight. Arms slightly away from body. Neutral pose. Front-facing.

ATTIRE:
Form-fitting neutral clothing that shows body shape clearly. Tank top and fitted shorts.

BACKGROUND:
Plain solid neutral background. No props. No context.

LIGHTING:
Even soft lighting. Full body clearly visible. No harsh shadows.

PURPOSE:
This is a reference map for maintaining body consistency across future generations. Include all distinguishing marks and features.

STYLE:
Realistic. Natural. Clean reference photo quality.`;

    const [profileResponse, bodymapResponse] = await Promise.all([
      fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nano-banana-pro",
          input: {
            prompt: profilePrompt,
            aspect_ratio: "1:1",
            quality: "high"
          }
        }),
      }),
      fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nano-banana-pro",
          input: {
            prompt: bodymapPrompt,
            aspect_ratio: "9:16",
            quality: "high"
          }
        }),
      })
    ]);

    const profileData = await profileResponse.json();
    const bodymapData = await bodymapResponse.json();

    if (profileData.code !== 200 || !profileData.data?.taskId) {
      throw new Error("Failed to create profile image task");
    }

    if (bodymapData.code !== 200 || !bodymapData.data?.taskId) {
      throw new Error("Failed to create bodymap task");
    }

    const profileTaskId = profileData.data.taskId;
    const bodymapTaskId = bodymapData.data.taskId;

    console.log("Profile task:", profileTaskId);
    console.log("Bodymap task:", bodymapTaskId);

    await supabase
      .from("influencers")
      .update({
        profile_image_task_id: profileTaskId,
        bodymap_task_id: bodymapTaskId,
        creation_status: 'creating_profile_image'
      })
      .eq("id", influencer_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile and bodymap tasks created",
        video_url: videoUrl,
        profile_task_id: profileTaskId,
        bodymap_task_id: bodymapTaskId,
        status: 'creating_profile_image'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in admin-process-influencer:", error);
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
