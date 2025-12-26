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
      .update({ intro_video_url: videoUrl })
      .eq("id", influencer_id);

    // Check if reference_frame_url already exists
    if (influencer.reference_frame_url) {
      console.log("Reference frame already exists, skipping to profile/bodymap creation");
      const referenceFrameUrl = influencer.reference_frame_url;

      const identity = influencer.identity_profile || {};
      const profilePrompt = `Professional portrait photo.

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

SUBJECT:
${identity.ethnicity || 'woman'} woman, ${identity.age || '25'} years old.
Face: ${identity.facial_traits || 'attractive features'}
Hair: ${identity.hair || 'long hair'}

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

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

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
              referenceImage: referenceFrameUrl,
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
              referenceImage: referenceFrameUrl,
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

      await supabase
        .from("influencers")
        .update({
          profile_image_task_id: profileTaskId,
          bodymap_task_id: bodymapTaskId,
          creation_status: 'optimizing_identity'
        })
        .eq("id", influencer_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Tasks created from existing reference",
          video_url: videoUrl,
          reference_frame_url: referenceFrameUrl,
          profile_task_id: profileTaskId,
          bodymap_task_id: bodymapTaskId,
          status: 'optimizing_identity'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const identity = influencer.identity_profile || {};
    const referencePrompt = `Professional reference portrait photo.

Character identity:
${identity.ethnicity || 'woman'} woman, ${identity.age || '25'} years old.
Face: ${identity.facial_traits || 'attractive features'}
Hair: ${identity.hair || 'long hair'}

This is a reference image that matches the character from a video.

FRAMING:
Close-up portrait. Head and shoulders. Front-facing.

POSE:
Neutral relaxed expression. Direct eye contact. Slight natural smile.

BACKGROUND:
Solid neutral background. Clean and simple.

LIGHTING:
Soft even lighting. Professional but natural.

STYLE:
Natural skin texture. Realistic. Clean reference photo quality.`;

    const refImageResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nano-banana-pro",
        input: {
          prompt: referencePrompt,
          aspect_ratio: "1:1",
          quality: "high"
        }
      }),
    });

    const refImageData = await refImageResponse.json();

    if (refImageData.code !== 200 || !refImageData.data?.taskId) {
      throw new Error("Failed to create reference image");
    }

    const referenceTaskId = refImageData.data.taskId;
    console.log("Reference image task created:", referenceTaskId);

    await new Promise(resolve => setTimeout(resolve, 20000));

    const refCheckResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${referenceTaskId}`,
      {
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
        },
      }
    );

    const refCheckData = await refCheckResponse.json();
    let referenceFrameUrl: string | undefined;

    if (refCheckData.code === 200 && refCheckData.data?.state === 'success' && refCheckData.data?.resultJson) {
      try {
        const parsedResult = typeof refCheckData.data.resultJson === 'string'
          ? JSON.parse(refCheckData.data.resultJson)
          : refCheckData.data.resultJson;
        referenceFrameUrl = parsedResult.resultUrls?.[0];
      } catch (error) {
        console.error("Failed to parse reference resultJson:", error);
      }
    }

    if (!referenceFrameUrl) {
      console.log("Reference image not ready yet, will need to retry");
      await supabase
        .from("influencers")
        .update({ creation_status: 'creating_profile_image' })
        .eq("id", influencer_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Reference image still processing",
          video_url: videoUrl,
          reference_task_id: referenceTaskId,
          status: 'creating_profile_image'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Reference image ready:", referenceFrameUrl);

    await supabase
      .from("influencers")
      .update({
        reference_frame_url: referenceFrameUrl,
        creation_status: 'optimizing_identity'
      })
      .eq("id", influencer_id);

    const profilePrompt = `Professional portrait photo.

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

SUBJECT:
${identity.ethnicity || 'woman'} woman, ${identity.age || '25'} years old.
Face: ${identity.facial_traits || 'attractive features'}
Hair: ${identity.hair || 'long hair'}

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

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

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
            referenceImage: referenceFrameUrl,
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
            referenceImage: referenceFrameUrl,
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
      })
      .eq("id", influencer_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Processing complete - tasks created",
        video_url: videoUrl,
        reference_frame_url: referenceFrameUrl,
        profile_task_id: profileTaskId,
        bodymap_task_id: bodymapTaskId,
        status: 'optimizing_identity'
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
