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

export async function buildSeedreamPrompt({ influencer, scene, camera, isExplicit = false }) {
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

  // Build UGC-style prompt for explicit content
  if (isExplicit) {
    const ugcTemplate = `=== IMAGE REFERENCE INSTRUCTION ===
SOURCE IMAGE IS FOR CHARACTER IDENTITY ONLY (Face/Body/Marks).
OUTPUT MUST BE A SINGLE PHOTO. NO GRIDS, NO SPLIT SCREENS.

=== MEDIUM & AESTHETIC (VIDEO STILL) ===
TYPE: Authentic smartphone video still, Instagram Story screenshot, captured mid-motion.
QUALITY: Standard definition (SD), soft focus (slightly out of focus), significant motion blur on moving hands, digital noise/grain, raw unedited footage feel.
LIGHTING: Direct hard flash (video torch mode), creating deep hard shadows and overexposed highlights on wet skin.

=== IDENTITY LOCK (FROM REFERENCE) ===
FACE: ${face.ethnicity || 'Latina'}, ${face.eyes?.color || 'amber'} ${face.eyes?.shape || 'almond'} eyes, ${face.face_shape || 'oval'} face, ${face.lips || 'full lips'}.
HAIR: ${hair.color || 'Dark Brown'}, ${hair.length || 'long'}, ${hair.style || 'messy/tousled'}, sticking to sweaty neck.
BODY: ${body.type || 'Athletic'}, ${body.proportions || 'slim'}, ${body.waist || 'defined waist'}, ${body.hips || 'full hips'}.
MARKS: ${tattoosDesc || 'Minimalist octopus tattoo near groin/hip'}, ${molesDesc ? `moles on ${molesDesc}` : 'moles'}.
SKIN: Real texture, heavy sweat droplets, oily sheen, flushed redness.

=== SCENE & ENVIRONMENT ===
LOC: ${scene.environment}
DETAILS: ${scene.scene_context || 'Torn condom wrapper on the floor, clothes pushed aside, messy nightstand background'}.

=== ACTION & POSE (FREEZE-FRAME) ===
POV: High-angle handheld selfie (video mode).
ACTION: Freeze-frame of ${scene.action_pose}. She is **mid-motion**, actively gesturing or touching her hair/face with one hand.
CRITICAL DETAIL: The moving hand has **heavy motion blur**, indicating speed. The other hand holds the camera (implied).
ANATOMY: ${scene.pose_details || 'Legs spread wide but soft focus on the edges, focus is on the torso and expression'}.

=== EXPRESSION ===
LOOK: Direct eye contact with the lens, breaking 4th wall.
FACE: ${scene.expression_attitude || 'Mouth open mid-breath (panting) or biting lip, not a static smile. Exhausted, intense, "aftermath" vibe'}.

--no grid, collage, split screen, border, film strip, sharp focus, 4k, ultra detailed, studio lighting, cgi, render`;

    // Truncate if needed
    if (ugcTemplate.length > MAX_SEEDREAM_PROMPT_LENGTH) {
      console.warn(`⚠️ UGC prompt exceeds limit: ${ugcTemplate.length}/${MAX_SEEDREAM_PROMPT_LENGTH}`);
      return truncateSmartly(ugcTemplate, MAX_SEEDREAM_PROMPT_LENGTH);
    }

    console.log(`✅ UGC prompt: ${ugcTemplate.length}/${MAX_SEEDREAM_PROMPT_LENGTH} chars`);
    return ugcTemplate;
  }

  // Original template for safe content
  const baseTemplate = `REF IMAGE = IDENTITY ONLY (not layout/composition)
SINGLE PHOTO ONLY - No grids/panels/collages

=== IDENTITY LOCK (PERMANENT) ===
Match reference exactly: face structure, proportions, skin tone, hair, body type, marks

FACE: ${face.ethnicity || 'N/A'} | ${face.skin_tone || 'N/A'} | ${face.eyes?.color || 'N/A'} ${face.eyes?.shape || 'N/A'} eyes | ${face.face_shape || 'N/A'} face | ${face.nose || 'N/A'} nose | ${face.lips || 'N/A'} lips | ${face.base_expression || 'Neutral'}

HAIR: ${hair.color || 'N/A'} | ${hair.length || 'N/A'} | ${hair.texture || 'N/A'} | ${hair.style || 'N/A'}

BODY: ${body.type || 'N/A'} | ${body.height || 'N/A'} | ${body.proportions || 'N/A'} | Shoulders:${body.shoulders || 'N/A'} | Waist:${body.waist || 'N/A'} | Hips:${body.hips || 'N/A'} | Legs:${body.legs || 'N/A'} | ${body.posture || 'N/A'} | Breast:${body.breast_size || 'N/A'} | Vulva:${body.vulva_type || 'N/A'}

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
    return await buildSeedreamPrompt({ influencer, scene, camera, isExplicit: true });
  }
}
