/**
 * Best Practices Analyzer
 * General email best practices for any type of email
 * Based on email writing research and communication best practices
 */

export interface BestPracticesAnalysis {
    overallScore: number;
    readability: ReadabilityScore;
    structure: StructureScore;
    tone: ToneScore;
    actionClarity: ActionClarityScore;
    lengthAnalysis: LengthAnalysis;
    improvements: BestPracticeImprovement[];
}

export interface ReadabilityScore {
    score: number;
    gradeLevel: number;
    avgSentenceLength: number;
    avgWordLength: number;
    complexWordPercentage: number;
    issues: string[];
}

export interface StructureScore {
    score: number;
    paragraphCount: number;
    avgParagraphLength: number;
    hasWhiteSpace: boolean;
    isVisuallyClean: boolean;
    issues: string[];
}

export interface ToneScore {
    score: number;
    detectedTone: 'formal' | 'professional' | 'casual' | 'friendly' | 'aggressive' | 'passive';
    isConsistent: boolean;
    sentimentBalance: 'positive' | 'neutral' | 'negative';
}

export interface ActionClarityScore {
    score: number;
    hasNextStep: boolean;
    isSpecific: boolean;
    isEasyToAction: boolean;
}

export interface LengthAnalysis {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
    recommendation: 'too_short' | 'optimal' | 'too_long';
    suggestedWordCount: { min: number; max: number };
}

export interface BestPracticeImprovement {
    category: 'readability' | 'structure' | 'tone' | 'action' | 'length';
    priority: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    impact: string;
}

// Complex words (3+ syllables) that reduce readability
const COMPLEX_WORDS = [
    'implementation', 'functionality', 'optimization', 'infrastructure', 'methodology',
    'comprehensive', 'nevertheless', 'accordingly', 'subsequently', 'notwithstanding',
    'aforementioned', 'hereinafter', 'respectively', 'alternatively', 'approximately',
    'significantly', 'unfortunately', 'additionally', 'furthermore', 'consequently',
];

// Formal/stiff phrases to avoid
const FORMAL_PHRASES = [
    { phrase: 'as per our conversation', alternative: 'as we discussed' },
    { phrase: 'please find attached', alternative: 'I\'ve attached' },
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
const PASSIVE_PATTERNS = [
    /\b(is|are|was|were|been|being)\s+\w+ed\b/i,
    /\b(has|have|had)\s+been\s+\w+ed\b/i,
];

/**
 * Calculate readability score (Flesch-Kincaid style)
 */
export function analyzeReadability(text: string): ReadabilityScore {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentenceCount = sentences.length;
    const wordCount = words.length;

    if (wordCount === 0 || sentenceCount === 0) {
        return {
            score: 0,
            gradeLevel: 0,
            avgSentenceLength: 0,
            avgWordLength: 0,
            complexWordPercentage: 0,
            issues: ['Email body is too short to analyze'],
        };
    }

    const avgSentenceLength = wordCount / sentenceCount;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

    // Count complex words
    const complexWordCount = words.filter(word => {
        const syllables = countSyllables(word);
        return syllables >= 3;
    }).length;
    const complexWordPercentage = (complexWordCount / wordCount) * 100;

    // Simplified Flesch-Kincaid Grade Level
    const gradeLevel = Math.round(0.39 * avgSentenceLength + 11.8 * (avgWordLength / 4) - 15.59);

    // Calculate score (lower grade = higher score for email readability)
    let score = 100;
    if (gradeLevel > 12) score -= (gradeLevel - 12) * 10;
    if (avgSentenceLength > 20) score -= (avgSentenceLength - 20) * 2;
    if (complexWordPercentage > 15) score -= (complexWordPercentage - 15) * 2;

    const issues: string[] = [];
    if (avgSentenceLength > 25) issues.push('Sentences are too long (aim for under 20 words)');
    if (complexWordPercentage > 20) issues.push('Too many complex words - simplify language');
    if (gradeLevel > 10) issues.push('Reading level too high for quick comprehension');

    return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        gradeLevel: Math.max(1, gradeLevel),
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        avgWordLength: Math.round(avgWordLength * 10) / 10,
        complexWordPercentage: Math.round(complexWordPercentage * 10) / 10,
        issues,
    };
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    // Remove silent e
    word = word.replace(/e$/, '');

    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g);
    return vowelGroups ? vowelGroups.length : 1;
}

/**
 * Analyze email structure
 */
export function analyzeStructure(text: string): StructureScore {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    let score = 70;
    const issues: string[] = [];

    const paragraphCount = paragraphs.length;
    const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.split(' ').length, 0) / paragraphCount;

    // Check paragraph structure
    if (paragraphCount === 1) {
        score -= 20;
        issues.push('Email is one long paragraph - break it up for better readability');
    } else if (paragraphCount > 5) {
        score -= 10;
        issues.push('Too many paragraphs - consolidate related ideas');
    } else {
        score += 10;
    }

    // Check paragraph length
    let hasLongParagraph = false;
    for (const p of paragraphs) {
        const sentences = p.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length > 4) {
            hasLongParagraph = true;
        }
    }
    if (hasLongParagraph) {
        score -= 10;
        issues.push('Some paragraphs are too long - aim for 2-3 sentences each');
    }

    // Check for white space
    const hasWhiteSpace = paragraphCount > 1 || (lines.length > paragraphCount);
    if (hasWhiteSpace) score += 10;

    // Check visual cleanliness
    const isVisuallyClean = !text.includes('!!!') && !text.includes('???') && !/[A-Z]{5,}/.test(text);
    if (!isVisuallyClean) {
        score -= 15;
        issues.push('Avoid excessive punctuation, caps, or formatting');
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        paragraphCount,
        avgParagraphLength: Math.round(avgParagraphLength),
        hasWhiteSpace,
        isVisuallyClean,
        issues,
    };
}

/**
 * Analyze email tone
 */
export function analyzeTone(text: string): ToneScore {
    const lowerText = text.toLowerCase();
    let score = 70;

    // Detect formality level
    let formalityScore = 0;
    for (const { phrase } of FORMAL_PHRASES) {
        if (lowerText.includes(phrase)) formalityScore += 10;
    }

    // Detect passive voice
    let passiveCount = 0;
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
        for (const pattern of PASSIVE_PATTERNS) {
            if (pattern.test(sentence)) passiveCount++;
        }
    }

    // Detect sentiment
    const positiveWords = ['great', 'excited', 'happy', 'pleased', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['unfortunately', 'problem', 'issue', 'concern', 'sorry', 'apologize', 'regret', 'disappointing'];

    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    let sentimentBalance: ToneScore['sentimentBalance'] = 'neutral';
    if (positiveCount > negativeCount + 1) sentimentBalance = 'positive';
    else if (negativeCount > positiveCount + 1) sentimentBalance = 'negative';

    // Determine detected tone
    let detectedTone: ToneScore['detectedTone'] = 'professional';
    if (formalityScore > 30) detectedTone = 'formal';
    else if (passiveCount > sentences.length / 3) detectedTone = 'passive';
    else if (lowerText.includes('!') && positiveCount > 2) detectedTone = 'friendly';
    else if (text.includes('ASAP') || /\!{2,}/.test(text)) detectedTone = 'aggressive';

    // Score adjustments
    if (detectedTone === 'aggressive') score -= 20;
    if (detectedTone === 'passive') score -= 10;
    if (formalityScore > 20) score -= 10;

    return {
        score: Math.max(0, Math.min(100, score)),
        detectedTone,
        isConsistent: true,
        sentimentBalance,
    };
}

/**
 * Analyze action clarity
 */
export function analyzeActionClarity(text: string): ActionClarityScore {
    let score = 40;
    const lowerText = text.toLowerCase();

    // Check for clear next step
    const nextStepIndicators = [
        /let me know/i,
        /can you/i,
        /would you/i,
        /please (respond|reply|confirm|let)/i,
        /looking forward to/i,
        /\?$/,
    ];

    const hasNextStep = nextStepIndicators.some(p => p.test(text));
    if (hasNextStep) score += 20;

    // Check specificity
    const specificActions = [
        /by (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
        /by \d{1,2}(:\d{2})?\s*(am|pm)?/i,
        /this week/i,
        /tomorrow/i,
        /\d+ (minutes?|hours?|days?)/i,
    ];

    const isSpecific = specificActions.some(p => p.test(text));
    if (isSpecific) score += 20;

    // Check ease of action
    const easyActions = [
        /reply to this email/i,
        /click (here|below|the link)/i,
        /yes or no/i,
        /quick (response|reply)/i,
        /one word/i,
    ];

    const isEasyToAction = easyActions.some(p => p.test(lowerText));
    if (isEasyToAction) score += 20;

    return {
        score: Math.max(0, Math.min(100, score)),
        hasNextStep,
        isSpecific,
        isEasyToAction,
    };
}

/**
 * Analyze email length
 */
export function analyzeLength(text: string, emailType: 'sales' | 'general' | 'follow_up' = 'general'): LengthAnalysis {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    const wordCount = words.length;
    const charCount = text.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;

    // Optimal ranges by email type
    const ranges = {
        sales: { min: 50, max: 125, ideal: 75 },
        follow_up: { min: 25, max: 75, ideal: 50 },
        general: { min: 50, max: 200, ideal: 100 },
    };

    const range = ranges[emailType];
    let recommendation: LengthAnalysis['recommendation'] = 'optimal';

    if (wordCount < range.min) recommendation = 'too_short';
    else if (wordCount > range.max) recommendation = 'too_long';

    return {
        wordCount,
        charCount,
        sentenceCount,
        paragraphCount,
        recommendation,
        suggestedWordCount: { min: range.min, max: range.max },
    };
}

/**
 * Generate improvement suggestions based on analysis
 */
export function generateBestPracticeImprovements(analysis: BestPracticesAnalysis): BestPracticeImprovement[] {
    const improvements: BestPracticeImprovement[] = [];

    // Readability improvements
    if (analysis.readability.score < 70) {
        for (const issue of analysis.readability.issues) {
            improvements.push({
                category: 'readability',
                priority: 'high',
                issue,
                suggestion: 'Simplify language and shorten sentences for faster comprehension',
                impact: 'Emails at 8th-grade level get 36% higher response rates',
            });
        }
    }

    // Structure improvements
    if (analysis.structure.score < 70) {
        for (const issue of analysis.structure.issues) {
            improvements.push({
                category: 'structure',
                priority: 'medium',
                issue,
                suggestion: 'Use short paragraphs (2-3 sentences) with line breaks between',
                impact: 'Visual clarity increases readership by 25%',
            });
        }
    }

    // Tone improvements
    if (analysis.tone.detectedTone === 'formal') {
        improvements.push({
            category: 'tone',
            priority: 'medium',
            issue: 'Overly formal language detected',
            suggestion: 'Use conversational language - write like you speak',
            impact: 'Casual tone increases reply rates by 20%',
        });
    }

    if (analysis.tone.detectedTone === 'aggressive') {
        improvements.push({
            category: 'tone',
            priority: 'high',
            issue: 'Aggressive or pushy tone detected',
            suggestion: 'Soften language, remove excessive punctuation and urgent demands',
            impact: 'Aggressive emails have 50% lower response rates',
        });
    }

    // Action clarity improvements
    if (!analysis.actionClarity.hasNextStep) {
        improvements.push({
            category: 'action',
            priority: 'high',
            issue: 'No clear call-to-action',
            suggestion: 'End with a specific ask or question',
            impact: 'Clear CTAs increase response rates by 28%',
        });
    }

    if (!analysis.actionClarity.isSpecific) {
        improvements.push({
            category: 'action',
            priority: 'medium',
            issue: 'Vague or open-ended request',
            suggestion: 'Add specific timeframes or options to make responding easier',
            impact: 'Specific asks get 40% faster responses',
        });
    }

    // Length improvements
    if (analysis.lengthAnalysis.recommendation !== 'optimal') {
        const { min, max } = analysis.lengthAnalysis.suggestedWordCount;
        improvements.push({
            category: 'length',
            priority: analysis.lengthAnalysis.recommendation === 'too_long' ? 'high' : 'medium',
            issue: analysis.lengthAnalysis.recommendation === 'too_long'
                ? `Email is too long (${analysis.lengthAnalysis.wordCount} words)`
                : `Email is too short (${analysis.lengthAnalysis.wordCount} words)`,
            suggestion: `Aim for ${min}-${max} words for optimal engagement`,
            impact: 'Optimal length emails have 18% higher response rates',
        });
    }

    return improvements;
}

/**
 * Main function to analyze email best practices
 */
export function analyzeEmailBestPractices(text: string, emailType: 'sales' | 'general' | 'follow_up' = 'general'): BestPracticesAnalysis {
    const readability = analyzeReadability(text);
    const structure = analyzeStructure(text);
    const tone = analyzeTone(text);
    const actionClarity = analyzeActionClarity(text);
    const lengthAnalysis = analyzeLength(text, emailType);

    // Calculate overall score
    const overallScore = Math.round(
        readability.score * 0.25 +
        structure.score * 0.2 +
        tone.score * 0.2 +
        actionClarity.score * 0.2 +
        (lengthAnalysis.recommendation === 'optimal' ? 100 : 60) * 0.15
    );

    const analysis: BestPracticesAnalysis = {
        overallScore,
        readability,
        structure,
        tone,
        actionClarity,
        lengthAnalysis,
        improvements: [],
    };

    analysis.improvements = generateBestPracticeImprovements(analysis);

    return analysis;
}
