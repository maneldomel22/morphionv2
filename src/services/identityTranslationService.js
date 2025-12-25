import { supabase } from '../lib/supabase';

export async function translateText(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return text;
  }

  try {
    const { data, error } = await supabase.functions.invoke('morphy-hot-translate', {
      body: { text: text.trim() }
    });

    if (error) {
      console.error('Translation error:', error);
      return text;
    }

    return data?.translation || text;
  } catch (err) {
    console.error('Translation service error:', err);
    return text;
  }
}

export async function translateIdentityProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }

  const translated = JSON.parse(JSON.stringify(profile));

  const translateObject = async (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const result = { ...obj };

    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string' && value.trim()) {
        result[key] = await translateText(value);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          result[key] = await Promise.all(value.map(async (item) => {
            if (typeof item === 'object') {
              return await translateObject(item);
            }
            return typeof item === 'string' ? await translateText(item) : item;
          }));
        } else {
          result[key] = await translateObject(value);
        }
      }
    }

    return result;
  };

  if (translated.face) {
    translated.face = await translateObject(translated.face);
  }

  if (translated.hair) {
    translated.hair = await translateObject(translated.hair);
  }

  if (translated.body) {
    translated.body = await translateObject(translated.body);
  }

  if (translated.skin) {
    translated.skin = await translateObject(translated.skin);
  }

  if (translated.body_marks) {
    translated.body_marks = await translateObject(translated.body_marks);
  }

  if (translated.distinctive_marks) {
    translated.distinctive_marks = await translateObject(translated.distinctive_marks);
  }

  if (translated.style && typeof translated.style === 'string') {
    translated.style = await translateText(translated.style);
  }

  return translated;
}

export function getBodyMarksAsText(bodyMarks) {
  if (!bodyMarks || typeof bodyMarks !== 'object') return '';

  const parts = [];

  if (bodyMarks.tattoos && Array.isArray(bodyMarks.tattoos) && bodyMarks.tattoos.length > 0) {
    const tattooDescs = bodyMarks.tattoos.map(t => {
      const desc = [];
      if (t.size) desc.push(t.size);
      if (t.style) desc.push(t.style);
      if (t.location) desc.push(`on ${t.location}`);
      return desc.join(' ');
    });
    parts.push(`Tattoos: ${tattooDescs.join('; ')}`);
  }

  if (bodyMarks.moles && Array.isArray(bodyMarks.moles) && bodyMarks.moles.length > 0) {
    const locations = bodyMarks.moles.map(m => m.location).filter(Boolean);
    if (locations.length > 0) {
      parts.push(`Moles on: ${locations.join(', ')}`);
    }
  }

  if (bodyMarks.scars && Array.isArray(bodyMarks.scars) && bodyMarks.scars.length > 0) {
    const scarDescs = bodyMarks.scars.map(s => {
      const desc = [];
      if (s.visibility) desc.push(s.visibility);
      desc.push('scar');
      if (s.location) desc.push(`on ${s.location}`);
      return desc.join(' ');
    });
    parts.push(`Scars: ${scarDescs.join('; ')}`);
  }

  return parts.join(' | ');
}

export function getPhysicalProfileAsText(identityProfile) {
  if (!identityProfile || typeof identityProfile !== 'object') return '';

  const parts = [];

  if (identityProfile.body) {
    const body = identityProfile.body;
    const bodyParts = [];

    if (body.body_type) bodyParts.push(`Tipo de corpo: ${body.body_type}`);
    if (body.breast_size) bodyParts.push(`Tamanho dos peitos: ${body.breast_size}`);
    if (body.breast_shape) bodyParts.push(`Formato dos peitos: ${body.breast_shape}`);
    if (body.butt_size) bodyParts.push(`Tamanho da bunda: ${body.butt_size}`);
    if (body.butt_shape) bodyParts.push(`Formato da bunda: ${body.butt_shape}`);
    if (body.waist) bodyParts.push(`Cintura: ${body.waist}`);
    if (body.hips) bodyParts.push(`Quadril: ${body.hips}`);
    if (body.muscle_tone) bodyParts.push(`Tônus muscular: ${body.muscle_tone}`);

    if (bodyParts.length > 0) {
      parts.push(bodyParts.join(', '));
    }
  }

  if (identityProfile.body_marks) {
    const marks = getBodyMarksAsText(identityProfile.body_marks);
    if (marks) parts.push(marks);
  }

  return parts.join(' | ');
}
