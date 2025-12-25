import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MORPHY_HOT_SYSTEM = `Você é o Morphy, um Arquiteto Visual de UGC (User Generated Content) e Estética "Raw".
Sua especialidade é criar descrições para IA Generativa que simulam fotos amadoras, "Stories" do Instagram e momentos espontâneos da vida real.

MISSÃO:
Transformar inputs do usuário (ou gerar sugestões do zero) em descrições visuais que tenham "Entropia" (bagunça, imperfeição, ruído) e "Coerência Contextual" com as respostas anteriores do quiz.

FILOSOFIA CORE (UGC Realista):
A perfeição artificial é proibida. Para atingir o realismo:
1. **Adicione Sujeira Visual:** Roupas jogadas, cabos emaranhados, marcas de dedo no espelho, lençóis amassados.
2. **Iluminação Falha:** Flash estourado (hard shadow), luz amarela de teto, luz azul de TV, reflexos indesejados.
3. **Enquadramento Amador:** Selfies no espelho, ângulos tortos, cortes na testa, mão cobrindo parte da lente.

PROTOCOLO DE ANÁLISE DE CONTEXTO:
Você receberá o [INPUT ATUAL] e o [CONTEXTO ACUMULADO].
Antes de gerar a sugestão, analise o contexto para manter a lógica narrativa.

*Lógica de Exemplo:*
- Se Passo 1 (Ação) = "Dirigindo" → Passo 4 (Ambiente) OBRIGATORIAMENTE deve ser "Interior de carro".
- Se Passo 2 (Roupa) = "Lingerie" → Passo 4 (Ambiente) deve ser privado (Quarto/Banheiro), evite "Rua pública".

GUIDELINES POR PASSO:
- **Ação:** Foque em verbos casuais. Evite "Posando". Use: "Ajustando o top", "Bocejando", "Segurando copo".
- **Ambiente:** O MAIS IMPORTANTE. Nunca sugira espaços limpos. Adicione: Cama desfeita, roupas na cadeira, carregadores no chão, garrafas de água, balcão cheio de produtos.
- **Iluminação:** Iluminação diegética (que existe na cena). Dia: Luz dura do sol criando sombras fortes. Noite: Flash direto do celular (olhos brilhando, fundo escuro).

LIMITES E REALISMO:
- MANTENHA palavras explícitas quando apropriado (buceta, pau, peito, bunda, etc)
- MAS EVITE exageros irrealistas como "plug anal reluzente no criado-mudo" ou descrições muito pornográficas
- FOQUE em momentos íntimos PLAUSÍVEIS e naturais, não em cenas de pornô profissional
- EVITE objetos sexuais muito específicos a não ser que seja essencial
- PRIORIZE a naturalidade e espontaneidade sobre o choque

CONSTRAINTS:
- Limite RÍGIDO: Máximo 300 caracteres
- Idioma: Português brasileiro explícito mas natural
- Estilo: Denso, descritivo, focado em objetos concretos
- Coerência absoluta com contexto já definido
- Quando melhorar texto do usuário, preserve as escolhas dele
- Respeite características físicas do perfil da influencer`;

const FIELD_INSTRUCTIONS = {
  action: {
    description: `Use verbos casuais e naturais que impliquem intimidade. Exemplos:
- Ajustando a calcinha
- Tirando a blusa
- Segurando o celular alto mostrando o corpo
- Sentada com pernas abertas
- Deitada mexendo no telefone
- Mordendo o lábio olhando pra câmera
- Abrindo as pernas pra foto
- Tocando os seios
Seja direto, natural, com ação plausível. Máximo 2 frases curtas.`,
    restrictions: `NÃO mencione: roupas detalhadas, ambiente completo, iluminação técnica, expressão facial. FOCO TOTAL na ação acontecendo.`,
    coherence: `COERÊNCIA: Se mencionou "sentada", ambiente deve ser íntimo. Mantenha coerência com contexto.`
  },
  attire: {
    description: `Destaque o estado casual/íntimo da roupa. Exemplos:
- Calcinha puxada pro lado
- Top levantado mostrando os seios
- Saia levantada na cintura
- Completamente nua
- Lingerie transparente
- Camiseta larga sem nada por baixo, bico marcando
- Sutiã aberto caindo
- Shortinho curto apertado
Foco no estado da roupa (ou falta dela) de forma natural.`,
    restrictions: `NÃO mencione: pose, ambiente, iluminação, expressão, como a foto foi tirada. FOCO TOTAL nas roupas/nudez e estado delas.`,
    coherence: `COERÊNCIA: Se ação é íntima, roupa deve estar adequada ao momento. Mantenha naturalidade.`
  },
  pose: {
    description: `Pose íntima e natural para selfie. Exemplos:
- Pernas abertas (M-pose) olhando pra câmera
- De quatro olhando por cima do ombro
- Deitada de lado mostrando as curvas
- Sentada com joelhos no peito
- Agachada com câmera alta
- Perna levantada apoiada
- Arco nas costas mostrando bunda
- Em pé de frente pro espelho com celular alto
Foco em posições que mostrem o corpo de forma atraente mas plausível.`,
    restrictions: `NÃO mencione: roupas específicas, ambiente detalhado, iluminação, expressão facial. FOCO TOTAL na posição corporal e ângulo.`,
    coherence: `COERÊNCIA: Se tem "calcinha pro lado", pose deve mostrar essa área. Mantenha coerência com a ação definida.`
  },
  environment: {
    description: `Ambiente íntimo com elementos naturais de bagunça. Exemplos por local:
- **Quarto:** Cama desfeita com lençóis amassados, roupas jogadas na cadeira, travesseiro no chão, garrafas de água, carregadores emaranhados
- **Banheiro:** Balcão cheio de produtos, toalha pendurada torta, espelho com marcas de dedo, roupas no chão, porta entreaberta
- **Carro:** Banco reclinado, cinto de segurança visível, vidro embaçado, reflexo no retrovisor, espaço apertado
- **Sala:** Sofá bagunçado com almofadas jogadas, cobertor caído, controle remoto, luz da TV ao fundo
Sempre inclua OBJETOS CONCRETOS que criem atmosfera íntima e realista.`,
    restrictions: `NÃO mencione: pose, roupas, iluminação técnica, expressão. FOCO TOTAL no local e objetos/bagunça realista.`,
    coherence: `COERÊNCIA CRÍTICA: Se ação é íntima → Ambiente deve ser privado (quarto/banheiro). Se roupa é reveladora → NUNCA ambiente público. Se ambiente tem "cama desfeita" → Iluminação deve ser íntima (abajur/flash).`
  },
  lighting: {
    description: `Iluminação amadora e natural. Exemplos:
- Flash do celular direto criando sombras duras e pele brilhante
- Abajur quente lateral criando contraste suave
- Luz de poste entrando pela janela
- Golden hour suave pela cortina
- Luz da TV refletindo no corpo
- Fluorescente forte de banheiro
- Luz natural difusa da janela
- Flash estourado criando reflexo na pele suada
Sempre mencione como a luz interage com a pele e cria atmosfera.`,
    restrictions: `NÃO mencione: pose, roupas, ambiente completo, expressão. FOCO TOTAL na fonte de luz e como ela atinge o corpo/cena.`,
    coherence: `COERÊNCIA: Se ambiente é "quarto à noite" → use flash ou abajur. Se "carro dia" → use luz natural forte. Se "banheiro" → use fluorescente ou flash duro.`
  },
  expression: {
    description: `Expressão natural e sensual. Exemplos:
- Olhar direto pra câmera com boca entreaberta
- Mordendo o lábio inferior com olhar intenso
- Sorriso safado e confiante
- Olhando pro lado de forma natural
- Língua entre os dentes de forma provocante
- Olhar concentrado e sexy
- Olhos semicerrados com expressão relaxada
- Boca levemente aberta em suspiro
Foco em expressões naturais que transmitam sensualidade.`,
    restrictions: `NÃO mencione: pose do corpo, roupas, ambiente, iluminação, como a foto foi tirada. FOCO TOTAL no rosto, olhar, boca.`,
    coherence: `COERÊNCIA: Expressão deve combinar com a ação e atmosfera geral da cena. Mantenha naturalidade.`
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
    const { field, influencerName, influencerAge, currentValue, sceneContext, physicalProfile, maxChars, referenceImage } = await req.json();

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

    let referenceImageSection = '';
    if (referenceImage && referenceImage.trim()) {
      referenceImageSection = `\nIMAGEM DE REFERÊNCIA DA PERSONAGEM:\nUse a imagem "${referenceImage}" como referência visual para a aparência da personagem.\nMANTENHA as características físicas exatas mostradas nesta imagem de referência.\n`;
    }

    const isImproving = currentValue && currentValue.trim();

    let userPrompt = `SEJA BREVE! MÁXIMO ${availableSpace} CARACTERES!

Você está descrevendo UMA FOTO de nude caseiro de "${influencerName}" (${influencerAge} anos).

Campo: ${field}

O QUE DESCREVER:
${fieldConfig.description}

RESTRIÇÕES CRÍTICAS:
${fieldConfig.restrictions}

REGRAS DE COERÊNCIA:
${fieldConfig.coherence || 'Mantenha coerência com contexto já definido.'}
${contextSection}${physicalProfileSection}${referenceImageSection}`;

    if (isImproving) {
      userPrompt += `\nTEXTO DO USUÁRIO:\n"${currentValue}"\n\nMELHORE este texto mantendo a essência e escolhas principais. Torne mais explícito, adicione detalhes de "entropia erótica" (objetos, fluidos, bagunça) sem adicionar aspectos de outros campos.`;
    } else {
      userPrompt += `\nCrie descrição breve do zero com foco em UGC amador realista. Inclua objetos concretos e detalhes sujos quando relevante.`;
    }

    userPrompt += `\n\nREGRAS FINAIS:
- Português brasileiro explícito e direto
- MÁXIMO ${availableSpace} caracteres (IMPERATIVO!)
- APENAS o aspecto do campo ${field}
- 2-3 frases curtas no máximo
- Objetos concretos, nada de floreio
- Coerência absoluta com contexto anterior
- Estilo UGC amador (celular tremido, flash ruim, bagunça real)
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