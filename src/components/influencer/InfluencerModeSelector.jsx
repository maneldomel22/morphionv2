import { Upload, Sparkles, Flame } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function InfluencerModeSelector({ selectedMode, onModeChange }) {
  const modes = [
    {
      id: 'existing',
      title: 'Usar Influencer Existente',
      description: 'Faça upload de uma imagem e personalize o estilo',
      icon: Upload,
      color: 'blue'
    },
    {
      id: 'new',
      title: 'Criar Novo Influencer com IA',
      description: 'Use nosso quiz guiado para gerar um influencer realista',
      icon: Sparkles,
      color: 'purple'
    },
    {
      id: 'hot',
      title: 'Modo Influencer 🔥 (18+)',
      description: 'Conteúdo adulto artístico com WAN 2.5 - Quiz simplificado de 3 etapas',
      icon: Flame,
      color: 'red',
      isAdult: true
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-textPrimary mb-2">Como você quer obter a imagem do influencer?</h3>
        <p className="text-textSecondary text-sm">Escolha entre usar uma imagem existente ou criar uma nova com IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`text-left transition-all duration-300 ${
                isSelected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              <Card className={`h-full cursor-pointer transition-all ${
                isSelected
                  ? 'border-brandPrimary bg-brandPrimary/5 shadow-lg shadow-glow'
                  : 'border-transparent hover:border-brandPrimary/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    mode.color === 'blue'
                      ? 'bg-blue-500/10 text-blue-600'
                      : mode.color === 'purple'
                      ? 'bg-purple-500/10 text-purple-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    <Icon size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-textPrimary">{mode.title}</h4>
                      {mode.isAdult && (
                        <Badge className="bg-red-500/20 text-red-600 border-red-500/30">18+</Badge>
                      )}
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-brandPrimary animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-textSecondary">{mode.description}</p>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
