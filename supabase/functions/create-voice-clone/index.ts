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
    const { fileId, voiceId, clonePrompt, text, model, languageBoost, needNoiseReduction, needVolumeNormalization } = await req.json();

    if (!fileId || !voiceId) {
      return new Response(
        JSON.stringify({ error: "fileId and voiceId are required" }),
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
      file_id: fileId,
      voice_id: voiceId,
    };

    if (clonePrompt) {
      requestBody.clone_prompt = clonePrompt;
    }

    if (text) {
      requestBody.text = text;
    }

    if (model) {
      requestBody.model = model;
    }

    if (languageBoost) {
      requestBody.language_boost = languageBoost;
    }

    if (needNoiseReduction !== undefined) {
      requestBody.need_noise_reduction = needNoiseReduction;
    }

    if (needVolumeNormalization !== undefined) {
      requestBody.need_volume_normalization = needVolumeNormalization;
    }

    const response = await fetch("https://api.minimax.io/v1/voice_clone", {
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
      throw new Error(data.base_resp?.status_msg || "Voice cloning failed");
    }

    return new Response(
      JSON.stringify({
        inputSensitive: data.input_sensitive,
        demoAudio: data.demo_audio,
        statusCode: data.base_resp.status_code,
        statusMsg: data.base_resp.status_msg,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating voice clone:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});