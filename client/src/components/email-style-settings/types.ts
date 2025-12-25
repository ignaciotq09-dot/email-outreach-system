// Types and constants for email style settings

import type { UserEmailPersonalization, UserEmailPersona, UserVoiceSample } from "@shared/schema";

export interface PersonalizationResponse {
    exists: boolean;
    personalization: UserEmailPersonalization;
}

export interface PersonasResponse {
    personas: UserEmailPersona[];
}

export interface VoiceSamplesResponse {
    samples: UserVoiceSample[];
}

export interface VoicePatternsResponse {
    hasPatterns: boolean;
    patterns: {
        averageSentenceLength: number;
        commonPhrases: string[];
        greetingStyle: string;
        closingStyle: string;
        punctuationStyle: string;
        formalityScore: number;
        warmthScore: number;
        keyCharacteristics: string[];
    } | null;
    samplesCount?: number;
}

export const HELPER_PROMPTS = [
    "Write casually, like I'm texting a friend",
    "Be direct and get to the point quickly",
    "Use short sentences and simple words",
    "Always ask a question at the end",
    "Reference their company specifically",
    "Sound confident but not arrogant",
    "Keep emails under 100 words",
    "Use data and numbers when relevant",
];

export function getToneLabel(value: number, type: string): string {
    if (type === "formality") {
        if (value <= 3) return "Casual";
        if (value <= 6) return "Balanced";
        return "Formal";
    }
    if (type === "warmth") {
        if (value <= 3) return "Neutral";
        if (value <= 6) return "Friendly";
        return "Very Warm";
    }
    if (type === "directness") {
        if (value <= 3) return "Subtle";
        if (value <= 6) return "Clear";
        return "Very Direct";
    }
    return String(value);
}

// Re-export schema types for convenience
export type { UserEmailPersonalization, UserEmailPersona, UserVoiceSample };
