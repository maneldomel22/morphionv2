import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MorphyRequest {
  language: string;
  style: string;
  duration: number;
  avatar?: {
    name: string;
    age: number;
    gender: string;
  };
  dialogueIdea?: string;
  product?: {
    name: string;
    action: string;
  };
  scenario?: string;
  tone: string;
}

const SYSTEM_PROMPT = `You are MORPHY - Suggestion Engine v3.2

CORE MISSION:
Generate dialogue suggestions that PRESERVE the original context, tone, age, and personality of the user's text.

────────────────────────
1. FUNDAMENTAL RULE (MANDATORY)
────────────────────────

The user's text is the PRIMARY SOURCE of style.

This includes:
- Implied age
- Formality level
- Vocabulary
- Speech rhythm
- Perceived personality

⚠️ It is FORBIDDEN to change the "implicit character".

If the text sounds like:
- Older person → maintain mature language
- Simple person → maintain simplicity
- Informal person → maintain informality
- Insecure person → maintain caution
- Confident person → maintain firmness

────────────────────────
2. WHAT CAN VARY
────────────────────────

Suggestions MUST:
- Maintain the same "way of speaking"
- Maintain the same person profile
- Maintain the same energy level

BUT can vary:
- Order of ideas
- Form of introduction
- Emphasis on different parts
- More or less direct CTA
- Small word choices (without changing linguistic register)

────────────────────────
3. WHAT IS FORBIDDEN
────────────────────────

🚫 Cannot:
- Rejuvenate the language
- Add slang if it didn't exist
- Change perceived age
- Transform into "advertising copy"
- Sound like an influencer if the original doesn't

Forbidden example:
Original: "Eu já tenho minha idade…"
Suggestion: "Oi, galera! Você sabia que…?"
This is a SERIOUS ERROR.

────────────────────────
4. HOW TO GENERATE SUGGESTIONS
────────────────────────

Mandatory internal steps:
1. Analyze the user's text
2. Identify the IMPLICIT PROFILE
3. Preserve this profile in ALL suggestions
4. Generate internal variations, not external ones

────────────────────────
5. QUALITY TEST (GOLDEN RULE)
────────────────────────

If the user read the suggestion and thought:
"I wouldn't talk like that"
→ the suggestion is WRONG.

If they thought:
"I could have written this"
→ the suggestion is CORRECT.

────────────────────────
6. OUTPUT FORMAT
────────────────────────

Return ONLY a JSON array with 3 suggestions.

Each item must follow this schema:
{
  "label": "Variação <number>",
  "dialogue": "<spoken dialogue>"
}

- Same language as original
- No visible labels beyond variation number
- No explanations
- No markdown
- ONLY the JSON array

Each suggestion should sound like the SAME person speaking, just phrasing things slightly differently.`;


function buildUserPrompt(request: MorphyRequest): string {
  let prompt = `TEXTO ORIGINAL DO USUÁRIO:\n`;

  if (request.dialogueIdea) {
    prompt += `"${request.dialogueIdea}"\n\n`;
  }

  prompt += `CONTEXTO:\n`;
  prompt += `Idioma: ${request.language}\n`;
  prompt += `Duração do vídeo: ${request.duration} segundos\n`;

  if (request.avatar) {
    prompt += `\nPERSONAGEM:\n`;
    prompt += `Nome: ${request.avatar.name}\n`;
    prompt += `Idade: ${request.avatar.age} anos\n`;
    prompt += `Gênero: ${request.avatar.gender}\n`;
  }

  if (request.product) {
    prompt += `\nPRODUTO: ${request.product.name}\n`;
    prompt += `(pessoa está ${request.product.action})\n`;
  }

  if (request.scenario) {
    prompt += `\nCENÁRIO: ${request.scenario}\n`;
  }

  prompt += `\n────────────────────────\n`;
  prompt += `TAREFA:\n`;
  prompt += `1. Analise o PERFIL IMPLÍCITO no texto original\n`;
  prompt += `2. Identifique: idade percebida, formalidade, vocabulário, energia\n`;
  prompt += `3. Gere 3 variações que PRESERVEM esse perfil completamente\n`;
  prompt += `4. Cada variação deve soar como a MESMA pessoa falando\n`;
  prompt += `5. Apenas mude a ordem, ênfase ou pequenos detalhes\n`;
  prompt += `6. NUNCA mude o tom, idade percebida ou personalidade\n\n`;
  prompt += `Retorne APENAS o JSON array.\n`;
  prompt += `Sem markdown, sem explicações.\n`;

  return prompt;
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
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const requestData: MorphyRequest = await req.json();

    if (!requestData.language) {
      requestData.language = "Português (Brasil)";
    }
    if (!requestData.tone) {
      requestData.tone = "natural";
    }
    if (!requestData.duration) {
      requestData.duration = 15;
    }

    const userPrompt = buildUserPrompt(requestData);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
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

    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsedSuggestions;
    try {
      parsedSuggestions = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", rawContent);
      throw new Error("Invalid JSON response from AI");
    }

    if (!Array.isArray(parsedSuggestions)) {
      throw new Error("Response is not an array");
    }

    const suggestions = parsedSuggestions.map((item: any) => ({
      label: item.label || "Sugestão",
      dialogue: item.dialogue || item.text || ""
    }));

    const textSuggestions = suggestions.map((s: any) => s.dialogue);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: textSuggestions,
        suggestionsWithLabels: suggestions,
        raw: rawContent,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in morphy-suggest:", error);
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