export const VIDEO_MODELS = {
  VEO3: 'veo3',
  VEO_3_1: 'veo_3_1',
  WAN_2_5: 'wan_2_5',
  SORA_2: 'sora_2',
  SORA_2_PRO: 'sora_2_pro'
};

export const MODEL_LABELS = {
  [VIDEO_MODELS.VEO3]: 'Veo 3',
  [VIDEO_MODELS.VEO_3_1]: 'Veo 3.1',
  [VIDEO_MODELS.WAN_2_5]: 'WAN 2.5',
  [VIDEO_MODELS.SORA_2]: 'Sora 2',
  [VIDEO_MODELS.SORA_2_PRO]: 'Sora 2 Pro',
  'veo3': 'Veo 3',
  'veo_3_1': 'Veo 3.1',
  'wan_2_5': 'WAN 2.5',
  'sora_2': 'Sora 2',
  'sora_2_pro': 'Sora 2 Pro'
};

export const WAN_DURATIONS = ['5', '10'];
export const WAN_RESOLUTIONS = ['720p', '1080p'];

export const WAN_ERROR_MESSAGES = {
  'Image format not supported': 'A imagem enviada não é compatível. Use JPG, PNG ou WEBP.',
  'Prompt too long': 'O texto do prompt ultrapassa o limite permitido.',
  'Internal server error': 'Erro interno no modelo. Tente novamente em alguns instantes.',
  'Invalid image url': 'URL da imagem inválida ou inacessível.',
  'Image too large': 'A imagem ultrapassa o limite de 10MB.',
  'Invalid duration': 'Duração inválida. Escolha 5s ou 10s.',
  'Invalid resolution': 'Resolução inválida. Escolha 720p ou 1080p.',
};

export const translateWanError = (errorMsg) => {
  for (const [key, translation] of Object.entries(WAN_ERROR_MESSAGES)) {
    if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }
  return errorMsg || 'Erro desconhecido ao gerar vídeo';
};
