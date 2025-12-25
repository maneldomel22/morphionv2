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
    const { model, text, voiceSettings, audioSettings, pronunciationDict, languageBoost, voiceModify } = await req.json();

    if (!model || !text) {
      return new Response(
        JSON.stringify({ error: "model and text are required" }),
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

    const requestBody: Record<string, any> = {
      model,
      text,
    };

    if (voiceSettings) {
      requestBody.voice_setting = voiceSettings;
    }

    if (audioSettings) {
      requestBody.audio_setting = audioSettings;
    }

    if (pronunciationDict) {
      requestBody.pronunciation_dict = pronunciationDict;
    }

    if (languageBoost) {
      requestBody.language_boost = languageBoost;
    }

    if (voiceModify) {
      requestBody.voice_modify = voiceModify;
    }

    const response = await fetch("https://api.minimax.io/v1/t2a_async_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${minimaxApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("MiniMax API Error:", errorData);
      throw new Error(`MiniMax API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp?.status_msg || "TTS task creation failed");
    }

    return new Response(
      JSON.stringify({
        taskId: data.task_id,
        fileId: data.file_id,
        taskToken: data.task_token,
        usageCharacters: data.usage_characters,
        statusCode: data.base_resp.status_code,
        statusMsg: data.base_resp.status_msg,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating TTS task:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});