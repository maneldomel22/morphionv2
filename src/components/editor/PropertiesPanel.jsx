import { useEditorStore } from '../../stores/editorStore';
import { Volume2, VolumeX } from 'lucide-react';

export default function PropertiesPanel() {
  const { timeline, selectedClipId, updateClip, moveClip } = useEditorStore();

  let selectedClip = null;

  for (const track of timeline.tracks) {
    const clip = track.clips.find(c => c.id === selectedClipId);
    if (clip) {
      selectedClip = clip;
      break;
    }
  }

  if (!selectedClip) {
    return (
      <div className="h-full bg-surfaceDark p-6 flex items-center justify-center">
        <p className="text-sm text-textSecondary text-center">
          Selecione um elemento na timeline para editar
        </p>
      </div>
    );
  }

  const props = selectedClip.properties || {};

  const handlePropertyChange = (key, value) => {
    updateClip(selectedClipId, {
      properties: { ...props, [key]: value }
    });
  };

  const handleTimeChange = (field, value) => {
    const numValue = parseFloat(value);
    if (field === 'startTime') {
      moveClip(selectedClipId, numValue, selectedClip.duration);
    } else if (field === 'duration') {
      moveClip(selectedClipId, selectedClip.startTime, numValue);
    }
  };

  return (
    <div className="h-full bg-surfaceDark flex flex-col">
      <div className="p-4 border-b border-borderSubtle flex-shrink-0">
        <h3 className="text-sm font-semibold text-textPrimary">Propriedades</h3>
        <p className="text-xs text-textSecondary mt-1 capitalize">{selectedClip.type} Clip</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs text-textSecondary mb-2">Início (s)</label>
          <input
            type="number"
            step="0.1"
            value={selectedClip.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-textSecondary mb-2">Duração (s)</label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            value={selectedClip.duration}
            onChange={(e) => handleTimeChange('duration', e.target.value)}
            className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
          />
        </div>

        {selectedClip.type === 'video' && (
          <div>
            <label className="flex items-center justify-between cursor-pointer p-3 bg-surfaceMuted rounded hover:bg-surfaceMuted/70 transition-colors">
              <span className="text-sm text-textPrimary flex items-center gap-2">
                {selectedClip.hasAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
                Áudio
              </span>
              <input
                type="checkbox"
                checked={selectedClip.hasAudio}
                onChange={(e) => updateClip(selectedClipId, { hasAudio: e.target.checked })}
                className="w-5 h-5 rounded"
              />
            </label>
            <p className="text-xs text-textSecondary mt-1">
              {selectedClip.hasAudio ? 'Áudio ativado' : 'Áudio desativado'}
            </p>
          </div>
        )}

        {selectedClip.type === 'text' && (
          <>
            <div>
              <label className="block text-xs text-textSecondary mb-2">Texto</label>
              <textarea
                value={props.text}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-xs text-textSecondary mb-2">Fonte</label>
              <select
                value={props.font}
                onChange={(e) => handlePropertyChange('font', e.target.value)}
                className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-textSecondary mb-2">Tamanho: {props.size}px</label>
              <input
                type="range"
                min="12"
                max="200"
                value={props.size}
                onChange={(e) => handlePropertyChange('size', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-textSecondary mb-2">Cor</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={props.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={props.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="flex-1 px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-textSecondary mb-2">X</label>
                <input
                  type="number"
                  value={props.x}
                  onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-2">Y</label>
                <input
                  type="number"
                  value={props.y}
                  onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-textSecondary mb-2">Alinhamento</label>
              <select
                value={props.align}
                onChange={(e) => handlePropertyChange('align', e.target.value)}
                className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-textSecondary mb-2">Animação</label>
              <select
                value={props.animation}
                onChange={(e) => handlePropertyChange('animation', e.target.value)}
                className="w-full px-3 py-2 bg-surfaceMuted border border-borderSubtle rounded text-sm text-textPrimary focus:border-brandPrimary focus:outline-none"
              >
                <option value="none">Nenhuma</option>
                <option value="fade-in">Fade In</option>
                <option value="fade-out">Fade Out</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
              </select>
            </div>

            <div className="flex gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.bold}
                  onChange={(e) => handlePropertyChange('bold', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs text-textSecondary">Negrito</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={props.italic}
                  onChange={(e) => handlePropertyChange('italic', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs text-textSecondary">Itálico</span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
