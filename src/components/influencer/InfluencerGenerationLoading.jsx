import { Loader2, Check, Sparkles } from 'lucide-react';
import Card from '../ui/Card';

export default function InfluencerGenerationLoading({ isOpen, messages, currentMessageIndex }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-2xl w-full">
        <Card className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={40} className="text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Criando conteúdo do influencer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Isso levará apenas alguns instantes...
            </p>

            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center gap-3 transition-all duration-300 ${
                    index <= currentMessageIndex ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  {index < currentMessageIndex && (
                    <Check size={18} className="text-green-500 flex-shrink-0" />
                  )}
                  {index === currentMessageIndex && (
                    <Loader2 size={18} className="text-blue-500 animate-spin flex-shrink-0" />
                  )}
                  {index > currentMessageIndex && (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    index <= currentMessageIndex
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {message}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-blue-500">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Gerando com IA</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
