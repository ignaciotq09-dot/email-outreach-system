// Subject Line Optimizer Patterns and Constants

// Hook type patterns
export const HOOK_PATTERNS = {
    question: { patterns: [/\?$/], name: 'Question', boost: '+44%' },
    number: { patterns: [/\d+/], name: 'Number/Statistic', boost: '+57%' },
    curiosity: { patterns: [/secret|discover|revealed|truth|why/i], name: 'Curiosity Gap', boost: '+38%' },
    personalization: { patterns: [/\{|\[/], name: 'Personalization Token', boost: '+26%' },
    howTo: { patterns: [/^how to/i, /^how i/i], name: 'How-To', boost: '+32%' },
    list: { patterns: [/^\d+\s+(ways?|tips?|steps?|things?|reasons?)/i], name: 'List Format', boost: '+45%' },
    urgency: { patterns: [/today|now|deadline|last chance|limited/i], name: 'Urgency', boost: '+22%' },
    exclusive: { patterns: [/exclusive|invite|private|vip|only you/i], name: 'Exclusivity', boost: '+14%' },
};

// Emotional triggers with their typical effectiveness
export const EMOTIONAL_TRIGGERS = {
    fear: { words: ['miss', 'missing', 'losing', 'behind', 'risk', 'danger', 'avoid', 'never'], boost: '+22%' },
    excitement: { words: ['breakthrough', 'amazing', 'incredible', 'finally', 'announcing', 'new'], boost: '+18%' },
    curiosity: { words: ['secret', 'revealed', 'truth', 'discover', 'unknown', 'hidden', 'why'], boost: '+35%' },
    greed: { words: ['save', 'free', 'bonus', 'discount', 'deal', 'value', 'profit'], boost: '+15%' },
    pride: { words: ['exclusive', 'selected', 'elite', 'top', 'best', 'winner', 'chosen'], boost: '+12%' },
};

// Spam trigger words to avoid
export const SPAM_TRIGGERS = [
    { word: 'free', risk: 'high', alternative: 'complimentary or no-cost' },
    { word: 'guarantee', risk: 'high', alternative: 'promise or ensure' },
    { word: 'no obligation', risk: 'high', alternative: 'no commitment' },
    { word: 'winner', risk: 'high', alternative: 'selected' },
    { word: 'congratulations', risk: 'high', alternative: 'great news' },
    { word: 'act now', risk: 'high', alternative: 'take a look' },
    { word: 'limited time', risk: 'high', alternative: 'this week' },
    { word: 'click here', risk: 'high', alternative: 'learn more' },
    { word: 'buy now', risk: 'high', alternative: 'check it out' },
    { word: 'order now', risk: 'high', alternative: 'see details' },
    { word: 'urgent', risk: 'medium', alternative: 'important' },
    { word: 'amazing', risk: 'medium', alternative: 'impressive' },
    { word: 'incredible', risk: 'medium', alternative: 'notable' },
    { word: 'unbelievable', risk: 'medium', alternative: 'remarkable' },
    { word: '100%', risk: 'medium', alternative: 'fully' },
    { word: "don't miss", risk: 'medium', alternative: 'worth seeing' },
];

// Format detection patterns
export const ALL_CAPS_PATTERN = /[A-Z]{4,}/;
export const EXCESSIVE_PUNCT_PATTERN = /[!?]{2,}/;
