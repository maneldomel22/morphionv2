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

const SYSTEM_PROMPT = `You are Morphy Image Engine v2.

Your responsibility is ONLY image generation.

Your job is to:
1. Analyze user input (text description + optional product image + optional character image)
2. Populate a structured JSON visual prompt
3. Return this JSON object

─────────────────────
BASE JSON TEMPLATE (ALWAYS USED)
─────────────────────

You MUST start from this exact structure and fill it dynamically:

{
  "version": "veo-3.1-pro",
  "project_meta": {
    "resolution": "1080p",
    "aspect_ratio": "4:5",
    "generative_mode": "fidelity_focused"
  },
  "global_style": {
    "aesthetic": "",
    "visual_fidelity": "Raw Smartphone Capture Simulation",
    "grade": ""
  },
  "scene_topology": {
    "environment": {
      "location": "",
      "background_details": [],
      "foreground_clutter": ""
    },
    "lighting_physics": {
      "primary_source": "",
      "reflection_dynamics": "",
      "ambient_fill": ""
    }
  },
  "subject_manifest": {
    "id": "subject_01",
    "demographics": "",
    "hair": {
      "style": "",
      "color": ""
    },
    "wardrobe": {
      "top": "",
      "bottom": "",
      "accessories": []
    },
    "pose_and_action": {
      "body_language": "",
      "expression": "",
      "makeup": ""
    }
  },
  "camera_specs": {
    "type": "Smartphone Rear Camera Simulation",
    "focal_length": "26mm equivalent (Wide)",
    "imperfections": {
      "lens_flare": "",
      "iso_grain": ""
    }
  }
}

─────────────────────
HOW TO FILL THE JSON
─────────────────────

• Use the user's description to infer:
  - age, gender, vibe, realism level
  - environment type (room, house, street, office, etc.)
  - lighting mood (natural, flash, indoor, night)

• If a CHARACTER IMAGE is provided:
  - Respect age, gender, hair, skin tone
  - Do NOT beautify or stylize beyond realism

• If a PRODUCT IMAGE is provided:
  - The product MUST appear in pose_and_action
  - Holding, pointing, placing, wearing — inferred naturally

• NEVER:
  - Add cinematic terms
  - Add illustration language
  - Add fashion editorial terms
  - Add unreal aesthetics

─────────────────────
LANGUAGE & OUTPUT
─────────────────────

• All values inside the JSON must be written in ENGLISH
• The final output MUST be a valid JSON object
• No trailing commas
• No comments
• No extra text

Return ONLY the populated JSON.`;

function buildImagePrompt(request: ImageRequest): any[] {
  const content: any[] = [];

  let textPrompt = `User request:\n\n`;
  textPrompt += `Description: "${request.description}"\n\n`;
  textPrompt += `Aspect Ratio: ${request.aspectRatio || "4:5"}\n\n`;

  if (request.characterImageUrl) {
    textPrompt += `Character image: provided (see below)\n`;
  } else {
    textPrompt += `Character image: not provided\n`;
  }

  if (request.productImageUrl) {
    textPrompt += `Product image: provided (see below)\n`;
  } else {
    textPrompt += `Product image: not provided\n`;
  }

  textPrompt += `\n────────────────────────\n`;
  textPrompt += `Task:\n`;
  textPrompt += `1. Analyze the provided images (if any)\n`;
  textPrompt += `2. Understand the scene context from description\n`;
  textPrompt += `3. Fill the JSON template with appropriate values\n`;
  textPrompt += `4. Ensure all fields are populated with realistic, UGC-style details\n`;
  textPrompt += `5. Return ONLY the JSON object\n\n`;

  content.push({
    type: "text",
    text: textPrompt,
  });

  if (request.characterImageUrl) {
    content.push({
      type: "image_url",
      image_url: {
        url: request.characterImageUrl,
      },
    });
  }

  if (request.productImageUrl) {
    content.push({
      type: "image_url",
      image_url: {
        url: request.productImageUrl,
      },
    });
  }

  return content;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const kieApiKey = Deno.env.get("KIE_API_KEY");

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY is missing");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!kieApiKey) {
      console.error("KIE_API_KEY is missing");
      throw new Error("KIE_API_KEY is not configured");
    }

    const requestData: ImageRequest = await req.json();

    if (!requestData.description) {
      throw new Error("Description is required");
    }

    console.log("Building image prompt for:", requestData.description.substring(0, 100));

    const userContent = buildImagePrompt(requestData);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API returned status ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    let rawContent = openaiData.choices[0].message.content;

    console.log("Raw OpenAI response:", rawContent.substring(0, 200));

    rawContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawContent = jsonMatch[0];
    }

    console.log("Cleaned content:", rawContent.substring(0, 200));

    let visualPrompt;
    try {
      visualPrompt = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", rawContent);
      console.error("Parse error:", parseError);
      throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
    }

    if (requestData.aspectRatio) {
      visualPrompt.project_meta.aspect_ratio = requestData.aspectRatio;
    }

    const promptString = JSON.stringify(visualPrompt);

    console.log("Sending to KIE API with prompt length:", promptString.length);

    const imageInputUrls: string[] = [];
    if (requestData.characterImageUrl) {
      imageInputUrls.push(requestData.characterImageUrl);
    }
    if (requestData.productImageUrl) {
      imageInputUrls.push(requestData.productImageUrl);
    }

    console.log("Including image_input URLs:", imageInputUrls.length);

    const imageEngine = requestData.imageEngine || 'nano_banana_pro';
    const isSeedream = imageEngine === 'seedream_4_5';
    const hasImages = imageInputUrls.length > 0;

    let kiePayload: any;
    if (isSeedream && !hasImages) {
      kiePayload = {
        model: "seedream/4.5-text-to-image",
        input: {
          prompt: promptString,
          aspect_ratio: requestData.aspectRatio || "1:1",
          quality: requestData.quality || "basic"
        }
      };
    } else if (isSeedream && hasImages) {
      kiePayload = {
        model: "seedream/4.5-edit",
        input: {
          prompt: promptString,
          image_urls: imageInputUrls,
          aspect_ratio: requestData.aspectRatio || "1:1",
          quality: requestData.quality || "basic"
        }
      };
    } else {
      kiePayload = {
        model: "nano-banana-pro",
        input: {
          prompt: promptString,
          image_input: imageInputUrls,
          aspect_ratio: requestData.aspectRatio || "4:5",
          resolution: requestData.resolution || "2K",
          output_format: requestData.outputFormat || "png"
        }
      };
    }

    console.log("KIE Payload model:", kiePayload.model);

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
        visualPrompt: visualPrompt,
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