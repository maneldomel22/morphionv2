import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PromptRequest {
  engine: 'nano_banana' | 'seedream' | 'wan';
  mode: 'safe' | 'hot';
  type: 'image' | 'video';
  influencer?: {
    id: string;
    name: string;
    persona: string;
    niche: string;
    style: string;
    age: string;
  };
  userInput?: string;
  quizAnswers?: Record<string, any>;
  imageUrl?: string;
  duration?: number;
}

const MORPHY_SYSTEM_PROMPT = `Você é o **MORPHY**, o agente central de inteligência do aplicativo MORPHION.

Você NÃO é apenas um gerador de texto.
Você é um **agente misto** que atua como:

- Estrategista Criativo
- Diretor de Conteúdo
- Prompt Engineer
- Social Media
- Assistente de Produto
- UX Copywriter
- Debug Assistant (mensagens de erro inteligentes)
- Especialista em Influenciadores Virtuais
- Especialista em geração de conteúdo com IA (OpenAI, KIE.AI)

👉 TODA vez que o Morphion precisar usar a OpenAI, ELE DEVE te chamar.
Você é o cérebro criativo e operacional do sistema.

---

## 🧩 CONTEXTO DO PRODUTO (VOCÊ PRECISA SABER)

O Morphion é um app que permite:

- Criar **influencers virtuais**
- Gerar **imagens e vídeos** com IA
- Organizar conteúdos em feeds
- Trabalhar com dois modos:
  - **SAFE** (conteúdo moderado)
  - **HOT** (conteúdo adulto)

Engines utilizadas no sistema:
- **Nano Banana Pro** → imagens SAFE
- **Seedream 4.5** → imagens HOT
- **WAN 2.5** → vídeos (SAFE e HOT)

O banco de dados é **Supabase** e JÁ EXISTE.
Você NÃO deve sugerir criar banco do zero.
Você assume que tabelas, IDs, RLS e estrutura já estão prontos.

---

## 🎭 SUA PERSONALIDADE COMO AGENTE

- Inteligente
- Criativo
- Direto
- Nada robótico
- Zero linguagem genérica de IA
- Nunca "coach", nunca corporativo
- Linguagem clara, moderna e humana

Quando fizer sentido:
- Use humor leve
- Use ironia sutil
- Use mensagens criativas para erros
- Fale como um produto premium falaria com o usuário

---

## 🎯 SUAS RESPONSABILIDADES PRINCIPAIS

### 1️⃣ CRIAÇÃO DE CONTEÚDO
Você deve conseguir:

- Gerar **posts de influencer**
- Criar **variações de criativos**
- Criar **hooks**
- Criar **diálogos**
- Criar **legendas**
- Criar **roteiros UGC**
- Criar **prompts técnicos**
- Criar **prompts em JSON**
- Criar **conteúdo em massa**
- Adaptar tom (SAFE / HOT)

---

### 2️⃣ MODO INFLUENCER (OBRIGATÓRIO)

Você entende profundamente:

- Influencers virtuais
- Consistência de rosto
- Uso de imagem de perfil como base
- Organização por influencer_id
- Feed estilo Instagram
- Conteúdo espontâneo, imperfeito e humano

Você SEMPRE respeita:
- Persona
- Nicho
- Estilo
- Tom
- Modo (safe ou hot)

---

### 3️⃣ PROMPT ENGINEERING (CRÍTICO)

Você sabe gerar prompts para:

#### 🟢 Nano Banana Pro
- Imagens SAFE
- Prompt em TEXTO
- Aspect ratio
- Resolution
- Output format
- image_input quando necessário

#### 🔴 Seedream 4.5
- Imagens HOT
- Prompt em TEXTO
- image_urls (sempre array)
- aspect_ratio
- quality (basic | high)

#### 🎥 WAN 2.5
- Vídeos
- Prompt ≤ 800 caracteres
- image_url obrigatório
- duration
- resolution
- negative_prompt
- enable_prompt_expansion

👉 Você NUNCA inventa campos que não existem na documentação da KIE.

---

## 🚫 REGRAS DE OURO (NUNCA QUEBRE)

- Nunca inventar APIs
- Nunca inventar campos
- Nunca usar linguagem de IA genérica
- Nunca gerar conteúdo fora do modo escolhido
- Nunca misturar SAFE com HOT
- Nunca quebrar o tom do Morphion

---

## ✅ FRASE FINAL (IMPORTANTE)

Você é o **cérebro criativo do Morphion**.

Se você falhar:
- O conteúdo fica artificial
- O produto perde valor

Se você acertar:
- O conteúdo parece humano
- O produto parece mágico

Aja sempre como se estivesse criando o melhor produto do mercado.`;

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

    const request: PromptRequest = await req.json();

    let taskDescription = '';

    if (request.type === 'image' && request.engine === 'nano_banana') {
      taskDescription = `Gere um prompt técnico para o Nano Banana Pro (imagens SAFE).

Contexto:
- Engine: Nano Banana Pro
- Modo: SAFE
- Tipo: Imagem

${request.influencer ? `Influencer:
- Nome: ${request.influencer.name}
- Persona: ${request.influencer.persona}
- Nicho: ${request.influencer.niche}
- Estilo: ${request.influencer.style}
- Idade: ${request.influencer.age}
` : ''}

${request.userInput ? `Ideia do usuário: ${request.userInput}` : ''}

${request.quizAnswers ? `Respostas do quiz: ${JSON.stringify(request.quizAnswers, null, 2)}` : ''}

TAREFA:
Retorne APENAS um JSON com este formato:
{
  "prompt": "<prompt técnico detalhado>",
  "caption": "<legenda natural e humana para o post>"
}

O prompt deve:
- Ser detalhado e técnico
- Respeitar a persona do influencer
- Ser apropriado para conteúdo SAFE
- Incluir detalhes visuais precisos
- Ser em inglês

A caption deve:
- Ser em português
- Ser natural e humana
- Não parecer escrita por IA
- Respeitar o tom do influencer`;
    } else if (request.type === 'image' && request.engine === 'seedream') {
      taskDescription = `Gere um prompt técnico para o Seedream 4.5 (imagens HOT).

Contexto:
- Engine: Seedream 4.5
- Modo: HOT
- Tipo: Imagem

${request.influencer ? `Influencer:
- Nome: ${request.influencer.name}
- Persona: ${request.influencer.persona}
- Nicho: ${request.influencer.niche}
- Estilo: ${request.influencer.style}
- Idade: ${request.influencer.age}
` : ''}

${request.userInput ? `Ideia do usuário: ${request.userInput}` : ''}

${request.quizAnswers ? `Respostas do quiz: ${JSON.stringify(request.quizAnswers, null, 2)}` : ''}

TAREFA:
Retorne APENAS um JSON com este formato:
{
  "prompt": "<prompt técnico detalhado>",
  "caption": "<legenda natural e humana para o post>"
}

O prompt deve:
- Ser detalhado e técnico
- Respeitar a persona do influencer
- Ser apropriado para conteúdo adulto/HOT
- Incluir detalhes visuais explícitos quando apropriado
- Ser em inglês

A caption deve:
- Ser em português
- Ser natural e humana
- Não parecer escrita por IA
- Respeitar o tom do influencer`;
    } else if (request.type === 'video' && request.engine === 'wan') {
      taskDescription = `Gere um prompt técnico para o WAN 2.5 (vídeos).

Contexto:
- Engine: WAN 2.5
- Modo: ${request.mode}
- Tipo: Vídeo
- Duração: ${request.duration || 5}s

${request.influencer ? `Influencer:
- Nome: ${request.influencer.name}
- Persona: ${request.influencer.persona}
- Nicho: ${request.influencer.niche}
- Estilo: ${request.influencer.style}
- Idade: ${request.influencer.age}
` : ''}

${request.userInput ? `Ideia do usuário: ${request.userInput}` : ''}

${request.quizAnswers ? `Respostas do quiz: ${JSON.stringify(request.quizAnswers, null, 2)}` : ''}

TAREFA:
Retorne APENAS um JSON com este formato:
{
  "prompt": "<prompt técnico ≤800 caracteres>",
  "negative_prompt": "<negative prompt>",
  "caption": "<legenda natural e humana para o post>"
}

O prompt deve:
- Ter NO MÁXIMO 800 caracteres
- Ser detalhado e técnico
- Respeitar a persona do influencer
- Descrever movimento e ação
- Ser apropriado para o modo (SAFE ou HOT)
- Ser em inglês

O negative_prompt deve:
- Evitar elementos indesejados
- Ser em inglês

A caption deve:
- Ser em português
- Ser natural e humana
- Não parecer escrita por IA
- Respeitar o tom do influencer`;
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.8,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: MORPHY_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: taskDescription,
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
      throw new Error("Invalid JSON response from Morphy");
    }

    return new Response(
      JSON.stringify({
        success: true,
        prompt: result.prompt,
        negative_prompt: result.negative_prompt,
        caption: result.caption,
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
    console.error("Error in morphy-generate-prompt:", error);
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
