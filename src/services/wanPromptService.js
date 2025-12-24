import { buildWanPrompt, WAN_NEGATIVE_PROMPT, PROMPT_LIMITS } from './promptUtils';

export { PROMPT_LIMITS, WAN_NEGATIVE_PROMPT };

export function buildWanQuizPrompt(quizAnswers) {
  const { actionText, environmentText } = quizAnswers;
  return buildWanPrompt(actionText, environmentText);
}

export function buildWanQuizPayload(quizAnswers, imageUrl) {
  const prompt = buildWanQuizPrompt(quizAnswers);

  return {
    duration: quizAnswers.duration.toString(),
    resolution: quizAnswers.resolution,
    enable_prompt_expansion: false,
    image_url: imageUrl,
    negative_prompt: WAN_NEGATIVE_PROMPT,
    prompt: prompt,
  };
}
