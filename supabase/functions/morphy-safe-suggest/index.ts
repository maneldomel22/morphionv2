import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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

function buildPromptRequest(data: any): any[] {
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

  if (data.characterImageUrl) {
    content.push({
      type: "image_url",
      image_url: {
        url: data.characterImageUrl,
      },
    });
  }

  if (data.productImageUrl) {
    content.push({
      type: "image_url",
      image_url: {
        url: data.productImageUrl,
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
    const data = await req.json();

    if (!data.description || data.description.trim() === '') {
      throw new Error("Description is required");
    }

    console.log("Building safe prompt for:", data.description.substring(0, 100));

    const userContent = buildPromptRequest(data);

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