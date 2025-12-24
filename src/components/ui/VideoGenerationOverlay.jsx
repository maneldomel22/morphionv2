import { Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { VIDEO_GENERATION_STATES } from '../../services/videoGenerationService';

const VideoGenerationOverlay = ({ state, error, productImage, onRetry, onClose, onCancel, pollAttempts, maxAttempts }) => {
  if (state === VIDEO_GENERATION_STATES.IDLE) {
    return null;
  }

  const getLoadingText = () => {
    switch (state) {
      case VIDEO_GENERATION_STATES.UPLOADING:
        return 'Preparando seu vídeo…';
      case VIDEO_GENERATION_STATES.GENERATING:
        return 'A IA está criando seu criativo';
      case VIDEO_GENERATION_STATES.POLLING:
        return 'Finalizando os últimos detalhes…';
      case VIDEO_GENERATION_STATES.SUCCESS:
        return 'Vídeo gerado com sucesso!';
      case VIDEO_GENERATION_STATES.ERROR:
        return 'Erro na geração';
      default:
        return 'Gerando vídeo…';
    }
  };

  const isLoading = [
    VIDEO_GENERATION_STATES.UPLOADING,
    VIDEO_GENERATION_STATES.GENERATING,
    VIDEO_GENERATION_STATES.POLLING,
  ].includes(state);

  const isSuccess = state === VIDEO_GENERATION_STATES.SUCCESS;
  const isError = state === VIDEO_GENERATION_STATES.ERROR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgPrimary/95 backdrop-blur-sm animate-fadeIn">
      {productImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl"
          style={{
            backgroundImage: `url(${productImage})`,
          }}
        />
      )}

      <div className="relative z-10 text-center px-6 max-w-md">
        <div className="mb-6">
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-brandPrimary animate-spin" />
            </div>
          )}

          {isSuccess && (
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
          )}

          {isError && (
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold text-textPrimary mb-3">
          {getLoadingText()}
        </h3>

        {isLoading && (
          <>
            <p className="text-sm text-textSecondary mb-4">
              Isso pode levar alguns minutos. Não feche esta página.
            </p>
            {state === VIDEO_GENERATION_STATES.POLLING && pollAttempts && maxAttempts && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-textTertiary mb-2">
                  <span>Verificando status...</span>
                  <span>{pollAttempts}/{maxAttempts}</span>
                </div>
                <div className="w-full bg-surfaceMuted rounded-full h-1.5">
                  <div
                    className="bg-brandPrimary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(pollAttempts / maxAttempts) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-4 px-4 py-2 text-sm text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-2 mx-auto"
              >
                <X size={16} />
                Cancelar e voltar
              </button>
            )}
          </>
        )}

        {isError && error && (
          <>
            <p className="text-sm text-red-400 mb-6 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-brandPrimary text-white rounded-lg font-medium hover:bg-brandPrimary/90 transition-all"
              >
                Tentar novamente
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-surfaceMuted text-textPrimary rounded-lg font-medium hover:bg-surfaceMuted/80 transition-all"
              >
                Editar configurações
              </button>
            </div>
          </>
        )}

        {isSuccess && (
          <p className="text-sm text-green-400 animate-fadeIn">
            Seu vídeo está pronto e aparecerá em instantes
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoGenerationOverlay;
