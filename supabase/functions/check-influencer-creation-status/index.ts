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
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Current influencer status: ${currentStatus}, video_task: ${influencer.intro_video_task_id || 'none'}, profile_task: ${influencer.profile_image_task_id || 'none'}, bodymap_task: ${influencer.bodymap_task_id || 'none'}`);

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

      if (videoStatus.state === 'success') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Video completed (task_id: ${influencer.intro_video_task_id}), calling process-influencer-intro-video...`);
        try {
          const processResponse = await fetch(
            `${supabaseUrl}/functions/v1/process-influencer-intro-video`,
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
            const processData = await processResponse.json();

            // Recarregar dados do banco para pegar task IDs atualizados
            const { data: updatedInfluencer, error: reloadError } = await supabase
              .from("influencers")
              .select("*")
              .eq("id", influencer_id)
              .single();

            if (reloadError) {
              console.error(`[${timestamp}] Failed to reload influencer:`, reloadError);
            } else {
              console.log(`[${timestamp}] Influencer reloaded, profile_image_task_id: ${updatedInfluencer?.profile_image_task_id}`);
            }

            return new Response(
              JSON.stringify({
                success: true,
                status: processData.status || 'creating_profile_image',
                influencer: updatedInfluencer || influencer,
                progress: 40,
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
          console.error(`[${timestamp}] Error calling process-influencer-intro-video:`, error);
        }
      }

      const timestamp2 = new Date().toISOString();
      console.log(`[${timestamp2}] Video still processing, KIE state: ${videoStatus.state}`);
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

    if (currentStatus === 'creating_profile_image' && influencer.profile_image_task_id) {
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

      const timestamp3 = new Date().toISOString();
      console.log(`[${timestamp3}] Profile image still processing, KIE state: ${profileStatus.state}`);
      return new Response(
        JSON.stringify({
          success: true,
          status: 'creating_profile_image',
          influencer,
          progress: 50,
          kieState: profileStatus.state
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // When profile completes, check if we can move to bodymap
    if (currentStatus === 'creating_profile_image' && influencer.profile_image_url && !influencer.bodymap_task_id) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Profile ready, creating bodymap using profile as reference...`);

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
          const processData = await processResponse.json();

          const { data: updatedInfluencer, error: reloadError } = await supabase
            .from("influencers")
            .select("*")
            .eq("id", influencer_id)
            .single();

          if (reloadError) {
            console.error(`[${timestamp}] Failed to reload influencer:`, reloadError);
          } else {
            console.log(`[${timestamp}] Bodymap task created: ${updatedInfluencer?.bodymap_task_id}`);
          }

          return new Response(
            JSON.stringify({
              success: true,
              status: processData.status || 'creating_bodymap',
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
        console.error(`[${timestamp}] Error calling process-profile-image:`, error);
      }

      // If we couldn't create bodymap, stay in this state and retry next poll
      return new Response(
        JSON.stringify({
          success: true,
          status: 'profile_ready_for_bodymap',
          influencer,
          progress: 60,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (currentStatus === 'creating_bodymap' && influencer.bodymap_task_id) {
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

      const timestamp4 = new Date().toISOString();
      console.log(`[${timestamp4}] Bodymap still processing, KIE state: ${bodymapStatus.state}`);
      return new Response(
        JSON.stringify({
          success: true,
          status: 'creating_bodymap',
          influencer,
          progress: 75,
          kieState: bodymapStatus.state
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (currentStatus === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
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
