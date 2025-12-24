import { buildHotWanPrompt, WAN_NEGATIVE_PROMPT, PROMPT_LIMITS } from './promptUtils';

export { PROMPT_LIMITS };

export const HOT_NEGATIVE_PROMPT = WAN_NEGATIVE_PROMPT;

export function buildHotWanQuizPrompt(quizAnswers) {
  const { actionText, environmentText, translations } = quizAnswers;

  const finalActionText = translations?.actionText || actionText;
  const finalEnvironmentText = translations?.environmentText || environmentText;

  return buildHotWanPrompt(finalActionText, finalEnvironmentText);
}

export function buildHotWanPayload(quizAnswers, imageUrl) {
  const prompt = buildHotWanQuizPrompt(quizAnswers);

  return {
    duration: quizAnswers.duration.toString(),
    resolution: quizAnswers.resolution,
    enable_prompt_expansion: false,
    image_url: imageUrl,
    negative_prompt: HOT_NEGATIVE_PROMPT,
    prompt: prompt,
  };
}
