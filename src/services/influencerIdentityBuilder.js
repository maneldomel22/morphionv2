/**
 * Influencer Identity Builder
 *
 * Builds detailed identity prompt sections from influencer identity_profile.
 * Used to ensure consistent physical appearance across all generated content.
 */

/**
 * Builds a detailed identity section from the influencer's identity_profile
 * @param {Object} identityProfile - The identity_profile JSONB object
 * @returns {string} Formatted identity section for AI prompts
 */
export function buildIdentityPromptSection(identityProfile) {
  if (!identityProfile) return '';

  const { face, hair, body, body_marks } = identityProfile;

  let prompt = '\n--- IDENTITY (CRITICAL - PRESERVE EXACTLY) ---\n';

  // FACE
  if (face) {
    prompt += `\nFACE:\n`;
    if (face.ethnicity) prompt += `Ethnicity: ${face.ethnicity}\n`;
    if (face.skin_tone) {
      prompt += `Skin: ${face.skin_tone}`;
      if (face.skin_tone_detail) prompt += ` (${face.skin_tone_detail})`;
      prompt += `\n`;
    }

    if (face.eyes) {
      prompt += `Eyes: ${face.eyes.color || ''} eyes`;
      if (face.eyes.shape) prompt += `, ${face.eyes.shape} shape`;
      prompt += `\n`;
    }

    if (face.face_shape) prompt += `Face shape: ${face.face_shape}\n`;
    if (face.nose) prompt += `Nose: ${face.nose}\n`;
    if (face.lips) prompt += `Lips: ${face.lips}\n`;
    if (face.base_expression) prompt += `Base expression: ${face.base_expression}\n`;
  }

  // HAIR
  if (hair) {
    prompt += `\nHAIR:\n`;
    const hairParts = [];
    if (hair.color) hairParts.push(hair.color);
    if (hair.length) hairParts.push(hair.length);
    if (hair.texture) hairParts.push(hair.texture);
    if (hair.style) hairParts.push(`styled as ${hair.style}`);
    if (hairParts.length > 0) {
      prompt += `${hairParts.join(', ')}\n`;
    }
  }

  // BODY
  if (body) {
    prompt += `\nBODY:\n`;
    if (body.type) prompt += `Build: ${body.type}\n`;
    if (body.height) prompt += `Height: ${body.height}\n`;
    if (body.proportions) prompt += `Proportions: ${body.proportions}\n`;

    const bodyDetails = [];
    if (body.shoulders) bodyDetails.push(`Shoulders: ${body.shoulders}`);
    if (body.waist) bodyDetails.push(`Waist: ${body.waist}`);
    if (body.hips) bodyDetails.push(`Hips: ${body.hips}`);
    if (body.legs) bodyDetails.push(`Legs: ${body.legs}`);

    if (bodyDetails.length > 0) {
      prompt += `${bodyDetails.join(', ')}\n`;
    }

    if (body.posture) prompt += `Posture: ${body.posture}\n`;
  }

  // BODY MARKS
  if (body_marks) {
    if (body_marks.tattoos && body_marks.tattoos.length > 0) {
      prompt += `\nTATTOOS:\n`;
      body_marks.tattoos.forEach(tattoo => {
        prompt += `- ${tattoo.size || 'medium'} tattoo on ${tattoo.location}`;
        if (tattoo.style) prompt += `: ${tattoo.style}`;
        prompt += `\n`;
      });
    }

    if (body_marks.moles && body_marks.moles.length > 0) {
      prompt += `\nMOLES:\n`;
      const locations = body_marks.moles.map(m => m.location).filter(Boolean);
      if (locations.length > 0) {
        prompt += `Located on: ${locations.join(', ')}\n`;
      }
    }

    if (body_marks.scars && body_marks.scars.length > 0) {
      prompt += `\nSCARS:\n`;
      body_marks.scars.forEach(scar => {
        prompt += `- ${scar.visibility || 'visible'} scar on ${scar.location}\n`;
      });
    }
  }

  prompt += `\n--- END IDENTITY ---\n`;

  return prompt;
}

/**
 * Builds the initial identity map prompt for a new influencer
 * This creates a 9-panel grid reference image showing multiple views
 * @param {Object} influencer - Complete influencer object with identity_profile
 * @returns {string} Complete prompt for identity map generation
 */
export function buildInitialInfluencerPrompt(influencer) {
  const profile = influencer.identity_profile;
  if (!profile) {
    throw new Error('Identity profile is required to build prompt');
  }

  const { face, hair, body, body_marks } = profile;

  // Build body marks descriptions
  let tattoosDesc = 'No tattoos';
  if (body_marks?.tattoos && body_marks.tattoos.length > 0) {
    const tattooList = body_marks.tattoos.map(t =>
      `${t.size || 'medium'} ${t.style || 'tattoo'} on ${t.location}`
    ).join(', ');
    tattoosDesc = tattooList;
  }

  let molesDesc = 'No moles';
  if (body_marks?.moles && body_marks.moles.length > 0) {
    const moleList = body_marks.moles.map(m => m.location).filter(Boolean).join(', ');
    if (moleList) molesDesc = `Moles on: ${moleList}`;
  }

  let scarsDesc = 'No scars';
  if (body_marks?.scars && body_marks.scars.length > 0) {
    const scarList = body_marks.scars.map(s =>
      `${s.visibility || 'visible'} scar on ${s.location}`
    ).join(', ');
    scarsDesc = scarList;
  }

  return `Create a high-resolution CHARACTER IDENTITY MAP image.

The image must be a clean studio composite grid showing the SAME woman multiple times,
each panel documenting a specific physical aspect for long-term identity consistency.

STYLE & QUALITY:
- Ultra-realistic photography
- Neutral studio background (light gray)
- Soft, even studio lighting
- No dramatic shadows
- No artistic styling
- No fashion posing
- Documentary / reference style
- Clean, clinical, identity-focused

GRID LAYOUT (MANDATORY – SINGLE IMAGE):

Panel 1: Full body – front view
Panel 2: Full body – back view
Panel 3: Face close-up – neutral expression
Panel 4: Upper torso close-up (chest & abdomen)
Panel 5: Left arm close-up
Panel 6: Right arm close-up
Panel 7: Legs close-up (thighs & calves)
Panel 8: Back close-up (upper and lower back)
Panel 9: Detail panel highlighting permanent body marks

SUBJECT DESCRIPTION (LOCKED):

Gender: Female
Age: ${influencer.age || '25'}
Ethnicity: ${face?.ethnicity || 'Caucasiana'}
Skin tone: ${face?.skin_tone || 'Clara'}${face?.skin_tone_detail ? ` (${face.skin_tone_detail})` : ''}
Body type: ${body?.type || 'Atlético'}
Approximate height: ${body?.height || 'Média (160-170cm)'}

Body proportions:
- Shoulders: ${body?.shoulders || 'Médios'}
- Waist: ${body?.waist || 'Média'}
- Hips: ${body?.hips || 'Médios'}
- Legs: ${body?.legs || 'Médias'}
- Posture: ${body?.posture || 'Ereta'}
- Overall proportions: ${body?.proportions || 'Equilibradas'}

Hair:
- Color: ${hair?.color || 'Castanho'}
- Style: ${hair?.style || 'Solto'}
- Length: ${hair?.length || 'Médio'}
- Texture: ${hair?.texture || 'Liso'}

Facial features:
- Eye color: ${face?.eyes?.color || 'Castanhos'}
- Eye shape: ${face?.eyes?.shape || 'Amendoados'}
- Face shape: ${face?.face_shape || 'Oval'}
- Nose: ${face?.nose || 'Médio'}
- Lips: ${face?.lips || 'Médios'}
- Base expression: ${face?.base_expression || 'Neutra'}

PERMANENT BODY MARKS (CRITICAL – MUST MATCH EXACTLY):

Tattoos: ${tattoosDesc}
Moles: ${molesDesc}
Scars: ${scarsDesc}

All panels must depict the SAME person with PERFECT consistency.
This image will be used as a permanent identity reference for future image and video generation.

Do NOT:
- Change proportions between panels
- Add or remove marks
- Stylize the body
- Alter identity across panels
- Use artistic filters or effects

CRITICAL: Every panel shows the exact same woman with identical physical features, body proportions, and permanent marks.
This is a comprehensive identity documentation image, not a fashion or portrait photoshoot.`;
}

/**
 * Validates that an identity_profile has all required fields
 * @param {Object} identityProfile - The identity profile to validate
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateIdentityProfile(identityProfile) {
  const missing = [];

  if (!identityProfile) {
    return { valid: false, missing: ['identity_profile is null or undefined'] };
  }

  // Check face
  if (!identityProfile.face) missing.push('face');
  else {
    if (!identityProfile.face.ethnicity) missing.push('face.ethnicity');
    if (!identityProfile.face.skin_tone) missing.push('face.skin_tone');
    if (!identityProfile.face.eyes?.color) missing.push('face.eyes.color');
    if (!identityProfile.face.eyes?.shape) missing.push('face.eyes.shape');
  }

  // Check hair
  if (!identityProfile.hair) missing.push('hair');
  else {
    if (!identityProfile.hair.color) missing.push('hair.color');
    if (!identityProfile.hair.texture) missing.push('hair.texture');
  }

  // Check body
  if (!identityProfile.body) missing.push('body');
  else {
    if (!identityProfile.body.type) missing.push('body.type');
    if (!identityProfile.body.height) missing.push('body.height');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
