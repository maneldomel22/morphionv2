import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImageRequest {
  description: string;
  productImageUrl?: string;
  characterImageUrl?: string;
  aspectRatio?: string;
  imageEngine?: string;
  resolution?: string;
  outputFormat?: string;
  quality?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const kieApiKey = Deno.env.get("KIE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!kieApiKey) {
      console.error("KIE_API_KEY is missing");
      throw new Error("KIE_API_KEY is not configured");
    }

    if (!supabaseUrl) {
      console.error("SUPABASE_URL is missing");
      throw new Error("SUPABASE_URL is not configured");
    }

    const requestData: ImageRequest = await req.json();

    if (!requestData.description) {
      throw new Error("Description is required");
    }

    console.log("Processing image request for:", requestData.description.substring(0, 100));

    // Call morphy-safe-suggest to get enhanced prompt
    console.log("Calling morphy-safe-suggest...");
    const morphyResponse = await fetch(`${supabaseUrl}/functions/v1/morphy-safe-suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: requestData.description,
        characterImageUrl: requestData.characterImageUrl,
        productImageUrl: requestData.productImageUrl,
        aspectRatio: requestData.aspectRatio || "4:5"
      }),
    });

    if (!morphyResponse.ok) {
      const errorText = await morphyResponse.text();
      console.error("Morphy Safe Suggest error:", errorText);
      throw new Error(`Morphy Safe Suggest returned status ${morphyResponse.status}`);
    }

    const morphyData = await morphyResponse.json();

    if (!morphyData.success || !morphyData.prompt) {
      throw new Error("Failed to generate prompt from Morphy");
    }

    const enhancedPrompt = morphyData.prompt;
    console.log("Enhanced prompt generated:", enhancedPrompt.substring(0, 150) + "...");
    console.log("Prompt length:", enhancedPrompt.length, "chars");

    // Prepare image URLs for KIE
    const imageInputUrls: string[] = [];
    if (requestData.characterImageUrl) {
      imageInputUrls.push(requestData.characterImageUrl);
    }
    if (requestData.productImageUrl) {
      imageInputUrls.push(requestData.productImageUrl);
    }

    console.log("Including image_input URLs:", imageInputUrls.length);

    // Determine KIE model and payload
    const imageEngine = requestData.imageEngine || 'nano_banana_pro';
    const isSeedream = imageEngine === 'seedream_4_5';
    const hasImages = imageInputUrls.length > 0;

    let kiePayload: any;
    if (isSeedream && !hasImages) {
      kiePayload = {
        model: "seedream/4.5-text-to-image",
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: requestData.aspectRatio || "1:1",
          quality: requestData.quality || "basic"
        }
      };
    } else if (isSeedream && hasImages) {
      kiePayload = {
        model: "seedream/4.5-edit",
        input: {
          prompt: enhancedPrompt,
          image_urls: imageInputUrls,
          aspect_ratio: requestData.aspectRatio || "1:1",
          quality: requestData.quality || "basic"
        }
      };
    } else {
      kiePayload = {
        model: "nano-banana-pro",
        input: {
          prompt: enhancedPrompt,
          image_input: imageInputUrls,
          aspect_ratio: requestData.aspectRatio || "4:5",
          resolution: requestData.resolution || "2K",
          output_format: requestData.outputFormat || "png"
        }
      };
    }

    console.log("KIE Payload model:", kiePayload.model);

    // Call KIE API
    const kieResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kiePayload),
    });

    if (!kieResponse.ok) {
      const errorText = await kieResponse.text();
      console.error("KIE API error:", errorText);
      throw new Error(`KIE API returned status ${kieResponse.status}`);
    }

    const kieData = await kieResponse.json();

    console.log("KIE response:", JSON.stringify(kieData).substring(0, 200));

    return new Response(
      JSON.stringify({
        success: true,
        taskId: kieData.data?.taskId,
        enhancedPrompt: enhancedPrompt,
        kieResponse: kieData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in morphy-image:", error);
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
