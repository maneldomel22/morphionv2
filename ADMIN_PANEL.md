# Painel Administrativo Morphion

Painel administrativo completo para gerenciamento do SaaS Morphion.

## Acesso

### Desenvolvimento
- URL: `http://localhost:5173/admin.html`
- Login: Apenas usuários cadastrados na tabela `admins` podem acessar
- Email autorizado: `admin@morphion.ai`

### Produção
- URL: `https://admin.morphion.ai` (configurar no DNS)
- Mesmo sistema de autenticação

## Funcionalidades

### 1. Overview (Dashboard)
- Total de usuários no sistema
- Total de créditos disponíveis
- Total de vídeos gerados
- Total de imagens geradas
- Receita total (Stripe)
- Gráficos de cadastros (últimos 30 dias)
- Gráficos de uso de créditos (últimos 30 dias)

### 2. Usuários
**Lista de Usuários:**
- Visualização completa de todos os usuários
- Filtros por email, plano, créditos e data de cadastro
- Informações: email, plano, créditos, vídeos, imagens, data de cadastro

**Ações por Usuário:**
- Ver detalhes completos
- Editar créditos (adicionar/remover)
- Alterar plano
- Deletar usuário (com confirmação dupla)

**Modal de Detalhes:**
Abas com histórico completo do usuário:
- Vídeos gerados
- Imagens geradas
- Conversas de chat
- Tarefas de Lip Sync
- Transcrições

### 3. Mensagens do Sistema
- Criar mensagens para exibição no app principal
- Tipos: info (azul), warning (amarelo), error (vermelho), success (verde)
- Ativar/desativar mensagens
- Editar mensagens existentes
- Deletar mensagens
- Mensagens ativas aparecem automaticamente no app

### 4. Configurações
- Nome do sistema
- Modo manutenção (on/off)
- Mensagem de manutenção customizada
- Informações do sistema (versão, ambiente, database)

## Estrutura de Arquivos

```
src/admin/
├── AdminApp.jsx              # App principal do admin
├── main.jsx                  # Entry point
├── components/
│   ├── AdminLayout.jsx       # Layout com sidebar
│   ├── ProtectedAdminRoute.jsx  # Rota protegida
│   └── UserDetailsModal.jsx  # Modal de detalhes do usuário
├── contexts/
│   └── AdminAuthContext.jsx  # Contexto de autenticação admin
├── pages/
│   ├── AdminLogin.jsx        # Página de login
│   ├── AdminOverview.jsx     # Dashboard principal
│   ├── AdminUsers.jsx        # Gerenciamento de usuários
│   ├── AdminMessages.jsx     # Mensagens do sistema
│   └── AdminSettings.jsx     # Configurações
└── services/
    └── adminService.js       # Serviços de API
```

## Database

### Tabelas Utilizadas
- `admins` - Lista de administradores autorizados
- `profiles` - Dados dos usuários
- `video_tasks` - Histórico de vídeos
- `image_generations` - Histórico de imagens
- `chat_threads` - Conversas
- `lipsync_tasks` - Tarefas de lip sync
- `transcription_tasks` - Transcrições
- `system_messages` - Mensagens do sistema
- `system_settings` - Configurações globais
- `stripe_orders` - Pedidos e receita

### Funções SQL
- `add_user_credits(user_id, amount, note)` - Adiciona/remove créditos
- `is_admin(user_id)` - Verifica se usuário é admin

## Segurança

### Row Level Security (RLS)
Todas as tabelas sensíveis possuem RLS ativado:
- Apenas admins podem acessar `system_settings`
- Apenas admins podem modificar `system_messages`
- Verificação de admin em todas as operações críticas

### Autenticação
- Usa mesma autenticação Supabase do app principal
- Verificação adicional na tabela `admins`
- Redirecionamento automático se não autorizado

## Planos Disponíveis

Ao alterar plano de um usuário, os seguintes créditos são aplicados:
- `free` - 0 créditos
- `junior` - 500 créditos
- `starter` - 750 créditos
- `creator` - 4.000 créditos
- `pro` - 8.000 créditos
- `admin` - 999.999 créditos

## Design

O painel segue o design system do Morphion:
- Background: `#0B0D12`
- Cards: `#121621`
- Border radius: 14px
- Dark theme consistente
- Animações suaves
- Interface limpa e profissional

## Desenvolvimento

### Executar localmente
```bash
npm run dev
# Acesse: http://localhost:5173/admin.html
```

### Build para produção
```bash
npm run build
# Gera: dist/admin.html e dist/assets/
```

### Deploy
1. Fazer build do projeto
2. Deploy dos arquivos gerados
3. Configurar subdomínio `admin.morphion.ai` apontando para `admin.html`
4. Garantir que usuário admin existe na tabela `admins`

## Adicionar Novo Admin

Execute no SQL Editor do Supabase:

```sql
INSERT INTO admins (id, email)
VALUES (
  'user-uuid-aqui',
  'email@exemplo.com'
);
```

Onde `user-uuid-aqui` é o UUID do usuário na tabela `auth.users`.
