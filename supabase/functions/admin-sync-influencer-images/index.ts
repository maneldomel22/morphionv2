import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function buildBodymapPrompt(influencer: any, referenceUrl: string): string {
  const identity = influencer.identity_profile || {};

  const ethnicity = identity.ethnicity || 'woman';
  const facialTraits = identity.facial_traits || 'attractive features';
  const hairDesc = identity.hair || 'long hair';
  const bodyDesc = identity.body || 'fit body';
  const marksDesc = identity.marks || 'none';

  return `Create a high-resolution CHARACTER IDENTITY MAP image.

The image must be a clean studio composite grid showing the SAME woman multiple times,
each panel documenting a specific physical aspect for long-term identity consistency.

REFERENCE IMAGE:
Use the provided reference image as the FACE AUTHORITY. Match the face EXACTLY in all panels.

STYLE & QUALITY:
- Ultra-realistic photography
- Neutral studio background (light gray)
- Soft, even studio lighting
- No dramatic shadows
- No artistic styling
- No fashion posing
- Documentary / reference style
- Clean, clinical, identity-focused

GRID LAYOUT (MANDATORY – SINGLE IMAGE):

Panel 1: Full body – front view
Panel 2: Full body – back view
Panel 3: Face close-up – neutral expression
Panel 4: Upper torso close-up (chest & abdomen)
Panel 5: Left arm close-up
Panel 6: Right arm close-up
Panel 7: Legs close-up (thighs & calves)
Panel 8: Back close-up (upper and lower back)
Panel 9: Detail panel highlighting permanent body marks

SUBJECT DESCRIPTION (LOCKED):

Gender: Female
Age: ${influencer.age || '25'}
Ethnicity: ${ethnicity}

Facial features: ${facialTraits}

Hair: ${hairDesc}

Body: ${bodyDesc}

ATTIRE (CRITICAL):
Fitted sports top and short athletic shorts. The clothing must show body shape clearly and reveal potential body marks on arms, legs, torso, and back.

PERMANENT BODY MARKS:
${marksDesc}

All panels must depict the SAME person with PERFECT consistency.
This image will be used as a permanent identity reference for future image and video generation.

Do NOT:
- Change proportions between panels
- Add or remove marks
- Stylize the body
- Alter identity across panels
- Use artistic filters or effects

CRITICAL: Every panel shows the exact same woman with identical physical features, body proportions, and permanent marks.
This is a comprehensive identity documentation image, not a fashion or portrait photoshoot.`;
}

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

  if (data.code !== 200) {
    throw new Error(`KIE API error for task ${taskId}: ${data.msg || 'Unknown error'}`);
  }

  let resultUrls: string[] = [];
  if (data.data?.state === 'success' && data.data?.resultJson) {
    try {
      const parsedResult = typeof data.data.resultJson === 'string'
        ? JSON.parse(data.data.resultJson)
        : data.data.resultJson;
      resultUrls = parsedResult.resultUrls || [];
    } catch (error) {
      console.error(`Failed to parse resultJson for task ${taskId}:`, error);
    }
  }

  return {
    state: data.data?.state,
    resultUrls,
    failCode: data.data?.failCode,
    failMsg: data.data?.failMsg,
  };
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

    // Get all influencers in creation status (not ready or failed)
    const { data: influencers, error: fetchError } = await supabase
      .from("influencers")
      .select("*")
      .in('creation_status', ['creating_video', 'extracting_frame', 'creating_profile_image', 'creating_bodymap', 'optimizing_identity']);

    if (fetchError) {
      throw fetchError;
    }

    const results = [];

    for (const influencer of influencers || []) {
      const result: any = {
        id: influencer.id,
        name: influencer.name,
        status: influencer.creation_status,
        updated: false
      };

      // Check profile image task
      if (influencer.profile_image_task_id && !influencer.profile_image_url) {
        try {
          const profileStatus = await checkKieTaskStatus(influencer.profile_image_task_id, kieApiKey);
          result.profileTaskState = profileStatus.state;

          if (profileStatus.state === 'success' && profileStatus.resultUrls.length > 0) {
            const profileImageUrl = profileStatus.resultUrls[0];

            // Update influencer
            await supabase
              .from("influencers")
              .update({
                profile_image_url: profileImageUrl,
                image_url: profileImageUrl
              })
              .eq("id", influencer.id);

            // Update generated_images if exists
            await supabase
              .from("generated_images")
              .update({
                status: 'completed',
                image_url: profileImageUrl
              })
              .eq("task_id", influencer.profile_image_task_id);

            result.profileImageUrl = profileImageUrl;
            result.updated = true;
            result.profileJustCompleted = true;
          }
        } catch (error) {
          result.profileError = error.message;
        }
      }

      // If profile just completed and no bodymap task yet, create bodymap
      console.log(`Checking bodymap creation: profileJustCompleted=${result.profileJustCompleted}, bodymap_task_id=${influencer.bodymap_task_id}`);
      if (result.profileJustCompleted && !influencer.bodymap_task_id) {
        try {
          console.log(`Profile completed for ${influencer.name}, creating bodymap...`);

          const bodymapPrompt = buildBodymapPrompt(influencer, result.profileImageUrl);

          const bodymapResponse = await fetch(
            `https://api.kie.ai/api/v1/jobs/cny-image-generate`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${kieApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt: bodymapPrompt,
                model: "flux-1.1-pro-ultra",
                imageUrl: result.profileImageUrl,
                aspectRatio: "1:1",
                raw: true,
                safeMode: 1,
                callbackUrl: `${supabaseUrl}/functions/v1/kie-callback`
              }),
            }
          );

          if (bodymapResponse.ok) {
            const bodymapData = await bodymapResponse.json();

            if (bodymapData.code === 200 && bodymapData.data?.taskId) {
              const bodymapTaskId = bodymapData.data.taskId;

              await supabase
                .from("influencers")
                .update({
                  bodymap_task_id: bodymapTaskId,
                  creation_status: 'creating_bodymap'
                })
                .eq("id", influencer.id);

              // Create generated_images record for bodymap
              await supabase
                .from("generated_images")
                .insert({
                  user_id: influencer.user_id,
                  influencer_id: influencer.id,
                  task_id: bodymapTaskId,
                  prompt: bodymapPrompt,
                  original_prompt: bodymapPrompt,
                  image_type: 'bodymap',
                  image_engine: 'flux-1.1-pro-ultra',
                  status: 'generating'
                });

              result.bodymapTaskId = bodymapTaskId;
              result.bodymapCreated = true;
              result.status = 'creating_bodymap';
            }
          }
        } catch (error) {
          console.error(`Failed to create bodymap for ${influencer.name}:`, error);
          result.bodymapCreationError = error.message;
        }
      }

      // Check bodymap task if exists
      if (influencer.bodymap_task_id && !influencer.bodymap_url) {
        try {
          const bodymapStatus = await checkKieTaskStatus(influencer.bodymap_task_id, kieApiKey);
          result.bodymapTaskState = bodymapStatus.state;

          if (bodymapStatus.state === 'success' && bodymapStatus.resultUrls.length > 0) {
            const bodymapUrl = bodymapStatus.resultUrls[0];

            // Update influencer
            await supabase
              .from("influencers")
              .update({ bodymap_url: bodymapUrl })
              .eq("id", influencer.id);

            // Update generated_images if exists
            await supabase
              .from("generated_images")
              .update({
                status: 'completed',
                image_url: bodymapUrl
              })
              .eq("task_id", influencer.bodymap_task_id);

            result.bodymapUrl = bodymapUrl;
            result.updated = true;
          }
        } catch (error) {
          result.bodymapError = error.message;
        }
      }

      // Check if ready
      if (result.updated && result.profileImageUrl && result.bodymapUrl) {
        await supabase
          .from("influencers")
          .update({ creation_status: 'ready' })
          .eq("id", influencer.id);

        result.status = 'ready';
      }

      results.push(result);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: influencers?.length || 0,
        results
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in admin-sync-influencer-images:", error);
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
