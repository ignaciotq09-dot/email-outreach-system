// Best Practices Analyzer Patterns and Constants

// Complex words (3+ syllables) that reduce readability
export const COMPLEX_WORDS = [
    'implementation', 'functionality', 'optimization', 'infrastructure', 'methodology',
    'comprehensive', 'nevertheless', 'accordingly', 'subsequently', 'notwithstanding',
    'aforementioned', 'hereinafter', 'respectively', 'alternatively', 'approximately',
    'significantly', 'unfortunately', 'additionally', 'furthermore', 'consequently',
];

// Formal/stiff phrases to avoid
export const FORMAL_PHRASES = [
    { phrase: 'as per our conversation', alternative: 'as we discussed' },
    { phrase: 'please find attached', alternative: "I've attached" },
    { phrase: 'at your earliest convenience', alternative: 'when you can' },
    { phrase: 'do not hesitate to', alternative: 'feel free to' },
    { phrase: 'kindly', alternative: 'please' },
    { phrase: 'in regards to', alternative: 'about' },
    { phrase: 'in reference to', alternative: 'about' },
    { phrase: 'pursuant to', alternative: 'following' },
    { phrase: 'hereby', alternative: '(remove)' },
    { phrase: 'herewith', alternative: '(remove)' },
    { phrase: 'leveraging', alternative: 'using' },
    { phrase: 'utilizing', alternative: 'using' },
    { phrase: 'synergize', alternative: 'work together' },
    { phrase: 'paradigm', alternative: 'model or approach' },
    { phrase: 'circle back', alternative: 'follow up' },
];

// Passive voice patterns
export const PASSIVE_PATTERNS = [
    /\b(is|are|was|were|been|being)\s+\w+ed\b/i,
    /\b(has|have|had)\s+been\s+\w+ed\b/i,
];
