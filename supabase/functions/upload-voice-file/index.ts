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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const purpose = formData.get("purpose") as string;

    if (!file || !purpose) {
      return new Response(
        JSON.stringify({ error: "file and purpose are required" }),
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

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("purpose", purpose);

    const response = await fetch("https://api.minimax.io/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${minimaxApiKey}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("MiniMax API Error:", errorData);
      throw new Error(`MiniMax API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp?.status_msg || "Upload failed");
    }

    return new Response(
      JSON.stringify({
        fileId: data.file.file_id,
        bytes: data.file.bytes,
        filename: data.file.filename,
        purpose: data.file.purpose,
        createdAt: data.file.created_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error uploading voice file:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});