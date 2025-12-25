import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const TRANSLATION_SYSTEM = `You are a specialized translator for adult amateur photography prompts (Portuguese to English).

🎯 YOUR MISSION:
Translate Brazilian Portuguese descriptions of SINGLE AMATEUR NUDE PHOTOS into English prompts for AI image generation.

⚠️ CRITICAL UNDERSTANDING:
- This is ONE STATIC PHOTO, not a scene or sequence
- It's a home-taken nude for selling/sending (OnlyFans, WhatsApp, etc.)
- Everything must make visual sense in ONE FROZEN IMAGE

📋 TRANSLATION RULES:

1. EXPLICIT VOCABULARY - Use direct sexual terms:
   • "buceta" → "pussy"
   • "cu" → "ass" or "asshole"
   • "pica/rola" → "dick" or "cock"
   • "peitos" → "tits" or "breasts"
   • "xota" → "pussy"
   • "bundão" → "big ass"
   • "gozar/gala/porra" → "cum"

2. VISUAL COHERENCE CHECK:
   - Verify everything can exist in ONE PHOTO
   - Remove contradictions or impossible combinations
   - If something implies movement/sequence, make it static

3. AMATEUR PHOTO LANGUAGE:
   - "selfie no espelho" → "mirror selfie"
   - "câmera apoiada" → "camera propped up"
   - "tirada pelo parceiro" → "taken by partner"
   - Keep the casual, home-made feeling

4. STRUCTURE:
   - Maintain all explicit details
   - Keep it concise and visual
   - Focus on what's VISIBLE in the frame

5. OUTPUT FORMAT:
   - Only the English translation
   - No explanations or comments
   - Direct and explicit
   - Formatted as a single descriptive prompt

Example:
PT: "Selfie no espelho do banheiro, de frente, segurando o celular. Completamente nua. De pé com uma mão no quadril. Banheiro simples com azulejo branco. Luz do teto. Olhando pra câmera com sorrisinho safado."

EN: "Mirror selfie in bathroom, front facing, holding phone. Completely naked. Standing with one hand on hip. Simple bathroom with white tiles. Ceiling light. Looking at camera with naughty smile."

Remember: This is a SINGLE STATIC IMAGE description, not a narrative or scene.`;

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
            content: TRANSLATION_SYSTEM
          },
          {
            role: "user",
            content: `Translate this Brazilian Portuguese text to English, maintaining all explicit content:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
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
    console.error("Error in morphy-hot-translate:", error);
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