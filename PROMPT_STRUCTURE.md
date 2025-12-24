# Estrutura de Prompt para KIE Sora 2

Este documento descreve como o sistema constrói prompts para geração de vídeos com o KIE Sora 2.

## Princípio Fundamental

O prompt final é SEMPRE composto por:
1. **Descrição visual em INGLÊS** (aspectos técnicos e visuais)
2. **Ambiente TRAVADO** (com instruções explícitas para não substituir)
3. **Produto obrigatório e ativo** (quando houver imagem)
4. **Diálogo no idioma ORIGINAL do usuário** (sem tradução)
5. **Regra de idioma EXPLÍCITA** para forçar o modelo a respeitar o idioma

## Estrutura do Prompt

### 1. Technical Header
```
TECHNICAL HEADER:
A casual, selfie-style IPHONE 15 PRO front-camera vertical video (9:16),
recorded handheld at arm's length, with subtle micro-jitters, natural
exposure shifts, and realistic smartphone stabilization artifacts.
```

### 2. Environment (FIXED - DO NOT CHANGE)
```
ENVIRONMENT (FIXED - DO NOT CHANGE):
Filmed in [LOCATION].
Lighting is [LIGHTING_TYPE].
This environment is FIXED.
Do NOT replace it.
Do NOT simplify it.
Do NOT use default or generic backgrounds.
```

**⚠️ CRÍTICO**: O ambiente é travado com instruções explícitas para evitar que o Sora 2 use ambientes genéricos/padrão.

**Opções de Location:**
- Cozinha Moderna → a modern kitchen
- Sala de Estar → a living room
- Quarto → a bedroom
- Escritório → a home office
- Área Externa → an outdoor area
- Café → a coffee shop
- Parque → a park

**Opções de Lighting:**
- Natural → natural
- Suave → soft
- Estúdio → studio
- Dramática → dramatic
- Dourada → golden hour

### 3. Product (CRITICAL - MUST BE VISIBLE) - Condicional
Incluído **APENAS** quando `productData.image_url` existe:
```
PRODUCT (CRITICAL - MUST BE VISIBLE):
The image provided represents the PRODUCT: [PRODUCT_NAME].
The character MUST hold the product in their hand.
The product MUST remain visible for the ENTIRE video.
The character MUST gesture naturally with the product while speaking.
Action: [PRODUCT_ACTION].
The product MUST NOT be ignored or placed on a surface.
The product MUST NOT be in the background.
```

**⚠️ CRÍTICO**: Quando há imagem de produto, ele DEVE ser segurado, mantido visível e usado na gesticulação durante todo o vídeo.

### 4. Character
```
CHARACTER:
[NAME], a [AGE]-year-old [GENDER].
Realistic appearance with visible skin texture, natural facial
micro-expressions, no artificial smoothing.
Maintains direct eye contact with the camera.
```

### 5. Cinematography
```
CINEMATOGRAPHY:
Medium close-up framing (head and shoulders).
Eye-level angle.
iPhone front camera (~24mm equivalent).
Slight handheld sway only.
No tripod. No cinematic camera moves.
```

### 6. Action & Performance
```
ACTION & PERFORMANCE:
Single continuous take.
The character speaks naturally to the camera.
Gestures and facial expressions are synchronized with the spoken dialogue.
No cuts. No scene changes.
```

### 7. Language Rule (CRITICAL)
```
LANGUAGE RULE (CRITICAL):
Speak ONLY in [LANGUAGE_NAME].
Do NOT translate.
Do NOT mix languages.
Do NOT add or remove words.
Pronounce clearly and naturally.
```

**Idiomas Suportados:**
- Português → pt-BR / Portuguese (padrão)
- Espanhol → es-ES / Spanish
- Inglês → en-US / English
- Polonês → pl-PL / Polish

### 8. Dialogue (LOCKED - DO NOT CHANGE)
```
DIALOGUE (LOCKED - DO NOT CHANGE):
SAY EXACTLY THIS, WORD FOR WORD:
"[USER_DIALOGUE]"
```

**⚠️ O diálogo é mantido EXATAMENTE como o usuário escreveu**, sem modificações, traduções ou adições.

### 9. Timing Rules
```
TIMING RULES:
- The dialogue must finish within the first [MAX_SPEECH_TIME] seconds.
- After finishing the dialogue, remain silent on camera for 2 seconds.
- Never cut off speech mid-sentence.
```

**Cálculo de Speech Duration:**
- 10s → fala até 8s (2s de buffer)
- 15s → fala até 14s (1s de buffer)
- 25s → fala até 23s (2s de buffer)

### 10. Audio
```
AUDIO:
Clear smartphone microphone audio.
Slight room reverb.
No background music.
Natural pacing.
Perfect lip-sync required.
```

### 11. Quality & Authenticity Modifiers
```
QUALITY & AUTHENTICITY MODIFIERS:
smartphone selfie,
real UGC,
handheld realism,
subtle exposure shifts,
minor digital noise,
imperfect framing,
raw TikTok-style footage.
```

### 12. Negative Constraints
```
NEGATIVE CONSTRAINTS:
No subtitles.
No captions.
No text overlays.
No logos.
No watermarks.
No CGI look.
No plastic skin.
No exaggerated gestures.
No jump cuts.
No studio lighting.
No default background.
No generic environment.
```

**Se houver produto (image_urls):**
```
No ignoring the product.
No product out of frame.
```

## Detecção de Idioma

O sistema detecta automaticamente o idioma do diálogo usando:

### Padrões de Palavras Comuns (peso 2x)
- Português: você, não, muito, mais, como, para, com, que, olá, sim, etc.
- Espanhol: tú, usted, muy, más, cómo, para, con, hola, sí, etc.
- Polonês: ty, nie, bardzo, jak, dla, cześć, tak, etc.
- Inglês: you, not, very, more, how, for, with, hello, yes, etc.

### Caracteres Especiais (peso 3x)
- Português: ã, õ, ç, á, é, í, ó, ú, â, ê, ô, à
- Espanhol: ñ, á, é, í, ó, ú, ü, ¿, ¡
- Polonês: ą, ć, ę, ł, ń, ó, ś, ź, ż

### Fallback
Se nenhum idioma for detectado com certeza, o sistema usa **Português (pt-BR)** como padrão.

## Envio para KIE API

### Payload para Text-to-Video
Quando **NÃO** há imagem de produto:
```json
{
  "model": "sora-2-text-to-video",
  "callBackUrl": "https://[SUPABASE_URL]/functions/v1/kie-callback",
  "input": {
    "prompt": "[PROMPT COMPLETO]",
    "aspect_ratio": "portrait",
    "n_frames": "15",
    "remove_watermark": true
  }
}
```

### Payload para Image-to-Video
Quando **EXISTE** imagem de produto:
```json
{
  "model": "sora-2-image-to-video",
  "callBackUrl": "https://[SUPABASE_URL]/functions/v1/kie-callback",
  "input": {
    "prompt": "[PROMPT COMPLETO]",
    "image_urls": ["https://[STORAGE_URL]/images/produto.png"],
    "aspect_ratio": "portrait",
    "n_frames": "15",
    "remove_watermark": true
  }
}
```

## Exemplo Completo

**Inputs do Quiz:**
- Avatar: Lucas, 28 anos, Masculino
- Location: Cozinha Moderna
- Lighting: Natural
- Duração: 15s
- Diálogo: "Galera, a mega cena vai sortear 850 milhões!"
- Produto: iPhone 15 Pro
- Ação: Segurando próximo ao rosto
- Imagem: https://example.com/iphone.png

**Prompt Gerado:**
```
TECHNICAL HEADER:
A casual, selfie-style IPHONE 15 PRO front-camera vertical video (9:16),
recorded handheld at arm's length, with subtle micro-jitters, natural
exposure shifts, and realistic smartphone stabilization artifacts.

ENVIRONMENT (FIXED - DO NOT CHANGE):
Filmed in a modern kitchen.
Lighting is natural.
This environment is FIXED.
Do NOT replace it.
Do NOT simplify it.
Do NOT use default or generic backgrounds.

PRODUCT (CRITICAL - MUST BE VISIBLE):
The image provided represents the PRODUCT: iPhone 15 Pro.
The character MUST hold the product in their hand.
The product MUST remain visible for the ENTIRE video.
The character MUST gesture naturally with the product while speaking.
Action: Segurando próximo ao rosto.
The product MUST NOT be ignored or placed on a surface.
The product MUST NOT be in the background.

CHARACTER:
Lucas, a 28-year-old male.
Realistic appearance with visible skin texture, natural facial
micro-expressions, no artificial smoothing.
Maintains direct eye contact with the camera.

CINEMATOGRAPHY:
Medium close-up framing (head and shoulders).
Eye-level angle.
iPhone front camera (~24mm equivalent).
Slight handheld sway only.
No tripod. No cinematic camera moves.

ACTION & PERFORMANCE:
Single continuous take.
The character speaks naturally to the camera.
Gestures and facial expressions are synchronized with the spoken dialogue.
No cuts. No scene changes.

LANGUAGE RULE (CRITICAL):
Speak ONLY in Portuguese.
Do NOT translate.
Do NOT mix languages.
Do NOT add or remove words.
Pronounce clearly and naturally.

DIALOGUE (LOCKED - DO NOT CHANGE):
SAY EXACTLY THIS, WORD FOR WORD:
"Galera, a mega cena vai sortear 850 milhões!"

TIMING RULES:
- The dialogue must finish within the first 14 seconds.
- After finishing the dialogue, remain silent on camera for 2 seconds.
- Never cut off speech mid-sentence.

AUDIO:
Clear smartphone microphone audio.
Slight room reverb.
No background music.
Natural pacing.
Perfect lip-sync required.

QUALITY & AUTHENTICITY MODIFIERS:
smartphone selfie,
real UGC,
handheld realism,
subtle exposure shifts,
minor digital noise,
imperfect framing,
raw TikTok-style footage.

NEGATIVE CONSTRAINTS:
No subtitles.
No captions.
No text overlays.
No logos.
No watermarks.
No CGI look.
No plastic skin.
No exaggerated gestures.
No jump cuts.
No studio lighting.
No default background.
No generic environment.
No ignoring the product.
No product out of frame.
```

## Notas Importantes

1. **NUNCA traduzir o diálogo** - ele deve ser mantido no idioma original do usuário
2. **SEMPRE incluir o bloco LANGUAGE RULE** - isso força o modelo a respeitar o idioma e pronúncia
3. **Descrições técnicas em inglês** - apenas o diálogo fica no idioma do usuário
4. **Ambiente é TRAVADO** - instruções explícitas para não usar ambiente genérico
5. **Produto é OBRIGATÓRIO** (quando houver) - deve ser segurado e visível o tempo todo
6. **Timing dinâmico** - calculado automaticamente com base na duração escolhida (10s, 15s, 25s)
7. **Headers explícitos** - cada seção tem um cabeçalho claro (TECHNICAL HEADER, ENVIRONMENT, etc.)
8. **Pronúncia natural** - a regra "Pronounce clearly and naturally" garante boa dicção
9. **Autenticidade** - a seção QUALITY & AUTHENTICITY MODIFIERS garante visual realista tipo UGC/TikTok
10. **N_FRAMES correto** - usar "15" frames para vídeos de 10-25 segundos
11. **Detecção automática** - o idioma é detectado automaticamente do diálogo usando padrões e caracteres especiais
12. **Negative Constraints fortes** - incluem "No default background" e "No ignoring the product"

## Checklist de Validação

Antes de gerar um vídeo, verificar:

- [ ] Ambiente está explicitamente travado (FIXED - DO NOT CHANGE)
- [ ] Se há produto, ele está marcado como CRITICAL - MUST BE VISIBLE
- [ ] Idioma foi detectado corretamente
- [ ] Diálogo está marcado como LOCKED - DO NOT CHANGE
- [ ] Timing está calculado corretamente (duração - 1 ou 2 segundos)
- [ ] Negative Constraints incluem "No default background" e "No generic environment"
- [ ] Se há produto, Negative Constraints incluem "No ignoring the product"
- [ ] Model correto (text-to-video vs image-to-video)
- [ ] n_frames = "15"
- [ ] aspect_ratio correto (portrait, square, landscape)
