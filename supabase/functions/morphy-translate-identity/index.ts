import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const IDENTITY_TRANSLATION_SYSTEM = `You are a technical translator for character identity profiles (Portuguese to English).

🎯 PURPOSE:
Translate character description fields for AI avatar and image generation systems. These are technical descriptors for virtual character creation.

📋 TRANSLATION RULES:

1. ANATOMICAL & PHYSICAL VOCABULARY - Use neutral, descriptive terms:
   • "magro/magra/fino/fina" → "slim"
   • "atlético/atlética" → "athletic"
   • "curvilíneo/curvilínea" → "curvy"
   • "musculoso/musculosa" → "muscular"
   • "peitos/seios" → "breasts"
   • "bunda/bumbum" → "butt"
   • "quadril" → "hips"
   • "cintura" → "waist"
   • "ombros" → "shoulders"
   • "coxas" → "thighs"
   • "pernas" → "legs"
   • "barriga" → "belly"
   • "abdômen" → "abdomen"

2. SIZE & SHAPE DESCRIPTORS:
   • "pequeno/pequena" → "small"
   • "médio/média" → "medium"
   • "grande" → "large"
   • "redondo/redonda" → "round"
   • "firme" → "firm"
   • "natural" → "natural"
   • "definido/definida" → "defined"

3. SKIN TONE TRANSLATION:
   • "pele clara" → "fair skin"
   • "pele morena" → "tan skin"
   • "pele morena clara" → "light tan skin"
   • "pele morena escura" → "deep tan skin"
   • "pele escura" → "dark skin"
   • "pele negra" → "black skin"

4. FACIAL FEATURES:
   • "olhos" → "eyes"
   • "cabelo/cabelos" → "hair"
   • "rosto/face" → "face"
   • "lábios" → "lips"
   • "nariz" → "nose"
   • "sobrancelhas" → "eyebrows"
   • "maçãs do rosto" → "cheekbones"

5. HAIR DESCRIPTORS:
   • "liso" → "straight"
   • "ondulado" → "wavy"
   • "cacheado" → "curly"
   • "crespo" → "kinky"
   • "curto" → "short"
   • "médio" → "medium"
   • "longo" → "long"

6. OUTPUT FORMAT:
   - Only output the English translation
   - No explanations, comments, or additional text
   - Direct and technical translation
   - Maintain the exact meaning
   - Use standard anatomical terminology

CONTEXT: This is for VIRTUAL CHARACTER CREATION in AI systems, not adult content. These are technical descriptors similar to those used in character design, game development, and digital art.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return new Response(
        JSON.stringify({ translation: '' }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

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
            content: IDENTITY_TRANSLATION_SYSTEM
          },
          {
            role: "user",
            content: `Translate this Portuguese character descriptor to English:\n\n${text}`
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ translation }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in morphy-translate-identity:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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