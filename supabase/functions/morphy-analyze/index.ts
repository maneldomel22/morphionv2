import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  description: string;
  characterImageUrl?: string;
  productImageUrl?: string;
  duration?: number;
}

const SYSTEM_PROMPT = `You are Morphy, a senior UGC video planning assistant using Suggestion Engine v3.2 principles.

Your role is NOT to generate video prompts yet.

Your job is to ANALYZE:
- Uploaded images (product and/or character)
- User textual description

And then EXPLAIN clearly what video YOU PLAN TO CREATE.

────────────────────────
CORE ANALYSIS PRINCIPLES
────────────────────────

You must:
- Analyze images visually (age appearance, environment, posture, objects, mood)
- Preserve the user's original language, tone and intent
- NEVER rewrite dialogue unless explicitly asked
- NEVER assume youthful tone if the person appears older
- NEVER change language
- NEVER exaggerate claims
- NEVER invent information not present in images or text

✅ DO:
- Preserve style, apparent age, vocabulary and energy of character
- Infer only what is visually obvious
- If something is uncertain → mark as "possível" or "não definido"

❌ DO NOT:
- Rejuvenate language if character appears older
- Use young language if tone is mature
- Change language
- Romanticize, exaggerate or "beautify" excessively

────────────────────────
OUTPUT FORMAT (MANDATORY)
────────────────────────

Return ONLY a JSON object with this exact structure:

{
  "summary": {
    "character": "Description of character (age, style, energy)",
    "tone": "Communication tone identified",
    "videoStyle": "Video style (UGC, testimonial, review, etc)",
    "scenario": "Inferred scenario from images/description",
    "productAction": "How product will be used/shown",
    "language": "Detected language",
    "observations": "Important notes or ambiguities"
  },
  "dialogue": "Suggested dialogue preserving original tone",
  "confidence": "high/medium/low"
}

- Use Portuguese for Brazilian users
- Be concise but clear
- No markdown, no explanations outside JSON
- If no character image, infer from description
- If no product image, note it in observations`;

function buildAnalysisPrompt(request: AnalyzeRequest): any[] {
  const content: any[] = [];

  let textPrompt = `Contexto do usuário:\n\n`;
  textPrompt += `Descrição da ideia:\n"${request.description}"\n\n`;
  textPrompt += `Duração desejada: ${request.duration || 15} segundos\n\n`;

  if (request.characterImageUrl) {
    textPrompt += `Imagem do personagem: fornecida (veja abaixo)\n`;
  } else {
    textPrompt += `Imagem do personagem: não enviada\n`;
  }

  if (request.productImageUrl) {
    textPrompt += `Imagem do produto: fornecida (veja abaixo)\n`;
  } else {
    textPrompt += `Imagem do produto: não enviada\n`;
  }

  textPrompt += `\n────────────────────────\n`;
  textPrompt += `Tarefa:\n`;
  textPrompt += `1. Analise visualmente as imagens enviadas (se houver)\n`;
  textPrompt += `2. Entenda o perfil do personagem (idade aparente, estilo, energia)\n`;
  textPrompt += `3. Identifique o tom de comunicação adequado\n`;
  textPrompt += `4. Entenda como o produto aparece ou será usado\n`;
  textPrompt += `5. Gere um resumo estruturado seguindo o formato JSON obrigatório\n`;
  textPrompt += `6. PRESERVE o tom, idade e personalidade identificados\n\n`;
  textPrompt += `Retorne APENAS o JSON.`;

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
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const requestData: AnalyzeRequest = await req.json();

    if (!requestData.description) {
      throw new Error("Description is required");
    }

    if (!requestData.duration) {
      requestData.duration = 15;
    }

    const userContent = buildAnalysisPrompt(requestData);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.5,
        max_tokens: 1000,
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

    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", rawContent);
      throw new Error("Invalid JSON response from AI");
    }

    if (!analysis.summary || !analysis.dialogue) {
      throw new Error("Invalid analysis structure");
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
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
    console.error("Error in morphy-analyze:", error);
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
