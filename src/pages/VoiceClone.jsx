import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ToolInfo from '../components/ui/ToolInfo';
import { Upload, Play, Sparkles, Download, Mic } from 'lucide-react';
import { toolsInfo } from '../data/toolsInfo';

export default function VoiceClone() {
  const clonedVoices = [
    { id: 1, name: 'Voz Feminina 1', emoji: '🎤' },
    { id: 2, name: 'Voz Masculina 1', emoji: '🎤' },
    { id: 3, name: 'Voz Neutra', emoji: '🎤' }
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Gerador de Voz UGC</h1>
        <ToolInfo tool={toolsInfo.voiceClone} icon={Mic} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl">Crie vozes naturais para anúncios, reviews e vídeos curtos.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Upload de Áudio Original</h3>
            <div className="border-2 border-dashed border rounded-xl p-8 text-center hover:border-white/[0.15] transition-colors cursor-pointer mb-4">
              <Upload size={40} className="text-textSecondary mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-textSecondary mb-1">Arraste um arquivo de áudio</p>
              <p className="text-textSecondary text-sm">MP3, WAV até 50MB</p>
            </div>

            <div className="p-4 bg-surfaceMuted/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-textPrimary text-sm">audio_original.mp3</span>
                <span className="text-textSecondary text-xs">2:34</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-surfaceMuted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '0%' }}></div>
                </div>
                <button className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors">
                  <Play size={16} className="text-textSecondary" />
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Texto para Fala</h3>
            <textarea
              placeholder="Digite o texto que você quer transformar em voz..."
              rows={6}
              className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-white/[0.15] transition-colors resize-none mb-4"
            />
            <Button className="w-full">
              <Sparkles size={18} className="mr-2" />
              Gerar Fala
            </Button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Áudio Gerado</h3>
            <div className="p-6 bg-surfaceMuted/30 rounded-xl border mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-textPrimary">voz_gerada.mp3</span>
                <button className="p-2 hover:bg-surfaceMuted/30 rounded-lg transition-colors">
                  <Download size={18} className="text-textSecondary" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-3 bg-surfaceMuted/50 hover:bg-surfaceMuted/50 rounded-xl transition-colors">
                  <Play size={20} className="text-white" />
                </button>
                <div className="flex-1 h-2 bg-surfaceMuted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-textSecondary text-sm">1:10 / 2:34</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Vozes Clonadas</h3>
            <div className="space-y-3">
              {clonedVoices.map((voice) => (
                <div
                  key={voice.id}
                  className="p-4 bg-surfaceMuted/30 rounded-xl hover:bg-surfaceMuted/50 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{voice.emoji}</div>
                    <span className="text-textPrimary">{voice.name}</span>
                  </div>
                  <Play size={16} className="text-textSecondary group-hover:text-textPrimary transition-colors" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
