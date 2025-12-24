# Ajustes da Etapa 4: Formato do Vídeo - Sora 2 / Sora 2 Pro

## 🎯 Objetivo

Alinhar 100% com as limitações reais da API KIE para Sora 2 e Sora 2 Pro, garantindo que apenas opções válidas sejam exibidas e enviadas para a API.

## ✅ Mudanças Implementadas

### 1. SELEÇÃO DE MODELO (NOVA)

**Adicionado campo de seleção de modelo:**

- **Sora 2** (padrão)
  - Subtitle: "Até 15s"
  - Limitações: apenas 10s e 15s

- **Sora 2 Pro**
  - Subtitle: "Até 25s (storyboard)"
  - Limitações: 10s, 15s, e 25s (25s somente com storyboard ativo)

**Comportamento:**
- Ao trocar de Sora 2 Pro para Sora 2 com 25s selecionado → fallback automático para 15s
- Visual: 2 cards lado a lado com seleção clara

### 2. PROPORÇÃO (ASPECT RATIO)

**ANTES:**
- 3 opções: 9:16, 1:1, 16:9

**DEPOIS:**
- **2 opções apenas:**
  - **9:16 (Vertical)** → mapeado internamente para `"portrait"`
  - **16:9 (Horizontal)** → mapeado internamente para `"landscape"`

**Mapeamento no Edge Function:**
```typescript
const mappedAspectRatio = uiRatio === '9:16' ? 'portrait' : 'landscape';
```

**Racional:**
- API KIE aceita apenas `portrait` e `landscape`
- Formato 1:1 (quadrado) não existe no Sora 2
- Mapeamento transparente: usuário vê 9:16, API recebe "portrait"

### 3. DURAÇÃO

**Lógica Dinâmica Implementada:**

```javascript
// Grid de duração ajusta colunas automaticamente
const canShow25s = formData.model === 'sora-2-pro' && formData.storyboardMode;
return canShow25s ? 'grid-cols-3' : 'grid-cols-2';
```

**Opções Visíveis:**

| Modelo | Storyboard | Durações Mostradas |
|--------|------------|-------------------|
| Sora 2 | OFF | 10s, 15s |
| Sora 2 | ON | 10s, 15s |
| Sora 2 Pro | OFF | 10s, 15s |
| Sora 2 Pro | ON | 10s, 15s, **25s** |

**Mensagens de Hint:**
- Sora 2: "Sora 2 suporta apenas 10s e 15s. Use Sora 2 Pro para vídeos de 25s."
- Sora 2 Pro (sem storyboard): "Ative o modo Storyboard para desbloquear vídeos de 25s."

**Mapeamento no Edge Function:**
```typescript
let nFrames = "15";
if (durationSeconds === 10) nFrames = "10";
else if (durationSeconds === 15) nFrames = "15";
else if (durationSeconds === 25) {
  if (baseModel !== 'sora-2-pro') {
    throw new Error('25s duration is only supported with Sora 2 Pro model');
  }
  nFrames = "25";
}
```

### 4. QUALIDADE (SIZE) - NOVA SEÇÃO

**Regra de Ouro:**
- **Sora 2 (normal)**: SEMPRE usa `size: "standard"` (não negociável)
- **Sora 2 Pro**: pode usar `size: "standard"` ou `size: "high"`

**UI - Sora 2:**
- Mostra card fixo com borda pontilhada (border-dashed)
- Texto: "⚪ Standard"
- Mensagem: "Alta qualidade disponível apenas no Sora 2 Pro"
- Usuário não pode alterar

**UI - Sora 2 Pro:**
- Mostra 2 cards selecionáveis:
  - ⚪ Standard (Qualidade padrão)
  - 🔥 Alta Qualidade (Máxima resolução)
- Grid 2 colunas com transição suave

**Comportamento ao trocar modelo:**
- Sora 2 Pro → Sora 2 com "high" selecionado → fallback automático para "standard"

**Mapeamento no Backend:**
```typescript
function mapSoraSize(quality: string | undefined, isPro: boolean): string {
  if (!isPro) return "standard";  // Sora 2 sempre standard
  return quality === "high" ? "high" : "standard";
}
```

**Validação:**
```typescript
if (!isPro && kiePayload.input.size === 'high') {
  throw new Error('High quality (size: "high") is only available with Sora 2 Pro model');
}
```

### 5. MODO STORYBOARD (AJUSTADO)

**Novo Comportamento:**
- Ao desativar storyboard com 25s selecionado → fallback automático para 15s
- Transição suave da grade de duração (3 colunas → 2 colunas)

```javascript
onClick={() => {
  const newStoryboardMode = !formData.storyboardMode;
  updateFormData('storyboardMode', newStoryboardMode);
  if (!newStoryboardMode && formData.duration === '25s') {
    updateFormData('duration', '15s');
  }
}}
```

### 6. REVISÃO FINAL (ATUALIZADA)

**Adicionado modelo e qualidade ao resumo:**

```
Sora 2 • Standard • 9:16 • 15s • Vídeo único
```

ou

```
Sora 2 Pro • Alta Qualidade • 16:9 • 25s • Storyboard
```

## 🔧 Mudanças Técnicas

### Frontend (SoraManual.jsx)

**FormData atualizado:**
```javascript
{
  model: 'sora-2',  // NOVO
  quality: 'standard',  // NOVO
  aspectRatio: '9:16',
  duration: '15s',
  storyboardMode: false,
  // ... outros campos
}
```

**Payload enviado para kieApiService:**
```javascript
const kiePayload = {
  videoId: video.id,
  model: formData.model,  // NOVO
  quality: formData.quality,  // NOVO
  aspectRatio: formData.aspectRatio,  // ainda envia 9:16 ou 16:9
  duration: formData.duration,
  // ... outros campos
};
```

### Backend (generate-video-kie/index.ts)

**Interface atualizada:**
```typescript
interface ProjectData {
  videoId: string;
  model?: string;  // NOVO
  quality?: string;  // NOVO
  aspectRatio: string;
  duration: string;
  // ... outros campos
}
```

**Lógica de geração:**
```typescript
const baseModel = projectData.model || 'sora-2';

// Validação de 25s
if (durationSeconds === 25 && baseModel !== 'sora-2-pro') {
  throw new Error('25s duration is only supported with Sora 2 Pro model');
}

// Mapeamento de aspect ratio
const mappedAspectRatio = uiRatio === '9:16' ? 'portrait' : 'landscape';

// Mapeamento de qualidade/size
const isPro = baseModel === 'sora-2-pro';
const mappedSize = mapSoraSize(projectData.quality, isPro);

function mapSoraSize(quality: string | undefined, isPro: boolean): string {
  if (!isPro) return "standard";  // Sora 2 sempre standard
  return quality === "high" ? "high" : "standard";
}

// Construção do modelo final
const model = hasProductImage
  ? `${baseModel}-image-to-video`
  : `${baseModel}-text-to-video`;

// Exemplos:
// - sora-2-text-to-video
// - sora-2-pro-text-to-video
// - sora-2-image-to-video
// - sora-2-pro-image-to-video
```

**Validações:**
```typescript
// n_frames
const validFrames = ['10', '15', '25'];
if (!validFrames.includes(kiePayload.input.n_frames)) {
  throw new Error(`Invalid n_frames: ${kiePayload.input.n_frames}. Must be "10", "15", or "25"`);
}

// aspect_ratio
const validAspectRatios = ['portrait', 'landscape'];
if (!validAspectRatios.includes(kiePayload.input.aspect_ratio)) {
  throw new Error(`Invalid aspect_ratio: ${kiePayload.input.aspect_ratio}. Must be "portrait" or "landscape"`);
}

// size (qualidade)
const validSizes = ['standard', 'high'];
if (!validSizes.includes(kiePayload.input.size)) {
  throw new Error(`Invalid size: ${kiePayload.input.size}. Must be "standard" or "high"`);
}

// Verificar se "high" é usado apenas com Sora 2 Pro
if (!isPro && kiePayload.input.size === 'high') {
  throw new Error('High quality (size: "high") is only available with Sora 2 Pro model');
}
```

## 📋 Fluxo Completo de Validação

1. **UI - Seleção de Modelo**
   - Usuário seleciona Sora 2 ou Sora 2 Pro
   - Se trocar para Sora 2 com 25s selecionado → reset para 15s

2. **UI - Proporção**
   - Apenas 9:16 e 16:9 disponíveis
   - Formato 1:1 removido completamente

3. **UI - Duração**
   - 10s e 15s sempre visíveis
   - 25s aparece SOMENTE se: Sora 2 Pro + Storyboard ON
   - Grid ajusta automaticamente (2 ou 3 colunas)

4. **UI - Qualidade**
   - Sora 2: mostra card fixo com "Standard" (não selecionável)
   - Sora 2 Pro: mostra 2 cards (Standard e Alta Qualidade)
   - Trocar para Sora 2 com "high" → reset para "standard"

5. **UI - Storyboard Toggle**
   - Desligar storyboard com 25s → reset para 15s

6. **Backend - Validação**
   - Verifica se 25s tem modelo correto
   - Mapeia aspect ratio: 9:16 → portrait, 16:9 → landscape
   - Constrói modelo final: `{baseModel}-{mode}-to-video`
   - Valida n_frames: 10, 15, ou 25
   - Valida aspect_ratio: portrait ou landscape

7. **API KIE**
   - Recebe modelo completo (ex: sora-2-pro-text-to-video)
   - Recebe aspect_ratio: portrait ou landscape
   - Recebe n_frames: 10, 15, ou 25
   - Recebe size: standard ou high

## ✅ Garantias

1. ✅ Apenas opções válidas são exibidas (nunca desabilitar, sempre esconder)
2. ✅ Fallback automático quando seleção se torna inválida
3. ✅ Mapeamento transparente de aspect ratio
4. ✅ Mapeamento transparente de quality → size
5. ✅ Validação em múltiplas camadas (UI → Frontend → Backend)
6. ✅ Transições suaves ao mostrar/esconder opções
7. ✅ Mensagens de hint claras sobre limitações
8. ✅ Formato 1:1 completamente removido
9. ✅ 25s bloqueado para Sora 2
10. ✅ 25s disponível apenas com storyboard em Sora 2 Pro
11. ✅ Alta qualidade (size: high) bloqueada para Sora 2
12. ✅ Sora 2 sempre envia size: "standard" para a API
13. ✅ Sora 2 Pro pode escolher entre "standard" e "high"

## 🧪 Testes Recomendados

### Teste 1: Modelo Sora 2
1. Selecionar Sora 2
2. Verificar: apenas 10s e 15s visíveis
3. Verificar: mensagem de hint aparece
4. Verificar: storyboard ON não libera 25s

### Teste 2: Modelo Sora 2 Pro sem Storyboard
1. Selecionar Sora 2 Pro
2. Storyboard OFF
3. Verificar: apenas 10s e 15s visíveis
4. Verificar: mensagem "Ative storyboard para 25s"

### Teste 3: Modelo Sora 2 Pro com Storyboard
1. Selecionar Sora 2 Pro
2. Storyboard ON
3. Verificar: 10s, 15s, 25s visíveis
4. Verificar: grid tem 3 colunas
5. Selecionar 25s
6. Desligar storyboard
7. Verificar: duração resetou para 15s

### Teste 4: Troca de Modelo com 25s
1. Sora 2 Pro + Storyboard ON
2. Selecionar 25s
3. Trocar para Sora 2
4. Verificar: duração resetou para 15s

### Teste 5: Proporções
1. Verificar: apenas 9:16 e 16:9 disponíveis
2. Verificar: 1:1 não aparece
3. Selecionar 9:16 e gerar vídeo
4. Verificar backend: recebeu "portrait"
5. Selecionar 16:9 e gerar vídeo
6. Verificar backend: recebeu "landscape"

### Teste 6: Qualidade - Sora 2
1. Selecionar Sora 2
2. Verificar: card fixo com "Standard" (não selecionável)
3. Verificar: mensagem "Alta qualidade disponível apenas no Sora 2 Pro"
4. Gerar vídeo
5. Verificar backend: recebeu size: "standard"

### Teste 7: Qualidade - Sora 2 Pro
1. Selecionar Sora 2 Pro
2. Verificar: 2 cards selecionáveis (Standard e Alta Qualidade)
3. Selecionar "Alta Qualidade"
4. Gerar vídeo
5. Verificar backend: recebeu size: "high"
6. Selecionar "Standard"
7. Gerar vídeo
8. Verificar backend: recebeu size: "standard"

### Teste 8: Troca de Modelo com Alta Qualidade
1. Sora 2 Pro
2. Selecionar "Alta Qualidade"
3. Trocar para Sora 2
4. Verificar: qualidade resetou para "standard"
5. Verificar: card fixo aparece (não selecionável)

## 📄 Arquivos Modificados

1. `src/pages/SoraManual.jsx` - UI do quiz
2. `supabase/functions/generate-video-kie/index.ts` - Edge function
3. `SORA_2_FORMAT_UPDATES.md` - Esta documentação

## 🎨 Consistência Visual

- Dark SaaS premium mantido
- Transições suaves com `transition-all`
- Grid responsivo com ajuste automático
- Cards com border-2 e hover states
- Cards fixos (não selecionáveis) com border-dashed
- Cores: brandPrimary para selecionado, surfaceMuted para não selecionado
- Mensagens de hint com text-xs e text-textSecondary
- Ícones: ⚪ para Standard, 🔥 para Alta Qualidade

## 📊 Exemplos de Payloads Finais

### Sora 2 - Text-to-Video
```json
{
  "model": "sora-2-text-to-video",
  "input": {
    "prompt": "...",
    "aspect_ratio": "portrait",
    "n_frames": "15",
    "size": "standard",
    "remove_watermark": true
  }
}
```

### Sora 2 Pro - Image-to-Video (Alta Qualidade)
```json
{
  "model": "sora-2-pro-image-to-video",
  "input": {
    "prompt": "...",
    "image_urls": ["https://...png"],
    "aspect_ratio": "landscape",
    "n_frames": "25",
    "size": "high",
    "remove_watermark": true
  }
}
```

### Sora 2 - Image-to-Video (Standard obrigatório)
```json
{
  "model": "sora-2-image-to-video",
  "input": {
    "prompt": "...",
    "image_urls": ["https://...png"],
    "aspect_ratio": "portrait",
    "n_frames": "10",
    "size": "standard",
    "remove_watermark": true
  }
}
```

Observe que mesmo se o usuário escolhesse "Alta Qualidade" no UI (se tivesse permissão), o Sora 2 sempre enviaria `size: "standard"` devido à função `mapSoraSize()`.
