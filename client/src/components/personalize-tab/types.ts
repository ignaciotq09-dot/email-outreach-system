// Types and constants for personalize tab

export interface PersonalizationSettings {
    personalInstructions: string | null;
    favoriteEmailSamples: string | null;
    toneFormality: number;
    toneWarmth: number;
    toneDirectness: number;
    variantDiversity: number;
    isEnabled: boolean;
}

export const QUICK_ADD_SUGGESTIONS = [
    "Keep it under 5 sentences",
    "Don't start with 'I hope this finds you well'",
    "Sound like a human, not a marketer",
    "End with one clear ask",
    "Avoid exclamation marks",
    "Get to the point in the first sentence",
    "Ask a question to invite a reply",
    "No corporate buzzwords or jargon",
    "Use their first name naturally",
    "Keep paragraphs to 2-3 sentences",
    "Don't apologize for reaching out",
    "Be specific about why you're emailing them",
];

export function getDiversityLabel(value: number): string {
    if (value <= 3) return "Similar variants";
    if (value <= 6) return "Moderate variety";
    return "Very different";
}
