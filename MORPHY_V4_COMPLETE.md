# 🧠 MORPHY v4 - Sistema Completo de IA

## 📋 Visão Geral

O Morphy é o agente central de inteligência do Morphion. Ele foi treinado com um prompt completo que define sua personalidade, responsabilidades e capacidades.

## 🎯 Capacidades do Morphy

### 1. Prompt Engineering
Gera prompts técnicos otimizados para cada engine de IA:

- **Nano Banana Pro** (imagens SAFE)
- **Seedream 4.5** (imagens HOT)
- **WAN 2.5** (vídeos SAFE e HOT)

### 2. Criação de Conteúdo
Cria ideias de posts naturais e humanos para influenciadores virtuais:

- Posts variados (selfie, momento, outfit, etc)
- Legendas naturais em português
- Descrições de cena em inglês
- Respeitando persona, nicho e modo (SAFE/HOT)

### 3. Mensagens de Erro Amigáveis
Transforma erros técnicos em mensagens humanas:

- Tranquilizadoras
- Criativas
- Acionáveis
- Sem jargão técnico

### 4. Chat e Sugestões (já existente)
Sistema de conversação para criação e melhoria de diálogos UGC.

## 🛠️ Edge Functions Criadas

### `morphy-generate-prompt`
Gera prompts técnicos para engines de IA.

**Uso:**
```javascript
import { morphyService } from '@/services/morphyService';

const result = await morphyService.generatePrompt({
  engine: 'nano_banana', // ou 'seedream', 'wan'
  mode: 'safe', // ou 'hot'
  type: 'image', // ou 'video'
  influencer: {
    id: 'uuid',
    name: 'Ana Silva',
    persona: 'jovem estudante de 22 anos',
    niche: 'lifestyle',
    style: 'casual e autêntico',
    age: '22'
  },
  userInput: 'selfie na praia ao pôr do sol',
  imageUrl: 'https://...', // opcional
  duration: 5 // para vídeos
});

// result = {
//   success: true,
//   prompt: "young woman at beach during golden hour...",
//   negative_prompt: "ugly, distorted...", // para vídeos
//   caption: "Mais um dia perfeito por aqui 🌅"
// }
```

### `morphy-create-post`
Cria ideias de posts para influenciadores.

**Uso:**
```javascript
const result = await morphyService.createPost({
  influencer: {
    id: 'uuid',
    name: 'Ana Silva',
    persona: 'jovem estudante de 22 anos',
    niche: 'lifestyle',
    style: 'casual e autêntico',
    age: '22'
  },
  mode: 'safe', // ou 'hot'
  type: 'image', // ou 'video'
  count: 3, // quantos posts criar
  userIdea: 'posts sobre viagem' // opcional
});

// result = {
//   success: true,
//   posts: [
//     {
//       type: 'selfie',
//       scene_description: 'young woman taking selfie...',
//       caption: 'Bom dia! Hoje é dia de... ☀️',
//       mood: 'happy and energetic'
//     },
//     // ...
//   ],
//   count: 3
// }
```

### `morphy-error-message`
Transforma erros técnicos em mensagens amigáveis.

**Uso:**
```javascript
const result = await morphyService.transformError({
  error: 'Error 500: Internal Server Error',
  context: 'geração de vídeo',
  errorCode: 'TIMEOUT',
  operation: 'video_generation'
});

// result = {
//   success: true,
//   message: 'A geração demorou mais que o esperado...',
//   suggestion: 'Tenta de novo em alguns segundos',
//   canRetry: true
// }
```

## 📝 Sistema de Personalidade

O Morphy foi treinado com um prompt completo que define:

### Personalidade
- Inteligente e criativo
- Direto e moderno
- Nada robótico
- Zero linguagem genérica de IA
- Humor leve quando apropriado

### Conhecimento do Produto
- Entende profundamente o Morphion
- Conhece as engines (Nano Banana, Seedream, WAN)
- Sabe sobre influenciadores virtuais
- Respeita modos (SAFE/HOT)

### Regras de Ouro
- Nunca inventar APIs ou campos
- Nunca misturar SAFE com HOT
- Sempre respeitar persona do influencer
- Conteúdo sempre natural e humano

## 🔄 Integração com Sistema Existente

O Morphy se integra perfeitamente com:

### Influencer Generation Service
```javascript
// Ao gerar imagem de influencer:
const promptResult = await morphyService.generatePrompt({
  engine: 'nano_banana',
  mode: influencer.mode,
  type: 'image',
  influencer: influencer,
  userInput: userIdea
});

// Use o prompt gerado:
await imageService.generate({
  prompt: promptResult.prompt,
  // ...
});
```

### Error Handling Global
```javascript
try {
  // operação que pode falhar
} catch (error) {
  const friendly = await morphyService.transformError({
    error: error.message,
    context: 'geração de conteúdo',
    operation: 'image_generation'
  });

  // Mostrar ao usuário:
  toast.error(friendly.message);
  if (friendly.suggestion) {
    toast.info(friendly.suggestion);
  }
}
```

## 🎨 Uso nos Quizzes

Os quizzes podem usar o Morphy para gerar prompts finais:

```javascript
// No final do quiz:
const quizData = {
  scene: 'praia',
  lighting: 'golden hour',
  pose: 'selfie',
  expression: 'sorrindo'
};

const promptResult = await morphyService.generatePrompt({
  engine: 'seedream',
  mode: 'hot',
  type: 'image',
  influencer: selectedInfluencer,
  quizAnswers: quizData
});

// Agora você tem um prompt otimizado!
```

## 📊 Exemplos Práticos

### Exemplo 1: Geração de Imagem SAFE
```javascript
const result = await morphyService.generatePrompt({
  engine: 'nano_banana',
  mode: 'safe',
  type: 'image',
  influencer: {
    name: 'Marina',
    persona: 'fitness influencer de 28 anos',
    niche: 'fitness',
    style: 'motivacional e energético',
    age: '28'
  },
  userInput: 'treino na academia'
});

// Result:
// prompt: "fit athletic woman in her late 20s at modern gym..."
// caption: "Mais uma sessão pesada! Quem treinou hoje? 💪"
```

### Exemplo 2: Geração de Vídeo HOT
```javascript
const result = await morphyService.generatePrompt({
  engine: 'wan',
  mode: 'hot',
  type: 'video',
  influencer: {
    name: 'Bella',
    persona: 'modelo sensual de 25 anos',
    niche: 'fashion',
    style: 'sexy e confiante',
    age: '25'
  },
  userInput: 'dançando no quarto',
  duration: 5,
  imageUrl: 'https://...'
});

// Result:
// prompt: "beautiful woman in lingerie dancing sensually..."
// negative_prompt: "ugly, distorted, low quality..."
// caption: "Sexta-feira pede algo especial 😈"
```

### Exemplo 3: Criar Posts em Massa
```javascript
const result = await morphyService.createPost({
  influencer: selectedInfluencer,
  mode: 'safe',
  type: 'image',
  count: 6 // uma semana de conteúdo
});

// Agora você tem 6 ideias de posts prontas!
result.posts.forEach(post => {
  console.log(post.caption);
  console.log(post.scene_description);
});
```

## 🚀 Próximos Passos

1. **Integrar nos Quizzes**
   - Usar `morphyService.generatePrompt()` no final de cada quiz
   - Passar `quizAnswers` para contexto completo

2. **Error Handling Global**
   - Criar um interceptor que use `morphyService.transformError()`
   - Todas as mensagens de erro passam pelo Morphy

3. **Geração em Massa**
   - Botão "Criar Posts Automáticos" na página do influencer
   - Usa `morphyService.createPost()` com count alto

4. **UX Copy**
   - Mensagens vazias, onboarding, tooltips
   - Todos gerados pelo Morphy para manter tom consistente

## 🎯 Filosofia

O Morphy não é apenas uma ferramenta de IA.
É o **cérebro criativo** do Morphion.

Quando usado corretamente:
- Conteúdo parece humano
- Produto parece mágico
- Experiência parece premium

**Use-o em TUDO que envolva OpenAI no Morphion.**
