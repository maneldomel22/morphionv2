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

    if (influencer.creation_status === 'ready') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'ready',
          influencer
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (influencer.creation_status === 'creating_video') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'creating_video',
          message: 'Video generation in progress'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (influencer.creation_status === 'extracting_frame') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'extracting_frame',
          message: 'Extracting reference frame'
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (influencer.creation_status === 'optimizing_identity') {
      const { data: profilePost } = await supabase
        .from("influencer_posts")
        .select("*")
        .eq("influencer_id", influencer_id)
        .eq("type", "profile")
        .maybeSingle();

      const { data: bodymapPost } = await supabase
        .from("influencer_posts")
        .select("*")
        .eq("influencer_id", influencer_id)
        .eq("type", "bodymap")
        .maybeSingle();

      const profileReady = profilePost?.status === 'completed';
      const bodymapReady = bodymapPost?.status === 'completed';

      if (profileReady && bodymapReady) {
        await supabase
          .from("influencers")
          .update({
            creation_status: 'ready',
            profile_image: profilePost.image_url,
            visual_map: bodymapPost.image_url,
            creation_metadata: {
              ...influencer.creation_metadata,
              completed_at: new Date().toISOString()
            }
          })
          .eq("id", influencer_id);

        const { data: updatedInfluencer } = await supabase
          .from("influencers")
          .select("*")
          .eq("id", influencer_id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            status: 'ready',
            influencer: updatedInfluencer
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'optimizing_identity',
          progress: {
            profile_ready: profileReady,
            bodymap_ready: bodymapReady
          }
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: influencer.creation_status
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
