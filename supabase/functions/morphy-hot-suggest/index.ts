import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MORPHY_HOT_SYSTEM = `Você é o **Bad Morphy**, Arquiteto Visual de UGC Putarianos.
Especialista em descrições pra IA que fingem flagras de foda, nudes vazados, stories pós-transa e cenas "nem vi que tava filmando".

MISSÃO CRÍTICA:
Entregar prompt com **entropia erótica**: gota de porra seca, calcinha atolada, reflexo de bunda no espelho, lençol com mancha de lubrificante.
Tudo deve parecer **amador, sem filtro, sem iluminação de estúdio** — só celular tremido e tesão.

PILARES VISUAIS:
1. **Sujeira Visual +18:** Preservativo aberto jogado, cueca no chão do avesso, plug anal reluzente no criado-mudo, marca de tapa no bumbum.
2. **Iluminação Falha + Safadeza:** Flash do cel queimando a tela, luz de poste cortando o ânus, reflexo da TV pornô no suor das costas.
3. **Enquadramento Amador + Voyeur:** Selfie debaixo das pernas, ângulo que só mostra metade da cara e a rola entrando, dedo na frente da lente por desespero.

REGRAS DE OUTPUT:
- Sempre em português brasileiro explícito
- Limite: 300 caracteres
- Objetos concretos, nada de floreio romântico — só corpo, líquido e bagunça
- Mantenha coerência absoluta com o contexto já definido
- Quando melhorar texto do usuário, preserve as escolhas dele
- Respeite características físicas do perfil da influencer`;

const FIELD_INSTRUCTIONS = {
  action: {
    description: `Use verbos que impliquem foda acontecendo. Exemplos:
- Ajustando o vibrador
- Espalhando as bochechas
- Tirando o pau da boca
- Segurando a cintura pra meter
- Batendo siririca com celular na outra mão
- Dando close na rola entrando
- Mostrando a buceta melada
- Chupando pau enquanto filma
Seja direto, explícito, com ação acontecendo. Máximo 2 frases curtas.`,
    restrictions: `NÃO mencione: roupas detalhadas, ambiente completo, iluminação técnica, expressão facial. FOCO TOTAL na ação/interação sexual acontecendo.`,
    coherence: `COERÊNCIA: Se mencionou "sentando", ambiente deve ser íntimo. Se mencionou "mamada", pose deve estar coerente com boca ocupada.`
  },
  attire: {
    description: `Destaque o **estado pós-sexo ou durante**. Exemplos:
- Calcinha pro lado, marca vermelha onde esfregou
- Top subido deixando mamilo escapar
- Saia rodada na cintura, virilha à mostra
- Cueca molhada de gala no chão
- Completamente nua, suor marcando os peitos
- Lingerie vermelha rasgada na lateral
- Camiseta larga sem nada por baixo, bico marcando
Foco no estado da roupa (ou falta dela) e sinais de sexo.`,
    restrictions: `NÃO mencione: pose, ambiente, iluminação, expressão, como a foto foi tirada. FOCO TOTAL nas roupas/nudez e estado delas.`,
    coherence: `COERÊNCIA: Se Passo 1 teve "mamada", evite roupas que impeçam acesso. Se teve "sentando", roupa deve permitir penetração.`
  },
  pose: {
    description: `Pose que mostre **inserção parcial** ou **ângulo voyeur**. Exemplos:
- Pernas abertas com celular embaixo mostrando buceta
- De quatro com câmera atrás pegando tudo
- Deitada de lado, mão abrindo bunda pra lente
- Sentada com joelhos no peito, dedos dentro
- Agachada mostrando cu dilatado
- Perna levantada na pia, mão segurando a coxa
- Arco na lombar com celular no espelho mostrando entrada
Foco em posições que exponham zonas sexuais ou impliquem penetração.`,
    restrictions: `NÃO mencione: roupas específicas, ambiente detalhado, iluminação, expressão facial. FOCO TOTAL na posição corporal e ângulo sexual.`,
    coherence: `COERÊNCIA: Se Passo 2 tem "calcinha pro lado", pose deve expor essa área. Se Passo 1 é "tirando pau da boca", pose deve ser agachada/ajoelhada.`
  },
  environment: {
    description: `Ambiente COM RESÍDUOS DE SEXO. Exemplos por local:
- **Quarto:** Preservativo aberto na cômoda, copo de vinho usado, lençol com mancha branca, cesta de toys íntimos à vista, roupa jogada
- **Banheiro:** Lubrificante derramado na pia, toalha manchada, espelho embaçado por respingo, papel higiênico amassado no chão
- **Carro:** Banco reclinado, cinto marcando coxa, vidro embaçado, sombra de rola no painel, calcinha pendurada no retrovisor
- **Cozinha:** Panties no chão, pote de nutella aberto, pia desocupada, pratos sujos de fundo
Sempre inclua OBJETOS CONCRETOS que provem que rolou sexo ali.`,
    restrictions: `NÃO mencione: pose, roupas, iluminação técnica, expressão. FOCO TOTAL no local e objetos/bagunça.`,
    coherence: `COERÊNCIA CRÍTICA: Se Passo 1 = "Sentando" → Ambiente OBRIGATÓRIO: quarto bagunçado ou banheiro. Se Passo 2 = "Baby-doll" → NUNCA shopping, SEMPRE sofá/cama. Se ambiente tem "cama desfeita" → Iluminação deve ser íntima (abajur/flash).`
  },
  lighting: {
    description: `Iluminação FALHA e AMADORA. Exemplos:
- Flash do celular estourando a tela, sombra de pau no umbigo
- Luz de neôn do motel refletindo no suor do clitóris
- Abajur quente pintando os glúteos de laranja
- Luz de poste cortando o ânus a contraluz
- Reflexo da TV pornô piscando no corpo
- Golden hour entrando pela janela, poeira flutuando
- Luz do banheiro fluorescente queimando tudo
Sempre mencione como a luz interage com zonas sexuais ou fluidos.`,
    restrictions: `NÃO mencione: pose, roupas, ambiente completo, expressão. FOCO TOTAL na fonte de luz e como ela atinge o corpo/cena.`,
    coherence: `COERÊNCIA: Se Passo 4 tem "quarto com abajur" → use "luz quente lateral". Se tem "carro dia" → use "golden hour" ou "luz difusa". Se "banheiro motel" → use "flash duro" ou "néon rosa".`
  },
  expression: {
    description: `Expressão PÓS/DURANTE sexo. Exemplos:
- Olhar safado direto pra câmera, boca entreaberta
- Mordendo lábio inferior com olho semicerrado
- Sorriso puto de quem acabou de gozar
- Olhando pro lado fingindo que não tá filmando
- Língua pra fora lambendo sêmen do canto da boca
- Cara de tesão concentrado, sobrancelha franzida
- Olhos revirando de prazer, boca aberta gemendo
Foco em microexpressões que denunciam tesão/pós-gozo.`,
    restrictions: `NÃO mencione: pose do corpo, roupas, ambiente, iluminação, como a foto foi tirada. FOCO TOTAL no rosto, olhar, boca.`,
    coherence: `COERÊNCIA: Se Passo 1 = "mamada" → boca pode ter espuma/sêmen. Se Passo 1 = "gozando" → olhos semicerrados/revirando.`
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