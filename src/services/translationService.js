import { supabase } from '../lib/supabase';

export const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷', name: 'Brazilian Portuguese' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', name: 'American English' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸', name: 'Spanish' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷', name: 'French' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪', name: 'German' },
  { code: 'it-IT', label: 'Italiano', flag: '🇮🇹', name: 'Italian' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵', name: 'Japanese' },
  { code: 'ko-KR', label: '한국어', flag: '🇰🇷', name: 'Korean' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳', name: 'Simplified Chinese' },
  { code: 'ru-RU', label: 'Русский', flag: '🇷🇺', name: 'Russian' }
];

export const translationService = {
  async translateDialogue(text, targetLanguage, context = '') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-dialogue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            targetLanguage,
            context
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Translation failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  },

  getLanguageByCode(code) {
    return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
  },

  getLanguageName(code) {
    const language = this.getLanguageByCode(code);
    return language.name;
  },

  getLanguageLabel(code) {
    const language = this.getLanguageByCode(code);
    return language.label;
  },

  getDefaultLanguage() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return savedLanguage || 'pt-BR';
  },

  setDefaultLanguage(code) {
    localStorage.setItem('preferredLanguage', code);
  }
};
