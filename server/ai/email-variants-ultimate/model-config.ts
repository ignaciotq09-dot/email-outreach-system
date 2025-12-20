import type { ModelConfig, SentenceCounts } from "./types";

export function selectModelConfig(inputWords: number, isRegeneration: boolean = false): ModelConfig {
  if (isRegeneration) return { model: "gpt-4o", maxTokens: 3000, temperature: 0.75, presencePenalty: 0.15, frequencyPenalty: 0.1 };
  if (inputWords <= 30) return { model: "gpt-4o-mini", maxTokens: 2000, temperature: 0.75, presencePenalty: 0.15, frequencyPenalty: 0.1 };
  if (inputWords <= 60) return { model: "gpt-4o", maxTokens: 2400, temperature: 0.75, presencePenalty: 0.15, frequencyPenalty: 0.1 };
  return { model: "gpt-4o", maxTokens: 3000, temperature: 0.75, presencePenalty: 0.15, frequencyPenalty: 0.1 };
}

export function getSentenceCounts(inputWords: number): SentenceCounts {
  if (inputWords <= 12) return { tier: "MINIMAL", ultra: "2-3", warm: "3-4", value: "3-4" };
  if (inputWords <= 25) return { tier: "SHORT", ultra: "3-4", warm: "4-5", value: "4-5" };
  if (inputWords <= 50) return { tier: "MEDIUM", ultra: "4-5", warm: "5-6", value: "5-6" };
  if (inputWords <= 80) return { tier: "DETAILED", ultra: "5-6", warm: "6-7", value: "6-7" };
  return { tier: "COMPREHENSIVE", ultra: "6-7", warm: "7-8", value: "7-8" };
}
