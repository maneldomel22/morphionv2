import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: tasks, error: tasksError } = await supabaseClient
      .from("tts_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_status", "completed")
      .is("audio_url", null)
      .not("file_id", "is", null);

    if (tasksError) throw tasksError;

    const minimaxApiKey = Deno.env.get("MINIMAX_API_KEY");
    if (!minimaxApiKey) {
      throw new Error("MINIMAX_API_KEY not configured");
    }

    const updated = [];
    const failed = [];

    for (const task of tasks || []) {
      try {
        const fileUrl = new URL("https://api.minimax.io/v1/files/retrieve");
        fileUrl.searchParams.append("file_id", task.file_id);

        const fileResponse = await fetch(fileUrl.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${minimaxApiKey}`,
          },
        });

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          if (fileData.file?.download_url) {
            const { error: updateError } = await supabaseClient
              .from("tts_tasks")
              .update({ audio_url: fileData.file.download_url })
              .eq("id", task.id);

            if (!updateError) {
              updated.push(task.id);
            } else {
              failed.push({ id: task.id, error: updateError.message });
            }
          }
        }
      } catch (error) {
        failed.push({ id: task.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updated.length,
        failed: failed.length,
        details: { updated, failed },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating TTS tasks:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});