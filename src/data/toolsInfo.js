export const toolsInfo = {
  metrics: {
    title: 'Métricas',
    whatIs: 'Painel de análise de performance de criativos e campanhas.',
    whenToUse: 'Avaliar quais vídeos geram mais conversões, CTR e ROAS. Identificar padrões de sucesso.',
    technology: [
      'Supabase Database — armazenamento de métricas',
      'Integração com plataformas de ads'
    ],
    notes: [
      'Dados atualizados em tempo real.',
      'Filtros por período, campanha e criativo.'
    ]
  },

  sora2: {
    title: 'Sora 2',
    whatIs: 'Geração de vídeos a partir de imagens e prompts.',
    whenToUse: 'Criar criativos UGC, anúncios e vídeos de performance.',
    technology: [
      'KIE.AI — Sora 2',
      'OpenAI — geração e estruturação de prompts'
    ],
    notes: [
      'Vídeos de 10s e 15s.',
      '25s apenas no Sora 2 Pro com storyboard.'
    ]
  },

  veo: {
    title: 'Veo 3.1',
    whatIs: 'Geração e expansão de vídeos realistas com movimento avançado.',
    whenToUse: 'Criar vídeos mais cinematográficos ou expandir vídeos existentes.',
    technology: [
      'KIE.AI — Veo 3.1'
    ],
    notes: [
      'Modelos Fast e Quality disponíveis.',
      'Aspect ratio limitado às opções suportadas pela API.'
    ]
  },

  sceneEditor: {
    title: 'Editor de Cenas',
    whatIs: 'Criação de storyboards multiparte para vídeos mais longos.',
    whenToUse: 'Estruturar narrativas complexas com múltiplas cenas sequenciais.',
    technology: [
      'KIE.AI — Sora 2 Pro',
      'Sistema de storyboard do Morphion'
    ],
    notes: [
      'Permite criar vídeos de até 25s.',
      'Cada cena pode ter configurações independentes.'
    ]
  },

  images: {
    title: 'Imagens',
    whatIs: 'Geração de imagens base para vídeos.',
    whenToUse: 'Criar produtos, cenários e frames iniciais.',
    technology: [
      'KIE.AI — Nano Banana'
    ],
    notes: [
      'Imagens geradas servem como base para vídeos.',
      'Múltiplos estilos e resoluções disponíveis.'
    ]
  },

  voiceClone: {
    title: 'Clonagem de Voz',
    whatIs: 'Criação de vozes sintéticas personalizadas.',
    whenToUse: 'Narrar vídeos com voz única da marca.',
    technology: [
      'MiniMax — Text-to-Speech & Voice Cloning'
    ],
    notes: [
      'Requer amostra de áudio de 10-30 segundos.',
      'Voz pode ser reutilizada em múltiplos projetos.'
    ]
  },

  lipSync: {
    title: 'Lip Sync',
    whatIs: 'Sincronização labial de vídeos com áudio.',
    whenToUse: 'Fazer personagens falarem áudios gerados.',
    technology: [
      'Newport AI — Lip Sync'
    ],
    notes: [
      'Funciona melhor com rostos frontais e bem iluminados.',
      'Suporta múltiplos idiomas.'
    ]
  },

  transcription: {
    title: 'Transcrição',
    whatIs: 'Conversão de áudio em texto.',
    whenToUse: 'Extrair falas de vídeos para análise e prompt.',
    technology: [
      'AssemblyAI — Speech to Text'
    ],
    notes: [
      'Alta precisão em português e inglês.',
      'Identifica múltiplos falantes automaticamente.'
    ]
  },

  library: {
    title: 'Biblioteca',
    whatIs: 'Gerenciamento de vídeos e criativos.',
    whenToUse: 'Organizar campanhas, pastas e versões.',
    technology: [
      'Supabase Storage',
      'Supabase Database'
    ],
    notes: [
      'Drag & drop para organizar em pastas.',
      'Histórico de versões mantido automaticamente.'
    ]
  },

  morphy: {
    title: 'Morphy AI',
    whatIs: 'Assistente criativo inteligente do Morphion.',
    whenToUse: 'Criar prompts, ideias, variações e otimizações.',
    technology: [
      'OpenAI — GPT-4o-mini'
    ],
    notes: [
      'Entende contexto de imagens e vídeos.',
      'Aprende com suas preferências ao longo do tempo.'
    ]
  }
};
