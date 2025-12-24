export const IMAGE_ENGINES = {
  NANO_BANANA: 'nano_banana_pro',
  SEEDREAM: 'seedream_4_5'
};

export const IMAGE_ENGINE_CONFIGS = {
  [IMAGE_ENGINES.NANO_BANANA]: {
    name: 'Geração Criativa',
    description: 'Crie imagens do zero',
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
    name: 'Editor Realista',
    description: 'Edite imagens existentes',
    kieModel: 'seedream/4.5-edit',
    supportsTextToImage: false,
    supportsImageToImage: true,
    requiresSourceImage: true,
    qualities: ['basic', 'high'],
    defaultQuality: 'basic',
    qualityMap: {
      basic: '2K',
      high: '4K'
    },
    maxPromptLength: 3000,
    tooltip: 'Edita uma imagem existente mantendo estrutura e pose. Requer imagem de entrada.'
  }
};

export const GENERATION_MODES = {
  TEXT_TO_IMAGE: 'text-to-image',
  IMAGE_TO_IMAGE: 'image-to-image'
};

export function getGenerationMode(engine, hasSourceImage) {
  if (engine === IMAGE_ENGINES.SEEDREAM) {
    return GENERATION_MODES.IMAGE_TO_IMAGE;
  }

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
