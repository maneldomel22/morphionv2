import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
      throw new Error("taskId is required");
    }

    const kieApiKey = Deno.env.get("KIE_API_KEY");
    if (!kieApiKey) {
      throw new Error("KIE_API_KEY is not configured");
    }

    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("KIE API error:", errorText);
      throw new Error(`KIE API returned status ${response.status}`);
    }

    const data = await response.json();

    let parsedResult = data.data;

    if (data.data?.state === 'success' && data.data?.resultJson) {
      try {
        const resultData = JSON.parse(data.data.resultJson);
        parsedResult = {
          ...data.data,
          images: resultData.resultUrls || [],
          parsedResult: resultData
        };
      } catch (e) {
        console.error('Failed to parse resultJson:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: data.data?.state,
        result: parsedResult,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error checking image status:", error);
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