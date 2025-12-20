import type { ToneValues, ToneGuidance } from "./types";
import { FORMALITY_RULEBOOK } from "./formality-rules";
import { WARMTH_RULEBOOK } from "./warmth-rules";
import { DIRECTNESS_RULEBOOK } from "./directness-rules";
import { VARIANT_DIVERSITY_RULEBOOK } from "./diversity-rules";

function getGuidanceForLevel(level: number, rulebook: Record<number, string | null>): string | null {
  const clampedLevel = Math.max(1, Math.min(10, Math.round(level)));
  return rulebook[clampedLevel] ?? null;
}

export function translateDiversityToGuidance(diversityValue: number): string {
  const clampedLevel = Math.max(1, Math.min(10, Math.round(diversityValue)));
  return VARIANT_DIVERSITY_RULEBOOK[clampedLevel];
}

export function translateToneToGuidance(toneValues: ToneValues): ToneGuidance {
  return {
    formality: getGuidanceForLevel(toneValues.formality, FORMALITY_RULEBOOK),
    warmth: getGuidanceForLevel(toneValues.warmth, WARMTH_RULEBOOK),
    directness: getGuidanceForLevel(toneValues.directness, DIRECTNESS_RULEBOOK),
  };
}

export function hasActivePersonalization(userInstructions: string | null, toneValues: ToneValues): boolean {
  if (userInstructions && userInstructions.trim().length > 0) return true;
  const guidance = translateToneToGuidance(toneValues);
  return !!(guidance.formality || guidance.warmth || guidance.directness);
}
