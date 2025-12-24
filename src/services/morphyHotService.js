import { supabase } from '../lib/supabase';
import { getBodyMarksAsText } from './identityTranslationService';

// SeeDream limit is 3000 chars
const MAX_SEEDREAM_PROMPT = 3000;

// Estimate base template size (identity + structure)
const BASE_TEMPLATE_SIZE = 800; // Conservative estimate

// Estimate field overhead (labels, formatting)
const FIELD_OVERHEAD = {
  scene_context: 20,  // "SCENE: "
  environment: 20,    // "ENV: "
  wardrobe: 20,       // "WARDROBE: "
  action_pose: 20,    // "ACTION: "
  expression_attitude: 20, // "EXPRESSION: "
  additional_notes: 20  // "NOTES: "
};

function calculateAvailableSpace(field, sceneContext = {}) {
  // Start with max available for user content
  let available = MAX_SEEDREAM_PROMPT - BASE_TEMPLATE_SIZE;

  // Subtract space already used by filled fields
  for (const [key, value] of Object.entries(sceneContext)) {
    if (value && value.trim() && key !== field) {
      available -= (value.length + (FIELD_OVERHEAD[key] || 20));
    }
  }

  // Subtract space for the current field's overhead
  available -= (FIELD_OVERHEAD[field] || 20);

  // Reserve space for remaining empty fields (estimate 150 chars each)
  const totalFields = 6; // scene_context, environment, wardrobe, action_pose, expression_attitude, additional_notes
  const filledFields = Object.values(sceneContext).filter(v => v && v.trim()).length;
  const remainingFields = Math.max(0, totalFields - filledFields - 1); // -1 for current field
  available -= (remainingFields * 150);

  // Ensure minimum and maximum
  return Math.max(100, Math.min(available, 600));
}

export async function getMorphyHotSuggestion(field, influencerName, influencerAge, currentValue = '', sceneContext = {}, bodyMarks = null) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-hot-suggest`;

  const bodyMarksText = bodyMarks ? getBodyMarksAsText(bodyMarks) : '';

  // Calculate available space for this field
  const maxChars = calculateAvailableSpace(field, sceneContext);

  console.log(`📏 Available space for ${field}: ${maxChars} chars`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      field,
      influencerName,
      influencerAge,
      currentValue,
      sceneContext,
      bodyMarks: bodyMarksText,
      maxChars
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao obter sugestão do Morphy Hot');
  }

  const data = await response.json();
  return data.suggestion;
}

export async function translateToEnglish(text) {
  if (!text || text.trim() === '') {
    return '';
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-hot-translate`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao traduzir texto');
  }

  const data = await response.json();
  return data.translation;
}
