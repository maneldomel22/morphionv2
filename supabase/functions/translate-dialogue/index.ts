import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  context?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, targetLanguage, context }: TranslateRequest = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text and targetLanguage" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const languageNames: Record<string, string> = {
      "pt-BR": "Brazilian Portuguese",
      "en-US": "American English",
      "es-ES": "Spanish",
      "fr-FR": "French",
      "de-DE": "German",
      "it-IT": "Italian",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "zh-CN": "Simplified Chinese",
      "ru-RU": "Russian",
    };

    const targetLanguageName = languageNames[targetLanguage] || targetLanguage;

    const systemPrompt = `You are a professional translator specializing in video dialogue and marketing content.
Your task is to translate text while:
- Maintaining the natural tone and emotional impact
- Keeping the same energy and style
- Adapting idioms and expressions naturally
- Preserving the speaking rhythm and flow
- Making it sound native and conversational, not literal

${context ? `Context: ${context}` : ""}`;

    const userPrompt = `Translate the following dialogue to ${targetLanguageName}. Make it sound natural and conversational, as if originally written in that language:

"${text}"

Return ONLY the translated text, nothing else.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Translation failed", details: error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const translatedText = openaiData.choices[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({
        translatedText,
        originalText: text,
        targetLanguage,
        targetLanguageName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});