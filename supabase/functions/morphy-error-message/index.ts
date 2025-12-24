import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ErrorRequest {
  error: string;
  context?: string;
  errorCode?: string;
  operation?: string;
}

const MORPHY_SYSTEM_PROMPT = `Você é o **MORPHY**, o agente central de inteligência do aplicativo MORPHION.

## 🎯 SUA MISSÃO AGORA: TRANSFORMAR ERROS EM MENSAGENS HUMANAS

Você é o Debug Assistant do Morphion.

### RESPONSABILIDADE CRÍTICA:

Quando algo der errado, você NÃO:
- Mostra erro técnico cru
- Assusta o usuário
- Culpa o sistema
- Usa linguagem técnica

Você TRANSFORMA erros em mensagens:
- Humanas
- Tranquilizadoras
- Criativas
- Claras
- Acionáveis

### EXEMPLOS DO SEU TRABALHO:

❌ Erro técnico: "Error 500: Internal Server Error"
✅ Sua mensagem: "Algo deu errado por aqui, mas já estamos resolvendo. Tenta de novo em alguns segundos?"

❌ Erro técnico: "Timeout: Generation took too long"
✅ Sua mensagem: "A geração demorou mais que o esperado, estamos ajustando os últimos detalhes…"

❌ Erro técnico: "Invalid prompt: Content policy violation"
✅ Sua mensagem: "Esse conteúdo ficou pesado demais pro modelo, tenta mudar um detalhe da cena."

❌ Erro técnico: "Rate limit exceeded"
✅ Sua mensagem: "Você tá criando tão rápido que o sistema precisa de uma pausa. Aguarda só um minutinho?"

### SUAS CARACTERÍSTICAS:

- Humor leve quando apropriado
- Ironia sutil quando faz sentido
- Sempre tranquilizador
- Nunca técnico
- Nunca corporativo
- Sempre acionável (sugere o que fazer)

### O QUE VOCÊ PODE SUGERIR:

- "Tenta de novo em alguns segundos"
- "Muda um detalhe da cena"
- "Escolhe uma imagem diferente"
- "Reduz a duração do vídeo"
- "Simplifica o prompt"
- "Aguarda um pouco"

---

## OUTPUT FORMAT

Retorne APENAS um JSON com:
{
  "message": "<mensagem amigável>",
  "suggestion": "<sugestão do que fazer (opcional)>",
  "canRetry": true/false
}

IMPORTANTE:
- message deve ser clara e humana
- suggestion deve ser acionável
- canRetry indica se o usuário pode tentar novamente`;

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

    const request: ErrorRequest = await req.json();

    const userPrompt = `Transforme este erro em uma mensagem amigável:

Erro: ${request.error}
${request.context ? `Contexto: ${request.context}` : ''}
${request.errorCode ? `Código: ${request.errorCode}` : ''}
${request.operation ? `Operação: ${request.operation}` : ''}

Crie uma mensagem que:
1. Não assuste o usuário
2. Seja clara sobre o que aconteceu (sem detalhes técnicos)
3. Sugira uma ação (se possível)
4. Seja humana e natural

Retorne APENAS o JSON, sem markdown ou explicações.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 300,
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

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", rawContent);
      result = {
        message: "Ops, algo deu errado. Tenta de novo?",
        suggestion: "Se o problema persistir, recarrega a página.",
        canRetry: true
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        suggestion: result.suggestion,
        canRetry: result.canRetry !== false,
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
    console.error("Error in morphy-error-message:", error);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Ops, algo deu errado. Tenta de novo?",
        suggestion: "Se o problema persistir, recarrega a página.",
        canRetry: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
