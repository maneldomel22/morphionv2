const AGE_MAP = {
  '18-25': '22',
  '26-35': '29',
  '36-45': '38',
  '46-55': '48',
  '56+': '58'
};

const SKIN_TONE_MAP = {
  very_fair: 'very fair skin tone',
  fair: 'fair skin tone',
  medium: 'medium skin tone',
  tan: 'tan skin tone',
  dark: 'dark brown skin tone'
};

const BODY_TYPE_MAP = {
  slim: 'slim build',
  average: 'average build',
  athletic: 'athletic build',
  plus_size: 'curvy plus-size build'
};

const HAIR_LENGTH_MAP = {
  very_short: 'very short',
  short: 'short',
  medium: 'medium length',
  long: 'long',
  very_long: 'very long',
  bald: 'shaved head'
};

const HAIR_STYLE_MAP = {
  straight: 'straight',
  wavy: 'wavy',
  curly: 'curly',
  coily: 'coily textured',
  dreadlocks: 'dreadlocks',
  buzz_cut: 'buzz cut'
};

const PHOTO_TYPE_MAP = {
  selfie: 'Photo captured using the front-facing camera, held at arm\'s length, with the subject directly facing the lens',
  selfie_spontaneous: 'Photo captured using the front-facing camera in a spontaneous moment, slightly crooked angle, casual and improvised',
  other_person: 'Photo taken by another person, natural perspective',
  casual_candid: 'Candid photo, unposed, captured spontaneously',
  video_frame: 'Video frame capture, natural movement frozen in time',
  mirror: 'Mirror selfie, reflection visible in mirror'
};

const PHOTO_TAKER_MAP = {
  self: 'Photographer: Subject herself',
  friend: 'Photographer: A friend',
  partner: 'Photographer: A partner',
  stranger: 'Photographer: A stranger or passerby',
  tripod: 'Photographer: Self-timer on tripod or improvised support'
};

const CAMERA_POSITION_MAP = {
  eye_level: 'Camera at eye level, straight on',
  slightly_above: 'Camera slightly above subject, subtle downward angle',
  slightly_below: 'Camera slightly below subject, subtle upward angle',
  side_angle: 'Camera at side angle, three-quarter perspective',
  slightly_tilted: 'Camera slightly tilted, casual imperfection',
  totally_casual: 'Camera position completely casual, imperfect framing'
};

const EXPRESSION_MAP = {
  natural_smile: 'Natural, genuine smile',
  shy_smile: 'Shy, subtle smile',
  neutral_relaxed: 'Neutral, relaxed expression',
  eye_contact: 'Direct eye contact with camera, engaged',
  looking_away: 'Looking to the side, avoiding direct eye contact',
  laughing: 'Caught mid-laugh, spontaneous joy',
  in_motion: 'In motion, turning head or walking, dynamic moment'
};

const ENVIRONMENT_MAP = {
  bedroom: 'A cozy bedroom with a visible bed, wooden headboard, bedside table with a lamp and books. The camera faces directly toward the subject, capturing the room behind her. No reflective surfaces visible in frame',
  living_room: 'A comfortable living room with a sofa, coffee table, and visible wall decor. The camera faces toward the subject with the living space visible behind',
  bathroom: 'A bathroom with visible sink, towels, and everyday toiletries. Natural everyday setting',
  car: 'Inside a car with natural lighting through windows, dashboard or steering wheel partially visible',
  beach: 'Beach location with sand and ocean visible in the background, outdoor natural setting',
  street: 'Street setting with urban environment visible, buildings or sidewalk in background',
  event: 'Event or party with people and social gathering atmosphere visible in background',
  cafe: 'Cafe or coffee shop with tables, chairs, and casual social space visible',
  gym: 'Gym or fitness center with equipment visible in background, workout environment',
  park: 'Park or outdoor green space with trees and nature visible',
  other: 'Casual everyday location with environment visible behind subject'
};

const LIGHTING_MAP = {
  soft_natural: 'Soft natural light, diffused through window or shade',
  direct_sun: 'Direct sunlight, strong highlights and shadows',
  golden_hour: 'Golden hour lighting, warm late afternoon sun',
  indoor_common: 'Common indoor lighting, mixed color temperatures',
  mixed: 'Mixed lighting, natural and artificial combined',
  poor: 'Poor lighting conditions, realistic imperfection, underexposed or grainy'
};

const DEVICE_TYPE_MAP = {
  high_quality: 'Shot with high-quality camera sensor, balanced HDR, clean highlights, accurate skin tones, natural processing',
  standard_quality: 'Shot with standard camera quality, slightly stronger contrast, mild sharpening, subtle color saturation',
  lower_quality: 'Shot with basic camera quality, washed-out colors, reduced sharpness, basic processing, visible compression',
  social_media: 'Shot with typical social media image quality, heavy compression, reduced detail, Instagram-like processing'
};

const AESTHETIC_STYLE_MAP = {
  feed_casual: 'Instagram feed casual aesthetic, curated but natural',
  stories: 'Instagram stories vibe, spontaneous and temporary feel',
  camera_roll: 'Random camera roll photo, unfiltered reality, no curation',
  ugc: 'Pure UGC content, raw and authentic, real user-generated feel',
  no_thought: 'Posted without overthinking, natural social media moment, authentic and imperfect'
};

function buildHairDescription(hairLength, hairStyle) {
  const length = HAIR_LENGTH_MAP[hairLength] || hairLength;
  const style = HAIR_STYLE_MAP[hairStyle] || hairStyle;

  if (hairLength === 'bald') {
    return 'shaved head, no hair';
  }

  return `${length} ${style} hair`;
}

export function buildInfluencerPrompt(answers) {
  const promptParts = [];

  promptParts.push('A realistic, unposed Instagram-style photo of a female influencer captured in a natural, everyday moment.');
  promptParts.push('');

  // Add Camera Logic Enforcement for non-mirror photos
  if (answers.photo_type !== 'mirror') {
    promptParts.push('Camera Logic Enforcement:');
    promptParts.push('The photo is NOT taken using a mirror.');
    promptParts.push('The camera is held directly in the subject\'s hand, positioned in front of her body.');
    promptParts.push('Her extended arm naturally explains the framing.');
    promptParts.push('The background is visible directly behind her.');
    promptParts.push('No mirrors, reflections, glass panels, or reflective surfaces are present anywhere in the scene.');
    promptParts.push('');
  }

  promptParts.push('Capture Method:');
  const photoType = PHOTO_TYPE_MAP[answers.photo_type] || 'Casual photo captured naturally';
  promptParts.push(photoType + '.');

  if (answers.photo_taker) {
    const photoTaker = PHOTO_TAKER_MAP[answers.photo_taker] || '';
    if (photoTaker) {
      promptParts.push(photoTaker + '.');
    }
  }

  if (answers.camera_position) {
    const cameraPosition = CAMERA_POSITION_MAP[answers.camera_position] || '';
    if (cameraPosition) {
      promptParts.push(cameraPosition + '.');
    }
  }

  promptParts.push('Casual angle, imperfect framing, natural perspective.');
  promptParts.push('');

  promptParts.push('The image feels spontaneous and human, not staged or professional.');
  promptParts.push('');

  promptParts.push('Subject:');
  const age = AGE_MAP[answers.age] || '25';
  const skinTone = SKIN_TONE_MAP[answers.skin_tone] || 'medium skin tone';
  const bodyType = BODY_TYPE_MAP[answers.body_type] || 'average build';

  promptParts.push(`${age} years old, ${skinTone}, ${bodyType}, realistic skin texture with visible pores, natural imperfections, subtle asymmetry, expressive eyes, relaxed posture.`);

  const hair = buildHairDescription(answers.hair_length, answers.hair_style);
  promptParts.push(`Hair: ${hair}.`);

  if (answers.distinct_features && answers.distinct_features.trim()) {
    promptParts.push(`Distinct features: ${answers.distinct_features.trim()}.`);
  }
  promptParts.push('');

  promptParts.push('Expression & Body Language:');
  const expression = EXPRESSION_MAP[answers.expression_body_language] ||
                     EXPRESSION_MAP[answers.expression] ||
                     'Natural, relaxed expression';
  promptParts.push(expression + '.');
  promptParts.push('');

  if (answers.scene_context && answers.scene_context.trim()) {
    promptParts.push('Scene Context:');
    promptParts.push(answers.scene_context.trim());
    promptParts.push('');
  } else if (answers.user_context && answers.user_context.trim()) {
    promptParts.push('Scene Context:');
    promptParts.push(answers.user_context.trim());
    promptParts.push('');
  }

  promptParts.push('Environment:');
  const environment = ENVIRONMENT_MAP[answers.environment] ||
                      ENVIRONMENT_MAP[answers.environment_preset] ||
                      `${answers.location || 'casual indoor space'}`;
  promptParts.push(environment + '.');

  if (answers.background_details && answers.background_details.trim()) {
    promptParts.push(`Background details: ${answers.background_details.trim()}.`);
  }
  promptParts.push('');

  promptParts.push('Lighting:');
  const lighting = LIGHTING_MAP[answers.lighting] ||
                   LIGHTING_MAP[answers.lighting_type] ||
                   'natural lighting';
  promptParts.push(lighting + '.');
  promptParts.push('');

  promptParts.push('Wardrobe:');
  if (answers.outfit_description && answers.outfit_description.trim()) {
    promptParts.push(answers.outfit_description.trim() + '.');
  } else {
    const top = answers.top || 'casual top';
    const bottom = answers.bottom || 'casual bottom';
    promptParts.push(`Top: ${top}.`);
    promptParts.push(`Bottom: ${bottom}.`);

    if (answers.accessories && answers.accessories.trim()) {
      promptParts.push(`Accessories: ${answers.accessories.trim()}.`);
    }
  }
  promptParts.push('');

  promptParts.push('Image Quality:');
  const deviceType = DEVICE_TYPE_MAP[answers.device_type] ||
                     'Shot with natural processing, balanced colors, realistic image quality';
  promptParts.push(deviceType + '.');
  promptParts.push('');

  promptParts.push('Composition:');
  promptParts.push('Casual framing, imperfect crop, natural perspective, no studio setup.');
  promptParts.push('');

  promptParts.push('Aesthetic:');
  const aestheticStyle = AESTHETIC_STYLE_MAP[answers.aesthetic_style] ||
                         'Raw Instagram UGC, unfiltered look, real-life moment';
  promptParts.push(aestheticStyle + '.');
  promptParts.push('Social media authenticity, realistic and relatable.');
  promptParts.push('');

  promptParts.push('Negative Constraints:');

  if (answers.photo_type !== 'mirror') {
    promptParts.push('No mirrors.');
    promptParts.push('No reflections.');
    promptParts.push('No reflective surfaces.');
  }

  promptParts.push('No studio lighting.');
  promptParts.push('No professional photography look.');
  promptParts.push('No beauty filters.');
  promptParts.push('No plastic or AI-smoothed skin.');
  promptParts.push('No text, watermarks, or logos.');

  const finalPrompt = promptParts.join('\n');
  return finalPrompt;
}

export function buildExistingInfluencerPrompt(description, aspectRatio = '9:16') {
  const promptParts = [];

  promptParts.push('A realistic, unposed Instagram-style photo of a female influencer captured in a natural, everyday moment.');
  promptParts.push('');

  promptParts.push('Camera Logic Enforcement:');
  promptParts.push('The photo is NOT taken using a mirror.');
  promptParts.push('The camera is held directly in the subject\'s hand, positioned in front of her body.');
  promptParts.push('Her extended arm naturally explains the framing.');
  promptParts.push('The background is visible directly behind her.');
  promptParts.push('No mirrors, reflections, glass panels, or reflective surfaces are present anywhere in the scene.');
  promptParts.push('');

  promptParts.push('Capture Method:');
  promptParts.push('Photo captured using the front-facing camera, held at arm\'s length.');
  promptParts.push('Casual angle, imperfect framing, natural perspective.');
  promptParts.push('');

  promptParts.push('Scene Context:');
  promptParts.push(description.trim());
  promptParts.push('');

  promptParts.push('Image Quality:');
  promptParts.push('Shot with high-quality front-facing camera.');
  promptParts.push('Balanced HDR, clean highlights, natural skin tones.');
  promptParts.push('Subtle noise, no beauty filters.');
  promptParts.push('');

  promptParts.push('Visual Fidelity:');
  promptParts.push('Raw capture with natural skin texture.');
  promptParts.push('Visible pores and natural imperfections.');
  promptParts.push('Subtle ISO noise if applicable.');
  promptParts.push('No beauty filters or artificial smoothing.');
  promptParts.push('');

  promptParts.push('Aesthetic:');
  promptParts.push('Raw Instagram story photo.');
  promptParts.push('Unplanned, spontaneous, authentic social media moment.');
  promptParts.push('');

  promptParts.push('Negative Constraints:');
  promptParts.push('No mirrors.');
  promptParts.push('No reflections.');
  promptParts.push('No studio lighting.');
  promptParts.push('No professional photography look.');
  promptParts.push('No beauty filters.');
  promptParts.push('No plastic or AI-smoothed skin.');
  promptParts.push('No text, watermarks, or logos.');

  const finalPrompt = promptParts.join('\n');
  return finalPrompt;
}
