/**
 * Client-side tone descriptions for real-time UI feedback
 * Mirrors the server-side rulebook descriptions for consistency
 */

export interface ToneLevel {
    level: number;
    name: string;
    description: string;
    example?: string;
}

// Formality levels (1-10)
export const FORMALITY_DESCRIPTIONS: Record<number, ToneLevel> = {
    1: {
        level: 1,
        name: "Ultra Casual",
        description: "Like texting a close friend",
        example: "Hey! Quick thing - you free Tuesday?"
    },
    2: {
        level: 2,
        name: "Very Casual",
        description: "Like a Slack message to a colleague",
        example: "Hey Sarah! Just wanted to loop you in"
    },
    3: {
        level: 3,
        name: "Casual",
        description: "Friendly email to someone you know",
        example: "Hi Mike, Hope you're doing well!"
    },
    4: {
        level: 4,
        name: "Relaxed",
        description: "Friendly but polished",
        example: "Hi there, Thanks for reaching out"
    },
    5: {
        level: 5,
        name: "Balanced",
        description: "Professional but approachable",
        example: "Hi [Name], I hope this message finds you well"
    },
    6: {
        level: 6,
        name: "Business Casual",
        description: "Standard business communication",
        example: "Hello [Name], Thank you for your time"
    },
    7: {
        level: 7,
        name: "Professional",
        description: "Business email to someone you respect",
        example: "Hello Dr. Smith, Thank you for meeting with me"
    },
    8: {
        level: 8,
        name: "Quite Formal",
        description: "Like a letter to a senior executive",
        example: "Dear Ms. Johnson, I am writing to follow up"
    },
    9: {
        level: 9,
        name: "Very Formal",
        description: "Like a letter to a board of directors",
        example: "Dear Chairman Williams, I am honored to present"
    },
    10: {
        level: 10,
        name: "Ultra Formal",
        description: "Formal diplomatic correspondence",
        example: "Dear Esteemed Members of the Committee"
    }
};

// Warmth levels (1-10)
export const WARMTH_DESCRIPTIONS: Record<number, ToneLevel> = {
    1: {
        level: 1,
        name: "Impersonal",
        description: "Pure clinical detachment",
        example: "The report is attached. Review by Friday."
    },
    2: {
        level: 2,
        name: "Detached",
        description: "Minimal emotional engagement",
        example: "Please find the attached document."
    },
    3: {
        level: 3,
        name: "Reserved",
        description: "Polite but distant",
        example: "Thank you for your email. I'll review shortly."
    },
    4: {
        level: 4,
        name: "Neutral",
        description: "Neither warm nor cold",
        example: "Thanks for sending this over."
    },
    5: {
        level: 5,
        name: "Pleasant",
        description: "Friendly without being personal",
        example: "Thanks for reaching out. Happy to help."
    },
    6: {
        level: 6,
        name: "Friendly",
        description: "Warm and personable",
        example: "Great to hear from you! Let me know how I can help."
    },
    7: {
        level: 7,
        name: "Warm",
        description: "Genuine friendliness",
        example: "Thanks so much! I'd love to help with this."
    },
    8: {
        level: 8,
        name: "Very Warm",
        description: "Obviously caring and supportive",
        example: "I really appreciate you reaching out. This means a lot."
    },
    9: {
        level: 9,
        name: "Deeply Warm",
        description: "Heartfelt, relationship-first",
        example: "It's wonderful to hear from you! I've been thinking of you."
    },
    10: {
        level: 10,
        name: "Effusive",
        description: "Maximum warmth and emotional expression",
        example: "I cannot tell you how thrilled I am to hear from you!"
    }
};

// Directness levels (1-10)
export const DIRECTNESS_DESCRIPTIONS: Record<number, ToneLevel> = {
    1: {
        level: 1,
        name: "Very Indirect",
        description: "Extensive context before the point",
        example: "I hope you're well. I've been reflecting on..."
    },
    2: {
        level: 2,
        name: "Quite Indirect",
        description: "Substantial context first",
        example: "I wanted to share some context on this first..."
    },
    3: {
        level: 3,
        name: "Moderately Indirect",
        description: "Reasonable context before the ask",
        example: "Thanks for your time yesterday. Building on what we discussed..."
    },
    4: {
        level: 4,
        name: "Balanced-Indirect",
        description: "Brief context, then the point",
        example: "Following up on our conversation..."
    },
    5: {
        level: 5,
        name: "Balanced",
        description: "Context and ask equally weighted",
        example: "Quick context, then here's what I'm thinking..."
    },
    6: {
        level: 6,
        name: "Balanced-Direct",
        description: "Point first, context after",
        example: "Here's my ask - and here's why..."
    },
    7: {
        level: 7,
        name: "Fairly Direct",
        description: "Point quickly with minimal preamble",
        example: "Quick ask: can you review this by Thursday?"
    },
    8: {
        level: 8,
        name: "Very Direct",
        description: "Lead with the ask, brief context only",
        example: "Need your approval on the budget. Details attached."
    },
    9: {
        level: 9,
        name: "Extremely Direct",
        description: "State exactly what you need immediately",
        example: "Can you call me in 10 minutes?"
    },
    10: {
        level: 10,
        name: "Ultra Direct",
        description: "Single-sentence precision",
        example: "Call me now."
    }
};

// Helper functions
export function getFormalityDescription(level: number): ToneLevel {
    const clamped = Math.max(1, Math.min(10, Math.round(level)));
    return FORMALITY_DESCRIPTIONS[clamped];
}

export function getWarmthDescription(level: number): ToneLevel {
    const clamped = Math.max(1, Math.min(10, Math.round(level)));
    return WARMTH_DESCRIPTIONS[clamped];
}

export function getDirectnessDescription(level: number): ToneLevel {
    const clamped = Math.max(1, Math.min(10, Math.round(level)));
    return DIRECTNESS_DESCRIPTIONS[clamped];
}
