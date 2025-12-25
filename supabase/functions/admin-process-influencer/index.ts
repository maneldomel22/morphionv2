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

    // Check video status
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

    // Call process function
    const processResponse = await fetch(
      `${supabaseUrl}/functions/v1/process-influencer-intro-video`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ influencer_id }),
      }
    );

    const processResult = await processResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Processing triggered",
        video_url: videoUrl,
        process_result: processResult
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
