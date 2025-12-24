# Sistema de Reconciliação Automática de Assinaturas Órfãs

Este sistema permite identificar e vincular automaticamente assinaturas do Stripe que não possuem um usuário associado no sistema, usando o histórico de adição de créditos como referência.

## Como Funciona

### 1. Detecção de Órfãos

Quando você clica em "Sincronizar com Stripe" no painel administrativo, o sistema:

1. Busca todas as assinaturas ativas no Stripe
2. Tenta vincular por email (método existente)
3. Para assinaturas sem vínculo, busca correspondências no `credits_history`
4. Auto-vincula casos de alta confiança (score >= 90)
5. Sugere correspondências para revisão manual (score < 90)

### 2. Sistema de Scoring

Cada correspondência recebe uma pontuação de 0 a 100 baseada em:

- **40 pontos**: Valor exato de créditos coincide
- **20-40 pontos**: Proximidade temporal
  - 40 pontos: diferença < 1 hora
  - 30 pontos: diferença < 1 dia
  - 20 pontos: diferença < 2 dias
- **20 pontos**: Email similar entre Stripe e sistema

**Auto-vinculação** ocorre quando:
- Score >= 90 (alta confiança)
- É o único match com score >= 80 (sem ambiguidade)

### 3. Vinculação Manual

Para correspondências com score < 90 ou múltiplos matches, o admin pode:

1. Revisar os matches sugeridos na interface
2. Ver detalhes como email, créditos, diferença de tempo
3. Clicar em "Vincular" para confirmar manualmente
4. Ou "Ignorar" para descartar a sugestão

## Configuração Necessária

### Mapeamento de Produtos Stripe

Você **DEVE** configurar o mapeamento de `price_id` → quantidade de créditos em:

**Arquivo**: `supabase/functions/sync-stripe-subscriptions/index.ts`

**Localização**: Linha 26-29

```typescript
const STRIPE_PRICE_TO_CREDITS: Record<string, number> = {
  // Exemplo: 'price_1ABC123': 1000,
  // Adicione seus price_ids aqui
};
```

### Como Obter seus Price IDs

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/products)
2. Clique em cada produto
3. Na seção "Pricing", copie o ID que começa com `price_`
4. Identifique quantos créditos cada produto concede
5. Adicione ao mapeamento:

```typescript
const STRIPE_PRICE_TO_CREDITS: Record<string, number> = {
  'price_1A2B3C4D5E6F7G8H': 1000,     // Plano Básico
  'price_9I8H7G6F5E4D3C2B': 5000,     // Plano Pro
  'price_XXXXXXXXXXX': 10000,         // Plano Enterprise
};
```

## Estrutura de Dados

### OrphanedCustomer

```typescript
{
  customerId: string;           // ID do customer no Stripe
  email: string | null;         // Email do Stripe (se disponível)
  name: string | null;          // Nome do customer
  subscriptionDate: string;     // Data de criação da subscription
  priceId: string;              // ID do price no Stripe
  expectedCredits: number | null; // Créditos esperados (baseado no mapeamento)
  reason: string;               // Motivo de estar órfão
  possibleMatches: OrphanMatch[]; // Matches encontrados
}
```

### OrphanMatch

```typescript
{
  userId: string;               // UUID do usuário no sistema
  userEmail: string;            // Email do usuário
  creditsAdded: number;         // Quantidade de créditos adicionados
  addedAt: string;              // Data/hora da adição
  timeDiffMinutes: number;      // Diferença em minutos
  score: number;                // Score de confiança (0-100)
  autoLinked: boolean;          // Se foi auto-vinculado
  reason?: string;              // Motivo (se não vinculado)
}
```

## Novo Tipo em credits_history

O sistema registra as seguintes ações:

- `manual_add`: Adição manual de créditos pelo admin (já existia)
- `manual_deduct`: Dedução manual de créditos (já existia)
- `stripe_auto_link`: Auto-vinculação por reconciliação (novo)
- `stripe_manual_link`: Vinculação manual pelo admin (novo)
- `stripe_purchase`: Registro de compra do Stripe (novo, opcional)

## Edge Functions

### sync-stripe-subscriptions

**Modificada** para incluir lógica de reconciliação automática.

**Request**: POST (sem body)

**Response**:
```json
{
  "success": true,
  "stats": {
    "activeInStripe": 10,
    "markedAsCanceled": 0,
    "linkedByEmail": 3,
    "linkedByCreditsHistory": 2,
    "orphanedWithMatches": 1,
    "orphanedNoMatches": 4
  },
  "orphanedCustomers": [...]
}
```

### link-orphan-customer

**Nova** edge function para vinculação manual.

**Request**:
```json
{
  "customer_id": "cus_xxx",
  "user_id": "uuid-xxx"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Customer successfully linked",
  "customer_id": "cus_xxx",
  "user_id": "uuid-xxx",
  "user_email": "user@example.com",
  "stripe_email": "stripe@example.com"
}
```

## Interface do Admin

### Seção "Correspondências Sugeridas"

Aparece automaticamente após sincronização se houver órfãos com matches.

**Para cada órfão, mostra**:
- Informações do Stripe (email, customer ID, data)
- Até 3 matches sugeridos com score, email, créditos, diferença de tempo
- Botões: "Vincular" e "Ignorar"

**Cores do Score**:
- Verde (>= 90): Alta confiança
- Amarelo (>= 70): Média confiança
- Laranja (< 70): Baixa confiança

## Fluxo Completo

```
1. Admin clica "Sincronizar com Stripe"
   ↓
2. Sistema busca assinaturas ativas
   ↓
3. Tenta vincular por email
   ↓
4. Para órfãos: busca em credits_history (±2 dias, valor exato)
   ↓
5. Calcula score de cada match
   ↓
6. Auto-vincula se score >= 90 E único match >= 80
   ↓
7. Mostra matches sugeridos para revisão manual
   ↓
8. Admin clica "Vincular" → chama link-orphan-customer
   ↓
9. Sistema vincula e registra em credits_history
   ↓
10. Órfão removido da lista de sugestões
```

## Melhores Práticas

1. **Configure o mapeamento de price_ids** antes de usar o sistema
2. **Revise matches com score < 80** cuidadosamente antes de vincular
3. **Use "Ignorar"** para descartar sugestões irrelevantes
4. **Sincronize regularmente** para pegar novos órfãos rapidamente
5. **Registre compras no webhook** para melhorar futuras reconciliações

## Segurança

- Apenas admins podem acessar esta funcionalidade
- Todas as operações são registradas em `credits_history`
- Vinculação manual requer confirmação explícita
- Auto-vinculação só ocorre com alta confiança (>= 90)

## Troubleshooting

### Nenhum match encontrado

**Possíveis causas**:
- Não há entradas em `credits_history` com tipo `manual_add` na janela de ±2 dias
- O valor de créditos não coincide (verifique o mapeamento)
- O admin adicionou créditos muito antes ou depois da compra

**Solução**: Adicione manualmente via interface de usuários

### Score muito baixo

**Possíveis causas**:
- Grande diferença de tempo entre compra e adição de créditos
- Valor de créditos não coincide
- Emails muito diferentes

**Solução**: Revise os dados e vincule manualmente se tiver certeza

### Múltiplos matches com score alto

**Possíveis causas**:
- Vários usuários compraram o mesmo plano no mesmo dia
- Sistema não consegue distinguir automaticamente

**Solução**: O sistema **não** auto-vincula nestes casos. Revise manualmente usando os detalhes fornecidos (email, horário exato, etc.)
