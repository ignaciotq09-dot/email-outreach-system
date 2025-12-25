// Sales Email Analysis Patterns and Constants
// Extracted from sales-analyzer.ts

// Generic openers that top sales teams avoid
export const GENERIC_OPENERS = [
    'i hope this email finds you well',
    'i hope you are doing well',
    'i wanted to reach out',
    'i am reaching out',
    'i hope you had a great weekend',
    'i hope this finds you in good spirits',
    'i just wanted to touch base',
    'i am following up',
    'my name is',
    'i am writing to',
    'i wanted to introduce myself',
    'hope all is well',
    'i trust this email finds you well',
    'good morning/afternoon',
    'happy monday',
    'happy friday',
];

// Pattern interrupt openers that work well
export const EFFECTIVE_OPENERS = [
    { pattern: 'quick question', type: 'question', boost: 20 },
    { pattern: 'noticed', type: 'observation', boost: 25 },
    { pattern: 'saw your', type: 'observation', boost: 25 },
    { pattern: 'came across', type: 'observation', boost: 20 },
    { pattern: "congrats on", type: 'personalized', boost: 30 },
    { pattern: 'loved your', type: 'personalized', boost: 30 },
    { pattern: 'permission to be blunt', type: 'pattern_interrupt', boost: 15 },
    { pattern: 'not a sales email', type: 'pattern_interrupt', boost: 15 },
    { pattern: 'weird ask', type: 'pattern_interrupt', boost: 12 },
];

// Social proof indicators
export const SOCIAL_PROOF_PATTERNS = [
    { pattern: /\d+%/, type: 'metric' },
    { pattern: /\d+x/, type: 'metric' },
    { pattern: /companies like/i, type: 'similar_company' },
    { pattern: /similar to/i, type: 'similar_company' },
    { pattern: /other \w+ (leaders?|teams?|companies)/i, type: 'similar_company' },
    { pattern: /(increased|improved|reduced|saved|generated)/i, type: 'result' },
    { pattern: /case study/i, type: 'testimonial' },
    { pattern: /for example/i, type: 'example' },
];

// CTA patterns
export const STRONG_CTA_PATTERNS = [
    { pattern: /worth a (\d+|quick|brief) (min|minute)/i, score: 25 },
    { pattern: /\d+ minutes?/i, score: 20 },
    { pattern: /quick call/i, score: 20 },
    { pattern: /open to/i, score: 18 },
    { pattern: /interested in/i, score: 15 },
    { pattern: /would you be against/i, score: 22 },
    { pattern: /does that sound/i, score: 18 },
];

export const WEAK_CTA_PATTERNS = [
    { pattern: /let me know if you have any questions/i, penalty: 10 },
    { pattern: /feel free to reach out/i, penalty: 10 },
    { pattern: /don't hesitate/i, penalty: 8 },
    { pattern: /at your earliest convenience/i, penalty: 12 },
    { pattern: /whenever you get a chance/i, penalty: 10 },
];
