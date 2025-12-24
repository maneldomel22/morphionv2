/**
 * Identity Profile Formatter
 *
 * Converts identity_profile JSONB objects into human-readable strings
 * for display in the UI.
 */

/**
 * Formats the face object into a readable string
 * @param {Object} face - Face object with ethnicity, skin_tone, eyes, etc.
 * @returns {string}
 */
function formatFace(face) {
  if (!face || typeof face !== 'object') return String(face || '');

  const parts = [];

  if (face.ethnicity) parts.push(face.ethnicity);
  if (face.skin_tone) {
    let skinText = face.skin_tone;
    if (face.skin_tone_detail) skinText += ` (${face.skin_tone_detail})`;
    parts.push(skinText);
  }

  if (face.eyes) {
    if (typeof face.eyes === 'object') {
      const eyeParts = [];
      if (face.eyes.color) eyeParts.push(`olhos ${face.eyes.color}`);
      if (face.eyes.shape) eyeParts.push(face.eyes.shape);
      if (eyeParts.length > 0) parts.push(eyeParts.join(', '));
    } else {
      parts.push(String(face.eyes));
    }
  }

  if (face.face_shape) parts.push(`rosto ${face.face_shape}`);
  if (face.nose) parts.push(`nariz ${face.nose}`);
  if (face.lips) parts.push(`lábios ${face.lips}`);
  if (face.base_expression) parts.push(`expressão ${face.base_expression}`);

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Formats the hair object into a readable string
 * @param {Object} hair - Hair object with color, style, length, texture
 * @returns {string}
 */
function formatHair(hair) {
  if (!hair || typeof hair !== 'object') return String(hair || '');

  const parts = [];

  if (hair.color) parts.push(hair.color);
  if (hair.length) parts.push(hair.length);
  if (hair.texture) parts.push(hair.texture);
  if (hair.style) parts.push(hair.style);

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Formats the body object into a readable string
 * @param {Object} body - Body object with type, height, proportions, etc.
 * @returns {string}
 */
function formatBody(body) {
  if (!body || typeof body !== 'object') return String(body || '');

  const parts = [];

  if (body.type) parts.push(body.type);
  if (body.height) parts.push(body.height);
  if (body.proportions) parts.push(body.proportions);

  const details = [];
  if (body.shoulders) details.push(`ombros ${body.shoulders}`);
  if (body.waist) details.push(`cintura ${body.waist}`);
  if (body.hips) details.push(`quadris ${body.hips}`);
  if (body.legs) details.push(`pernas ${body.legs}`);

  if (details.length > 0) parts.push(details.join(', '));
  if (body.posture) parts.push(`postura ${body.posture}`);

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Formats the skin object into a readable string
 * @param {Object} skin - Skin object or string
 * @returns {string}
 */
function formatSkin(skin) {
  if (!skin) return '';
  if (typeof skin !== 'object') return String(skin);

  const parts = [];
  if (skin.tone) parts.push(skin.tone);
  if (skin.texture) parts.push(skin.texture);
  if (skin.detail) parts.push(skin.detail);

  return parts.length > 0 ? parts.join(', ') : '';
}

/**
 * Formats body marks (tattoos, moles, scars) into a readable string
 * @param {Object} bodyMarks - Body marks object with arrays
 * @returns {string}
 */
function formatBodyMarks(bodyMarks) {
  if (!bodyMarks || typeof bodyMarks !== 'object') return String(bodyMarks || '');

  const parts = [];

  if (bodyMarks.tattoos && Array.isArray(bodyMarks.tattoos) && bodyMarks.tattoos.length > 0) {
    const tattooDescs = bodyMarks.tattoos.map((t, index) => {
      const desc = [];

      if (t.location) {
        desc.push(t.location);
      }

      const details = [];
      if (t.size) details.push(t.size);
      if (t.style) details.push(t.style);

      if (details.length > 0) {
        desc.push(`(${details.join(', ')})`);
      }

      return desc.join(' ');
    });

    if (bodyMarks.tattoos.length === 1) {
      parts.push(`Tatuagem: ${tattooDescs[0]}`);
    } else {
      const formattedList = tattooDescs.map((desc, idx) => `${idx + 1}. ${desc}`).join(' | ');
      parts.push(`Tatuagens: ${formattedList}`);
    }
  }

  if (bodyMarks.moles && Array.isArray(bodyMarks.moles) && bodyMarks.moles.length > 0) {
    const locations = bodyMarks.moles.map(m => m.location).filter(Boolean);
    if (locations.length > 0) {
      parts.push(`Pintas em: ${locations.join(', ')}`);
    }
  }

  if (bodyMarks.scars && Array.isArray(bodyMarks.scars) && bodyMarks.scars.length > 0) {
    const scarDescs = bodyMarks.scars.map(s => {
      const desc = [];
      if (s.visibility) desc.push(s.visibility);
      desc.push('cicatriz');
      if (s.location) desc.push(`em ${s.location}`);
      return desc.join(' ');
    });
    parts.push(`Cicatrizes: ${scarDescs.join('; ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : '';
}

/**
 * Main formatter function that handles any identity_profile field
 * @param {string} fieldName - Name of the field (face, hair, body, etc.)
 * @param {any} fieldValue - Value of the field
 * @returns {string}
 */
export function formatIdentityField(fieldName, fieldValue) {
  if (!fieldValue) return '';

  // If it's already a string, return it
  if (typeof fieldValue === 'string') return fieldValue;

  // If it's not an object, convert to string
  if (typeof fieldValue !== 'object') return String(fieldValue);

  // Route to specific formatters based on field name
  switch (fieldName) {
    case 'face':
      return formatFace(fieldValue);
    case 'hair':
      return formatHair(fieldValue);
    case 'body':
      return formatBody(fieldValue);
    case 'skin':
      return formatSkin(fieldValue);
    case 'body_marks':
    case 'distinctive_marks':
      return formatBodyMarks(fieldValue);
    default:
      // Generic object formatter
      return Object.entries(fieldValue)
        .filter(([_, v]) => v != null && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
  }
}

/**
 * Formats the entire identity_profile object for display
 * @param {Object} identityProfile - Complete identity_profile JSONB object
 * @returns {Object} Object with formatted fields
 */
export function formatIdentityProfile(identityProfile) {
  if (!identityProfile || typeof identityProfile !== 'object') {
    return {};
  }

  return {
    face: formatIdentityField('face', identityProfile.face),
    hair: formatIdentityField('hair', identityProfile.hair),
    body: formatIdentityField('body', identityProfile.body),
    skin: formatIdentityField('skin', identityProfile.skin),
    bodyMarks: formatIdentityField('body_marks', identityProfile.body_marks),
    distinctiveMarks: formatIdentityField('distinctive_marks', identityProfile.distinctive_marks),
    style: identityProfile.style || ''
  };
}
