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
    const { transcriptionId, audioUrl, speechModels } = await req.json();

    if (!transcriptionId || !audioUrl) {
      return new Response(
        JSON.stringify({ error: "transcriptionId and audioUrl are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const assemblyApiKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!assemblyApiKey) {
      throw new Error("ASSEMBLYAI_API_KEY not configured");
    }

    const requestBody: Record<string, any> = {
      audio_url: audioUrl,
      language_detection: true,
    };

    if (speechModels && Array.isArray(speechModels) && speechModels.length > 0) {
      requestBody.speech_models = speechModels;
    }

    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: assemblyApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AssemblyAI API Error:", errorData);
      throw new Error(`AssemblyAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        assemblyId: data.id,
        status: data.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error starting transcription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});