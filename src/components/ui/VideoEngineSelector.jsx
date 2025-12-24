import { Upload } from 'lucide-react';
import { prepareImageForUpload } from '../../lib/imageUtils';
import { WAN_DURATIONS, WAN_RESOLUTIONS, VIDEO_MODELS } from '../../types/videoModels';

const ENGINE_TYPES = {
  SORA_2: 'sora-2',
  SORA_2_PRO: 'sora-2-pro',
  SORA_2_PRO_STORYBOARD: 'sora-2-pro-storyboard',
  WAN_2_5: 'wan-2.5',
  VEO_3_1: 'veo-3.1'
};

const ENGINES = [
  {
    id: ENGINE_TYPES.SORA_2,
    name: 'Sora 2',
    description: '10s / 15s',
    subtitle: 'Qualidade standard'
  },
  {
    id: ENGINE_TYPES.SORA_2_PRO,
    name: 'Sora 2 Pro',
    description: '10s / 15s',
    subtitle: 'Standard / High quality'
  },
  {
    id: ENGINE_TYPES.SORA_2_PRO_STORYBOARD,
    name: 'Sora 2 Pro — Storyboard',
    description: '25s · 3 cenas',
    subtitle: 'Storyboard obrigatório'
  },
  {
    id: ENGINE_TYPES.WAN_2_5,
    name: 'WAN 2.5',
    description: 'Image → Video',
    subtitle: '5s / 10s · 720p / 1080p'
  },
  {
    id: ENGINE_TYPES.VEO_3_1,
    name: 'Veo 3.1',
    description: 'Image → Video',
    subtitle: '8s · Fast / Quality'
  }
];

export default function VideoEngineSelector({ formData, updateFormData, allowedEngines = null }) {
  const selectedEngine = formData.engineType;

  const availableEngines = allowedEngines
    ? ENGINES.filter(engine => allowedEngines.includes(engine.id))
    : ENGINES;

  const handleEngineSelect = (engineId) => {
    updateFormData('engineType', engineId);

    switch (engineId) {
      case ENGINE_TYPES.SORA_2:
        updateFormData('model', 'sora-2');
        updateFormData('videoModel', VIDEO_MODELS.SORA_2);
        updateFormData('duration', '10s');
        updateFormData('quality', 'standard');
        updateFormData('storyboardMode', false);
        updateFormData('aspectRatio', '9:16');
        break;

      case ENGINE_TYPES.SORA_2_PRO:
        updateFormData('model', 'sora-2-pro');
        updateFormData('videoModel', VIDEO_MODELS.SORA_2_PRO);
        updateFormData('duration', '10s');
        updateFormData('quality', 'standard');
        updateFormData('storyboardMode', false);
        updateFormData('aspectRatio', '9:16');
        break;

      case ENGINE_TYPES.SORA_2_PRO_STORYBOARD:
        updateFormData('model', 'sora-2-pro');
        updateFormData('videoModel', VIDEO_MODELS.SORA_2_PRO);
        updateFormData('duration', '25s');
        updateFormData('quality', 'standard');
        updateFormData('storyboardMode', true);
        updateFormData('aspectRatio', '9:16');
        break;

      case ENGINE_TYPES.WAN_2_5:
        updateFormData('videoModel', VIDEO_MODELS.WAN_2_5);
        updateFormData('wanDuration', '5');
        updateFormData('wanResolution', '720p');
        break;

      case ENGINE_TYPES.VEO_3_1:
        updateFormData('videoModel', VIDEO_MODELS.VEO_3_1);
        updateFormData('duration', '8s');
        updateFormData('veoMode', 'fast');
        updateFormData('aspectRatio', '9:16');
        break;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-textPrimary mb-4">
          Motor de Geração
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableEngines.map((engine) => (
            <button
              key={engine.id}
              onClick={() => handleEngineSelect(engine.id)}
              className={`p-5 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                selectedEngine === engine.id
                  ? 'border-brandPrimary bg-brandPrimary/10 shadow-lg shadow-brandPrimary/20'
                  : 'border hover:border-brandPrimary/50'
              }`}
            >
              <div className="text-lg font-bold text-textPrimary mb-1">{engine.name}</div>
              <div className="text-sm text-textSecondary mb-1">{engine.description}</div>
              <div className="text-xs text-textSecondary/70">{engine.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedEngine === ENGINE_TYPES.SORA_2 && (
        <SoraSettings
          durations={['10s', '15s']}
          showQuality={false}
          formData={formData}
          updateFormData={updateFormData}
        />
      )}

      {selectedEngine === ENGINE_TYPES.SORA_2_PRO && (
        <SoraProSettings
          durations={['10s', '15s']}
          formData={formData}
          updateFormData={updateFormData}
        />
      )}

      {selectedEngine === ENGINE_TYPES.SORA_2_PRO_STORYBOARD && (
        <SoraProStoryboardSettings
          formData={formData}
          updateFormData={updateFormData}
        />
      )}

      {selectedEngine === ENGINE_TYPES.WAN_2_5 && (
        <WanSettings
          formData={formData}
          updateFormData={updateFormData}
        />
      )}

      {selectedEngine === ENGINE_TYPES.VEO_3_1 && (
        <VeoSettings
          formData={formData}
          updateFormData={updateFormData}
        />
      )}
    </div>
  );
}

function SoraSettings({ durations, showQuality, formData, updateFormData }) {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">Duração</label>
        <div className="grid grid-cols-2 gap-3">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={() => updateFormData('duration', duration)}
              className={`py-4 rounded-xl text-lg font-semibold transition-all ${
                formData.duration === duration
                  ? 'bg-brandPrimary text-white'
                  : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      <AspectRatioSelector formData={formData} updateFormData={updateFormData} />
    </div>
  );
}

function SoraProSettings({ durations, formData, updateFormData }) {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">Duração</label>
        <div className="grid grid-cols-2 gap-3">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={() => updateFormData('duration', duration)}
              className={`py-4 rounded-xl text-lg font-semibold transition-all ${
                formData.duration === duration
                  ? 'bg-brandPrimary text-white'
                  : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">Qualidade</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'standard', label: 'Standard', icon: '⚪', subtitle: 'Qualidade padrão' },
            { value: 'high', label: 'High', icon: '🔥', subtitle: 'Máxima qualidade' }
          ].map((quality) => (
            <button
              key={quality.value}
              onClick={() => updateFormData('quality', quality.value)}
              className={`p-5 rounded-xl border-2 transition-all ${
                formData.quality === quality.value
                  ? 'border-brandPrimary bg-brandPrimary/10'
                  : 'border hover:border-brandPrimary/50'
              }`}
            >
              <div className="text-2xl mb-1">{quality.icon}</div>
              <div className="text-base font-bold text-textPrimary mb-1">{quality.label}</div>
              <div className="text-xs text-textSecondary">{quality.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      <AspectRatioSelector formData={formData} updateFormData={updateFormData} />
    </div>
  );
}

function SoraProStoryboardSettings({ formData, updateFormData }) {
  return (
    <div className="space-y-6 fade-in">
      <div className="p-5 rounded-xl border-2 border-brandPrimary/30 bg-brandPrimary/5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📋</div>
          <div>
            <div className="text-base font-bold text-textPrimary mb-1">25 segundos fixo</div>
            <div className="text-sm text-textSecondary">
              Este motor gera automaticamente 3 cenas em sequência
            </div>
          </div>
        </div>
      </div>

      <AspectRatioSelector formData={formData} updateFormData={updateFormData} />
    </div>
  );
}

function WanSettings({ formData, updateFormData }) {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">Imagem Base *</label>
        <label className="flex-1 cursor-pointer group block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              try {
                const imageUrl = await prepareImageForUpload(file, 'wan-images');
                updateFormData('wanImageUrl', imageUrl);
              } catch (error) {
                alert(error.message || 'Erro ao fazer upload da imagem');
              }
            }}
          />
          <div className="border-2 border-dashed rounded-xl p-6 hover:border-brandPrimary/50 transition-all text-center">
            {formData.wanImageUrl ? (
              <div className="space-y-2">
                <img src={formData.wanImageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                <p className="text-sm text-green-400">Imagem carregada</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-2 text-textSecondary group-hover:text-brandPrimary transition-colors" size={32} />
                <p className="text-sm text-textSecondary">Arraste ou clique para fazer upload</p>
                <p className="text-xs text-textSecondary mt-1">JPG, PNG ou WEBP · Máx 10MB</p>
              </>
            )}
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">
          Prompt de Movimento * <span className="text-textSecondary font-normal">(máx 800 caracteres)</span>
        </label>
        <textarea
          value={formData.wanPrompt || ''}
          onChange={(e) => updateFormData('wanPrompt', e.target.value)}
          placeholder="Descreva o movimento desejado no vídeo..."
          rows={4}
          maxLength={800}
          className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none"
        />
        <p className="text-xs text-textSecondary mt-1">{(formData.wanPrompt || '').length}/800 caracteres</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-3">Duração</label>
          <div className="grid grid-cols-2 gap-3">
            {WAN_DURATIONS.map((dur) => (
              <button
                key={dur}
                onClick={() => updateFormData('wanDuration', dur)}
                className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                  formData.wanDuration === dur
                    ? 'bg-brandPrimary text-white'
                    : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textPrimary mb-3">Resolução</label>
          <div className="grid grid-cols-2 gap-3">
            {WAN_RESOLUTIONS.map((res) => (
              <button
                key={res}
                onClick={() => updateFormData('wanResolution', res)}
                className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                  formData.wanResolution === res
                    ? 'bg-brandPrimary text-white'
                    : 'bg-surfaceMuted/50 text-textSecondary hover:bg-surfaceMuted'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">
          Negative Prompt <span className="text-textSecondary font-normal">(opcional, máx 500 caracteres)</span>
        </label>
        <textarea
          value={formData.wanNegativePrompt || ''}
          onChange={(e) => updateFormData('wanNegativePrompt', e.target.value)}
          placeholder="Descreva o que você NÃO quer ver no vídeo..."
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 bg-surfaceMuted/30 border rounded-xl text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-brandPrimary/50 transition-colors resize-none"
        />
        <p className="text-xs text-textSecondary mt-1">{(formData.wanNegativePrompt || '').length}/500 caracteres</p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-surfaceMuted/20 rounded-xl">
        <input
          type="checkbox"
          id="wanPromptExpansion"
          checked={formData.wanEnablePromptExpansion || false}
          onChange={(e) => updateFormData('wanEnablePromptExpansion', e.target.checked)}
          className="w-5 h-5 rounded border-2 border-textSecondary/30 checked:bg-brandPrimary checked:border-brandPrimary cursor-pointer"
        />
        <label htmlFor="wanPromptExpansion" className="flex-1 cursor-pointer">
          <div className="text-sm font-medium text-textPrimary">Expandir prompt automaticamente</div>
          <div className="text-xs text-textSecondary">O modelo LLM irá melhorar e detalhar seu prompt</div>
        </label>
      </div>
    </div>
  );
}

function VeoSettings({ formData, updateFormData }) {
  return (
    <div className="space-y-6 fade-in">
      <div className="p-5 rounded-xl border-2 border-blue-500/30 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⏱️</div>
          <div>
            <div className="text-base font-bold text-textPrimary mb-1">8 segundos fixo</div>
            <div className="text-sm text-textSecondary">
              Veo 3.1 gera vídeos com duração fixa de 8 segundos
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-textPrimary mb-3">Modo</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'fast', label: 'Fast', icon: '⚡', subtitle: 'Geração rápida' },
            { value: 'quality', label: 'Quality', icon: '✨', subtitle: 'Máxima qualidade' }
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateFormData('veoMode', mode.value)}
              className={`p-5 rounded-xl border-2 transition-all ${
                formData.veoMode === mode.value
                  ? 'border-brandPrimary bg-brandPrimary/10'
                  : 'border hover:border-brandPrimary/50'
              }`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="text-base font-bold text-textPrimary mb-1">{mode.label}</div>
              <div className="text-xs text-textSecondary">{mode.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      <AspectRatioSelector formData={formData} updateFormData={updateFormData} />
    </div>
  );
}

function AspectRatioSelector({ formData, updateFormData }) {
  return (
    <div>
      <label className="block text-sm font-medium text-textPrimary mb-3">Proporção</label>
      <div className="grid grid-cols-2 gap-6">
        {[
          {
            value: '9:16',
            label: 'Vertical',
            subtitle: 'Stories / Reels / TikTok',
            icon: (
              <svg width="40" height="64" viewBox="0 0 40 64" fill="none" className="mx-auto">
                <rect
                  x="1"
                  y="1"
                  width="38"
                  height="62"
                  rx="6"
                  className={`transition-all duration-300 ${
                    formData.aspectRatio === '9:16'
                      ? 'fill-brandPrimary/20 stroke-brandPrimary'
                      : 'fill-surfaceMuted/30 stroke-textSecondary/30'
                  }`}
                  strokeWidth="2"
                />
              </svg>
            )
          },
          {
            value: '16:9',
            label: 'Horizontal',
            subtitle: 'YouTube / TV',
            icon: (
              <svg width="80" height="48" viewBox="0 0 80 48" fill="none" className="mx-auto">
                <rect
                  x="1"
                  y="1"
                  width="78"
                  height="46"
                  rx="6"
                  className={`transition-all duration-300 ${
                    formData.aspectRatio === '16:9'
                      ? 'fill-brandPrimary/20 stroke-brandPrimary'
                      : 'fill-surfaceMuted/30 stroke-textSecondary/30'
                  }`}
                  strokeWidth="2"
                />
              </svg>
            )
          }
        ].map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => updateFormData('aspectRatio', ratio.value)}
            className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
              formData.aspectRatio === ratio.value
                ? 'border-brandPrimary bg-brandPrimary/10 shadow-brandPrimary/20 shadow-lg'
                : 'border hover:border-brandPrimary/50 hover:bg-surfaceMuted/20'
            }`}
          >
            <div className={`mb-4 transition-transform duration-300 ${
              formData.aspectRatio === ratio.value ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              {ratio.icon}
            </div>
            <div className="text-base font-bold text-textPrimary mb-1">{ratio.label}</div>
            <div className="text-xs text-textSecondary">{ratio.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { ENGINE_TYPES };
