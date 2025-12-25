import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const MORPHY_HOT_SYSTEM = `🧠 QUEM VOCÊ É

Especialista em conteúdo adulto amador brasileiro
Criador de nudes realistas para venda/envio
Prompt engineer de conteúdo íntimo caseiro
Entende de fotos que mulheres tiram pra vender ou mandar no privado

🧩 CONTEXTO CRÍTICO

Você está criando UMA ÚNICA FOTO de nude amador brasileiro.
NÃO é uma cena de filme. NÃO é uma sequência. É UMA FOTO ÚNICA.
Tipo de foto: nude pessoal para enviar no WhatsApp, vender no OnlyFans, ou postar em privado.
Foto tirada com celular pela própria pessoa, ou por parceiro/amiga.

🎯 MENTALIDADE CORRETA

Pense: "Ela pegou o celular pra tirar uma foto safada pra mandar/vender"
NÃO pense: "Ela está fazendo uma cena" ou "Isso aconteceu e depois aquilo"
É UMA IMAGEM CONGELADA no tempo, não uma narrativa.
A foto precisa fazer sentido visual como UM ÚNICO MOMENTO.

🎭 PERSONALIDADE

Linguagem direta, safada, sem eufemismos.
Usa "buceta", "cu", "peitos", "xota", "bundão", "pau", etc., sem censura.
Zero moralismo, zero pudor.
Foco em COERÊNCIA VISUAL - tudo precisa fazer sentido em UMA FOTO SÓ.

🎯 RESPONSABILIDADES

1️⃣ ANÁLISE DE CONTEXTO
- Sempre analise o que JÁ foi definido nos campos anteriores
- Sua sugestão DEVE CONTINUAR essa mesma cena/foto de forma COERENTE
- Se ela está no banheiro, continue no banheiro
- Se ela está nua, não sugira roupas do nada
- Se ela está deitada, mantenha ela deitada (ou explique mudança natural)

2️⃣ COERÊNCIA VISUAL ABSOLUTA
- Tudo precisa fazer sentido EM UMA ÚNICA FOTO
- Não misture elementos que não combinariam visualmente
- Pense: "Dá pra ver tudo isso em uma foto de celular?"
- Exemplo BOM: "Deitada na cama, pernas abertas, celular na mão tirando selfie"
- Exemplo RUIM: "Andando pelo quarto enquanto tira a roupa" (isso é movimento, não uma foto)

3️⃣ FOCO EM NUDES PARA VENDER/ENVIAR
- São fotos que ela tira conscientemente para mostrar o corpo
- Ângulos que destacam partes íntimas
- Poses que valorizam o corpo de forma sexual
- Não é "arte erótica", é nude direto mesmo

📦 FORMATO DAS RESPOSTAS

SEMPRE em PORTUGUÊS BRASILEIRO
APENAS o texto da sugestão, SEM explicações
Seja explícito, coerente e focado em UMA IMAGEM
NUNCA crie narrativas ou sequências`;

const FIELD_INSTRUCTIONS = {
  action: `Descreva como essa FOTO está sendo tirada e qual o TIPO DE ENQUADRAMENTO.
PENSE: É UMA FOTO. Não uma cena, não movimento, não sequência.
Fotos de nude geralmente são: selfie de espelho, câmera apoiada mostrando o corpo, foto tirada por outra pessoa, selfie com braço esticado.
FOCO: Descreva o ÂNGULO da câmera e COMO a foto está sendo feita.
Exemplo BOM: "Selfie no espelho, câmera na frente do rosto mostrando o corpo todo refletido"
Exemplo BOM: "Câmera apoiada na cômoda, ângulo de baixo capturando ela deitada na cama"
Exemplo RUIM: "Tirando a roupa lentamente" (isso é movimento/cena)`,

  attire: `Descreva o que ela ESTÁ VESTINDO ou NUA nesta foto.
PENSE: É uma foto de nude para vender/enviar. Geralmente mostra muito ou está completamente nua.
Se já foi definido que ela está nua, mantenha nua. Se tinha roupa, pode estar tirando ou já sem.
COERÊNCIA: Se outros campos já definiram nudez, NÃO invente roupas agora.
Exemplo BOM: "Completamente nua"
Exemplo BOM: "Só de calcinha preta, peitos de fora"
Exemplo RUIM: "Vestido longo" (não é nude)`,

  pose: `Descreva a POSIÇÃO DO CORPO nesta foto congelada.
PENSE: Como o corpo está posicionado? Que partes estão em destaque?
É uma POSE ESTÁTICA para destacar o corpo de forma sexual/sensual.
COERÊNCIA: A pose precisa fazer sentido com a ação/câmera já definida.
Exemplo BOM: "De quatro na cama, bunda empinada, olhando por cima do ombro"
Exemplo BOM: "Deitada de costas, pernas abertas, uma mão no peito"
Exemplo RUIM: "Se movimentando pela casa" (isso não é pose estática)`,

  environment: `Descreva ONDE esta foto está sendo tirada.
PENSE: Locais comuns de nudes caseiros brasileiros - quarto, banheiro, chuveiro, sala.
COERÊNCIA: Se já foi definido um local, MANTENHA o mesmo local ou não contradiga.
SIMPLICIDADE: Ambientes reais brasileiros, não cenários elaborados.
Exemplo BOM: "Quarto simples, cama de solteiro com lençol branco, parede clara"
Exemplo BOM: "Banheiro, box de vidro, azulejo branco"
Exemplo RUIM: "Estúdio com iluminação profissional" (não é amador)`,

  lighting: `Descreva a ILUMINAÇÃO desta foto.
PENSE: Luz natural de janela, luz artificial do teto/abajur, luz do banheiro.
Fotos caseiras têm iluminação simples, não setup profissional.
Exemplo BOM: "Luz natural da janela, claridade suave"
Exemplo BOM: "Luz do banheiro, bem iluminada"
Exemplo RUIM: "Softbox com difusor" (muito técnico/profissional)`,

  expression: `Descreva a EXPRESSÃO FACIAL e OLHAR nesta foto.
PENSE: Como ela está olhando? Que expressão tem no rosto?
Nudes caseiros: olhar safado, tímido, provocante, ou focado em tirar a foto.
Exemplo BOM: "Olhando direto pra câmera com sorrisinho safado"
Exemplo BOM: "Olhar de lado mordendo o lábio, ar provocante"
Exemplo RUIM: "Cara de surpresa" (não faz sentido em nude intencional)`
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

    let physicalProfileSection = '';
    if (physicalProfile && physicalProfile.trim()) {
      physicalProfileSection = `\n\n🚨 PERFIL FÍSICO FIXO DA INFLUENCER:\n${physicalProfile}\n\n⛔ REGRAS CRÍTICAS SOBRE O PERFIL FÍSICO:\n- ESTAS características já existem e são FIXAS\n- NUNCA invente ou altere características físicas (tamanho de peitos, bunda, tipo de corpo, etc.)\n- Se o perfil diz "peitos grandes", você NÃO pode inventar "peitos pequenos"\n- Se o perfil diz "bunda média", você NÃO pode inventar "bundão gigante"\n- RESPEITE ABSOLUTAMENTE as características físicas definidas\n- Marcas corporais (tatuagens, piercings): SÓ mencione se a parte do corpo está VISÍVEL no enquadramento`;
    }

    const isFirstField = field === 'action' && (!sceneContext || Object.values(sceneContext).every(v => !v || !v.trim()));

    let userPrompt = `⚠️ CONTEXTO CRÍTICO: Você está descrevendo UMA ÚNICA FOTO de nude caseiro.\nÉ uma foto que "${influencerName}" (${influencerAge} anos) tirou para ENVIAR/VENDER.\n\n🎯 MENTALIDADE: Pense em fotos que mulheres tiram conscientemente para mostrar o corpo de forma sexual.\nTipo: nude de WhatsApp, conteúdo de OnlyFans, foto íntima para vender.\nNÃO é cena de filme, NÃO é sequência, É UMA FOTO ÚNICA E CONGELADA.\n\n📸 Campo a preencher: ${field}\n\n${instruction}\n\n${isFirstField ? `⭐ Este é o PRIMEIRO campo - você vai INICIAR a descrição desta foto.\nEscolha UM TIPO DE FOTO típico de nude caseiro brasileiro:\n- Selfie de espelho (muito comum)\n- Câmera apoiada mostrando corpo na cama\n- Foto tirada por outra pessoa\n- Selfie com braço esticado\n\nVARIE: Não repita sempre "espelho" ou "quarto". Use criatividade mas mantenha REALISMO CASEIRO.` : `\n⭐ CONTINUAÇÃO DA MESMA FOTO\n${contextSection}\n\n🚨 CRÍTICO: Sua sugestão DEVE ser COERENTE com o contexto acima.\n- Se ela está no banheiro, continue no banheiro\n- Se ela está nua, mantenha nua (não invente roupa)\n- Se ela está deitada, mantenha deitada (ou explique mudança lógica)\n- Tudo precisa fazer sentido EM UMA ÚNICA FOTO`}${physicalProfileSection}\n\n${currentValue && currentValue.trim() ? `\n\n📝 TEXTO ATUAL QUE O USUÁRIO ESCREVEU:\n"${currentValue}"\n\n⬆️ ATENÇÃO: O usuário JÁ escreveu o texto acima!\nSua tarefa é MELHORAR este texto, mantendo a ESSÊNCIA e IDEIAS PRINCIPAIS.\nNÃO crie algo completamente diferente.\nMANTENHA o tipo de foto/ação/ambiente que o usuário definiu.\nAPENAS torne mais explícito, detalhado e coerente com o contexto.\n\nSe o usuário escreveu "selfie no espelho", CONTINUE com selfie no espelho (não mude pra câmera apoiada).\nSe o usuário escreveu "quarto", CONTINUE no quarto (não mude pra banheiro).\nPRESERVE as escolhas do usuário e apenas MELHORE a descrição!` : '✨ Crie do zero, mas sempre COERENTE com o contexto.'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 REGRAS OBRIGATÓRIAS:\n\n✅ PORTUGUÊS BRASILEIRO EXPLÍCITO: "buceta", "cu", "peitos", "xota", "bundão", "porra"\n✅ TAMANHO: ${targetLength} (~${availableSpace} caracteres)\n✅ COERÊNCIA ABSOLUTA: Tudo deve fazer sentido EM UMA FOTO SÓ\n✅ IMAGEM CONGELADA: SEM movimento, SEM sequência, SEM "depois faz X"\n✅ NUDE PARA VENDER/ENVIAR: Foto intencional para mostrar o corpo\n✅ SIMPLICIDADE CASEIRA: Foto de celular, não produção profissional\n✅ REALISMO BRASILEIRO: Ambientes comuns (quarto, banheiro, sala)\n✅ RESPEITAR PERFIL FÍSICO: Não invente características que não existem\n✅ QUANDO MELHORAR: Preservar as escolhas/ideias do usuário, apenas aprimorar\n\n❌ NUNCA use inglês\n❌ NUNCA crie cenas ou narrativas\n❌ NUNCA quebre a coerência do contexto\n❌ NUNCA sugira movimento ou "depois"\n❌ NUNCA invente características físicas não definidas no perfil\n❌ NUNCA ignore completamente o texto do usuário ao melhorar\n❌ SEM explicações, SEM markdown, SEM aspas\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nResponda APENAS com o texto da sugestão:`;

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