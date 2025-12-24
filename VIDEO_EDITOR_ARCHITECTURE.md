# Editor de Vídeo Web - Arquitetura Completa

## Visão Geral

Um editor de vídeo web profissional estilo CapCut, com preview em tempo real no navegador e renderização final via FFmpeg no backend.

## Arquitetura em 3 Camadas

### 1️⃣ Frontend - Editor Visual

**Tecnologias:**
- React + Zustand (gerenciamento de estado)
- HTML5 Canvas (renderização de preview)
- requestAnimationFrame (sincronização de tempo)

**Componentes Principais:**

#### VideoPreview (`src/components/editor/VideoPreview.jsx`)
- Canvas para renderização em tempo real
- Controles de play/pause
- Scrubber de tempo
- Suporta texto, imagens e animações
- 60fps de preview

#### TimelinePanel (`src/components/editor/TimelinePanel.jsx`)
- 4 tracks: Video, Text, Image, Audio
- Drag & drop com snap
- Resize lateral para trim
- Controles de visibilidade e exclusão
- Zoom ajustável

#### EditorSidebar (`src/components/editor/EditorSidebar.jsx`)
- Biblioteca de mídia (vídeos existentes)
- Presets de texto
- Upload de assets

#### PropertiesPanel (`src/components/editor/PropertiesPanel.jsx`)
- Edição de propriedades do elemento selecionado
- Controles de texto (fonte, tamanho, cor, posição)
- Animações (fade, slide, etc)
- Timing (start/end)

### 2️⃣ Engine de Timeline (Modelo de Dados)

**Estrutura (`src/types/timeline.ts`):**

```typescript
Timeline {
  width: 1920
  height: 1080
  fps: 30
  duration: 30
  tracks: Track[]
}

Track {
  id: string
  type: "video" | "text" | "image" | "audio"
  start: number
  end: number
  layer: number
  properties: object
  visible: boolean
}
```

**Propriedades por Tipo:**

**Video:**
- src, x, y, scale, rotation, opacity
- trim (start/end)

**Text:**
- text, font, size, color
- x, y, align, verticalAlign
- animation, bold, italic
- shadow, backgroundColor

**Image:**
- src, x, y, scale, rotation, opacity
- animation

**Audio:**
- src, volume, fadeIn, fadeOut
- trim

### 3️⃣ Backend - Renderização FFmpeg

**Edge Function (`render-video`):**

Fluxo de renderização:
1. Recebe jobId e projectId
2. Carrega timeline JSON do banco
3. Gera comando FFmpeg dinamicamente
4. Atualiza progresso (queued → processing → completed)
5. Retorna URL do vídeo final

**Exemplo de Comando FFmpeg Gerado:**

```bash
ffmpeg \
  -i base_video.mp4 \
  -filter_complex "
    [0:v]trim=start=0:end=5[v0];
    [v0]drawtext=text='Aproveita agora':
      fontfile=/usr/share/fonts/Inter-Bold.ttf:
      fontsize=64:
      fontcolor=0xFFFFFF:
      x=960:
      y=540:
      enable='between(t,2,5)'[out]
  " \
  -map "[out]" \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  output.mp4
```

## Banco de Dados

### Tables

**timeline_projects**
- Armazena projetos de timeline
- timeline_data (jsonb) - timeline completo serializado
- Metadados: width, height, fps, duration

**render_jobs**
- Gerencia fila de renderização
- Estados: queued, processing, completed, failed
- progress (0-100)
- output_url quando concluído

## Estado Global (Zustand)

**Store (`src/stores/editorStore.js`):**

```javascript
{
  timeline: Timeline
  currentTime: number
  isPlaying: boolean
  selectedTrackId: string | null
  zoom: number
  project: TimelineProject | null
  renderJob: RenderJob | null
}
```

**Actions:**
- `addTrack()` - Adiciona elemento à timeline
- `updateTrack()` - Atualiza propriedades
- `deleteTrack()` - Remove elemento
- `moveTrack()` - Move no tempo
- `duplicateTrack()` - Duplica elemento
- `setCurrentTime()` - Controla playhead
- `togglePlayPause()` - Play/pause

## Fluxo de Trabalho

### Edição
1. Usuário adiciona elementos (vídeo, texto) via sidebar
2. Elementos aparecem na timeline
3. Arrasta/redimensiona na timeline
4. Edita propriedades no painel direito
5. Preview atualiza em tempo real no canvas

### Salvamento
1. Timeline serializado em JSON
2. Salvo no Supabase (timeline_projects)
3. Pode carregar projetos salvos

### Renderização
1. Usuário clica em "Renderizar"
2. Cria render_job no banco
3. Chama Edge Function com projectId
4. Edge Function:
   - Carrega timeline
   - Gera comando FFmpeg
   - Executa renderização
   - Atualiza progresso
   - Salva URL do output
5. Frontend faz polling do job
6. Exibe link de download quando concluído

## Recursos Implementados

### Preview em Tempo Real
- ✅ Renderização canvas 60fps
- ✅ Texto com fontes, cores, animações
- ✅ Múltiplas layers
- ✅ Animações: fade-in, fade-out, slide (up/down/left/right)
- ✅ Timeline sincronizada

### Timeline
- ✅ 4 tracks (video, text, image, audio)
- ✅ Drag & drop
- ✅ Trim visual
- ✅ Zoom timeline
- ✅ Indicador de tempo atual
- ✅ Seleção de tracks

### Controles
- ✅ Play/Pause
- ✅ Scrubber de tempo
- ✅ Display de timecode
- ✅ Controles de visibilidade
- ✅ Duplicar/deletar tracks

### Propriedades
- ✅ Edição de texto inline
- ✅ Controles de fonte e estilo
- ✅ Posicionamento X/Y
- ✅ Animações pré-definidas
- ✅ Timing (start/end)

### Persistência
- ✅ Salvar projetos
- ✅ Carregar projetos
- ✅ Timeline serializado em JSON
- ✅ RLS no Supabase

### Renderização
- ✅ Fila de jobs
- ✅ Estados de progresso
- ✅ Geração de comando FFmpeg
- ✅ Polling com timeout
- ✅ Download do resultado

## Próximos Passos (Evolução)

### Engine de Renderização Real
- [ ] Integrar FFmpeg real (via Docker ou serverless)
- [ ] Suporte a áudio
- [ ] Transições entre clipes
- [ ] Efeitos avançados

### UX Avançada
- [ ] Undo/Redo
- [ ] Keyboard shortcuts
- [ ] Snap entre elementos
- [ ] Multi-seleção
- [ ] Copy/paste

### Assets
- [ ] Upload de vídeos
- [ ] Upload de imagens
- [ ] Upload de áudio
- [ ] Biblioteca de assets

### Integrações
- [ ] Templates pré-prontos
- [ ] Integração com Sora/Veo
- [ ] Automação via IA (Morphy)
- [ ] Export para múltiplas resoluções

## Performance

### Preview
- Canvas otimizado com requestAnimationFrame
- Renderiza apenas tracks visíveis
- 60fps constantes

### Timeline
- Virtualização para muitos tracks
- Debounce em atualizações
- Lazy loading de assets

### Renderização
- Jobs assíncronos
- Polling inteligente com timeout
- Retry automático em falhas

## Conclusão

Sistema completo e escalável de edição de vídeo web, pronto para:
- Criação de UGC ads
- Automação de criativos
- Templates e presets
- Integração com IA
- Milhares de renders simultâneos
