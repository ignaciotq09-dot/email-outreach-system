/**
 * Subject Line Optimizer
 * Advanced subject line analysis and optimization
 * Based on email marketing research and A/B test data
 */

export interface SubjectLineOptimization {
    score: number;
    analysis: {
        length: LengthAnalysis;
        hookType: HookTypeAnalysis;
        emotionalTriggers: EmotionalTriggerAnalysis;
        spamRisk: SpamRiskAnalysis;
        mobilePreview: MobilePreviewAnalysis;
        personalization: PersonalizationAnalysis;
    };
    improvements: SubjectImprovement[];
    suggestions: SuggestedSubject[];
}

export interface LengthAnalysis {
    charCount: number;
    wordCount: number;
    status: 'too_short' | 'optimal' | 'too_long' | 'mobile_optimal';
    mobileVisible: number;
    desktopVisible: number;
}

export interface HookTypeAnalysis {
    detected: string[];
    effective: boolean;
    recommendations: string[];
}

export interface EmotionalTriggerAnalysis {
    triggers: Array<{ type: string; word: string; boost: string }>;
    score: number;
}

export interface SpamRiskAnalysis {
    score: number; // 0 = no risk, 100 = high risk
    triggers: string[];
    recommendations: string[];
}

export interface MobilePreviewAnalysis {
    previewText: string;
    isComplete: boolean;
    recommendations: string[];
}

export interface PersonalizationAnalysis {
    hasTokens: boolean;
    hasName: boolean;
    hasCompany: boolean;
    score: number;
}

export interface SubjectImprovement {
    issue: string;
    suggestion: string;
    impact: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SuggestedSubject {
    text: string;
    hookType: string;
    predictedBoost: string;
}

// Hook type patterns
const HOOK_PATTERNS = {
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
const EMOTIONAL_TRIGGERS = {
    fear: {
        words: ['miss', 'missing', 'losing', 'behind', 'risk', 'danger', 'avoid', 'never'],
        boost: '+22%'
    },
    excitement: {
        words: ['breakthrough', 'amazing', 'incredible', 'finally', 'announcing', 'new'],
        boost: '+18%'
    },
    curiosity: {
        words: ['secret', 'revealed', 'truth', 'discover', 'unknown', 'hidden', 'why'],
        boost: '+35%'
    },
    greed: {
        words: ['save', 'free', 'bonus', 'discount', 'deal', 'value', 'profit'],
        boost: '+15%'
    },
    pride: {
        words: ['exclusive', 'selected', 'elite', 'top', 'best', 'winner', 'chosen'],
        boost: '+12%'
    },
};

// Spam trigger words to avoid
const SPAM_TRIGGERS = [
    // High-risk
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
    // Medium-risk
    { word: 'urgent', risk: 'medium', alternative: 'important' },
    { word: 'amazing', risk: 'medium', alternative: 'impressive' },
    { word: 'incredible', risk: 'medium', alternative: 'notable' },
    { word: 'unbelievable', risk: 'medium', alternative: 'remarkable' },
    { word: '100%', risk: 'medium', alternative: 'fully' },
    { word: 'don\'t miss', risk: 'medium', alternative: 'worth seeing' },
];

// All caps detection
const ALL_CAPS_PATTERN = /[A-Z]{4,}/;

// Excessive punctuation
const EXCESSIVE_PUNCT_PATTERN = /[!?]{2,}/;

/**
 * Analyze subject line length
 */
export function analyzeSubjectLength(subject: string): LengthAnalysis {
    const charCount = subject.length;
    const wordCount = subject.split(/\s+/).length;

    let status: LengthAnalysis['status'] = 'optimal';
    if (charCount < 20) status = 'too_short';
    else if (charCount <= 35) status = 'mobile_optimal';
    else if (charCount <= 60) status = 'optimal';
    else status = 'too_long';

    return {
        charCount,
        wordCount,
        status,
        mobileVisible: Math.min(charCount, 35),
        desktopVisible: Math.min(charCount, 70),
    };
}

/**
 * Analyze hook types in subject line
 */
export function analyzeHookType(subject: string): HookTypeAnalysis {
    const detected: string[] = [];
    const recommendations: string[] = [];
    let effective = false;

    for (const [key, { patterns, name, boost }] of Object.entries(HOOK_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(subject)) {
                detected.push(`${name} (${boost})`);
                effective = true;
                break;
            }
        }
    }

    if (detected.length === 0) {
        recommendations.push('Add a hook: question, number, or curiosity gap');
        recommendations.push('Questions increase open rates by 44%');
    }

    // Check for lowercase (which performs well)
    if (subject === subject.toLowerCase()) {
        detected.push('All lowercase (+32%)');
        effective = true;
    }

    return {
        detected,
        effective,
        recommendations,
    };
}

/**
 * Analyze emotional triggers
 */
export function analyzeEmotionalTriggers(subject: string): EmotionalTriggerAnalysis {
    const lowerSubject = subject.toLowerCase();
    const triggers: Array<{ type: string; word: string; boost: string }> = [];
    let score = 50;

    for (const [emotionType, { words, boost }] of Object.entries(EMOTIONAL_TRIGGERS)) {
        for (const word of words) {
            if (lowerSubject.includes(word)) {
                triggers.push({ type: emotionType, word, boost });
                score += 15;
                break;
            }
        }
    }

    return {
        triggers,
        score: Math.min(100, score),
    };
}

/**
 * Analyze spam risk
 */
export function analyzeSpamRisk(subject: string): SpamRiskAnalysis {
    const lowerSubject = subject.toLowerCase();
    const triggers: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check spam words
    for (const { word, risk, alternative } of SPAM_TRIGGERS) {
        if (lowerSubject.includes(word)) {
            const riskValue = risk === 'high' ? 20 : 10;
            score += riskValue;
            triggers.push(word);
            recommendations.push(`Replace "${word}" with "${alternative}"`);
        }
    }

    // Check formatting issues
    if (ALL_CAPS_PATTERN.test(subject)) {
        score += 25;
        triggers.push('ALL CAPS words');
        recommendations.push('Avoid all-caps words - they trigger spam filters');
    }

    if (EXCESSIVE_PUNCT_PATTERN.test(subject)) {
        score += 20;
        triggers.push('Excessive punctuation');
        recommendations.push('Use single punctuation marks only');
    }

    if (subject.includes('$') || /\$\d+/.test(subject)) {
        score += 15;
        triggers.push('Dollar amounts');
        recommendations.push('Avoid mentioning specific dollar amounts in subject lines');
    }

    return {
        score: Math.min(100, score),
        triggers,
        recommendations,
    };
}

/**
 * Analyze mobile preview
 */
export function analyzeMobilePreview(subject: string): MobilePreviewAnalysis {
    const previewText = subject.substring(0, 35);
    const recommendations: string[] = [];

    const isComplete = subject.length <= 35 || subject.substring(0, 35).includes(' ');

    if (subject.length > 35) {
        recommendations.push(`Only "${previewText}..." visible on mobile`);
        recommendations.push('Put key message in first 35 characters');
    }

    // Check if key content is at beginning
    const firstWord = subject.split(' ')[0]?.toLowerCase() || '';
    if (['the', 'a', 'an', 'our', 'your', 'i'].includes(firstWord)) {
        recommendations.push('Lead with a strong word, not articles or pronouns');
    }

    return {
        previewText: previewText + (subject.length > 35 ? '...' : ''),
        isComplete,
        recommendations,
    };
}

/**
 * Analyze personalization
 */
export function analyzeSubjectPersonalization(subject: string): PersonalizationAnalysis {
    const hasTokens = /\{[^}]+\}|\[[^\]]+\]/.test(subject);
    const hasName = /\{(first_?name|name)\}|\[(first_?name|name)\]/i.test(subject);
    const hasCompany = /\{company\}|\[company\]/i.test(subject);

    let score = 40;
    if (hasTokens) score += 20;
    if (hasName) score += 20;
    if (hasCompany) score += 20;

    return {
        hasTokens,
        hasName,
        hasCompany,
        score: Math.min(100, score),
    };
}

/**
 * Generate improvement suggestions
 */
export function generateSubjectImprovements(analysis: SubjectLineOptimization['analysis']): SubjectImprovement[] {
    const improvements: SubjectImprovement[] = [];

    // Length improvements
    if (analysis.length.status === 'too_long') {
        improvements.push({
            issue: `Subject line too long (${analysis.length.charCount} chars)`,
            suggestion: 'Shorten to under 50 characters for better open rates',
            impact: '+21% open rate for shorter subjects',
            priority: 'high',
        });
    } else if (analysis.length.status === 'too_short') {
        improvements.push({
            issue: `Subject line too short (${analysis.length.charCount} chars)`,
            suggestion: 'Add more context or intrigue (aim for 30-50 chars)',
            impact: 'Short subjects lack context and intrigue',
            priority: 'medium',
        });
    }

    // Hook improvements
    if (!analysis.hookType.effective) {
        improvements.push({
            issue: 'No effective hook detected',
            suggestion: 'Add a question, number, or curiosity gap to grab attention',
            impact: 'Hooks increase open rates by 20-44%',
            priority: 'critical',
        });
    }

    // Spam risk improvements
    if (analysis.spamRisk.score > 30) {
        improvements.push({
            issue: `High spam risk (${analysis.spamRisk.triggers.join(', ')})`,
            suggestion: analysis.spamRisk.recommendations[0] || 'Remove spam trigger words',
            impact: 'Reduces deliverability and trust',
            priority: 'critical',
        });
    }

    // Mobile preview improvements
    for (const rec of analysis.mobilePreview.recommendations) {
        improvements.push({
            issue: 'Mobile preview optimization needed',
            suggestion: rec,
            impact: '60% of emails opened on mobile',
            priority: 'medium',
        });
    }

    // Personalization improvements
    if (analysis.personalization.score < 60) {
        improvements.push({
            issue: 'Missing personalization',
            suggestion: 'Add {name} or {company} tokens to subject line',
            impact: '+26% higher open rates with personalization',
            priority: 'high',
        });
    }

    return improvements.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Generate alternative subject line suggestions
 */
export function generateSubjectSuggestions(originalSubject: string): SuggestedSubject[] {
    const suggestions: SuggestedSubject[] = [];
    const baseSubject = originalSubject.replace(/[?!.]$/, '').trim();

    // Question version
    suggestions.push({
        text: baseSubject + '?',
        hookType: 'Question',
        predictedBoost: '+44%',
    });

    // Lowercase version
    suggestions.push({
        text: originalSubject.toLowerCase(),
        hookType: 'All lowercase',
        predictedBoost: '+32%',
    });

    // Add number if none exists
    if (!/\d/.test(originalSubject)) {
        suggestions.push({
            text: `3 ways to ${baseSubject.toLowerCase()}`,
            hookType: 'List format',
            predictedBoost: '+45%',
        });
    }

    // Pattern interrupt
    suggestions.push({
        text: `Quick question about ${baseSubject.toLowerCase()}`,
        hookType: 'Pattern interrupt',
        predictedBoost: '+35%',
    });

    return suggestions;
}

/**
 * Main function to optimize subject line
 */
export function optimizeSubjectLine(subject: string): SubjectLineOptimization {
    const analysis = {
        length: analyzeSubjectLength(subject),
        hookType: analyzeHookType(subject),
        emotionalTriggers: analyzeEmotionalTriggers(subject),
        spamRisk: analyzeSpamRisk(subject),
        mobilePreview: analyzeMobilePreview(subject),
        personalization: analyzeSubjectPersonalization(subject),
    };

    // Calculate overall score
    let score = 50;

    // Length contribution
    if (analysis.length.status === 'mobile_optimal') score += 15;
    else if (analysis.length.status === 'optimal') score += 10;
    else if (analysis.length.status === 'too_long') score -= 10;

    // Hook contribution
    if (analysis.hookType.effective) score += 20;

    // Emotional triggers contribution
    score += Math.min(15, analysis.emotionalTriggers.triggers.length * 5);

    // Spam risk penalty
    score -= Math.min(30, analysis.spamRisk.score / 3);

    // Personalization contribution
    if (analysis.personalization.hasTokens) score += 10;

    const improvements = generateSubjectImprovements(analysis);
    const suggestions = generateSubjectSuggestions(subject);

    return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        analysis,
        improvements,
        suggestions,
    };
}
