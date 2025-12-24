import { supabase } from '../lib/supabase';

export const authService = {
  async createProfile(userId, email, fullName) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email: email,
        full_name: fullName,
        credits: 100
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};

export const getErrorMessage = (error) => {
  const errorMessages = {
    'Invalid login credentials': 'Email ou senha inválidos',
    'User already registered': 'Essa conta já existe',
    'Email not confirmed': 'Confirme seu email antes de fazer login',
    'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
    'Unable to validate email address': 'Email inválido',
    'Session expired': 'Sua sessão expirou. Faça login novamente.',
    'Network error': 'Erro de conexão. Tente novamente.'
  };

  return errorMessages[error.message] || error.message || 'Ocorreu um erro. Tente novamente.';
};
