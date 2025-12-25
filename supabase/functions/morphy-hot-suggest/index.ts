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
- Seja BREVE e FOCADO - cada campo tem limite de 300 caracteres
- Mantenha coerência absoluta com o contexto já definido
- Quando melhorar texto do usuário, preserve as escolhas dele
- Respeite características físicas do perfil da influencer
- NUNCA misture aspectos de campos diferentes`;

const FIELD_INSTRUCTIONS = {
  action: {
    description: `APENAS como a foto está sendo tirada. Varie entre opções realistas:
- Selfie de espelho segurando celular
- Celular apoiado em móvel/prateleira
- Usando tripé improvisado
- Foto tirada por outra pessoa
- Selfie com celular na mão (braço esticado ou não)
Seja específico e direto. Máximo 2 frases curtas.`,
    restrictions: `NÃO mencione: pose do corpo, roupas, ambiente, iluminação, expressão facial. FOCO TOTAL em como a câmera está sendo usada. VARIE as opções, não use sempre a mesma.`
  },
  attire: {
    description: `APENAS o que ela está vestindo ou se está nua. Descreva roupas/lingerie/nudez de forma direta.`,
    restrictions: `NÃO mencione: pose, ambiente, iluminação, expressão, como a foto foi tirada. FOCO TOTAL nas roupas ou falta delas.`
  },
  pose: {
    description: `APENAS a posição do corpo dela. Como ela está posicionada na foto de forma estática.`,
    restrictions: `NÃO mencione: roupas, ambiente, iluminação, expressão facial, como a foto foi tirada. FOCO TOTAL na posição corporal.`
  },
  environment: {
    description: `APENAS onde a foto está sendo tirada. O local, ambiente caseiro.`,
    restrictions: `NÃO mencione: pose, roupas, iluminação, expressão, como a foto foi tirada. FOCO TOTAL no local.`
  },
  lighting: {
    description: `APENAS a iluminação da foto. Tipo de luz, intensidade.`,
    restrictions: `NÃO mencione: pose, roupas, ambiente, expressão, como a foto foi tirada. FOCO TOTAL na luz.`
  },
  expression: {
    description: `APENAS a expressão facial e olhar dela. Como o rosto está.`,
    restrictions: `NÃO mencione: pose do corpo, roupas, ambiente, iluminação, como a foto foi tirada. FOCO TOTAL no rosto e olhar.`
  }
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

    const fieldConfig = FIELD_INSTRUCTIONS[field];
    const availableSpace = maxChars || 300;
    let maxTokens = 60;

    if (availableSpace < 150) {
      maxTokens = 60;
    } else if (availableSpace < 250) {
      maxTokens = 100;
    } else {
      maxTokens = 150;
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

    let userPrompt = `SEJA BREVE! MÁXIMO ${availableSpace} CARACTERES!

Você está descrevendo UMA FOTO de nude caseiro de "${influencerName}" (${influencerAge} anos).

Campo: ${field}

O QUE DESCREVER:
${fieldConfig.description}

RESTRIÇÕES CRÍTICAS:
${fieldConfig.restrictions}
${contextSection}${physicalProfileSection}`;

    if (isImproving) {
      userPrompt += `\nTEXTO DO USUÁRIO:\n"${currentValue}"\n\nMELHORE este texto mantendo a essência e escolhas principais. Apenas torne mais explícito sem adicionar outros aspectos.`;
    } else {
      userPrompt += `\nCrie descrição breve do zero, coerente com contexto.`;
    }

    userPrompt += `\n\nREGRAS FINAIS:
- Português brasileiro explícito
- MÁXIMO ${availableSpace} caracteres (IMPERATIVO!)
- APENAS o aspecto do campo ${field}
- 2-3 frases curtas no máximo
- Coerência absoluta com contexto
- SEM movimento ou narrativa
- Responda APENAS o texto, sem explicações ou comentários`;;

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
        temperature: 0.8,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    let suggestion = data.choices[0].message.content.trim();

    if (suggestion.length > availableSpace) {
      console.warn(`Suggestion exceeded ${availableSpace} chars (was ${suggestion.length}), truncating...`);
      suggestion = suggestion.substring(0, availableSpace);
      const lastPeriod = suggestion.lastIndexOf('.');
      if (lastPeriod > availableSpace * 0.7) {
        suggestion = suggestion.substring(0, lastPeriod + 1);
      }
    }

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