import { supabase } from '../lib/supabase';

export const morphyService = {
  async getConversations(isBadMode = false) {
    const { data, error } = await supabase
      .from('morphy_conversations')
      .select('*')
      .eq('is_bad_mode', isBadMode)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('morphy_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async sendMessage({ conversationId, message, language = 'pt-BR', style = 'natural', tone = 'conversational', duration = 15, isBadMode = false }) {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          conversationId,
          message,
          language,
          style,
          tone,
          duration,
          isBadMode
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar sugestões');
    }

    return await response.json();
  },

  async getSuggestions({ language, style, duration, avatar, product, scenario, tone, dialogueIdea }) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-suggest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          language,
          style,
          duration,
          avatar,
          product,
          scenario,
          tone,
          dialogueIdea
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar sugestões');
    }

    return await response.json();
  },

  async deleteConversation(conversationId) {
    const { error } = await supabase
      .from('morphy_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  async generatePrompt({ engine, mode, type, influencer, userInput, quizAnswers, imageUrl, duration }) {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-generate-prompt`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          engine,
          mode,
          type,
          influencer,
          userInput,
          quizAnswers,
          imageUrl,
          duration
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar prompt');
    }

    return await response.json();
  },

  async createPost({ influencer, mode, type, count = 1, userIdea }) {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-create-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          influencer,
          mode,
          type,
          count,
          userIdea
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar post');
    }

    return await response.json();
  },

  async transformError({ error, context, errorCode, operation }) {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-error-message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          error,
          context,
          errorCode,
          operation
        })
      }
    );

    if (!response.ok) {
      return {
        success: true,
        message: 'Ops, algo deu errado. Tenta de novo?',
        suggestion: 'Se o problema persistir, recarrega a página.',
        canRetry: true
      };
    }

    return await response.json();
  },

  async generateVariations({ baseVideo, variationConfig }) {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-generate-variations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          baseVideo,
          variationConfig
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao gerar variações');
    }

    return await response.json();
  }
};
