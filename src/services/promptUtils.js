const MAX_TOTAL_CHARS = 800;
const MAX_ACTION_CHARS = 250;
const MAX_ENV_CHARS = 200;

const IDENTITY_BLOCK = "Use ONLY the face identity from the reference image, preserving facial structure, skin tone, eyes, nose, and proportions. Do NOT copy body, clothing, or pose from reference.";

const CHARACTER_BLOCK = "Character: adult influencer, realistic human appearance, natural skin texture, confident posture.";

const CAMERA_BLOCK = "Camera: handheld capture, slight natural movement, medium to medium-full framing, shallow depth of field.";

const LIGHTING_BLOCK = "Lighting: natural daylight or ambient realistic lighting.";

const STYLE_BLOCK = "Style: raw UGC, unfiltered, real human motion, cinematic realism.";

const AVOID_BLOCK = "Avoid: cartoon, anime, exaggerated anatomy, artificial skin, distortions, blur, text, logos, watermark.";

function truncateText(text, maxChars) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + '...';
}

export function buildWanPrompt(actionText, environmentText) {
  let action = truncateText(actionText, MAX_ACTION_CHARS);
  let environment = truncateText(environmentText, MAX_ENV_CHARS);

  let prompt = `Realistic handheld video capture. ${IDENTITY_BLOCK}

${CHARACTER_BLOCK}

Action:
${action}

Environment:
${environment}

${CAMERA_BLOCK}
${LIGHTING_BLOCK}
${STYLE_BLOCK}

${AVOID_BLOCK}`;

  if (prompt.length > MAX_TOTAL_CHARS) {
    const overhead = prompt.length - MAX_TOTAL_CHARS;
    const reducedEnvMax = Math.max(50, MAX_ENV_CHARS - Math.ceil(overhead / 2));
    const reducedActionMax = Math.max(50, MAX_ACTION_CHARS - Math.floor(overhead / 2));

    action = truncateText(actionText, reducedActionMax);
    environment = truncateText(environmentText, reducedEnvMax);

    prompt = `Realistic handheld video capture. ${IDENTITY_BLOCK}

${CHARACTER_BLOCK}

Action:
${action}

Environment:
${environment}

${CAMERA_BLOCK}
${LIGHTING_BLOCK}
${STYLE_BLOCK}

${AVOID_BLOCK}`;
  }

  return prompt;
}

export function buildHotWanPrompt(actionText, environmentText) {
  const hotCharacterBlock = "Character: adult woman (18+), realistic human appearance, natural body proportions, natural skin texture, confident posture.";

  let action = truncateText(actionText, MAX_ACTION_CHARS);
  let environment = truncateText(environmentText, MAX_ENV_CHARS);

  let prompt = `Realistic handheld video capture. ${IDENTITY_BLOCK}

${hotCharacterBlock}

Action:
${action}

Environment:
${environment}

${CAMERA_BLOCK}
${LIGHTING_BLOCK}
${STYLE_BLOCK}

${AVOID_BLOCK}`;

  if (prompt.length > MAX_TOTAL_CHARS) {
    const overhead = prompt.length - MAX_TOTAL_CHARS;
    const reducedEnvMax = Math.max(50, MAX_ENV_CHARS - Math.ceil(overhead / 2));
    const reducedActionMax = Math.max(50, MAX_ACTION_CHARS - Math.floor(overhead / 2));

    action = truncateText(actionText, reducedActionMax);
    environment = truncateText(environmentText, reducedEnvMax);

    prompt = `Realistic handheld video capture. ${IDENTITY_BLOCK}

${hotCharacterBlock}

Action:
${action}

Environment:
${environment}

${CAMERA_BLOCK}
${LIGHTING_BLOCK}
${STYLE_BLOCK}

${AVOID_BLOCK}`;
  }

  return prompt;
}

export const WAN_NEGATIVE_PROMPT = "exaggerated body proportions, cartoon, anime, CGI look, low resolution, blurry face, distorted face, extra limbs, unrealistic anatomy, artificial skin, plastic texture, over-sharpening, watermark, subtitles, text overlays, logos";

export const PROMPT_LIMITS = {
  MAX_TOTAL_CHARS,
  MAX_ACTION_CHARS,
  MAX_ENV_CHARS,
};
