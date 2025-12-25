import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
            await supabase
              .from("influencers")
              .update({
                profile_image_url: profileStatus.resultUrls[0],
                image_url: profileStatus.resultUrls[0]
              })
              .eq("id", influencer.id);

            result.profileImageUrl = profileStatus.resultUrls[0];
            result.updated = true;
          }
        } catch (error) {
          result.profileError = error.message;
        }
      }

      // Check bodymap task
      if (influencer.bodymap_task_id && !influencer.bodymap_url) {
        try {
          const bodymapStatus = await checkKieTaskStatus(influencer.bodymap_task_id, kieApiKey);
          result.bodymapTaskState = bodymapStatus.state;

          if (bodymapStatus.state === 'success' && bodymapStatus.resultUrls.length > 0) {
            await supabase
              .from("influencers")
              .update({ bodymap_url: bodymapStatus.resultUrls[0] })
              .eq("id", influencer.id);

            result.bodymapUrl = bodymapStatus.resultUrls[0];
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
