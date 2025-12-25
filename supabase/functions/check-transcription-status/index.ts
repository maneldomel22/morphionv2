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
    const { assemblyId } = await req.json();

    if (!assemblyId) {
      return new Response(
        JSON.stringify({ error: "assemblyId is required" }),
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

    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${assemblyId}`,
      {
        method: "GET",
        headers: {
          authorization: assemblyApiKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AssemblyAI API Error:", errorData);
      throw new Error(`AssemblyAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    const result: Record<string, any> = {
      status: data.status,
      assemblyId: data.id,
    };

    if (data.status === "completed") {
      result.text = data.text;
      result.languageCode = data.language_code;
      result.audioDuration = data.audio_duration;
      result.confidence = data.confidence;
      result.speechModelUsed = data.speech_model || "universal";

      if (data.words && Array.isArray(data.words)) {
        result.wordsCount = data.words.length;
      }
    } else if (data.status === "error") {
      result.errorMessage = data.error;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking transcription status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});