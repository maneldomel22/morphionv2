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
    console.log("Current influencer status:", currentStatus);

    if (currentStatus === 'ready') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'ready',
          influencer,
          progress: 100
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (currentStatus === 'failed') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'failed',
          influencer,
          progress: 0
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (currentStatus === 'creating_video' && influencer.intro_video_task_id) {
      const videoStatus = await checkKieTaskStatus(influencer.intro_video_task_id, kieApiKey);

      if (videoStatus.state === 'fail') {
        await supabase
          .from("influencers")
          .update({ creation_status: 'failed' })
          .eq("id", influencer_id);

        return new Response(
          JSON.stringify({
            success: true,
            status: 'failed',
            influencer: { ...influencer, creation_status: 'failed' },
            progress: 0
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
          status: 'creating_video',
          influencer,
          progress: 25,
          kieState: videoStatus.state
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (currentStatus === 'extracting_frame' || currentStatus === 'creating_profile_image') {
      return new Response(
        JSON.stringify({
          success: true,
          status: currentStatus,
          influencer,
          progress: 50
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (currentStatus === 'optimizing_identity') {
      let allReady = true;

      if (influencer.profile_image_task_id) {
        const profileStatus = await checkKieTaskStatus(influencer.profile_image_task_id, kieApiKey);

        if (profileStatus.state === 'fail') {
          await supabase
            .from("influencers")
            .update({ creation_status: 'failed' })
            .eq("id", influencer_id);

          return new Response(
            JSON.stringify({
              success: true,
              status: 'failed',
              influencer: { ...influencer, creation_status: 'failed' },
              progress: 0
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        if (profileStatus.state === 'success' && profileStatus.resultUrls.length > 0 && !influencer.profile_image_url) {
          await supabase
            .from("influencers")
            .update({
              profile_image_url: profileStatus.resultUrls[0],
              image_url: profileStatus.resultUrls[0]
            })
            .eq("id", influencer_id);

          influencer.profile_image_url = profileStatus.resultUrls[0];
          influencer.image_url = profileStatus.resultUrls[0];
        }

        if (profileStatus.state !== 'success') {
          allReady = false;
        }
      }

      if (influencer.bodymap_task_id) {
        const bodymapStatus = await checkKieTaskStatus(influencer.bodymap_task_id, kieApiKey);

        if (bodymapStatus.state === 'fail') {
          await supabase
            .from("influencers")
            .update({ creation_status: 'failed' })
            .eq("id", influencer_id);

          return new Response(
            JSON.stringify({
              success: true,
              status: 'failed',
              influencer: { ...influencer, creation_status: 'failed' },
              progress: 0
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        if (bodymapStatus.state === 'success' && bodymapStatus.resultUrls.length > 0 && !influencer.bodymap_url) {
          await supabase
            .from("influencers")
            .update({ bodymap_url: bodymapStatus.resultUrls[0] })
            .eq("id", influencer_id);

          influencer.bodymap_url = bodymapStatus.resultUrls[0];
        }

        if (bodymapStatus.state !== 'success') {
          allReady = false;
        }
      }

      if (allReady && influencer.profile_image_url && influencer.bodymap_url) {
        await supabase
          .from("influencers")
          .update({ creation_status: 'ready' })
          .eq("id", influencer_id);

        influencer.creation_status = 'ready';

        return new Response(
          JSON.stringify({
            success: true,
            status: 'ready',
            influencer,
            progress: 100
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
          influencer,
          progress: 75
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
        status: currentStatus,
        influencer,
        progress: 10
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
