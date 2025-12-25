import { supabase } from '../lib/supabase';
import { getBodyMarksAsText } from './identityTranslationService';

const MAX_FIELD_LENGTH = 300;

export async function getMorphyHotSuggestion(field, influencerName, influencerAge, currentValue = '', sceneContext = {}, bodyMarks = null) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-hot-suggest`;

  const bodyMarksText = bodyMarks ? getBodyMarksAsText(bodyMarks) : '';

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
      maxChars: MAX_FIELD_LENGTH
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
