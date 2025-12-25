import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: "taskId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const minimaxApiKey = Deno.env.get("MINIMAX_API_KEY");
    if (!minimaxApiKey) {
      throw new Error("MINIMAX_API_KEY not configured");
    }

    const url = new URL("https://api.minimax.io/v1/query/t2a_async_query_v2");
    url.searchParams.append("task_id", taskId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${minimaxApiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("MiniMax API Error:", errorData);
      throw new Error(`MiniMax API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp?.status_msg || "Query failed");
    }

    const status = data.status.toLowerCase();
    let audioUrl = null;

    if (status === 'success' && data.file_id) {
      const fileUrl = new URL("https://api.minimax.io/v1/files/retrieve");
      fileUrl.searchParams.append("file_id", data.file_id.toString());

      const fileResponse = await fetch(fileUrl.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${minimaxApiKey}`,
        },
      });

      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        if (fileData.file?.download_url) {
          audioUrl = fileData.file.download_url;
        }
      }
    }

    return new Response(
      JSON.stringify({
        taskId: data.task_id,
        status: status,
        fileId: data.file_id,
        audioUrl: audioUrl,
        statusCode: data.base_resp.status_code,
        statusMsg: data.base_resp.status_msg,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error querying TTS task:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});