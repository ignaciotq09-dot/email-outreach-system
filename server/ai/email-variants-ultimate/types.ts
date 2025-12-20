import type { EmailPreferences, UserEmailPersonalization, UserEmailPersona } from "@shared/schema";
import type { ExtractedPatterns } from "../voice-analyzer";

export interface PersonalizationOptions {
  personalization?: UserEmailPersonalization | null;
  voicePatterns?: ExtractedPatterns | null;
  persona?: UserEmailPersona | null;
  editPatterns?: { commonRemovals: string[]; commonAdditions: string[]; lengthPreference: "shorter" | "longer" | "same"; formalityAdjustment: number } | null;
}

export interface SimplePersonalization {
  userInstructions: string | null;
  favoriteEmailSamples: string | null;
  toneFormality: number;
  toneWarmth: number;
  toneDirectness: number;
}

export interface QualityScore {
  readability: number;
  sentenceVariety: number;
  youFocusRatio: number;
  spamScore: number;
  hookStrength: number;
  ctaClarity: number;
  overall: number;
}

export interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

export interface SentenceCounts {
  tier: string;
  ultra: string;
  warm: string;
  value: string;
}

export interface CacheEntry {
  variants: import("../openai-client").EmailVariant[];
  scores: QualityScore[];
  createdAt: number;
  hits: number;
}

export interface GenerationResult {
  variants: import("../openai-client").EmailVariant[];
  scores: QualityScore[];
  meta: { model: string; inputWords: number; tier: string; duration: number; cached: boolean; retried: boolean };
}
