const HOT_KEYWORDS = [
  'nua', 'nu', 'pelada', 'pelado', 'naked', 'nude', 'nudity',
  'seios', 'peitos', 'breast', 'boobs', 'tits',
  'bunda', 'bundão', 'bundona', 'ass', 'butt',
  'buceta', 'pussy', 'vagina',
  'pau', 'pênis', 'penis', 'dick', 'cock',
  'sexo', 'sex', 'sexual', 'sexy',
  'pornô', 'porno', 'porn', 'pornography',
  'gostosa', 'gostoso', 'hot', 'sensual',
  'lingerie', 'calcinha', 'sutiã', 'bra', 'panties', 'underwear',
  'topless', 'seminua', 'seminudo',
  'íntimas', 'intimas', 'intimate',
  'erótico', 'erotico', 'erotic',
  'provocante', 'provocative',
  'decote', 'cleavage',
  'biquíni', 'biquini', 'bikini',
  'fetiche', 'fetish',
  'nsfw', 'adult content', 'conteúdo adulto',
  'explícito', 'explicito', 'explicit',
  'voluptuosa', 'voluptuous',
  'curvas', 'curves',
  'sedução', 'seduction', 'seductive',
  'nudez', 'nakedness'
];

export function containsHotContent(text) {
  if (!text || typeof text !== 'string') return false;

  const normalizedText = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return HOT_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
    return regex.test(normalizedText);
  });
}

export function getBlockedMessage() {
  return 'Este tipo de conteúdo só pode ser gerado na aba "Influencer". Por favor, use a ferramenta de Influencer para criar este tipo de imagem.';
}
