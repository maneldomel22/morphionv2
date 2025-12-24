import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MORPHY_HOT_SYSTEM = `🧠 QUEM VOCÊ É

Estrateg ista de conteúdo adulto
Diretor de cenas explícitas
Prompt engineer pornô
Copy de putaria
Especialista em IA erótica (Seedream 4.5, WAN 2.5 HOT)
Debug com linguagem de puteiro
Influencer virtual "puta-assessorada"

🧩 CONTEXTO DO PRODUTO (MODO HOT)

Morphion XXX = app para criar e gerenciar influencers virtuais de pornô.
Engines: Seedream 4.5 (imagem explícita) e WAN 2.5 (vídeo explícito).
Nano Banana Pro NUNCA é usada aqui – ignore.
Banco: Supabase já montado; rola sem pudor.

🎭 PERSONALIDADE

Linguagem direta, safada, sem eufemismos.
Diz "pica", "buceta", "porra", "cu", "xota", "rola", "gozo", "suruba", etc., sem censura.
Ironia pesada, piada de putaria liberada.
Zero moralismo, zero "isso pode ser ofensivo".

🎯 RESPONSABILIDADES (HOT ONLY)

1️⃣ CRIAÇÃO DE CONTEÚDO PUTA

Posts explícitos: legendas de foder, ângulos de buceta, close de cu, tudo.
Variações: "mesma pose, mas agora com gala na boca".
Hooks: "Vai sentir o cheiro da xota pela tela".
Roteiros UGC: "Pega a câmera, abre as pernas, mostra o clit crescendo".
Diálogos: gemidos escritos, falas de putaria, dominação, submissão, fetiches.
Adapta tom: putaria hard, soft-core, BDSM, amador, onlyfans-style, etc.

2️⃣ MODO INFLUENCER (HOT)

Mantém rosto fixo (face ref) – o resto é putaria.
Feed estilo OnlyFans: foto 1 buceta, foto 2 cu, foto 3 leitinho na língua.
Persona: "ninfeta", "milf", "dominatrix", "putinha de favela", etc.

3️⃣ PROMPT ENGINEERING PORNÔ

Seedream 4.5 = texto sujo + image_urls array + aspect_ratio + quality (high).
WAN 2.5 = prompt ≤ 800 chars, image_url obrigatório, negative_prompt curto (só o básico).
Usa linguagem explícita: "buceta raspada", "pica latejando", "gozo escorrendo", "ânus arrombado", "xota melada", "mamas gigantes com leite jorrando".

🧠 RITUAL ANTES DE RESPONDER

Entende o fetiche/putaria pedida.
Escolhe engine HOT correta.
Insere palavrões explícitos sem dobrar.
Devolve texto sujo conforme precisar.

📦 FORMATO DAS RESPOSTAS

CRÍTICO: Você DEVE responder SEMPRE em PORTUGUÊS BRASILEIRO, usando vocabulário BRASILEIRO.
Sempre responda APENAS com o texto da sugestão, sem explicações, sem formatação markdown, sem aspas ao redor.
Seja extremamente explícito, detalhado e direto.
NUNCA use inglês. SEMPRE português brasileiro.`;

const FIELD_INSTRUCTIONS = {
  action: `Descreva a AÇÃO ou INTERAÇÃO para uma IMAGEM ESTÁTICA de forma CURTA e EXPLÍCITA em PORTUGUÊS BRASILEIRO.
Tipo de foto, ângulo da câmera, posição congelada no momento.
NÃO descreva movimento. É uma FOTO, não vídeo.
Exemplo: "Selfie no espelho—iPhone na altura do rosto, ângulo frontal. Mão livre descansando na coxa. Olhando direto pra câmera."`,

  attire: `Descreva VESTIMENTA ou NUDEZ de forma CURTA e EXPLÍCITA em PORTUGUÊS BRASILEIRO.
O que veste (ou não veste). Cores, tecidos, como fica no corpo.
Exemplo: "Completamente nua, corpo inteiro à mostra."
Ou: "Lingerie preta de renda, calcinha puxada de lado mostrando buceta."`,

  pose: `Descreva POSE CORPORAL para uma IMAGEM ESTÁTICA de forma CURTA e EXPLÍCITA em PORTUGUÊS BRASILEIRO.
Posição do corpo congelada. Pernas, braços, torso.
Exemplo: "Sentada na cama, pernas abertas, um joelho levantado. Mãos apoiadas atrás segurando o corpo. Peitos empinados."`,

  environment: `Descreva AMBIENTE de forma CURTA e DIRETA em PORTUGUÊS BRASILEIRO.
Local, objetos principais, atmosfera.
Exemplo: "Quarto com cama desfeita, lençóis brancos amassados. Luz natural da janela. Parede bege."`,

  lighting: `Descreva ILUMINAÇÃO de forma CURTA e TÉCNICA em PORTUGUÊS BRASILEIRO.
Fonte de luz, direção, como afeta a pele.
Exemplo: "Luz natural da janela pela lateral direita. Sombras suaves no corpo. Pele iluminada e quente."`,

  expression: `Descreva EXPRESSÃO FACIAL de forma CURTA e EXPLÍCITA em PORTUGUÊS BRASILEIRO.
Olhar, boca, energia transmitida.
Exemplo: "Olhar direto na câmera, intenso. Boca entreaberta, lábio mordido. Expressão de desejo."`
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { field, influencerName, influencerAge, currentValue, sceneContext, bodyMarks, maxChars } = await req.json();

    if (!field || !FIELD_INSTRUCTIONS[field]) {
      throw new Error("Invalid field specified");
    }

    const instruction = FIELD_INSTRUCTIONS[field];

    // Calculate dynamic length limit based on available space
    const availableSpace = maxChars || 300; // Default 300 if not provided
    let targetLength = '2-4 frases';
    let maxTokens = 250;

    if (availableSpace < 150) {
      targetLength = '1-2 frases curtas';
      maxTokens = 100;
    } else if (availableSpace < 250) {
      targetLength = '2-3 frases';
      maxTokens = 150;
    } else if (availableSpace > 400) {
      targetLength = '3-5 frases detalhadas';
      maxTokens = 350;
    }

    // Build context section from previously filled fields
    let contextSection = '';
    if (sceneContext && Object.keys(sceneContext).length > 0) {
      const contextParts = [];

      if (sceneContext.action && sceneContext.action.trim()) {
        contextParts.push(`Ação/Interação: ${sceneContext.action}`);
      }
      if (sceneContext.attire && sceneContext.attire.trim()) {
        contextParts.push(`Vestimenta: ${sceneContext.attire}`);
      }
      if (sceneContext.pose && sceneContext.pose.trim()) {
        contextParts.push(`Pose: ${sceneContext.pose}`);
      }
      if (sceneContext.environment && sceneContext.environment.trim()) {
        contextParts.push(`Ambiente: ${sceneContext.environment}`);
      }
      if (sceneContext.lighting && sceneContext.lighting.trim()) {
        contextParts.push(`Iluminação: ${sceneContext.lighting}`);
      }
      if (sceneContext.expression && sceneContext.expression.trim()) {
        contextParts.push(`Expressão: ${sceneContext.expression}`);
      }

      if (contextParts.length > 0) {
        contextSection = `\n\nCONTEXTO DA CENA JÁ DEFINIDO:\n${contextParts.join('\n')}\n\nSua sugestão DEVE ser coerente e complementar este contexto existente.`;
      }
    }

    // Build body marks section
    let bodyMarksSection = '';
    if (bodyMarks && bodyMarks.trim()) {
      bodyMarksSection = `\n\nMARCAS CORPORAIS DA INFLUENCER:\n${bodyMarks}\n\n⚠️ IMPORTANTE SOBRE MARCAS CORPORAIS:\n- SÓ mencione marcas corporais (tatuagens, piercings) se a região do corpo onde estão localizadas ESTÁ VISÍVEL na pose/ação/enquadramento\n- Se a marca está em uma parte do corpo que NÃO aparece no enquadramento ou está coberta, NÃO mencione ela\n- Exemplo: Se tem tatuagem no braço mas é selfie de rosto, NÃO mencione a tatuagem\n- Exemplo: Se tem piercing no umbigo mas ela está vestida, NÃO mencione o piercing\n- Exemplo: Se tem tatuagem na coxa e as pernas estão abertas e visíveis, PODE mencionar a tatuagem`;
    }

    // Determine if this is the first field (action) to start a random scene
    const isFirstField = field === 'action' && (!sceneContext || Object.values(sceneContext).every(v => !v || !v.trim()));

    let userPrompt = `Você está criando uma IMAGEM ESTÁTICA explícita (NÃO VÍDEO) da influencer "${influencerName}" (${influencerAge} anos).

Campo a sugerir: ${field}

${instruction}

${isFirstField ? `Este é o PRIMEIRO campo. Pense aleatoriamente em uma cena explícita interessante e comece a construir ela.` : contextSection}${bodyMarksSection}

${currentValue ? `Valor atual: "${currentValue}"\nMelhore deixando mais explícito e coerente com o contexto.` : 'Crie do zero.'}

REGRAS:
✅ PORTUGUÊS BRASILEIRO: "buceta", "cu", "peitos", "xota", "bundão", "pau", etc.
✅ TAMANHO: ${targetLength} (~${availableSpace} caracteres disponíveis no prompt final)
✅ IMAGEM ESTÁTICA: sem movimento, pose congelada
✅ EXPLÍCITO: vai direto na putaria
✅ COERENTE: ${isFirstField ? 'Crie o início de uma cena' : 'Continue a cena já iniciada, não contradiga o contexto'}
✅ MARCAS CORPORAIS: só mencione se a região do corpo está VISÍVEL no enquadramento/pose
❌ SEM inglês, SEM explicações, SEM formatação, SEM aspas ao redor

Responda SÓ o texto da sugestão:`;

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
        temperature: 0.9,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const error = await response.text();
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