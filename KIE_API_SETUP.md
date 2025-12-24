# Configuração da KIE API (Sora 2)

Este documento explica como configurar a KIE API Key para habilitar a geração de vídeos usando Sora 2 e como funciona o sistema de polling para monitorar o status dos vídeos.

## Pré-requisitos

1. Conta na KIE API (https://api.kie.ai)
2. API Key válida da KIE
3. Acesso ao Dashboard do Supabase do projeto

## Passos de Configuração

### 1. Obter API Key da KIE

1. Acesse https://api.kie.ai e faça login
2. Navegue até a seção de API Keys
3. Crie uma nova API Key ou copie uma existente
4. Guarde a chave em local seguro

### 2. Configurar Secret no Supabase

**IMPORTANTE**: A API Key NUNCA deve ser exposta no código frontend ou no repositório Git.

**Sua API Key**: `0a30cb34de4ec530f2d30fd705fe982f`

#### Via Dashboard do Supabase:

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto: **selmogfyeujesrayxrhs**
3. Navegue para **Settings** > **Edge Functions** > **Secrets**
4. Clique em **Add new secret**
5. Configure o secret:
   - **Name**: `KIE_API_KEY`
   - **Value**: `0a30cb34de4ec530f2d30fd705fe982f`
6. Clique em **Save**

#### Via CLI do Supabase (Opcional):

```bash
npx supabase secrets set KIE_API_KEY=0a30cb34de4ec530f2d30fd705fe982f
```

### 3. Verificar Callback URL

A callback URL já foi configurada automaticamente durante o setup:

**Callback URL Configurada**: `https://selmogfyeujesrayxrhs.supabase.co/functions/v1/kie-callback`

Para verificar a configuração atual, execute no SQL Editor do Supabase:

```sql
SELECT callback_url, is_active
FROM api_configurations
WHERE service_name = 'KIE';
```

Caso precise atualizar manualmente:

```sql
UPDATE api_configurations
SET callback_url = 'https://selmogfyeujesrayxrhs.supabase.co/functions/v1/kie-callback'
WHERE service_name = 'KIE';
```

### 4. Verificar Instalação

Para verificar se a integração está funcionando:

1. Acesse a página **Sora Manual** no seu aplicativo
2. Complete o quiz de geração de vídeo
3. Clique em **Gerar Vídeo UGC**
4. O vídeo deve aparecer com status "Na Fila" na biblioteca
5. Após alguns minutos, o status deve mudar para "Processando" e depois "Pronto"

## Arquitetura da Integração

### Edge Functions Criadas

1. **generate-video-kie**: Recebe dados do frontend e envia requisição para KIE API
2. **kie-callback**: Recebe callbacks da KIE quando o vídeo estiver pronto
3. **check-video-status**: Polling manual para verificar status (fallback)

### Fluxo de Geração

```
Frontend → videoService.generateVideo()
  ↓
Cria registro no DB com status 'queued'
  ↓
kieApiService.generateVideo()
  ↓
Edge Function: generate-video-kie
  ↓
Constrói prompt estruturado
  ↓
POST para KIE API /createTask
  ↓
Recebe taskId, atualiza DB
  ↓
Retorna taskId para frontend
  ↓
Frontend inicia polling (a cada 5s)
  ↓
[Aguardando...]
  ↓
KIE processa vídeo
  ↓
KIE envia callback → kie-callback
  ↓
Atualiza DB: video_url + status 'ready'
  ↓
Frontend detecta mudança (polling ou realtime)
  ↓
Vídeo aparece pronto na biblioteca
```

## Tabelas do Banco de Dados

### videos
- `kie_task_id`: ID da tarefa na KIE API
- `kie_model`: Modelo usado (sora-2-text-to-video ou sora-2-image-to-video)
- `generation_mode`: text-to-video ou image-to-video
- `kie_prompt`: Prompt estruturado enviado
- `kie_fail_code`: Código de erro (se falhou)
- `kie_fail_message`: Mensagem de erro (se falhou)
- `status`: queued | processing | ready | failed

### video_generation_logs
Registra todos os eventos de geração para debugging:
- request_sent
- callback_received
- status_updated
- error_occurred
- polling_check

## Monitoramento

### Ver Logs de Geração

```sql
SELECT
  vgl.event_type,
  vgl.event_data,
  vgl.created_at,
  v.title,
  v.status
FROM video_generation_logs vgl
JOIN videos v ON v.id = vgl.video_id
ORDER BY vgl.created_at DESC
LIMIT 50;
```

### Ver Vídeos com Erro

```sql
SELECT
  id,
  title,
  kie_fail_code,
  kie_fail_message,
  created_at
FROM videos
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Estatísticas de Geração

```sql
SELECT
  status,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM videos
WHERE completed_at IS NOT NULL
GROUP BY status;
```

## Troubleshooting

### Vídeo fica preso em "Na Fila"

1. Verifique se a API Key está configurada corretamente
2. Verifique os logs da Edge Function `generate-video-kie`:
   ```bash
   npx supabase functions logs generate-video-kie
   ```
3. Verifique o saldo de créditos na sua conta KIE

### Vídeo fica preso em "Processando"

1. A geração pode levar de 2 a 10 minutos
2. Verifique se a callback URL está correta
3. Tente fazer polling manual na página de detalhes do vídeo

### Erro de Autenticação

1. Confirme que a secret `KIE_API_KEY` está configurada
2. Recarregue as Edge Functions:
   ```bash
   npx supabase functions deploy --no-verify-jwt kie-callback
   ```

### Callback não está sendo recebido

1. Verifique a URL configurada em `api_configurations`
2. Verifique os logs da Edge Function `kie-callback`:
   ```bash
   npx supabase functions logs kie-callback
   ```
3. Use polling manual como fallback

## Sistema de Polling e Estados

### Endpoint de Verificação

A aplicação usa o endpoint oficial da KIE API para verificar o status dos vídeos:

```
GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
```

### Estados da KIE API

A KIE API retorna os seguintes estados:

| Estado | Descrição | Status no DB | Ação |
|--------|-----------|--------------|------|
| `waiting` | Tarefa aguardando na fila | `processing` | Continuar polling |
| `queuing` | Tarefa sendo preparada | `processing` | Continuar polling |
| `generating` | Vídeo sendo gerado | `processing` | Continuar polling |
| `success` | Geração concluída com sucesso | `ready` | Extrair URL e parar polling |
| `fail` | Geração falhou | `failed` | Exibir erro e parar polling |

### Parsing de resultJson

**CRÍTICO**: O campo `resultJson` retornado pela KIE API é uma **STRING JSON**, não um objeto.

Exemplo de resposta:

```json
{
  "data": {
    "state": "success",
    "resultJson": "{\"resultUrls\":[\"https://storage.kie.ai/videos/abc123.mp4\"]}",
    "createTime": 1734384000000,
    "completeTime": 1734384300000
  }
}
```

A aplicação precisa fazer:

```typescript
const parsedResult = JSON.parse(resultJson);
const videoUrl = parsedResult.resultUrls?.[0];
```

### Fluxo de Polling

1. **Usuário gera vídeo**
   - Status inicial: `queued`
   - `kie_task_id` salvo no banco

2. **Frontend inicia polling (10s em 10s)**
   - Chama `/functions/v1/check-video-status?taskId={taskId}`
   - Edge function consulta KIE API

3. **Durante processamento** (`waiting`, `queuing`, `generating`)
   - Status atualizado para `processing`
   - Preview mostra skeleton loader
   - Botões desabilitados
   - Data exibe "Processando..."

4. **Quando completo** (`success`)
   - `resultJson` é parseado
   - `video_url` e `thumbnail_url` são atualizados
   - Status atualizado para `ready`
   - `completed_at` é definido
   - Preview exibe o vídeo real
   - Polling para

5. **Se falhar** (`fail`)
   - Status atualizado para `failed`
   - `kie_fail_code` e `kie_fail_message` salvos
   - Preview exibe ícone de erro
   - Botão "Tentar Novamente" aparece
   - Polling para

### Renderização de Preview

**REGRA CRÍTICA**: O preview do vídeo **SÓ** deve ser renderizado quando:
- `video.status === 'ready'`
- `video.video_url` existe e é válido

Enquanto o vídeo está sendo gerado:
- Exibir skeleton loader animado
- Exibir ícone apropriado (relógio, spinner)
- Exibir texto "Na fila..." ou "Gerando vídeo..."
- **NÃO** tentar renderizar thumbnail genérico

### Tratamento de Datas

Para evitar "Invalid Date":

```javascript
const formatDate = (dateString) => {
  if (!dateString) return 'Processando...';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Processando...';
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return 'Processando...';
  }
};
```

Datas são exibidas apenas quando:
- `created_at`: sempre (data de criação do registro)
- `completed_at`: apenas quando status = `ready` ou `failed`

## Limites e Considerações

- **Tempo de geração**: 2-10 minutos por vídeo
- **Polling**: A cada 5 segundos quando há vídeos em processamento
- **Timeout**: Vídeos que ficarem em processamento por mais de 10 minutos são marcados como timeout
- **Retry**: Vídeos com erro podem ser regenerados via botão "Tentar Novamente"
- **Créditos**: Cada geração consome créditos da sua conta KIE

## Suporte

Para problemas relacionados à:
- **KIE API**: https://api.kie.ai/docs
- **Supabase**: https://supabase.com/docs
- **Este projeto**: Verifique os logs das Edge Functions e da tabela `video_generation_logs`
