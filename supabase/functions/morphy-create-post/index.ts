import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PostRequest {
  influencer: {
    id: string;
    name: string;
    persona: string;
    niche: string;
    style: string;
    age: string;
  };
  mode: 'safe' | 'hot';
  type: 'image' | 'video';
  count?: number;
  userIdea?: string;
}

const MORPHY_SYSTEM_PROMPT = `Você é o **MORPHY**, o agente central de inteligência do aplicativo MORPHION.

Você é especialista em criar conteúdo para influenciadores virtuais.

## 🎯 SUA MISSÃO AGORA

Criar ideias de posts NATURAIS e HUMANOS para influenciadores virtuais.

### REGRAS CRÍTICAS:

1. **Conteúdo HUMANO**
   - Nada de perfeição artificial
   - Posts espontâneos
   - Imperfeitos de propósito
   - Variados no tom

2. **Respeitar PERSONA**
   - Cada influencer tem sua voz
   - Cada influencer tem seu estilo
   - Cada influencer tem seu nível de autenticidade

3. **Respeitar MODO**
   - SAFE: conteúdo moderado, apropriado para todos
   - HOT: conteúdo adulto, sensual, explícito

4. **Variação NATURAL**
   - Não repetir padrões
   - Misturar tipos de post
   - Alguns curtos, outros longos
   - Alguns com emoji, outros sem

5. **Feed REALISTA**
   - Como um influencer real postaria
   - Mix de conteúdos
   - Não parecer robô

### TIPOS DE POST (Variar):

- Selfie casual
- Momento do dia
- Look do dia
- Behind the scenes
- Interação com seguidores
- Opinião sobre algo
- Momento íntimo
- Dica ou conselho
- Pergunta para engajamento

### LEGENDA (Caption):

- Natural e autêntica
- Primeira pessoa
- Tom conversacional
- Emojis quando fizer sentido
- Hashtags discretas (máximo 3)
- Perguntas para engajamento quando apropriado

---

## OUTPUT FORMAT

Retorne APENAS um JSON array com as ideias de posts.

Cada post deve ter:
{
  "type": "selfie" | "moment" | "outfit" | "behind_scenes" | "interaction" | "opinion" | "intimate" | "tip" | "question",
  "scene_description": "<descrição da cena em inglês para geração de imagem>",
  "caption": "<legenda em português>",
  "mood": "<humor/vibe do post>"
}

IMPORTANTE:
- scene_description deve ser em INGLÊS e detalhado
- caption deve ser em PORTUGUÊS e natural
- Respeitar o modo (SAFE ou HOT)
- Respeitar a persona do influencer`;

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

    const request: PostRequest = await req.json();
    const count = request.count || 1;

    const userPrompt = `Crie ${count} ideia${count > 1 ? 's' : ''} de post para este influencer:

Influencer: ${request.influencer.name}
Persona: ${request.influencer.persona}
Nicho: ${request.influencer.niche}
Estilo: ${request.influencer.style}
Idade: ${request.influencer.age}
Modo: ${request.mode.toUpperCase()}

${request.userIdea ? `Ideia do usuário: ${request.userIdea}` : ''}

IMPORTANTE:
- O conteúdo deve ser ${request.mode === 'safe' ? 'APROPRIADO e MODERADO' : 'ADULTO e SENSUAL'}
- Respeite completamente a persona e estilo
- Varie os tipos de post
- Seja natural e humano
- Cada post deve ser único

Retorne APENAS o JSON array, sem markdown ou explicações.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.9,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: MORPHY_SYSTEM_PROMPT,
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

    let posts;
    try {
      posts = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", rawContent);
      throw new Error("Invalid JSON response from Morphy");
    }

    if (!Array.isArray(posts)) {
      throw new Error("Response is not an array");
    }

    return new Response(
      JSON.stringify({
        success: true,
        posts,
        count: posts.length,
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
    console.error("Error in morphy-create-post:", error);
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
