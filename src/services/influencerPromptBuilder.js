import { buildIdentityPromptSection } from './influencerIdentityBuilder';

export async function buildNanoBananaPrompt({ influencer, scene, camera }) {
  const profile = influencer.identity_profile;

  const face = profile?.face || {};
  const hair = profile?.hair || {};
  const body = profile?.body || {};
  const bodyMarks = profile?.body_marks || {};

  // Tattoos
  let tattoosDesc = '';
  if (bodyMarks.tattoos && bodyMarks.tattoos.length > 0) {
    tattoosDesc = bodyMarks.tattoos.map(t =>
      `${t.size || 'medium'} ${t.style || 'tattoo'} on ${t.location}`
    ).join(', ');
  }

  // Moles
  let molesDesc = '';
  if (bodyMarks.moles && bodyMarks.moles.length > 0) {
    const locations = bodyMarks.moles.map(m => m.location).filter(Boolean);
    if (locations.length > 0) {
      molesDesc = `Moles on: ${locations.join(', ')}`;
    }
  }

  // Scars
  let scarsDesc = '';
  if (bodyMarks.scars && bodyMarks.scars.length > 0) {
    scarsDesc = bodyMarks.scars.map(s =>
      `${s.visibility || 'visible'} scar on ${s.location}`
    ).join(', ');
  }

  return `IMPORTANT GLOBAL RULE:
The attached image is a REFERENCE IMAGE ONLY.
It defines the influencer's permanent identity.
It MUST NOT define layout, composition, grid, panels, collage, or split views.

The generated image MUST be a SINGLE, NORMAL photograph.
DO NOT create grids, panels, identity maps, comparisons, or multi-view layouts.

====================================
IDENTITY LOCK — PERMANENT (DO NOT CHANGE)
====================================

Use the attached reference image to preserve EXACTLY:
- Face structure
- Facial proportions
- Skin tone and undertone
- Hair color, texture, and density
- Body type and proportions
- Permanent body marks

IDENTITY DETAILS (LOCKED):

FACE:
Ethnicity: ${face.ethnicity || 'Not specified'}
Skin tone: ${face.skin_tone || 'Not specified'}${face.skin_tone_detail ? ` (${face.skin_tone_detail})` : ''}
Eye color and shape: ${face.eyes?.color || 'Not specified'} eyes, ${face.eyes?.shape || 'Not specified'} shape
Face shape: ${face.face_shape || 'Not specified'}
Nose: ${face.nose || 'Not specified'}
Lips: ${face.lips || 'Not specified'}
Base expression: ${face.base_expression || 'Neutral'}

HAIR:
Color: ${hair.color || 'Not specified'}
Length: ${hair.length || 'Not specified'}
Texture: ${hair.texture || 'Not specified'}
Style: ${hair.style || 'Not specified'}

BODY:
Build: ${body.type || 'Not specified'}
Height: ${body.height || 'Not specified'}
Proportions: ${body.proportions || 'Not specified'}
Shoulders: ${body.shoulders || 'Not specified'}
Waist: ${body.waist || 'Not specified'}
Hips: ${body.hips || 'Not specified'}
Legs: ${body.legs || 'Not specified'}
Posture: ${body.posture || 'Not specified'}

PERMANENT MARKS (MUST MATCH EXACTLY):
${tattoosDesc ? `Tattoos: ${tattoosDesc}` : 'No tattoos'}
${molesDesc || 'No moles'}
${scarsDesc ? `Scars: ${scarsDesc}` : 'No scars'}

Do NOT:
- Add or remove marks
- Change body shape
- Alter proportions
- Smooth or stylize the body unnaturally

====================================
SCENE & CONTENT — USER CONTROLLED
====================================

The following section defines ONLY the current scene.
It does NOT override identity.

Age context: ${influencer.age}
Style: ${influencer.style}
Skin texture: Natural, visible pores, realistic imperfections

Scene description:
${scene.scene_context}

Environment:
${scene.environment}

Wardrobe:
${scene.wardrobe}

Action / Pose:
${scene.action_pose}

Expression:
${scene.expression_attitude}

${scene.additional_notes ? `Additional notes:\n${scene.additional_notes}\n` : ''}

Camera & capture:
${camera.capture_type}, ${camera.photographer}
Quality: ${camera.quality || 'high'} quality with ${camera.processing || 'natural'} processing

====================================
FINAL CONSTRAINTS
====================================

- Output a SINGLE realistic photo
- Natural perspective
- No grids
- No identity map layout
- No collage
- No split screen
- No comparison views
- No mirror reflections
- No studio lighting
- No professional photography look
- No beauty filters
- No plastic or AI-looking skin
- No text, logos or watermarks
- Maintain full identity consistency
- Authentic Instagram-style, unposed, natural framing, imperfect crop`;
}

// SeeDream has a 3000 character limit
const MAX_SEEDREAM_PROMPT_LENGTH = 3000;

function truncateSmartly(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export async function buildSeedreamPrompt({ influencer, scene, camera }) {
  const profile = influencer.identity_profile;

  const face = profile?.face || {};
  const hair = profile?.hair || {};
  const body = profile?.body || {};
  const bodyMarks = profile?.body_marks || {};

  // Tattoos - compact format
  let tattoosDesc = '';
  if (bodyMarks.tattoos && bodyMarks.tattoos.length > 0) {
    tattoosDesc = bodyMarks.tattoos.map(t =>
      `${t.size || ''} ${t.style || 'tattoo'} ${t.location}`.trim()
    ).join(', ');
  }

  // Moles - compact format
  let molesDesc = '';
  if (bodyMarks.moles && bodyMarks.moles.length > 0) {
    const locations = bodyMarks.moles.map(m => m.location).filter(Boolean);
    if (locations.length > 0) {
      molesDesc = locations.join(', ');
    }
  }

  // Scars - compact format
  let scarsDesc = '';
  if (bodyMarks.scars && bodyMarks.scars.length > 0) {
    scarsDesc = bodyMarks.scars.map(s =>
      `${s.visibility || ''} ${s.location}`.trim()
    ).join(', ');
  }

  // Build base template (optimized)
  const baseTemplate = `REF IMAGE = IDENTITY ONLY (not layout/composition)
SINGLE PHOTO ONLY - No grids/panels/collages

=== IDENTITY LOCK (PERMANENT) ===
Match reference exactly: face structure, proportions, skin tone, hair, body type, marks

FACE: ${face.ethnicity || 'N/A'} | ${face.skin_tone || 'N/A'} | ${face.eyes?.color || 'N/A'} ${face.eyes?.shape || 'N/A'} eyes | ${face.face_shape || 'N/A'} face | ${face.nose || 'N/A'} nose | ${face.lips || 'N/A'} lips | ${face.base_expression || 'Neutral'}

HAIR: ${hair.color || 'N/A'} | ${hair.length || 'N/A'} | ${hair.texture || 'N/A'} | ${hair.style || 'N/A'}

BODY: ${body.type || 'N/A'} | ${body.height || 'N/A'} | ${body.proportions || 'N/A'} | Shoulders:${body.shoulders || 'N/A'} | Waist:${body.waist || 'N/A'} | Hips:${body.hips || 'N/A'} | Legs:${body.legs || 'N/A'} | ${body.posture || 'N/A'}

MARKS: ${tattoosDesc || 'No tattoos'} | Moles: ${molesDesc || 'none'} | Scars: ${scarsDesc || 'none'}

DO NOT alter identity, marks, proportions, or body shape.

=== SCENE (USER CONTROLLED) ===
Age: ${influencer.age} | Natural skin texture with imperfections

SCENE: ${scene.scene_context}

ENV: ${scene.environment}

WARDROBE: ${scene.wardrobe}

ACTION: ${scene.action_pose}

EXPRESSION: ${scene.expression_attitude}`;

  // Calculate available space for additional notes
  const baseLength = baseTemplate.length;
  const cameraSection = `\nCAMERA: ${camera.capture_type} | ${camera.photographer} | ${camera.quality || 'high'} quality with ${camera.processing || 'natural'} processing`;
  const constraints = `\n\nCONSTRAINTS: Single realistic photo, natural perspective, no grids/layout/collage/split/comparison, full identity match, raw/natural/unfiltered, no censorship/filters/text`;

  const fixedLength = baseLength + cameraSection.length + constraints.length;
  const availableForNotes = MAX_SEEDREAM_PROMPT_LENGTH - fixedLength - 50; // 50 char buffer

  let additionalNotesSection = '';
  if (scene.additional_notes) {
    const notesPrefix = '\n\nNOTES: ';
    const maxNotesLength = availableForNotes - notesPrefix.length;
    if (maxNotesLength > 0) {
      const truncatedNotes = truncateSmartly(scene.additional_notes, maxNotesLength);
      additionalNotesSection = notesPrefix + truncatedNotes;
    }
  }

  const finalPrompt = baseTemplate + additionalNotesSection + cameraSection + constraints;

  // Final safety check
  if (finalPrompt.length > MAX_SEEDREAM_PROMPT_LENGTH) {
    console.warn(`⚠️ Prompt still exceeds limit: ${finalPrompt.length}/${MAX_SEEDREAM_PROMPT_LENGTH}`);
    return truncateSmartly(finalPrompt, MAX_SEEDREAM_PROMPT_LENGTH);
  }

  console.log(`✅ Optimized prompt: ${finalPrompt.length}/${MAX_SEEDREAM_PROMPT_LENGTH} chars`);
  return finalPrompt;
}

export function buildWanPrompt({ scene }) {
  const prompt = `${scene.scene_context}. ${scene.action_pose}. ${scene.expression_attitude}.`;

  console.log('📝 WAN prompt length:', prompt.length, 'chars');

  return prompt;
}

export function getEngineConfig(type, mode) {
  if (type === 'image') {
    if (mode === 'safe') {
      return {
        model: 'nano-banana-pro',
        buildPrompt: buildNanoBananaPrompt
      };
    } else {
      return {
        model: 'seedream/4.5-edit',
        buildPrompt: buildSeedreamPrompt
      };
    }
  }

  if (type === 'video') {
    return {
      model: 'wan/2-5-image-to-video',
      buildPrompt: buildWanPrompt
    };
  }

  throw new Error('Invalid post type');
}

export async function buildInfluencerPrompt({ influencer, mode, scene, camera }) {
  if (mode === 'safe') {
    return await buildNanoBananaPrompt({ influencer, scene, camera });
  } else {
    return await buildSeedreamPrompt({ influencer, scene, camera });
  }
}
