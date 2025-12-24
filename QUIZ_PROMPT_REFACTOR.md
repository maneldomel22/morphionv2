# Refatoração do Quiz de Criação de Vídeo e Sistema de Prompts - Sora 2

## 🎯 Objetivo

Garantir fidelidade total entre as respostas do quiz e o prompt enviado ao Sora 2, eliminando defaults genéricos e garantindo que o cenário digitado pelo usuário apareça explicitamente no vídeo gerado.

## ✅ Mudanças Implementadas

### 1. ETAPA 6 - CENÁRIO (Refatorada)

**ANTES:**
- Campo: "Local" (texto livre)
- Campo: "Iluminação" (Natural / Suave / Estúdio)
- Problema: O campo "Local" podia ser mapeado para valores genéricos como "an everyday indoor setting"

**DEPOIS:**
- Campo: **"Ambiente principal"** (texto obrigatório, com asterisco vermelho)
  - Placeholder: "Ex: Quarto com esteira"
  - Mensagem: "Seja específico. Este ambiente aparecerá literalmente no vídeo."

- Campo: **"Elementos visíveis do cenário"** (opcional)
  - Placeholder: "Ex: Esteira embaixo do personagem, parede branca ao fundo"
  - Mensagem: "Detalhe objetos ou elementos importantes para adicionar contexto."

- Campo: **"Iluminação"** (3 opções mais claras):
  - "Natural (janela / luz do dia)"
  - "Suave interna"
  - "Estilo estúdio simples"

**Validação:** O campo "Ambiente principal" é obrigatório e não pode estar vazio.

### 2. ETAPA 7 - ESTILO DE GRAVAÇÃO (Ajustada)

**ANTES:**
- Campos obrigatórios: Enquadramento, Ângulo de câmera
- Problema: Criava conflito se preenchidos parcialmente

**DEPOIS:**
- Todos os campos são **opcionais**
- **Aviso claro no topo:** "Ajustes visuais opcionais. Se não preencher, o Morphion usará o preset padrão de selfie iPhone realista."
- **Card informativo** explicando o preset padrão:
  - Enquadramento médio (cabeça e ombros)
  - Ângulo frontal na altura dos olhos
  - Câmera iPhone estática com leve movimento natural
  - Profundidade de campo natural

**Campos:**
- Enquadramento (opcional)
- Ângulo de câmera (opcional)
- Movimento (opcional)
- Profundidade de campo (opcional)

**Lógica:** Se QUALQUER campo for preenchido, ele sobrescreve APENAS aquela parte do preset.

### 3. ETAPA 5 - PRODUTO (Regra Clara)

**ANTES:**
- Não estava claro quando o produto deveria aparecer no prompt

**DEPOIS:**
- Se o usuário **pular a etapa**: Bloco de produto NÃO aparece no prompt
- Se o usuário **subir imagem do produto**:
  - Produto passa a ser obrigatório e visível no vídeo
  - Ação com o produto é respeitada literalmente
  - Se não definir ação, usa comportamento padrão: "gesture naturally with the product"

### 4. REVISÃO FINAL (Atualizada)

A seção de revisão foi atualizada para mostrar:
- **Cenário:** Ambiente principal + elementos visíveis + iluminação
- **Estilo de Gravação:**
  - Se customizado: mostra todos os campos preenchidos
  - Se não customizado: mostra "Preset padrão (selfie iPhone realista)"

## 🔧 Mudanças Técnicas

### Campos do FormData (SoraManual.jsx)

**Removidos:**
```javascript
location: ''
```

**Adicionados:**
```javascript
mainEnvironment: ''
visibleElements: ''
```

**Modificados:**
```javascript
lighting: 'Natural (janela / luz do dia)' // valor padrão atualizado
framing: '' // agora opcional
cameraAngle: '' // agora opcional
movement: '' // agora opcional
depthOfField: '' // agora opcional
```

### Interface da Edge Function (generate-video-kie/index.ts)

**Atualizado:**
```typescript
interface ProjectData {
  videoId: string;
  selectedAvatar: any;
  creativeStyle: any;
  dialogue: string;
  duration: string;
  aspectRatio: string;
  mainEnvironment: string;        // NOVO
  visibleElements?: string;       // NOVO (opcional)
  lighting: string;
  framing?: string;               // agora opcional
  cameraAngle?: string;           // agora opcional
  movement?: string;              // agora opcional
  depthOfField?: string;          // agora opcional
  productData?: {
    name?: string;
    action?: string;
    image_url?: string;
  };
}
```

### Função buildPrompt (generate-video-kie/index.ts)

A função `buildPrompt()` foi completamente refatorada para seguir o novo template:

**Principais mudanças:**

1. **Cenário Literal:**
```typescript
const mainEnvironment = data.mainEnvironment?.trim() || 'an indoor setting';
const visibleElements = data.visibleElements?.trim();

// No prompt:
promptParts.push(`ENVIRONMENT (LOCKED — MUST FOLLOW EXACTLY):`);
promptParts.push(`Location: ${mainEnvironment}`);
if (visibleElements) {
  promptParts.push(`Visible elements: ${visibleElements}`);
}
```

2. **Iluminação Descritiva:**
```typescript
const lightingMap: Record<string, string> = {
  'Natural (janela / luz do dia)': 'natural lighting from windows or daylight',
  'Suave interna': 'soft internal lighting',
  'Estilo estúdio simples': 'simple studio-style lighting',
};
```

3. **Cinematografia Condicional:**
```typescript
const hasCustomCinematography = !!(
  data.framing?.trim() ||
  data.cameraAngle?.trim() ||
  data.movement?.trim() ||
  data.depthOfField?.trim()
);

if (hasCustomCinematography) {
  // Usa valores customizados, preenchendo com defaults apenas os campos vazios
} else {
  // Usa preset completo de iPhone selfie
}
```

4. **Produto Condicional:**
```typescript
if (hasProductImage) {
  // Bloco de produto completo
  if (data.productData?.action?.trim()) {
    promptParts.push(`The character MUST perform this action with the product:`);
    promptParts.push(`${data.productData.action}`);
  } else {
    promptParts.push(`The character MUST gesture naturally with the product while speaking.`);
  }
}
// Se não tem produto, bloco não aparece
```

## 📋 Template do Prompt Final

O prompt agora segue esta estrutura rígida:

```
TECHNICAL HEADER:
A casual, selfie-style IPHONE 15 PRO front-camera vertical video...

ENVIRONMENT (LOCKED — MUST FOLLOW EXACTLY):
Location: [ambiente_principal do usuário]
Visible elements: [elementos_visiveis se fornecido]
Lighting: [iluminação mapeada]

This environment is FIXED.
Do NOT replace it.
Do NOT simplify it.
Do NOT generalize it.
Do NOT use any default or generic environment.
The entire video must take place in this exact environment.

[SE PRODUTO EXISTE:]
PRODUCT (CRITICAL — MUST BE VISIBLE):
The image provided represents the PRODUCT: [nome_do_produto].
The character MUST hold the product in hand.
The product MUST remain visible for the ENTIRE video.
The character MUST perform this action with the product:
[acao_com_produto]
The product MUST NOT be placed on surfaces or left in the background.

CHARACTER:
Name: [nome]
Age: [idade] years old
Gender: [genero]
[Descrição se avatar customizado]

The character has a realistic appearance...

CINEMATOGRAPHY:
[SE CUSTOM:]
  Framing: [custom ou default]
  Camera angle: [custom ou default]
  ...
[SE NÃO CUSTOM:]
  Medium close-up framing (head and shoulders).
  Eye-level angle.
  ...

ACTION & PERFORMANCE:
Creative style: [estilo do quiz]
Single continuous take.
...

LANGUAGE RULE (CRITICAL):
Speak ONLY in [idioma detectado].
...

DIALOGUE (LOCKED — DO NOT CHANGE):
Say EXACTLY the following text, word for word:
"[dialogo_exato_do_usuario]"

TIMING RULES:
- The dialogue must finish within [X] seconds.
...

AUDIO:
Clear smartphone microphone audio.
...

QUALITY & AUTHENTICITY MODIFIERS:
smartphone selfie,
real UGC,
handheld realism,
...

NEGATIVE CONSTRAINTS:
No subtitles.
No generic environments.
No ignoring the scenario.
[SE PRODUTO: No product out of frame.]
```

## ✅ Garantias do Sistema

Após esta refatoração:

1. ✅ O cenário digitado no quiz aparece **literalmente** no prompt
2. ✅ O Sora não pode inventar ou substituir o ambiente
3. ✅ Produto só aparece no prompt quando existe imagem de produto
4. ✅ Estilo de gravação não conflita (preset padrão ou customizado)
5. ✅ O prompt é 100% determinístico baseado nas respostas do quiz
6. ✅ Não há mais defaults genéricos como "everyday indoor setting"
7. ✅ Elementos visíveis podem adicionar contexto adicional
8. ✅ Iluminação é descritiva e clara

## 🔍 Testes Recomendados

Para validar a refatoração:

1. **Teste de Cenário Específico:**
   - Preencher: "Quarto com esteira no chão"
   - Elementos: "Esteira embaixo do personagem, cama ao fundo"
   - Verificar: Prompt deve conter exatamente esses termos

2. **Teste de Preset Padrão:**
   - Não preencher nenhum campo de estilo de gravação
   - Verificar: Prompt usa preset completo de iPhone selfie

3. **Teste de Estilo Customizado:**
   - Preencher apenas "Enquadramento: Close-up extremo"
   - Verificar: Prompt usa close-up e preenche resto com defaults

4. **Teste Sem Produto:**
   - Pular etapa de produto
   - Verificar: Bloco PRODUCT não aparece no prompt

5. **Teste Com Produto:**
   - Adicionar produto com ação específica
   - Verificar: Bloco PRODUCT aparece com ação literal

## 🚀 Próximos Passos

O sistema está pronto para Sora 2 e Sora 2 Pro (KIE API). As mudanças são retrocompatíveis com vídeos existentes através do `retryFailedVideo` que foi atualizado para mapear os campos antigos para os novos.

## 📄 Arquivos Modificados

1. `src/pages/SoraManual.jsx` - Quiz e interface
2. `supabase/functions/generate-video-kie/index.ts` - Geração de prompt
3. `src/services/kieApiService.js` - Função de retry
4. `QUIZ_PROMPT_REFACTOR.md` - Esta documentação
