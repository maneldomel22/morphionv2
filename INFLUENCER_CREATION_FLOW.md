# Fluxo de Criação de Influencers - Backend First

Sistema completo de criação de influencers virtuais com identidade visual consistente.

## Visão Geral

Quando o usuário completa o quiz de criação, o sistema:
1. Gera vídeo de apresentação (10s) usando WAN 2.5
2. Extrai identidade visual do vídeo
3. Cria foto de perfil com rosto consistente
4. Gera bodymap para manter corpo/marcas fixas
5. Influencer fica pronta para uso

## Arquitetura

### Database Schema

Novos campos em `influencers`:
- `creation_status`: Status do processo de criação
- `intro_video_url`: URL do vídeo de apresentação
- `intro_video_task_id`: Task ID do vídeo em geração
- `reference_frame_url`: Frame de referência extraído
- `profile_image_task_id`: Task ID da foto de perfil
- `bodymap_task_id`: Task ID do bodymap
- `creation_metadata`: Metadados do processo

### Status Flow

```
creating_video → extracting_frame → creating_profile_image →
creating_bodymap → optimizing_identity → ready
```

## Edge Functions

### 1. `create-influencer-with-intro`
**Entrada**: Dados do quiz (nome, idade, características físicas, etc.)
**Saída**: `influencer_id` e `task_id` do vídeo

**Processo**:
1. Constrói prompt detalhado para vídeo de apresentação
2. Chama KIE API (WAN 2.5) para gerar vídeo
3. Cria registro em `influencers` com status `creating_video`
4. Retorna IDs para monitoramento

**Prompt do Vídeo**:
- Duração: 10 segundos
- Formato: Selfie vertical (9:16)
- Ação: Apresentação → giro mostrando corpo → contato visual final
- Linguagem: Português brasileiro
- Estilo: UGC amador realista

### 2. `process-influencer-intro-video`
**Entrada**: `influencer_id`
**Saída**: Status do processamento

**Processo**:
1. Verifica se vídeo está pronto na KIE
2. Se pronto, cria imagem de referência baseada nas características
3. Usa imagem como autoridade facial
4. Inicia geração paralela de:
   - Foto de perfil (aspect 1:1)
   - Bodymap (aspect 9:16)
5. Atualiza status para `optimizing_identity`

### 3. `check-influencer-creation-status`
**Entrada**: `influencer_id`
**Saída**: Status atual e dados do influencer (se pronto)

**Processo**:
1. Busca status atual
2. Se `optimizing_identity`, verifica se profile e bodymap estão prontos
3. Se ambos prontos:
   - Atualiza `profile_image` e `visual_map`
   - Muda status para `ready`
   - Retorna influencer completo

### 4. `influencer-image` (Modificado)
Agora suporta:
- `type`: 'profile' | 'bodymap' | 'post'
- `referenceImage`: URL da imagem de referência
- Criação automática de registros em `influencer_posts`

### 5. `check-influencer-post` (Modificado)
Agora aceita dois modos:
- Por `postId` (legacy)
- Por `influencer_id` + `type` (novo fluxo)

## Frontend

### Services

#### `influencerCreationService.js`
Novo serviço para gerenciar criação:

```javascript
// Iniciar criação
createInfluencerWithIntro(data)

// Processar vídeo quando pronto
processIntroVideo(influencerId)

// Verificar status
checkCreationStatus(influencerId)

// Monitorar até conclusão
monitorCreation(influencerId, onProgress)
```

### Components

#### `CreateInfluencerModal.jsx` (Modificado)
- Usa novo fluxo de criação
- Mostra progresso em tempo real
- Monitora automaticamente até conclusão
- Labels amigáveis para cada etapa

## Fluxo Detalhado

### Etapa 1: Criação do Vídeo (30-60s)
```
Status: creating_video
UI: "Criando vídeo de apresentação..."
```
- Sistema gera vídeo UGC da influencer
- Vídeo inclui fala + movimento + close final
- Frontend chama `processIntroVideo` automaticamente

### Etapa 2: Imagem de Referência (30-45s)
```
Status: creating_profile_image
UI: "Gerando foto de perfil..."
```
- Sistema cria imagem base usando características do quiz
- Esta imagem é a "autoridade facial"
- Será usada como referência para tudo

### Etapa 3: Geração Paralela (60-90s)
```
Status: optimizing_identity
UI: "Otimizando identidade visual..."
```
- **Profile**: Foto de perfil (1:1, close, fundo neutro)
- **Bodymap**: Corpo completo (9:16, marcas visíveis)
- Ambos usam a imagem de referência

### Etapa 4: Finalização (Instantâneo)
```
Status: ready
UI: Redireciona para perfil
```
- Sistema atualiza `profile_image` e `visual_map`
- Influencer pronta para criar conteúdo
- Todas gerações futuras usam profile + bodymap

## Prompts

### Vídeo de Apresentação
```
UGC-style selfie video for influencer identity creation.

CHARACTER:
Name: {name}
Age: {age}
Ethnicity: {ethnicity}
Face: {facial_traits}
Hair: {hair}
Body: {body}
Marks: {marks}

ACTION (10 seconds):
0-4s: Greeting in Portuguese
4-7s: Turn showing body
7-10s: Direct eye contact, silent

STYLE: Raw amateur smartphone video
```

### Foto de Perfil
```
Professional portrait photo.

REFERENCE: Match face from reference image exactly

FRAMING: Head and shoulders only
POSE: Neutral, direct eye contact
BACKGROUND: Solid neutral
LIGHTING: Soft even
STYLE: Natural, professional headshot
```

### Bodymap
```
Full body reference photo.

REFERENCE: Match face from reference image exactly

SUBJECT: {ethnicity}, {age}, {body_type}
Body marks: {marks}

POSE: Standing straight, front-facing
ATTIRE: Form-fitting neutral
BACKGROUND: Plain solid
PURPOSE: Body consistency reference
```

## Características Técnicas

### Consistência Visual
- **Rosto**: Lockado pela imagem de referência
- **Corpo**: Lockado pelo bodymap
- **Marcas**: Definidas no bodymap, sempre presentes
- **Controle do usuário**: Apenas cena, pose, ambiente, ação

### Performance
- Criação total: ~2-3 minutos
- Polling interval: 10 segundos
- Timeout máximo: 30 minutos
- Gerações paralelas quando possível

### Error Handling
- Retry automático em falhas temporárias
- Status `failed` em erros definitivos
- Logs detalhados em cada etapa
- Metadata preserva informações de debug

## Uso Futuro

Todas as gerações de conteúdo agora usam:
```javascript
{
  image_urls: [
    influencer.profile_image,  // Rosto
    influencer.visual_map      // Corpo + marcas
  ]
}
```

Isso garante:
- Rosto sempre idêntico
- Corpo sempre consistente
- Marcas corporais sempre presentes
- Apenas pose/cena variam

## Benefícios

1. **Zero Intervenção Manual**: Usuário não vê processos técnicos
2. **Identidade Consistente**: Rosto e corpo sempre iguais
3. **Escalável**: Backend gerencia complexidade
4. **Transparente**: UI mostra progresso claro
5. **Robusto**: Retry e error handling automáticos
