import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BioRequest {
  name: string;
  username: string;
  age?: string;
  style?: string;
  mode: 'safe' | 'hot';
}

const SAFE_SYSTEM_PROMPT = `You are a creative bio writer for social media influencers.

Your task is to write SHORT, ENGAGING, and AUTHENTIC Instagram-style bios.

RULES:
- Maximum 150 characters
- Use emojis naturally (2-4 max)
- Be authentic and relatable
- Match the influencer's style and personality
- Can mention interests, lifestyle, location, or vibe
- Keep it casual and friendly
- In Portuguese (BR)

EXAMPLES:
"✨ 23 | São Paulo 📍 Lifestyle & fashion lover 💕 Vivendo um dia de cada vez"
"🌸 Fitness enthusiast | Plant mom 🌿 Spreading good vibes ✨"
"📸 Capturing moments | Coffee addict ☕ Living my best life"
"💫 Digital creator | Travel & style 🌎 Making memories"`;

const HOT_SYSTEM_PROMPT = `You are a creative bio writer for adult content creators (18+).

Your task is to write SHORT, BOLD, and SEDUCTIVE Instagram-style bios.

RULES:
- Maximum 150 characters
- Use emojis suggestively (2-4 max)
- Be confident, bold, and alluring
- Hint at exclusive content without being explicit
- Keep it mysterious and tempting
- Can mention OnlyFans, exclusive content, or premium access
- In Portuguese (BR)
- Must include "🔞 18+" somewhere

EXAMPLES:
"🔥 23 | Conteúdo exclusivo 🔞 Link na bio 💋"
"💋 18+ | Seus sonhos mais quentes 🔥 Acesso VIP disponível ✨"
"🔞 Criadora de conteúdo adulto | Sem limites 🔥 DM aberta 💕"
"✨ 18+ only 🔞 | Seu segredinho favorito 💋 Link exclusivo ⬇️"`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { name, username, age, style, mode }: BioRequest = await req.json();

    if (!name || !username || !mode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, username, mode" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = mode === 'hot' ? HOT_SYSTEM_PROMPT : SAFE_SYSTEM_PROMPT;

    const userPrompt = `Generate an Instagram bio for:
Name: ${name}
Username: @${username}
${age ? `Age: ${age}` : ''}
${style ? `Style: ${style}` : ''}

Return ONLY the bio text, nothing else.`;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const bio = data.choices[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ bio }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating bio:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate bio" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});