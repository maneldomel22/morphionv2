import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function buildBodymapPrompt(influencer: any, referenceUrl: string): string {
  const identity = influencer.identity_profile || {};

  return `Full body reference photo for character consistency.

REFERENCE IMAGE:
Use the face from the reference image as the FACE AUTHORITY. Match it exactly.

SUBJECT:
${identity.ethnicity || 'woman'} woman, ${influencer.age || '25'} years old.
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