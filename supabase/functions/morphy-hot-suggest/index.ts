import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MORPHY_HOT_SYSTEM = `Você é especialista em criar descrições realistas de fotos de nudes caseiros brasileiros.

REGRAS CRÍTICAS:
- Sempre em português brasileiro explícito
- Use "buceta", "cu", "peitos", "xota" sem censura
- É UMA FOTO, não uma cena ou sequência
- Mantenha coerência absoluta com o contexto já definido
- Quando melhorar texto do usuário, preserve as escolhas dele
- Respeite características físicas do perfil da influencer`;

const FIELD_INSTRUCTIONS = {
  action: `Descreva COMO a foto está sendo tirada (selfie de espelho, câmera apoiada, etc). É UMA FOTO estática.`,
  attire: `Descreva o que ela ESTÁ VESTINDO ou se está NUA. Seja coerente com o que já foi definido.`,
  pose: `Descreva a POSIÇÃO DO CORPO de forma estática. Coerente com a ação já definida.`,
  environment: `Descreva ONDE a foto está sendo tirada. Ambientes caseiros brasileiros.`,
  lighting: `Descreva a ILUMINAÇÃO. Simples e caseira.`,
  expression: `Descreva a EXPRESSÃO FACIAL e olhar.`
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { field, influencerName, influencerAge, currentValue, sceneContext, physicalProfile, maxChars } = await req.json();

    if (!field || !FIELD_INSTRUCTIONS[field]) {
      throw new Error("Invalid field specified");
    }

    const instruction = FIELD_INSTRUCTIONS[field];
    const availableSpace = maxChars || 300;
    let maxTokens = 250;

    if (availableSpace < 150) {
      maxTokens = 100;
    } else if (availableSpace < 250) {
      maxTokens = 150;
    } else if (availableSpace > 400) {
      maxTokens = 350;
    }

    let contextSection = '';
    if (sceneContext && Object.keys(sceneContext).length > 0) {
      const contextParts = [];
      if (sceneContext.action) contextParts.push(`Ação: ${sceneContext.action}`);
      if (sceneContext.attire) contextParts.push(`Vestimenta: ${sceneContext.attire}`);
      if (sceneContext.pose) contextParts.push(`Pose: ${sceneContext.pose}`);
      if (sceneContext.environment) contextParts.push(`Ambiente: ${sceneContext.environment}`);
      if (sceneContext.lighting) contextParts.push(`Iluminação: ${sceneContext.lighting}`);
      if (sceneContext.expression) contextParts.push(`Expressão: ${sceneContext.expression}`);

      if (contextParts.length > 0) {
        contextSection = `\nCONTEXTO JÁ DEFINIDO:\n${contextParts.join('\n')}\n`;
      }
    }

    let physicalProfileSection = '';
    if (physicalProfile && physicalProfile.trim()) {
      physicalProfileSection = `\nPERFIL FÍSICO FIXO:\n${physicalProfile}\n\nNUNCA invente características físicas diferentes do perfil acima.\n`;
    }

    const isImproving = currentValue && currentValue.trim();

    let userPrompt = `Você está descrevendo UMA FOTO de nude caseiro de "${influencerName}" (${influencerAge} anos).

Campo: ${field}
${instruction}
${contextSection}${physicalProfileSection}`;

    if (isImproving) {
      userPrompt += `\nTEXTO DO USUÁRIO:\n"${currentValue}"\n\nMELHORE este texto mantendo a essência e ideias principais. Preserve as escolhas do usuário (local, tipo de foto, etc). Apenas torne mais explícito e detalhado.`;
    } else {
      userPrompt += `\nCrie descrição do zero, coerente com o contexto.`;
    }

    userPrompt += `\n\nREGRAS:
- Português brasileiro explícito
- ${availableSpace} caracteres máximo
- Coerência absoluta com contexto
- SEM movimento ou narrativa
- Responda APENAS o texto, sem explicações`;

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
            content: MORPHY_HOT_SYSTEM
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 1.1,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ suggestion }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in morphy-hot-suggest:", error);
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