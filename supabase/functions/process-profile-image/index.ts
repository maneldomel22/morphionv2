import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    if (!influencer.profile_image_url) {
      throw new Error("Profile image URL not yet available");
    }

    console.log("Creating bodymap using profile image as reference:", influencer.profile_image_url);

    await supabase
      .from("influencers")
      .update({
        creation_status: 'creating_bodymap'
      })
      .eq("id", influencer_id);

    const bodymapPrompt = buildBodymapPrompt(influencer, influencer.profile_image_url);

    const bodymapResponse = await fetch(
      `${supabaseUrl}/functions/v1/influencer-image`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          influencerId: influencer_id,
          prompt: bodymapPrompt,
          referenceImage: influencer.profile_image_url,
          type: 'bodymap'
        }),
      }
    );

    if (!bodymapResponse.ok) {
      const errorText = await bodymapResponse.text();
      console.error("Failed to create bodymap task:", errorText);
      throw new Error(`Bodymap generation failed: ${errorText}`);
    }

    const bodymapData = await bodymapResponse.json();

    console.log("Bodymap response:", bodymapData);

    const bodymapTaskId = bodymapData.task_id || bodymapData.taskId;

    if (!bodymapTaskId) {
      console.error("No task_id in bodymap response:", bodymapData);
      throw new Error("Bodymap task created but no task_id returned");
    }

    console.log("Bodymap task created:", bodymapTaskId);

    await supabase
      .from("influencers")
      .update({
        bodymap_task_id: bodymapTaskId,
      })
      .eq("id", influencer_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'creating_bodymap',
        profile_image_url: influencer.profile_image_url,
        bodymap_task_id: bodymapTaskId,
        message: 'Creating bodymap using profile as reference.'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in process-profile-image:", error);

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