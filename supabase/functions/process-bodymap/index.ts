import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    if (!influencer.bodymap_task_id) {
      throw new Error("No bodymap task ID found");
    }

    console.log("Checking bodymap status for task:", influencer.bodymap_task_id);

    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${influencer.bodymap_task_id}`,
      {
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error("Failed to check bodymap status");
    }

    const statusData = await statusResponse.json();

    if (statusData.code !== 200) {
      throw new Error(`KIE API error: ${statusData.msg || 'Unknown error'}`);
    }

    const taskState = statusData.data?.state;
    console.log("Bodymap status:", taskState);

    if (taskState !== "success") {
      return new Response(
        JSON.stringify({
          success: true,
          status: taskState,
          message: "Bodymap still processing"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let bodymapUrl: string | undefined;
    if (statusData.data?.resultJson) {
      try {
        const parsedResult = typeof statusData.data.resultJson === 'string'
          ? JSON.parse(statusData.data.resultJson)
          : statusData.data.resultJson;
        bodymapUrl = parsedResult.resultUrls?.[0];
      } catch (error) {
        console.error("Failed to parse resultJson:", error);
      }
    }

    if (!bodymapUrl) {
      throw new Error("No bodymap URL in completed task");
    }

    console.log("Bodymap completed, URL:", bodymapUrl);

    await supabase
      .from("influencers")
      .update({
        bodymap_url: bodymapUrl,
        creation_status: 'completed'
      })
      .eq("id", influencer_id);

    console.log("Influencer creation completed!");

    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        bodymap_url: bodymapUrl,
        message: 'Influencer creation completed!'
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in process-bodymap:", error);

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
