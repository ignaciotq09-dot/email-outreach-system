// Email Structure Analyzer Patterns and Constants

// Strong opening indicators
export const STRONG_OPENERS = [
    /^(noticed|saw|came across|read|heard|congratulations)/i,
    /^quick question/i,
    /^(i|we)'ll be (brief|quick)/i,
    /^\{name\}/i,
];

// Weak opening indicators  
export const WEAK_OPENERS = [
    /^(i hope|hope this|i wanted to|my name is)/i,
    /^(hello|hi|hey|dear|good morning|good afternoon)/i,
    /^(i'm reaching out|i am reaching out|i'm writing|i am writing)/i,
];

// Value proposition indicators
export const VALUE_INDICATORS = [
    /help (you|your)/i,
    /enable you/i,
    /increase your/i,
    /reduce your/i,
    /save you/i,
    /improve your/i,
    /so you can/i,
    /which means/i,
];

// Social proof patterns
export const SOCIAL_PROOF_PATTERNS = [
    /companies like/i,
    /teams like yours/i,
    /similar to/i,
    /\d+%/,
    /\d+x/,
    /(increased|improved|grew|reduced) (by|to)/i,
];

// CTA patterns
export const QUESTION_CTA = /\?$/;
export const SPECIFIC_TIME_CTA = /\d+\s*(min|minute|mins|minutes)/i;
export const LOW_FRICTION_PHRASES = [/worth a/i, /open to/i, /interested in/i, /make sense/i, /sound good/i];

// Sign-off patterns
export const SIGN_OFFS = {
    formal: ['best regards', 'sincerely', 'respectfully', 'kind regards', 'warmly'],
    casual: ['cheers', 'thanks', 'best', 'later', 'talk soon'],
    professional: ['thank you', 'looking forward', 'appreciate it', 'let me know'],
};
