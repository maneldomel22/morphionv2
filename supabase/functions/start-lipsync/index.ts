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

    const { srcVideoUrl, audioUrl, videoParams } = await req.json();

    if (!srcVideoUrl || !audioUrl) {
      throw new Error("Missing required fields: srcVideoUrl, audioUrl");
    }

    const newportApiKey = Deno.env.get("NEWPORT_API_KEY");
    if (!newportApiKey) {
      throw new Error("Newport API key not configured");
    }

    // Create task in database first
    const { data: taskData, error: taskError } = await supabase
      .from("lipsync_tasks")
      .insert({
        user_id: user.id,
        src_video_url: srcVideoUrl,
        audio_url: audioUrl,
        video_width: videoParams?.video_width ?? 0,
        video_height: videoParams?.video_height ?? 0,
        video_enhance: videoParams?.video_enhance ?? 0,
        fps: videoParams?.fps ?? "original",
        status: "pending",
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error creating lipsync task:", taskError);
      throw new Error("Failed to create lipsync task");
    }

    // Call Newport AI LipSync API
    const newportResponse = await fetch("https://api.newportai.com/api/async/lipsync", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${newportApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        srcVideoUrl,
        audioUrl,
        videoParams: {
          video_width: videoParams?.video_width ?? 0,
          video_height: videoParams?.video_height ?? 0,
          video_enhance: videoParams?.video_enhance ?? 0,
          fps: videoParams?.fps ?? "original",
        },
      }),
    });

    if (!newportResponse.ok) {
      const errorText = await newportResponse.text();
      console.error("Newport API error:", errorText);

      // Update task status to failed
      await supabase
        .from("lipsync_tasks")
        .update({
          status: "failed",
          error_message: `Newport API error: ${errorText}`,
        })
        .eq("id", taskData.id);

      throw new Error("Failed to start lipsync task");
    }

    const newportData = await newportResponse.json();

    if (newportData.code !== 0) {
      // Update task status to failed
      await supabase
        .from("lipsync_tasks")
        .update({
          status: "failed",
          error_message: newportData.message || "Unknown error from Newport AI",
        })
        .eq("id", taskData.id);

      throw new Error(newportData.message || "Failed to start lipsync task");
    }

    // Update task with Newport task ID
    const { error: updateError } = await supabase
      .from("lipsync_tasks")
      .update({
        task_id: newportData.data.taskId,
        status: "processing",
      })
      .eq("id", taskData.id);

    if (updateError) {
      console.error("Error updating task:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId: taskData.id,
        newportTaskId: newportData.data.taskId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in start-lipsync:", error);
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
