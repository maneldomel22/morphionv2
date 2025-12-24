# Fluxo de Variações - Documentação Completa

## Visão Geral

O sistema de variações permite que usuários gerem múltiplas versões alternativas de um vídeo existente, alterando elementos específicos como:
- Diálogo
- Hook inicial
- CTA final
- Gênero do personagem
- Ambiente (location + lighting)

## Arquitetura

### 1. Componente UI: GenerateVariationsModal
**Arquivo:** `src/components/video/GenerateVariationsModal.jsx`

Modal interativo que permite ao usuário:
- Escolher quantidade de variações: 1, 3, 5 ou 10
- Selecionar quais elementos variar via checkboxes
- Visualizar informações do vídeo original
- Iniciar o processo de geração

### 2. Service: videoVariationsService
**Arquivo:** `src/services/videoVariationsService.js`

Orquestra todo o fluxo de variações:

#### Função `generateVariations(config)`
1. Busca o vídeo original do Supabase
2. Monta contexto com dados do vídeo
3. Envia para o Morphy gerar variações criativas
4. Cria novos registros na tabela `videos`
5. Envia cada vídeo para geração via KIE

#### Função `sendToGeneration(video, originalVideo)`
- Reconstrói os dados do projeto
- Usa o mesmo construtor de prompt do fluxo principal
- Envia para a edge function `generate-video-kie`

### 3. Edge Function: morphy-generate-variations
**Arquivo:** `supabase/functions/morphy-generate-variations/index.ts`

Agente de IA (Morphy) responsável por gerar as variações criativas:

#### Entrada
```typescript
{
  originalDialogue: string;
  creativeStyle: string;
  avatarName: string;
  avatarGender: string;
  environment: {
    location?: string;
    lighting?: string;
  };
  product?: object;
  variations: {
    dialogue: boolean;
    hook: boolean;
    cta: boolean;
    gender: boolean;
    environment: boolean;
  };
  quantity: number;
}
```

#### Saída
```json
{
  "variations": [
    {
      "id": "var_1",
      "hook": "texto do gancho inicial",
      "dialogue": "texto do diálogo principal",
      "cta": "texto da chamada para ação",
      "full_dialogue": "hook + diálogo + cta concatenados",
      "changes": {
        "gender": "male | female | unchanged",
        "environment": {
          "location": "string ou unchanged",
          "lighting": "string ou unchanged"
        }
      },
      "notes": "breve explicação criativa"
    }
  ]
}
```

### 4. Integração na Library
**Arquivo:** `src/pages/Library.jsx`

- Botão "Variar" (ícone Sparkles) em cada vídeo pronto
- Disponível tanto em grid view quanto list view
- Abre o modal de configuração
- Recarrega a lista após criar as variações

## Fluxo Completo

```
Usuário clica "Variar" no vídeo
          ↓
Modal de configuração abre
          ↓
Usuário seleciona quantidade e opções
          ↓
Clica "Gerar variações com Morphy"
          ↓
videoVariationsService.generateVariations()
          ↓
Busca vídeo original do Supabase
          ↓
Monta contexto para o Morphy
          ↓
Envia para morphy-generate-variations (Edge Function)
          ↓
Morphy gera N variações usando OpenAI
          ↓
Retorna JSON com variações
          ↓
Para cada variação:
  - Cria novo registro em `videos`
  - Status: 'pending'
  - Campos alterados conforme a variação
  - Mantém dados do vídeo original
  - Adiciona metadata.variation_info
          ↓
Para cada vídeo criado:
  - sendToGeneration()
  - Reconstrói projectData
  - Envia para generate-video-kie
  - KIE processa e gera vídeo
          ↓
Vídeos aparecem na Library
Status muda: pending → queued → processing → ready
```

## Fontes de Verdade

O sistema **SEMPRE** busca dados do banco de dados Supabase:

### Campos Diretos
- `video.avatar_name`
- `video.avatar_gender`
- `video.creative_style`
- `video.dialogue`
- `video.aspect_ratio`
- `video.duration`
- `video.video_model`

### Campos do Metadata
- `video.metadata.scene_settings.location`
- `video.metadata.scene_settings.lighting`
- `video.metadata.style_settings.framing`
- `video.metadata.style_settings.cameraAngle`
- `video.metadata.style_settings.movement`
- `video.metadata.style_settings.depthOfField`
- `video.metadata.product_data`

### O que NÃO é usado
- ❌ Prompts antigos da KIE
- ❌ TaskIds como fonte de dados
- ❌ Reconstrução parcial de prompts

## Características Importantes

### 1. Determinístico
- Sempre usa os mesmos dados do banco
- Sempre reconstrói o prompt completo
- Não depende de estados anteriores

### 2. Isolado
- Não altera o vídeo original
- Cada variação é um novo registro independente
- Usa o source_mode 'variation'

### 3. Consistente
- Usa o mesmo construtor de prompt (generate-video-kie)
- Segue as mesmas regras de validação
- Mantém a mesma estrutura de dados

### 4. Rastreável
- Cada variação tem `metadata.variation_info`:
  - `original_video_id`: ID do vídeo base
  - `variation_number`: Número da variação (1, 2, 3...)
  - `morphy_notes`: Explicação criativa do Morphy

## Diferenças do Fluxo Principal

| Aspecto | Fluxo Principal | Fluxo de Variações |
|---------|----------------|-------------------|
| Origem | Formulário do usuário | Vídeo existente |
| Criatividade | Manual | IA (Morphy) |
| Quantidade | 1 vídeo por vez | 1-10 vídeos de uma vez |
| Prompt | Montado diretamente | Reconstruído do banco |
| Source Mode | 'manual', 'sora', etc | 'variation' |

## Exemplo de Uso

1. Usuário tem um vídeo pronto de um depoimento
2. Quer testar 5 versões diferentes do hook inicial
3. Clica em "Variar" no vídeo
4. Seleciona:
   - Quantidade: 5
   - ☑ Variar hook (início)
   - ☐ Outras opções desmarcadas
5. Clica "Gerar variações com Morphy"
6. Morphy gera 5 hooks diferentes
7. Sistema cria 5 novos vídeos
8. Cada um é enviado para a KIE
9. Usuário recebe 5 vídeos com hooks diferentes, mas mesmo conteúdo

## Tratamento de Erros

- Se Morphy falhar: Retorna erro amigável
- Se criação de vídeo falhar: Rollback e notificação
- Se envio para KIE falhar: Vídeo marcado como 'failed'
- Cada erro é logado no console com contexto

## Próximos Passos Possíveis

- [ ] Adicionar histórico de variações no modal
- [ ] Permitir comparação lado-a-lado
- [ ] Adicionar mais opções de variação
- [ ] Permitir variações em batch
- [ ] A/B testing automático
