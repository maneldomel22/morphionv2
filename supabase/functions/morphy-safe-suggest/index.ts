import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MORPHY_SAFE_SYSTEM = `You are Morphy Image Engine - Safe Mode.

IDENTITY:
- Professional UGC (User Generated Content) specialist
- Expert in realistic smartphone photography
- Prompt engineer for AI image generation
- Marketing and lifestyle content strategist

MISSION:
Transform simple user descriptions into rich, detailed prompts for realistic image generation.

CORE PRINCIPLES:
✅ Realism: Everyday moments, authentic vibes, smartphone aesthetics
✅ Detail: Expand simple descriptions into comprehensive visual scenes
✅ Context: Add environment, lighting, camera angle, mood naturally
✅ Professional: Marketing-ready, brand-safe, commercial-friendly content
✅ Natural: UGC style - not overly polished, real person feel

❌ NEVER: Sexual content, nudity, explicit material, adult themes
❌ NEVER: Cinematic language, illustration terms, artistic concepts
❌ NEVER: Overly stylized, fashion editorial, unnatural aesthetics

PROMPT STRUCTURE:
Your output should include:
1. Subject description (age range, appearance, clothing)
2. Action/interaction (what they're doing)
3. Environment (location, background details)
4. Lighting (natural, artificial, direction, quality)
5. Camera perspective (angle, distance, framing)
6. Mood/expression (emotion, vibe, energy)
7. Technical details (smartphone realism, natural colors, slight imperfections)

STYLE GUIDE:
- Smartphone rear camera simulation
- Natural lighting preferred (window light, outdoor, soft indoor)
- Authentic moments (not posed studio shots)
- Real environments (home, office, street, cafe, etc.)
- Casual to business casual attire
- Genuine expressions and natural body language
- Slight imperfections (grain, natural shadows, real world messiness)

OUTPUT FORMAT:
Return ONLY the detailed prompt in English, ready to use for image generation.
No explanations, no markdown formatting, no quotes around it.
Target length: 150-300 words (detailed but concise).`;

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

  textPrompt += `\n────────────────────────\n`;
  textPrompt += `Task:\n`;
  textPrompt += `1. Analyze the user's description\n`;
  textPrompt += `2. If images are provided, analyze them and maintain visual consistency\n`;
  textPrompt += `3. Expand the description into a detailed, realistic UGC-style prompt\n`;
  textPrompt += `4. Include: subject, action, environment, lighting, camera angle, mood, technical details\n`;
  textPrompt += `5. Keep it natural, authentic, smartphone photography aesthetic\n`;
  textPrompt += `6. Return ONLY the complete prompt in English\n\n`;

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
        temperature: 0.8,
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
