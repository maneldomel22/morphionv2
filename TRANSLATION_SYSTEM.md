# Sistema de Tradução de Diálogos

Sistema completo de tradução de diálogos para vídeos usando OpenAI GPT-4o-mini.

## Funcionalidades Implementadas

### 1. Seletor de Idioma
- Interface elegante com dropdown de idiomas
- 10 idiomas disponíveis com bandeiras:
  - 🇧🇷 Português (Brasil)
  - 🇺🇸 English (US)
  - 🇪🇸 Español
  - 🇫🇷 Français
  - 🇩🇪 Deutsch
  - 🇮🇹 Italiano
  - 🇯🇵 日本語 (Japanese)
  - 🇰🇷 한국어 (Korean)
  - 🇨🇳 中文 (Simplified Chinese)
  - 🇷🇺 Русский (Russian)
- Preferência de idioma salva no localStorage

### 2. Botão de Tradução Manual
- Aparece quando o usuário digita 5+ caracteres
- Traduz o diálogo atual para o idioma selecionado
- Loading state visual durante tradução
- Usa contexto do avatar para melhor tradução

### 3. Tradução Automática ao Trocar Idioma
- Ao selecionar um novo idioma, o sistema pergunta se deseja traduzir o diálogo atual
- Se confirmado, traduz automaticamente

### 4. Integração com Morphy
- As sugestões do Morphy são geradas automaticamente no idioma selecionado
- Mantém tom, estilo e naturalidade em cada idioma

## Arquitetura

### Edge Function: `translate-dialogue`

**Localização:** `supabase/functions/translate-dialogue/index.ts`

**Endpoint:** `POST /functions/v1/translate-dialogue`

**Request:**
```json
{
  "text": "Texto a ser traduzido",
  "targetLanguage": "en-US",
  "context": "Video dialogue for Marina"
}
```

**Response:**
```json
{
  "translatedText": "Translated text",
  "originalText": "Texto a ser traduzido",
  "targetLanguage": "en-US",
  "targetLanguageName": "American English"
}
```

**Características:**
- Modelo: GPT-4o-mini (rápido e econômico)
- Temperatura: 0.7 (naturalidade)
- Max tokens: 500
- Especializado em marketing e diálogos de vídeo
- CORS configurado para acesso público

### Frontend Service: `translationService`

**Localização:** `src/services/translationService.js`

**Métodos:**
- `translateDialogue(text, targetLanguage, context)` - Traduz texto
- `getLanguageByCode(code)` - Retorna objeto do idioma
- `getLanguageName(code)` - Retorna nome em inglês
- `getLanguageLabel(code)` - Retorna label localizado
- `getDefaultLanguage()` - Pega idioma do localStorage
- `setDefaultLanguage(code)` - Salva idioma padrão

### Integração no SoraManual

**Estados Adicionados:**
- `formData.language` - Idioma selecionado
- `translatingDialogue` - Loading da tradução
- `showLanguageDropdown` - Controle do dropdown

**Funções:**
- `translateDialogue()` - Traduz o diálogo atual
- `handleLanguageChange(code)` - Muda idioma e oferece tradução

## Como Usar

### Cenário 1: Traduzir Diálogo Manualmente

1. Digite o diálogo em qualquer idioma
2. Selecione o idioma desejado no dropdown
3. Clique no botão "Traduzir"
4. O diálogo será traduzido automaticamente

### Cenário 2: Trocar Idioma com Diálogo Existente

1. Digite o diálogo
2. Selecione um novo idioma no dropdown
3. Sistema pergunta se deseja traduzir
4. Confirme para traduzir automaticamente

### Cenário 3: Gerar Sugestões em Outro Idioma

1. Selecione o idioma desejado primeiro
2. Digite uma ideia simples
3. Clique em "Gerar Sugestões do Morphy"
4. Sugestões virão já no idioma selecionado

## Qualidade da Tradução

O sistema usa GPT-4o-mini com prompts especializados para garantir:

- **Naturalidade:** Soa como nativo, não literal
- **Contexto:** Mantém contexto de marketing/vídeo
- **Tom e Energia:** Preserva persuasão e impacto
- **Expressões:** Adapta idiomatismos
- **Ritmo:** Mantém cadência para fala

## Custos

- GPT-4o-mini: ~$0.15/1M tokens entrada, ~$0.60/1M tokens saída
- Diálogo típico: ~100 tokens
- **Custo por tradução: ~$0.0001** (praticamente gratuito)

## Variáveis de Ambiente

A edge function requer:
- `OPENAI_API_KEY` - Configurada automaticamente no Supabase

## Arquivos Criados/Modificados

1. **Edge Function:**
   - `supabase/functions/translate-dialogue/index.ts`

2. **Frontend:**
   - `src/services/translationService.js` (novo)
   - `src/pages/SoraManual.jsx` (modificado)

## Melhorias Futuras

1. Cache de traduções comuns
2. Tradução em batch de múltiplos diálogos
3. Detecção automática de idioma do input
4. Histórico de traduções
5. Mais idiomas (árabe, hindi, turco, etc)
6. Opção de "melhorar" texto antes de traduzir

## Troubleshooting

### Tradução não funciona
- Verificar se está autenticado
- Verificar console do navegador para erros
- Verificar logs da edge function no Supabase
- Confirmar que OPENAI_API_KEY está configurada

### Tradução com qualidade baixa
- Adicionar mais contexto no parâmetro `context`
- Verificar se o texto original está claro
- Ajustar temperatura na edge function (se necessário)

### Dropdown não fecha
- Clicar fora do dropdown
- Selecionar um idioma
- Recarregar a página
