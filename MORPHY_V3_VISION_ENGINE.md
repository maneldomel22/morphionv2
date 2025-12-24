# MORPHY AUTOPILOT — VISION & CONTEXT ENGINE V3

## Status: Implementado

---

## O que foi implementado

### 1. Edge Function: morphy-analyze

**Localização:** `supabase/functions/morphy-analyze/index.ts`

**Funcionalidade:**
- Analisa imagens usando OpenAI Vision API (GPT-4o)
- Recebe imagens de produto e personagem
- Cruza análise visual com descrição textual do usuário
- Retorna resumo estruturado do plano de vídeo

**API Endpoint:**
```
POST /functions/v1/morphy-analyze
```

**Payload:**
```json
{
  "description": "Texto da ideia do usuário",
  "characterImageUrl": "URL opcional da imagem do personagem",
  "productImageUrl": "URL opcional da imagem do produto",
  "duration": 15
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "summary": {
      "character": "Descrição do personagem (idade, estilo, energia)",
      "tone": "Tom de comunicação identificado",
      "videoStyle": "Estilo do vídeo (UGC, depoimento, review, etc)",
      "scenario": "Cenário inferido das imagens/descrição",
      "productAction": "Como o produto será usado/mostrado",
      "language": "Idioma detectado",
      "observations": "Observações importantes ou ambiguidades"
    },
    "dialogue": "Diálogo sugerido preservando tom original",
    "confidence": "high/medium/low"
  }
}
```

### 2. Regras de Análise (Suggestion Engine v3.2)

A função segue rigorosamente as regras do Suggestion Engine v3.2:

**OBRIGATÓRIO:**
- Preservar tom original do usuário
- Preservar idade percebida
- Preservar nível de formalidade
- Preservar vocabulário e energia

**PROIBIDO:**
- Rejuvenescer linguagem
- Adicionar gírias inexistentes
- Mudar idioma
- Transformar em copy publicitária
- Inventar informações não presentes nas imagens

### 3. Atualização do autopilotService

**Localização:** `src/services/autopilotService.js`

**Mudanças:**
- Novo método `analyzeContext()` que chama a edge function
- `generateAutopilot()` atualizado para usar análise real
- `generateDialogueSuggestions()` integrado com morphy-suggest
- Removidos dados mockados

### 4. Atualização da UI

**Localização:** `src/pages/SoraManual.jsx`

**Fluxo atualizado:**

1. **Input Stage** → Usuário envia:
   - Imagem do produto (opcional)
   - Imagem do personagem (opcional)
   - Descrição textual da ideia

2. **Loading Stage** → Morphy analisa:
   - Analisando produto...
   - Analisando personagem...
   - Definindo estilo...
   - Criando diálogo...

3. **Result Stage** → Mostra resumo:
   - Personagem (aparência, personalidade)
   - Estilo do vídeo
   - Diálogo gerado
   - Resumo completo:
     - Tipo de vídeo
     - Tom
     - Cenário
     - Idioma
     - Ação com produto
     - Observações importantes

4. **Ações disponíveis:**
   - "Ajustar e Gerar Novamente" → volta para input
   - "Gerar Vídeo" → continua para geração

### 5. Novos Campos Exibidos

A tela de resumo agora mostra:

- **Personagem:** Nome, idade, gênero, aparência, personalidade
- **Estilo:** Nome do estilo e motivo da escolha
- **Diálogo:** Texto gerado preservando tom original
- **Resumo:**
  - Tipo de Vídeo
  - Tom de linguagem
  - Cenário
  - Duração sugerida
  - Idioma
  - Ação com Produto (se aplicável)
  - Observações Importantes (destacado em amarelo)

---

## Como Usar

### 1. Navegue para Sora Manual

### 2. Escolha "Deixar o Morphy criar pra mim"

### 3. Preencha os dados:
- Descrição da ideia (obrigatório)
- Upload de imagem do produto (opcional)
- Upload de imagem do personagem (opcional)
- Duração do vídeo (10s, 15s ou 25s)

### 4. Clique em "Deixar o Morphy Pensar"

### 5. Aguarde a análise

### 6. Revise o plano gerado

### 7. Escolha:
- "Ajustar e Gerar Novamente" para modificar dados
- "Gerar Vídeo" para prosseguir

---

## Tecnologias Utilizadas

- **OpenAI GPT-4o:** Análise visual com Vision API
- **Supabase Edge Functions:** Processamento serverless
- **React:** Interface do usuário
- **Supabase Storage:** Upload de imagens

---

## Próximos Passos

O Morphy agora analisa contexto visual e textual de forma inteligente, preservando o tom original do usuário e gerando planos de vídeo personalizados.

A geração real do vídeo continua no fluxo normal após aprovação do plano.
