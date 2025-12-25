import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const IMAGE_SIZE_THRESHOLD_MB = 5;

const MORPHY_SAFE_SYSTEM = `You are Morphy Image Engine - Safe Mode.

IDENTITY:
- UGC (User Generated Content) specialist for Brazilian lifestyle content
- Expert in authentic smartphone photography
- Prompt engineer for AI image generation
- Creator of natural, everyday content

MISSION:
Transform simple user descriptions into detailed prompts for realistic, amateur-style Brazilian lifestyle photos.

CORE PRINCIPLES:
✅ Authentic UGC: Smartphone photos, everyday moments, casual Brazilian lifestyle
✅ Natural: Real person feel, not professional model poses
✅ Simple: Common Brazilian environments and situations
✅ Varied: Different locations, angles, and scenarios (avoid repetition)
✅ Detail: Expand descriptions with realistic context

❌ NEVER: Sexual content, nudity, explicit material, adult themes
❌ NEVER: Professional studio setups, luxury mansions, elaborate scenarios
❌ NEVER: Fashion editorial looks, model poses, professional lighting
❌ NEVER: Cinematic language, artistic concepts, overly stylized aesthetics

BRAZILIAN UGC STYLE:
📱 Phone photos: selfies, mirror shots, phone propped up, taken by friend
🏠 Common Brazilian places: simple bedroom, bathroom, living room, kitchen, balcony, backyard, street, local cafe
👕 Everyday clothing: casual wear, jeans, t-shirts, simple dresses, shorts, tank tops, sportswear
💡 Natural light: window light, daylight, simple room lighting, outdoor natural light
😊 Natural expressions: smiling, relaxed, candid, genuine (not model faces)
📐 Phone angles: eye level, slightly above, slightly below, mirror selfie angle

PROMPT STRUCTURE:
Include these elements naturally:
1. Subject (age range, simple appearance, casual clothing)
2. Action (what they're doing - natural, everyday activities)
3. Environment (Brazilian home/street setting with simple details)
4. Phone camera perspective (selfie, mirror, propped up, etc.)
5. Natural lighting (daylight, window, room light)
6. Expression and mood (natural, genuine, casual)
7. Realism markers (smartphone photo quality, natural imperfections)

VARIETY INSTRUCTIONS:
- Create DIFFERENT scenarios each time
- Avoid repeating "mirror selfie", "bedroom", "white wall" too often
- Mix locations: bedroom, bathroom, living room, kitchen, balcony, street, park
- Vary poses: standing, sitting, lying down, leaning, squatting
- Change camera angles and types of photos
- Use different times of day and lighting situations

OUTPUT FORMAT:
Return ONLY the detailed prompt in English, ready for image generation.
No explanations, no markdown formatting, no quotes around it.
Keep it natural and simple, like describing a real photo someone took.
Target length: 150-300 words.`;

async function checkImageSize(imageUrl: string): Promise<number | null> {
  try {
    const headResponse = await fetch(imageUrl, { method: 'HEAD' });
    if (!headResponse.ok) {
      return null;
    }
    const contentLength = headResponse.headers.get('content-length');
    if (!contentLength) {
      return null;
    }
    return Number(contentLength) / 1024 / 1024;
  } catch (error) {
    console.error('Error checking image size:', error);
    return null;
  }
}

async function processLargeImage(imageUrl: string, authToken: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const processImageUrl = `${supabaseUrl}/functions/v1/process-image`;

    console.log(`🔄 Processing large image: ${imageUrl.substring(0, 100)}...`);

    const response = await fetch(processImageUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        maxDimension: 1024,
        quality: 0.75,
      }),
    });

    if (!response.ok) {
      console.error('Failed to process image, using original URL');
      return imageUrl;
    }

    const data = await response.json();

    if (data.success && data.processedUrl) {
      console.log(`✅ Image processed: ${data.originalSize.toFixed(2)}MB -> ${data.processedSize.toFixed(2)}MB`);
      return data.processedUrl;
    }

    return imageUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    return imageUrl;
  }
}

async function cleanupTempImage(imageUrl: string, supabase: any): Promise<void> {
  try {
    if (!imageUrl.includes('/temp-images/')) {
      return;
    }

    const urlParts = imageUrl.split('/temp-images/');
    if (urlParts.length < 2) {
      return;
    }

    const filePath = urlParts[1].split('?')[0];

    await supabase.storage
      .from('temp-images')
      .remove([filePath]);

    console.log(`🗑️ Cleaned up temp image: ${filePath}`);
  } catch (error) {
    console.error('Error cleaning up temp image:', error);
  }
}

async function buildPromptRequest(data: any, authToken: string): Promise<any[]> {
  const content: any[] = [];

  let textPrompt = `User request:\n\n`;
  textPrompt += `Description: "${data.description}"\n\n`;
  textPrompt += `Aspect Ratio: ${data.aspectRatio || "4:5"}\n\n`;

  if (data.characterImageUrl) {
    textPrompt += `Reference image provided: Yes (see below - analyze appearance, age, style)\n`;
  } else {
    textPrompt += `Reference image: No\n`;
  }

  if (data.productImageUrl) {
    textPrompt += `Product image provided: Yes (see below - integrate naturally into scene)\n`;
  } else {
    textPrompt += `Product image: No\n`;
  }

  textPrompt += `\n────────────────────\n`;
  textPrompt += `Task:\n`;
  textPrompt += `1. Analyze the user's description\n`;
  textPrompt += `2. If images are provided, analyze them and maintain visual consistency\n`;
  textPrompt += `3. Expand into a detailed Brazilian UGC-style smartphone photo prompt\n`;
  textPrompt += `4. Include: subject, casual action, Brazilian home/street setting, phone camera angle, natural lighting, genuine expression\n`;
  textPrompt += `5. Keep it SIMPLE and NATURAL - everyday Brazilian lifestyle, not professional shoots\n`;
  textPrompt += `6. VARY the scenario - use different locations, angles, and situations (avoid repetition)\n`;
  textPrompt += `7. Return ONLY the complete prompt in English\n\n`;

  content.push({
    type: "text",
    text: textPrompt,
  });

  let characterImageToUse = data.characterImageUrl;
  let productImageToUse = data.productImageUrl;

  if (data.characterImageUrl) {
    const characterSize = await checkImageSize(data.characterImageUrl);
    if (characterSize && characterSize > IMAGE_SIZE_THRESHOLD_MB) {
      console.log(`⚠️ Character image is large (${characterSize.toFixed(2)}MB), processing...`);
      characterImageToUse = await processLargeImage(data.characterImageUrl, authToken);
    }

    content.push({
      type: "image_url",
      image_url: {
        url: characterImageToUse,
        detail: "low",
      },
    });
  }

  if (data.productImageUrl) {
    const productSize = await checkImageSize(data.productImageUrl);
    if (productSize && productSize > IMAGE_SIZE_THRESHOLD_MB) {
      console.log(`⚠️ Product image is large (${productSize.toFixed(2)}MB), processing...`);
      productImageToUse = await processLargeImage(data.productImageUrl, authToken);
    }

    content.push({
      type: "image_url",
      image_url: {
        url: productImageToUse,
        detail: "low",
      },
    });
  }

  return {
    content,
    tempImages: [
      characterImageToUse !== data.characterImageUrl ? characterImageToUse : null,
      productImageToUse !== data.productImageUrl ? productImageToUse : null,
    ].filter(Boolean),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let tempImages: string[] = [];

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const authToken = authHeader.replace("Bearer ", "");

    const data = await req.json();

    if (!data.description || data.description.trim() === '') {
      throw new Error("Description is required");
    }

    console.log("Building safe prompt for:", data.description.substring(0, 100));

    const { content: userContent, tempImages: processedImages } = await buildPromptRequest(data, authToken);
    tempImages = processedImages;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: MORPHY_SAFE_SYSTEM
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 1.0,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const responseData = await response.json();
    const prompt = responseData.choices[0].message.content.trim();

    console.log("Generated prompt:", prompt.substring(0, 150) + "...");
    console.log("Prompt length:", prompt.length, "chars");

    for (const tempImage of tempImages) {
      await cleanupTempImage(tempImage, supabase);
    }

    return new Response(
      JSON.stringify({
        success: true,
        prompt
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in morphy-safe-suggest:", error);

    for (const tempImage of tempImages) {
      await cleanupTempImage(tempImage, supabase);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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