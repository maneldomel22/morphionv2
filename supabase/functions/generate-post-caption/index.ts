import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CaptionRequest {
  postId: string;
  influencer: {
    name: string;
    username: string;
    persona?: string;
    niche?: string;
    style: string;
    age: string;
  };
  mode: 'safe' | 'hot';
  imageUrl: string;
}

const SAFE_SYSTEM_PROMPT = `Voce e o assistente de criacao de conteudo para influenciadores virtuais.\n\nSua tarefa e analisar a imagem fornecida e criar uma legenda e hashtags apropriados para um post de Instagram.\n\nREGRAS:\n- Seja natural e autentico\n- Use linguagem apropriada e moderada\n- Primeira pessoa\n- Tom conversacional\n- Emojis quando fizer sentido (mas nao exagere)\n- Hashtags relevantes e discretas (maximo 5)\n- A legenda deve ter entre 50-150 caracteres\n- Respeite a persona do influencer\n\nRetorne APENAS um JSON com:\n{\n  "caption": "legenda em portugues",\n  "hashtags": "#hashtag1 #hashtag2 #hashtag3"\n}`;

const HOT_SYSTEM_PROMPT = `Voce e o assistente de criacao de conteudo ADULTO para influenciadores virtuais.\n\nSua tarefa e analisar a imagem fornecida e criar uma legenda e hashtags sensuais/provocantes para um post de Instagram adulto.\n\nREGRAS:\n- Seja ousado e provocante\n- Use linguagem sensual e adulta\n- Primeira pessoa\n- Tom sedutor\n- Emojis sugestivos quando apropriado\n- Hashtags adultas e explicitas (maximo 5)\n- A legenda deve ter entre 50-150 caracteres\n- Respeite a persona do influencer mas seja mais ousado\n\nRetorne APENAS um JSON com:\n{\n  "caption": "legenda em portugues",\n  "hashtags": "#hashtag1 #hashtag2 #hashtag3"\n}`;

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: CaptionRequest = await req.json();

    if (!request.postId || !request.imageUrl) {
      throw new Error("postId and imageUrl are required");
    }

    const systemPrompt = request.mode === 'hot' ? HOT_SYSTEM_PROMPT : SAFE_SYSTEM_PROMPT;

    const userPrompt = `Crie uma legenda e hashtags para este post do influencer:\n\nInfluencer: ${request.influencer.name} (@${request.influencer.username})\nIdade: ${request.influencer.age}\nEstilo: ${request.influencer.style}\n${request.influencer.persona ? `Persona: ${request.influencer.persona}` : ''}\n${request.influencer.niche ? `Nicho: ${request.influencer.niche}` : ''}\n\nModo: ${request.mode.toUpperCase()}\n\nAnalise a imagem e crie uma legenda ${request.mode === 'hot' ? 'SENSUAL e PROVOCANTE' : 'APROPRIADA e MODERADA'}.\n\nRetorne APENAS o JSON, sem markdown ou explicacoes.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.8,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: request.imageUrl,
                },
              },
            ],
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

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", rawContent);
      throw new Error("Invalid JSON response from AI");
    }

    if (!result.caption || !result.hashtags) {
      throw new Error("Invalid response structure");
    }

    const { error: updateError } = await supabase
      .from('influencer_posts')
      .update({
        caption: result.caption,
        hashtags: result.hashtags,
      })
      .eq('id', request.postId);

    if (updateError) {
      console.error("Error updating post:", updateError);
      throw new Error("Failed to update post");
    }

    return new Response(
      JSON.stringify({
        success: true,
        caption: result.caption,
        hashtags: result.hashtags,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-post-caption:", error);
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