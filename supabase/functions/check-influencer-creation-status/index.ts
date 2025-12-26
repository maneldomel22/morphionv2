import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
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

    const currentStatus = influencer.creation_status;
    console.log(`Influencer ${influencer_id} current status: ${currentStatus}`);

    // Map status to progress percentage
    const progressMap: Record<string, number> = {
      'creating_video': 25,
      'creating_profile_image': 50,
      'profile_ready_for_bodymap': 60,
      'creating_bodymap': 75,
      'ready': 100,
      'completed': 100,
      'failed': 0,
    };

    const progress = progressMap[currentStatus] || 10;

    // If profile is ready and bodymap hasn't been started, trigger bodymap creation
    if (currentStatus === 'profile_ready_for_bodymap' && !influencer.bodymap_task_id) {
      console.log(`Profile ready for influencer ${influencer_id}, creating bodymap...`);

      try {
        const processResponse = await fetch(
          `${supabaseUrl}/functions/v1/process-profile-image`,
          {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ influencer_id }),
          }
        );

        if (processResponse.ok) {
          // Reload influencer to get updated status
          const { data: updatedInfluencer } = await supabase
            .from("influencers")
            .select("*")
            .eq("id", influencer_id)
            .single();

          return new Response(
            JSON.stringify({
              success: true,
              status: updatedInfluencer?.creation_status || 'creating_bodymap',
              influencer: updatedInfluencer || influencer,
              progress: 65,
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
      } catch (error) {
        console.error(`Error triggering bodymap creation:`, error);
      }
    }

    // Return current status
    return new Response(
      JSON.stringify({
        success: true,
        status: currentStatus,
        influencer,
        progress
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-influencer-creation-status:", error);
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
