/**
 * Email Structure Analyzer
 * Analyzes email structure: introduction, body, and call-to-action sections
 */

export interface EmailStructureAnalysis {
    overallScore: number;
    sections: {
        introduction: IntroductionAnalysis;
        body: BodyContentAnalysis;
        callToAction: CTASectionAnalysis;
        closing: ClosingAnalysis;
    };
    flow: FlowAnalysis;
    improvements: StructureImprovement[];
}

export interface IntroductionAnalysis {
    score: number;
    lineCount: number;
    wordCount: number;
    quality: 'strong' | 'adequate' | 'weak';
    hasPersonalHook: boolean;
    hasRelevanceStatement: boolean;
    issues: string[];
}

export interface BodyContentAnalysis {
    score: number;
    paragraphCount: number;
    avgParagraphWords: number;
    hasValueProposition: boolean;
    hasSocialProof: boolean;
    hasSpecificBenefit: boolean;
    issues: string[];
}

export interface CTASectionAnalysis {
    score: number;
    hasClosingParagraph: boolean;
    ctaType: 'question' | 'statement' | 'offer' | 'missing';
    isLowFriction: boolean;
    isSpecific: boolean;
    issues: string[];
}

export interface ClosingAnalysis {
    score: number;
    hasSignOff: boolean;
    signOffType: 'formal' | 'casual' | 'professional' | 'none';
    isAppropriate: boolean;
}

export interface FlowAnalysis {
    score: number;
    hasLogicalProgression: boolean;
    transitionQuality: 'smooth' | 'adequate' | 'choppy';
    focusScore: number;
    issues: string[];
}

export interface StructureImprovement {
    section: 'introduction' | 'body' | 'cta' | 'closing' | 'flow';
    priority: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    example?: string;
    impact: string;
}

// Strong opening indicators
const STRONG_OPENERS = [
    /^(noticed|saw|came across|read|heard|congratulations)/i,
    /^quick question/i,
    /^(i|we)'ll be (brief|quick)/i,
    /^\{name\}/i,
];

// Weak opening indicators  
const WEAK_OPENERS = [
    /^(i hope|hope this|i wanted to|my name is)/i,
    /^(hello|hi|hey|dear|good morning|good afternoon)/i,
    /^(i'm reaching out|i am reaching out|i'm writing|i am writing)/i,
];

// Value proposition indicators
const VALUE_INDICATORS = [
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
const SOCIAL_PROOF_PATTERNS = [
    /companies like/i,
    /teams like yours/i,
    /similar to/i,
    /\d+%/,
    /\d+x/,
    /(increased|improved|grew|reduced) (by|to)/i,
];

// CTA patterns
const QUESTION_CTA = /\?$/;
const SPECIFIC_TIME_CTA = /\d+\s*(min|minute|mins|minutes)/i;
const LOW_FRICTION_PHRASES = [
    /worth a/i,
    /open to/i,
    /interested in/i,
    /make sense/i,
    /sound good/i,
];

// Sign-off patterns
const SIGN_OFFS = {
    formal: ['best regards', 'sincerely', 'respectfully', 'kind regards', 'warmly'],
    casual: ['cheers', 'thanks', 'best', 'later', 'talk soon'],
    professional: ['thank you', 'looking forward', 'appreciate it', 'let me know'],
};

/**
 * Split email into sections
 */
function splitIntoSections(body: string): { intro: string; middle: string; closing: string } {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 0);

    if (paragraphs.length === 1) {
        const sentences = paragraphs[0].split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length <= 2) {
            return { intro: paragraphs[0], middle: '', closing: '' };
        }
        return {
            intro: sentences.slice(0, 2).join('. ') + '.',
            middle: sentences.slice(2, -1).join('. ') + (sentences.length > 3 ? '.' : ''),
            closing: sentences.slice(-1).join(''),
        };
    }

    return {
        intro: paragraphs[0] || '',
        middle: paragraphs.slice(1, -1).join('\n\n'),
        closing: paragraphs[paragraphs.length - 1] || '',
    };
}

/**
 * Analyze introduction section
 */
export function analyzeIntroduction(body: string): IntroductionAnalysis {
    const { intro } = splitIntoSections(body);
    const lines = intro.split('\n').filter(l => l.trim());
    const words = intro.split(/\s+/).filter(w => w);

    let score = 50;
    const issues: string[] = [];

    // Check for personal hook
    let hasPersonalHook = false;
    for (const pattern of STRONG_OPENERS) {
        if (pattern.test(intro)) {
            hasPersonalHook = true;
            score += 20;
            break;
        }
    }

    // Check for weak openers
    for (const pattern of WEAK_OPENERS) {
        if (pattern.test(intro)) {
            score -= 20;
            issues.push('Generic opening - replace with personalized hook');
            break;
        }
    }

    // Check for relevance statement
    const hasRelevanceStatement = /because|since|noticed|saw|given that/i.test(intro);
    if (hasRelevanceStatement) score += 15;

    // Check length
    if (words.length > 40) {
        score -= 10;
        issues.push('Introduction too long - get to the point faster');
    }

    // Determine quality
    let quality: IntroductionAnalysis['quality'] = 'adequate';
    if (score >= 70 && hasPersonalHook) quality = 'strong';
    else if (score < 50) quality = 'weak';

    return {
        score: Math.max(0, Math.min(100, score)),
        lineCount: lines.length,
        wordCount: words.length,
        quality,
        hasPersonalHook,
        hasRelevanceStatement,
        issues,
    };
}

/**
 * Analyze body content
 */
export function analyzeBodyContent(body: string): BodyContentAnalysis {
    const { middle } = splitIntoSections(body);
    if (!middle) {
        return {
            score: 40,
            paragraphCount: 0,
            avgParagraphWords: 0,
            hasValueProposition: false,
            hasSocialProof: false,
            hasSpecificBenefit: false,
            issues: ['Email is too short - add more value content'],
        };
    }

    const paragraphs = middle.split(/\n\n+/).filter(p => p.trim());
    const words = middle.split(/\s+/);
    const issues: string[] = [];
    let score = 60;

    // Check value proposition
    const hasValueProposition = VALUE_INDICATORS.some(p => p.test(middle));
    if (hasValueProposition) score += 15;
    else issues.push('Missing clear value proposition');

    // Check social proof
    const hasSocialProof = SOCIAL_PROOF_PATTERNS.some(p => p.test(middle));
    if (hasSocialProof) score += 10;

    // Check specific benefits
    const hasSpecificBenefit = /\d+%|\d+x|\d+ hours?|\d+ minutes?|\$\d+/i.test(middle);
    if (hasSpecificBenefit) score += 10;

    // Check paragraph structure
    const avgParagraphWords = paragraphs.length > 0
        ? words.length / paragraphs.length
        : words.length;

    if (avgParagraphWords > 50) {
        score -= 10;
        issues.push('Paragraphs too long - break into smaller chunks');
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        paragraphCount: paragraphs.length,
        avgParagraphWords: Math.round(avgParagraphWords),
        hasValueProposition,
        hasSocialProof,
        hasSpecificBenefit,
        issues,
    };
}

/**
 * Analyze CTA section
 */
export function analyzeCTASection(body: string): CTASectionAnalysis {
    const { closing } = splitIntoSections(body);
    const issues: string[] = [];
    let score = 40;

    const hasClosingParagraph = closing.length > 0;
    if (!hasClosingParagraph) {
        return {
            score: 20,
            hasClosingParagraph: false,
            ctaType: 'missing',
            isLowFriction: false,
            isSpecific: false,
            issues: ['Missing closing paragraph with call-to-action'],
        };
    }

    // Determine CTA type
    let ctaType: CTASectionAnalysis['ctaType'] = 'statement';
    if (QUESTION_CTA.test(closing.trim())) {
        ctaType = 'question';
        score += 20;
    } else if (/offer|free|bonus/i.test(closing)) {
        ctaType = 'offer';
        score += 10;
    }

    // Check if low friction
    const isLowFriction = LOW_FRICTION_PHRASES.some(p => p.test(closing));
    if (isLowFriction) {
        score += 15;
    } else {
        issues.push('CTA could be lower friction - make it easier to say yes');
    }

    // Check if specific (mentions time/date)
    const isSpecific = SPECIFIC_TIME_CTA.test(closing) || /this week|tomorrow|today/i.test(closing);
    if (isSpecific) {
        score += 15;
    } else {
        issues.push('Add specific timeframe to increase response rate');
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        hasClosingParagraph,
        ctaType,
        isLowFriction,
        isSpecific,
        issues,
    };
}

/**
 * Analyze closing/sign-off
 */
export function analyzeClosing(body: string): ClosingAnalysis {
    const lowerBody = body.toLowerCase();
    let score = 70;

    let signOffType: ClosingAnalysis['signOffType'] = 'none';
    let hasSignOff = false;

    for (const type of ['formal', 'casual', 'professional'] as const) {
        for (const phrase of SIGN_OFFS[type]) {
            if (lowerBody.includes(phrase)) {
                signOffType = type;
                hasSignOff = true;
                break;
            }
        }
        if (hasSignOff) break;
    }

    if (!hasSignOff) score -= 10;

    // Professional or casual are generally fine
    const isAppropriate = signOffType !== 'none';

    return {
        score,
        hasSignOff,
        signOffType,
        isAppropriate,
    };
}

/**
 * Analyze email flow
 */
export function analyzeFlow(body: string): FlowAnalysis {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim());
    const issues: string[] = [];
    let score = 70;

    // Check logical progression (hook -> context -> value -> ask)
    const hasLogicalProgression = paragraphs.length >= 2 && paragraphs.length <= 4;
    if (!hasLogicalProgression) {
        score -= 10;
        if (paragraphs.length === 1) issues.push('Email needs paragraph breaks for better flow');
        else if (paragraphs.length > 4) issues.push('Too many paragraphs - consolidate ideas');
    }

    // Check transition words
    const transitionWords = ['because', 'so', 'which is why', 'that\'s why', 'specifically', 'for example'];
    const hasTransitions = transitionWords.some(w => body.toLowerCase().includes(w));
    const transitionQuality: FlowAnalysis['transitionQuality'] = hasTransitions ? 'smooth' : 'choppy';
    if (!hasTransitions) {
        score -= 10;
        issues.push('Add transition words to improve flow between ideas');
    }

    // Check focus (mentions of recipient vs sender)
    const youCount = (body.match(/\byou\b|\byour\b/gi) || []).length;
    const iCount = (body.match(/\bi\b|\bwe\b|\bour\b|\bmy\b/gi) || []).length;
    const focusScore = Math.round((youCount / (youCount + iCount + 1)) * 100);

    if (focusScore < 40) {
        score -= 10;
        issues.push('Email is too self-focused - use more "you" language');
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        hasLogicalProgression,
        transitionQuality,
        focusScore,
        issues,
    };
}

/**
 * Generate structure improvements
 */
function generateStructureImprovements(analysis: EmailStructureAnalysis): StructureImprovement[] {
    const improvements: StructureImprovement[] = [];

    // Introduction improvements
    for (const issue of analysis.sections.introduction.issues) {
        improvements.push({
            section: 'introduction',
            priority: analysis.sections.introduction.quality === 'weak' ? 'critical' : 'high',
            issue,
            suggestion: 'Start with a personalized observation or pattern-interrupt question',
            example: 'Try: "Noticed your recent [specific thing] - quick question..."',
            impact: 'Strong openers increase read-through rate by 35%',
        });
    }

    // Body improvements
    for (const issue of analysis.sections.body.issues) {
        improvements.push({
            section: 'body',
            priority: 'high',
            issue,
            suggestion: 'Focus on specific benefits with concrete numbers or outcomes',
            impact: 'Clear value props increase engagement by 40%',
        });
    }

    // CTA improvements
    for (const issue of analysis.sections.callToAction.issues) {
        improvements.push({
            section: 'cta',
            priority: 'critical',
            issue,
            suggestion: 'End with a specific, low-friction question',
            example: '"Worth a 15-minute call this week?"',
            impact: 'Specific CTAs get 28% more responses',
        });
    }

    // Flow improvements
    for (const issue of analysis.flow.issues) {
        improvements.push({
            section: 'flow',
            priority: 'medium',
            issue,
            suggestion: 'Use transition words and focus on recipient benefits',
            impact: 'Better flow increases comprehension and action',
        });
    }

    return improvements.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Main function to analyze email structure
 */
export function analyzeEmailStructure(body: string): EmailStructureAnalysis {
    const sections = {
        introduction: analyzeIntroduction(body),
        body: analyzeBodyContent(body),
        callToAction: analyzeCTASection(body),
        closing: analyzeClosing(body),
    };

    const flow = analyzeFlow(body);

    // Calculate overall score
    const overallScore = Math.round(
        sections.introduction.score * 0.25 +
        sections.body.score * 0.25 +
        sections.callToAction.score * 0.3 +
        sections.closing.score * 0.05 +
        flow.score * 0.15
    );

    const analysis: EmailStructureAnalysis = {
        overallScore,
        sections,
        flow,
        improvements: [],
    };

    analysis.improvements = generateStructureImprovements(analysis);

    return analysis;
}
