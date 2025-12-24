import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ToolInfo from '../components/ui/ToolInfo';
import { Upload, Copy, Download, FileText } from 'lucide-react';
import { toolsInfo } from '../data/toolsInfo';

export default function Transcription() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-textPrimary tracking-tight">Transcrição e Roteiros UGC</h1>
        <ToolInfo tool={toolsInfo.transcription} icon={FileText} />
      </div>
      <p className="text-textSecondary mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl">Transforme áudio em texto e roteiros prontos para anúncios.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Upload de Arquivo</h3>
            <div className="border-2 border-dashed border rounded-xl p-10 text-center hover:border-white/[0.15] transition-colors cursor-pointer">
              <Upload size={48} className="text-textSecondary mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-textSecondary text-lg mb-2">Arraste um áudio ou vídeo</p>
              <p className="text-textSecondary">MP3, WAV, MP4 até 200MB</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-textPrimary">Transcrição</h3>
                <Badge variant="success">Português</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-sm">
                  <Copy size={16} className="mr-2" />
                  Copiar Texto
                </Button>
                <Button variant="secondary" className="text-sm">
                  <Download size={16} className="mr-2" />
                  Baixar
                </Button>
              </div>
            </div>

            <textarea
              value="Olá pessoal! Hoje vou compartilhar com vocês um produto incrível que mudou completamente a minha rotina. Esse produto é perfeito para quem busca praticidade e qualidade..."
              readOnly
              rows={12}
              className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary focus:outline-none focus:border-white/[0.15] transition-colors resize-none"
            />

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-textSecondary">487 palavras • 2:34 minutos</span>
              <span className="text-textSecondary">Editável</span>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-surfaceMuted/50 rounded-xl">
                <FileText size={24} className="text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-textPrimary">Roteiro UGC</h3>
                <p className="text-textSecondary text-sm">Gerado automaticamente</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                <h4 className="text-textPrimary font-medium mb-2">Gancho (0-3s)</h4>
                <p className="text-textSecondary text-sm">Olá pessoal! Hoje vou compartilhar...</p>
              </div>

              <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                <h4 className="text-textPrimary font-medium mb-2">Problema (3-10s)</h4>
                <p className="text-textSecondary text-sm">Vocês já passaram por isso? Eu vivia...</p>
              </div>

              <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                <h4 className="text-textPrimary font-medium mb-2">Solução (10-20s)</h4>
                <p className="text-textSecondary text-sm">Esse produto mudou tudo porque...</p>
              </div>

              <div className="p-4 bg-surfaceMuted/30 rounded-xl">
                <h4 className="text-textPrimary font-medium mb-2">CTA (20-25s)</h4>
                <p className="text-textSecondary text-sm">Link na bio! Não percam essa...</p>
              </div>
            </div>

            <Button variant="secondary" className="w-full text-sm">
              <Download size={16} className="mr-2" />
              Exportar Roteiro
            </Button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Estatísticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-textSecondary text-sm">Palavras totais</span>
                <span className="text-textPrimary font-semibold">487</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSecondary text-sm">Duração estimada</span>
                <span className="text-textPrimary font-semibold">2:34</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSecondary text-sm">Taxa de fala</span>
                <span className="text-textPrimary font-semibold">185 wpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSecondary text-sm">Idioma</span>
                <Badge variant="success" className="text-xs">Português</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
