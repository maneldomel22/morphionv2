import { supabase } from '../lib/supabase';

export const autopilotService = {
  async analyzeContext(autopilotData) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-analyze`;

      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        description: autopilotData.description,
        characterImageUrl: autopilotData.characterImage,
        productImageUrl: autopilotData.productImage,
        duration: autopilotData.duration || 15
      };

      console.log('Sending to Morphy:', payload);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze context');
      }

      const data = await response.json();

      if (!data.success || !data.analysis) {
        throw new Error('Invalid response from analysis service');
      }

      return {
        summary: data.analysis.summary,
        dialogue: data.analysis.dialogue,
        confidence: data.analysis.confidence,
        raw: data.raw
      };
    } catch (error) {
      console.error('Error in analyzeContext:', error);
      throw error;
    }
  },

  async generateAutopilot(autopilotData) {
    const analysis = await this.analyzeContext(autopilotData);

    const result = {
      avatar: {
        name: 'Personagem',
        appearance: analysis.summary.character,
        personality: analysis.summary.tone
      },
      style: {
        name: analysis.summary.videoStyle,
        reason: analysis.summary.observations
      },
      dialogue: analysis.dialogue,
      summary: {
        type: analysis.summary.videoStyle,
        tone: analysis.summary.tone,
        approach: analysis.summary.scenario,
        duration: `${autopilotData.duration || 15}s`,
        productAction: analysis.summary.productAction,
        language: analysis.summary.language,
        observations: analysis.summary.observations
      },
      confidence: analysis.confidence
    };

    return result;
  },

  async generateDialogueSuggestions(context) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/morphy-suggest`;

      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const payload = {
        language: 'Português (Brasil)',
        style: context.style || 'natural',
        duration: context.duration || 15,
        dialogueIdea: context.dialogue,
        tone: context.tone || 'conversational'
      };

      if (context.avatar) {
        payload.avatar = context.avatar;
      }

      if (context.product) {
        payload.product = context.product;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }

      const data = await response.json();

      if (!data.success || !data.suggestions) {
        throw new Error('Invalid response from suggestions service');
      }

      return data.suggestions.map((text, index) => ({
        id: index + 1,
        title: `Variação ${index + 1}`,
        text
      }));
    } catch (error) {
      console.error('Error in generateDialogueSuggestions:', error);
      throw error;
    }
  }
};
