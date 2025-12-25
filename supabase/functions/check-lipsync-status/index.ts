import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { taskId } = await req.json();

    if (!taskId) {
      throw new Error("Missing taskId");
    }

    // Get task from database
    const { data: task, error: taskError } = await supabase
      .from("lipsync_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) {
      throw new Error("Task not found");
    }

    // If already completed or failed, return current status
    if (task.status === "completed" || task.status === "failed") {
      return new Response(
        JSON.stringify({
          success: true,
          status: task.status,
          resultVideoUrl: task.result_video_url,
          errorMessage: task.error_message,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!task.task_id) {
      throw new Error("Task ID from Newport AI not found");
    }

    const newportApiKey = Deno.env.get("NEWPORT_API_KEY");
    if (!newportApiKey) {
      throw new Error("Newport API key not configured");
    }

    // Poll Newport AI for status using correct endpoint
    const pollingResponse = await fetch("https://api.newportai.com/api/getAsyncResult", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${newportApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: task.task_id,
      }),
    });

    if (!pollingResponse.ok) {
      const errorText = await pollingResponse.text();
      console.error("Newport polling error:", errorText);
      throw new Error("Failed to check lipsync status");
    }

    const responseText = await pollingResponse.text();
    console.log("Newport polling response:", responseText);

    if (!responseText || responseText.trim() === '') {
      console.log("Empty response from Newport, task still processing");
      return new Response(
        JSON.stringify({
          success: true,
          status: "processing",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let pollingData;
    try {
      pollingData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Newport response:", parseError);
      return new Response(
        JSON.stringify({
          success: true,
          status: "processing",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (pollingData.code !== 0) {
      console.error("Newport API error code:", pollingData.code, pollingData.message);
      throw new Error(pollingData.message || "Failed to check lipsync status");
    }

    // Check task status according to Newport AI documentation
    // status: 1=submitted, 2=processing, 3=success, 4=failed
    const taskStatus = pollingData.data?.task?.status;
    const taskReason = pollingData.data?.task?.reason || "";

    console.log("Newport task status:", taskStatus, "reason:", taskReason);

    if (taskStatus === 3) {
      // Task completed successfully
      if (pollingData.data?.videos && pollingData.data.videos.length > 0) {
        const videoUrl = pollingData.data.videos[0].videoUrl;
        console.log("Task completed, video URL:", videoUrl);

        await supabase
          .from("lipsync_tasks")
          .update({
            status: "completed",
            result_video_url: videoUrl,
          })
          .eq("id", taskId);

        return new Response(
          JSON.stringify({
            success: true,
            status: "completed",
            resultVideoUrl: videoUrl,
            newportData: pollingData.data,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        console.error("Task status is 3 (success) but no videos found");
        throw new Error("Task completed but no video URL available");
      }
    }

    if (taskStatus === 4) {
      // Task failed
      const errorMessage = taskReason || "Unknown error";
      console.log("Task failed:", errorMessage);

      await supabase
        .from("lipsync_tasks")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", taskId);

      return new Response(
        JSON.stringify({
          success: true,
          status: "failed",
          errorMessage,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Status 1 (submitted) or 2 (processing) - still processing
    console.log("Task still processing, status:", taskStatus);
    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in check-lipsync-status:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
