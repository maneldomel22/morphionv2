import { supabase } from '../lib/supabase';

export async function improveSafePrompt(description, options = {}) {
  if (!description || description.trim() === '') {
    throw new Error('Descrição é obrigatória');
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-safe-suggest`;

  const payload = {
    description,
    characterImageUrl: options.characterImageUrl || null,
    productImageUrl: options.productImageUrl || null,
    aspectRatio: options.aspectRatio || '4:5'
  };

  console.log('📝 Calling morphy-safe-suggest with:', {
    descriptionLength: description.length,
    hasCharacterImage: !!payload.characterImageUrl,
    hasProductImage: !!payload.productImageUrl,
    aspectRatio: payload.aspectRatio
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao melhorar prompt com Morphy');
  }

  const data = await response.json();

  if (!data.success || !data.prompt) {
    throw new Error('Resposta inválida do Morphy');
  }

  console.log('✅ Enhanced prompt received:', data.prompt.substring(0, 150) + '...');
  console.log('📏 Prompt length:', data.prompt.length, 'chars');

  return data.prompt;
}
