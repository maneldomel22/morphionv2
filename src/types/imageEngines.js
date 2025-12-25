export const IMAGE_ENGINES = {
  NANO_BANANA: 'nano_banana_pro',
  SEEDREAM: 'seedream_4_5'
};

export const IMAGE_ENGINE_CONFIGS = {
  [IMAGE_ENGINES.NANO_BANANA]: {
    name: 'Nano Banana Pro',
    description: 'Geração criativa com mais controle',
    kieModel: 'nano-banana-pro',
    supportsTextToImage: true,
    supportsImageToImage: true,
    requiresSourceImage: false,
    defaultResolution: '2K',
    resolutions: ['1K', '2K', '4K'],
    outputFormats: ['png', 'jpg'],
    maxPromptLength: 5000,
    tooltip: 'Ideal para criar imagens do zero ou com referências opcionais'
  },
  [IMAGE_ENGINES.SEEDREAM]: {
    name: 'Seedream',
    description: 'Realista e automático',
    kieModel: 'seedream/4.5',
    supportsTextToImage: true,
    supportsImageToImage: true,
    requiresSourceImage: false,
    qualities: ['basic', 'high'],
    defaultQuality: 'basic',
    qualityMap: {
      basic: '2K',
      high: '4K'
    },
    maxPromptLength: 3000,
    tooltip: 'Escolhe automaticamente: text-to-image (sem foto) ou edit (com foto)'
  }
};

export const GENERATION_MODES = {
  TEXT_TO_IMAGE: 'text-to-image',
  IMAGE_TO_IMAGE: 'image-to-image'
};

export function getGenerationMode(engine, hasSourceImage) {
  return hasSourceImage ? GENERATION_MODES.IMAGE_TO_IMAGE : GENERATION_MODES.TEXT_TO_IMAGE;
}

export function validateEnginePayload(engine, payload) {
  const config = IMAGE_ENGINE_CONFIGS[engine];

  if (!config) {
    throw new Error(`Unknown engine: ${engine}`);
  }

  if (config.requiresSourceImage && (!payload.image_urls || payload.image_urls.length === 0)) {
    throw new Error(`${config.name} requires at least one source image`);
  }

  if (!payload.prompt || payload.prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  if (payload.prompt.length > config.maxPromptLength) {
    throw new Error(`Prompt must be less than ${config.maxPromptLength} characters`);
  }

  if (!payload.aspect_ratio) {
    throw new Error('Aspect ratio is required');
  }

  return true;
}
