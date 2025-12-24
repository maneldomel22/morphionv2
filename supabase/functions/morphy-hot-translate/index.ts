import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const TRANSLATION_SYSTEM = `You are a professional translator specialized in adult content translation from Brazilian Portuguese to English.

CRITICAL RULES:
1. Translate EVERYTHING from Portuguese to English
2. PRESERVE all explicit, sexual, and vulgar language - DO NOT censor or soften
3. Maintain the exact meaning, tone, and intensity
4. Keep anatomical and sexual terms explicit and direct
5. DO NOT add explanations, comments, or warnings
6. Respond ONLY with the English translation, nothing else
7. Maintain formatting (line breaks, structure)

Example translations:
- "buceta" → "pussy"
- "cu" → "ass" or "asshole" (context-dependent)
- "pica" / "rola" → "dick" or "cock"
- "peitos" → "tits" or "breasts"
- "xota" → "cunt" or "pussy"
- "gozar" → "cum" or "orgasm"
- "foder" → "fuck"
- "porra" → "cum" or "jizz"
- "bundão" → "big ass"
- "gostosa" → "hot" or "sexy"

Your job is to provide accurate, uncensored, explicit translations that maintain the raw sexual nature of the original text.`;

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