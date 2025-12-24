import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VariationRequest {
  originalDialogue: string;
  creativeStyle: string;
  avatarName: string;
  avatarGender: string;
  environment: {
    location?: string;
    lighting?: string;
  };
  product?: {
    name?: string;
    action?: string;
  };
  variations: {
    dialogue: boolean;
    hook: boolean;
    cta: boolean;
    gender: boolean;
    environment: boolean;
  };
  quantity: number;
}

interface Variation {
  id: string;
  hook: string;
  dialogue: string;
  cta: string;
  full_dialogue: string;
  changes: {
    gender: "male" | "female" | "unchanged";
    environment: {
      location: string;
      lighting: string;
    };
  };
  notes: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const requestData: VariationRequest = await req.json();

    console.log('Morphy recebeu pedido de variações:', {
      quantity: requestData.quantity,
      vary_dialogue: requestData.variations.dialogue,
      vary_hook: requestData.variations.hook,
      vary_cta: requestData.variations.cta,
      vary_gender: requestData.variations.gender,
      vary_environment: requestData.variations.environment,
    });

    const systemPrompt = `Você é MORPHY, um assistente criativo especializado em gerar variações de vídeos UGC (User Generated Content).

Seu trabalho é APENAS gerar variações criativas de texto, hooks, CTAs e sugestões de mudanças.

NUNCA gere prompts técnicos para IA de vídeo.
NUNCA inferir estrutura técnica de prompt.
SEMPRE responda APENAS com JSON válido.

Você deve respeitar EXATAMENTE o que o usuário pediu para variar.`;

    const varyInstructions = [];
    if (requestData.variations.dialogue) {
      varyInstructions.push('- Variar o diálogo principal (mantendo o tom e objetivo)');
    }
    if (requestData.variations.hook) {
      varyInstructions.push('- Variar o hook inicial (primeiras palavras para capturar atenção)');
    }
    if (requestData.variations.cta) {
      varyInstructions.push('- Variar o CTA final (chamada para ação no encerramento)');
    }
    if (requestData.variations.gender) {
      varyInstructions.push('- Alternar o gênero do personagem (male/female)');
    }
    if (requestData.variations.environment) {
      varyInstructions.push('- Sugerir ambientes diferentes (location + lighting)');
    }

    const userPrompt = `Gere EXATAMENTE ${requestData.quantity} variações criativas para o seguinte vídeo UGC:

VÍDEO ORIGINAL:
- Diálogo: "${requestData.originalDialogue}"
- Estilo criativo: ${requestData.creativeStyle}
- Personagem: ${requestData.avatarName} (${requestData.avatarGender})
- Ambiente: ${requestData.environment.location || 'não especificado'}
- Iluminação: ${requestData.environment.lighting || 'natural'}
${requestData.product ? `- Produto: ${requestData.product.name || 'produto'}` : ''}

O QUE DEVE SER VARIADO:
${varyInstructions.join('\n')}

REGRAS CRÍTICAS:
1. Se "variar diálogo" NÃO foi selecionado, mantenha o diálogo EXATAMENTE igual
2. Se "variar hook" NÃO foi selecionado, mantenha o início igual
3. Se "variar CTA" NÃO foi selecionado, mantenha o final igual
4. Se "variar gênero" NÃO foi selecionado, use "unchanged" no campo gender
5. Se "variar ambiente" NÃO foi selecionado, use "unchanged" em location e lighting
6. O campo "full_dialogue" deve conter: hook + diálogo + CTA concatenados naturalmente
7. Cada variação deve ter uma explicação criativa em "notes"

FORMATO DE RESPOSTA (JSON VÁLIDO):
{
  "variations": [
    {
      "id": "var_1",
      "hook": "texto do gancho inicial",
      "dialogue": "texto do diálogo principal",
      "cta": "texto da chamada para ação",
      "full_dialogue": "hook + diálogo + cta concatenados",
      "changes": {
        "gender": "male" | "female" | "unchanged",
        "environment": {
          "location": "string ou unchanged",
          "lighting": "string ou unchanged"
        }
      },
      "notes": "breve explicação criativa"
    }
  ]
}

Gere as ${requestData.quantity} variações agora:`;

    console.log('Chamando OpenAI para gerar variações...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Erro ao comunicar com OpenAI');
    }

    const openaiResult = await openaiResponse.json();
    const morphyResponse = openaiResult.choices[0].message.content;

    console.log('Morphy gerou resposta');

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(morphyResponse);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta do Morphy:', morphyResponse);
      throw new Error('Morphy retornou resposta inválida');
    }

    if (!parsedResponse.variations || !Array.isArray(parsedResponse.variations)) {
      console.error('Resposta sem array de variações:', parsedResponse);
      throw new Error('Formato de resposta inválido');
    }

    if (parsedResponse.variations.length !== requestData.quantity) {
      console.warn(`Esperava ${requestData.quantity} variações, recebeu ${parsedResponse.variations.length}`);
    }

    console.log(`✅ Morphy gerou ${parsedResponse.variations.length} variações com sucesso`);

    return new Response(
      JSON.stringify(parsedResponse),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Erro no Morphy:', error);

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        friendly_message: 'Desculpe, tive dificuldade em gerar as variações. Tente novamente!',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
