/**
 * Sales Email Analyzer
 * Analyzes emails using patterns from top-performing sales teams
 * Based on research from best SDR/BDR practices
 */

import { EmailIntent } from "./types";

// Sales email analysis result type
export interface SalesEmailAnalysis {
    isSalesEmail: boolean;
    confidence: number;
    scores: {
        openingLine: OpeningLineScore;
        personalization: PersonalizationScore;
        valueProposition: ValuePropScore;
        socialProof: SocialProofScore;
        urgency: UrgencyScore;
        callToAction: CTAScore;
    };
    overallScore: number;
    improvements: SalesImprovement[];
}

export interface OpeningLineScore {
    score: number;
    type: 'generic' | 'personalized' | 'pattern_interrupt' | 'question' | 'observation';
    issue?: string;
    suggestion?: string;
}

export interface PersonalizationScore {
    score: number;
    hasCompanyMention: boolean;
    hasNameMention: boolean;
    hasSpecificReference: boolean;
    hasResearch: boolean;
}

export interface ValuePropScore {
    score: number;
    clarity: 'clear' | 'vague' | 'missing';
    benefitFocused: boolean;
    recipientCentric: boolean;
}

export interface SocialProofScore {
    score: number;
    hasCompanyProof: boolean;
    hasMetrics: boolean;
    hasTestimonial: boolean;
    hasSimilarCompany: boolean;
}

export interface UrgencyScore {
    score: number;
    type: 'none' | 'natural' | 'artificial' | 'aggressive';
    appropriate: boolean;
}

export interface CTAScore {
    score: number;
    hasClearCTA: boolean;
    singleAsk: boolean;
    lowFriction: boolean;
    specific: boolean;
}

export interface SalesImprovement {
    category: 'opening' | 'personalization' | 'value_prop' | 'social_proof' | 'urgency' | 'cta' | 'structure';
    priority: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    impact: string;
    example?: string;
}

// Generic openers that top sales teams avoid
const GENERIC_OPENERS = [
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
const EFFECTIVE_OPENERS = [
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
const SOCIAL_PROOF_PATTERNS = [
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
const STRONG_CTA_PATTERNS = [
    { pattern: /worth a (\d+|quick|brief) (min|minute)/i, score: 25 },
    { pattern: /\d+ minutes?/i, score: 20 },
    { pattern: /quick call/i, score: 20 },
    { pattern: /open to/i, score: 18 },
    { pattern: /interested in/i, score: 15 },
    { pattern: /would you be against/i, score: 22 },
    { pattern: /does that sound/i, score: 18 },
];

const WEAK_CTA_PATTERNS = [
    { pattern: /let me know if you have any questions/i, penalty: 10 },
    { pattern: /feel free to reach out/i, penalty: 10 },
    { pattern: /don't hesitate/i, penalty: 8 },
    { pattern: /at your earliest convenience/i, penalty: 12 },
    { pattern: /whenever you get a chance/i, penalty: 10 },
];

/**
 * Detect if email is sales-focused
 */
export function detectSalesEmail(subject: string, body: string): { isSalesEmail: boolean; confidence: number } {
    const content = (subject + ' ' + body).toLowerCase();
    let salesIndicators = 0;
    let totalWeight = 0;

    // Check for sales indicators
    const salesPatterns = [
        { pattern: /(\bsales\b|revenue|pipeline|deal|close)/i, weight: 2 },
        { pattern: /(demo|meeting|call|chat|coffee)/i, weight: 1.5 },
        { pattern: /(solution|product|service|platform|tool)/i, weight: 1 },
        { pattern: /(challenge|problem|struggle|pain point)/i, weight: 1.5 },
        { pattern: /(help (you|your)|assist your|support your)/i, weight: 1.5 },
        { pattern: /(increase|improve|boost|grow|scale)/i, weight: 1 },
        { pattern: /(roi|results|outcomes|impact)/i, weight: 1.5 },
        { pattern: /(competitor|market|industry)/i, weight: 1 },
    ];

    salesPatterns.forEach(({ pattern, weight }) => {
        if (pattern.test(content)) {
            salesIndicators += weight;
        }
        totalWeight += weight;
    });

    const confidence = Math.min(100, Math.round((salesIndicators / totalWeight) * 100 * 2));
    const isSalesEmail = confidence > 40;

    return { isSalesEmail, confidence };
}

/**
 * Analyze opening line effectiveness
 */
export function analyzeOpeningLine(body: string): OpeningLineScore {
    const lines = body.split(/[.\n]/).filter(l => l.trim().length > 0);
    const firstLine = lines[0]?.toLowerCase().trim() || '';
    const firstTwoLines = lines.slice(0, 2).join(' ').toLowerCase();

    // Check for generic openers (bad)
    for (const opener of GENERIC_OPENERS) {
        if (firstTwoLines.includes(opener)) {
            return {
                score: 20,
                type: 'generic',
                issue: 'Generic opener detected - these are ignored by 95% of recipients',
                suggestion: `Replace "${opener}" with a specific observation about the recipient or their company`,
            };
        }
    }

    // Check for effective openers (good)
    for (const { pattern, type, boost } of EFFECTIVE_OPENERS) {
        if (firstLine.includes(pattern)) {
            return {
                score: 70 + boost,
                type: type as OpeningLineScore['type'],
            };
        }
    }

    // Check if it's a question
    if (firstLine.includes('?')) {
        return {
            score: 75,
            type: 'question',
        };
    }

    // Default - neutral opener
    return {
        score: 55,
        type: 'generic',
        issue: 'Opening lacks a strong hook',
        suggestion: 'Start with a specific observation, relevant question, or personalized reference',
    };
}

/**
 * Analyze personalization level
 */
export function analyzePersonalization(content: string, recipientData?: any): PersonalizationScore {
    let score = 30;
    const analysis: PersonalizationScore = {
        score: 30,
        hasCompanyMention: false,
        hasNameMention: false,
        hasSpecificReference: false,
        hasResearch: false,
    };

    // Check for company mention
    if (recipientData?.company && content.toLowerCase().includes(recipientData.company.toLowerCase())) {
        analysis.hasCompanyMention = true;
        score += 20;
    } else if (/your (company|team|organization)/i.test(content)) {
        score += 10;
    }

    // Check for name mention
    if (recipientData?.name && content.toLowerCase().includes(recipientData.name.split(' ')[0].toLowerCase())) {
        analysis.hasNameMention = true;
        score += 10;
    }

    // Check for specific references (shows research)
    const researchIndicators = [
        /saw (your|you|that)/i,
        /noticed (your|you|that)/i,
        /read (your|about)/i,
        /listened to/i,
        /watched your/i,
        /your (recent|latest)/i,
        /congrats on/i,
        /loved your/i,
    ];

    for (const pattern of researchIndicators) {
        if (pattern.test(content)) {
            analysis.hasResearch = true;
            analysis.hasSpecificReference = true;
            score += 20;
            break;
        }
    }

    // Check for placeholder tokens (good practice)
    if (/\{[^}]+\}|\[[^\]]+\]/.test(content)) {
        score += 5;
    }

    analysis.score = Math.min(100, score);
    return analysis;
}

/**
 * Analyze value proposition clarity
 */
export function analyzeValueProposition(body: string): ValuePropScore {
    let score = 40;
    const analysis: ValuePropScore = {
        score: 40,
        clarity: 'vague',
        benefitFocused: false,
        recipientCentric: false,
    };

    const lowerBody = body.toLowerCase();

    // Check recipient-centric language (you/your vs I/we)
    const youCount = (body.match(/\byou\b|\byour\b/gi) || []).length;
    const iCount = (body.match(/\bi\b|\bwe\b|\bour\b/gi) || []).length;

    if (youCount > iCount) {
        analysis.recipientCentric = true;
        score += 20;
    } else if (iCount > youCount * 1.5) {
        score -= 10;
    }

    // Check for benefit-focused language
    const benefitWords = ['save', 'increase', 'improve', 'reduce', 'grow', 'boost', 'accelerate', 'simplify', 'automate', 'eliminate'];
    if (benefitWords.some(word => lowerBody.includes(word))) {
        analysis.benefitFocused = true;
        score += 15;
    }

    // Check for clear value statement
    const valueIndicators = [
        /help you/i,
        /enable you/i,
        /so that you/i,
        /which means/i,
        /resulting in/i,
        /leading to/i,
    ];

    if (valueIndicators.some(pattern => pattern.test(body))) {
        analysis.clarity = 'clear';
        score += 15;
    } else if (/our (product|solution|platform|tool)/i.test(body)) {
        analysis.clarity = 'vague';
        score -= 5;
    }

    analysis.score = Math.min(100, Math.max(0, score));
    return analysis;
}

/**
 * Analyze social proof usage
 */
export function analyzeSocialProof(body: string): SocialProofScore {
    let score = 30;
    const analysis: SocialProofScore = {
        score: 30,
        hasCompanyProof: false,
        hasMetrics: false,
        hasTestimonial: false,
        hasSimilarCompany: false,
    };

    for (const { pattern, type } of SOCIAL_PROOF_PATTERNS) {
        if (pattern.test(body)) {
            switch (type) {
                case 'metric':
                    analysis.hasMetrics = true;
                    score += 20;
                    break;
                case 'similar_company':
                    analysis.hasSimilarCompany = true;
                    score += 25;
                    break;
                case 'testimonial':
                    analysis.hasTestimonial = true;
                    score += 15;
                    break;
                case 'result':
                    score += 10;
                    break;
            }
        }
    }

    // Check for company name drops
    if (/\b(fortune \d+|google|amazon|microsoft|meta|salesforce|hubspot)\b/i.test(body)) {
        analysis.hasCompanyProof = true;
        score += 15;
    }

    analysis.score = Math.min(100, score);
    return analysis;
}

/**
 * Analyze urgency/scarcity usage
 */
export function analyzeUrgency(body: string): UrgencyScore {
    const lowerBody = body.toLowerCase();
    const analysis: UrgencyScore = {
        score: 60,
        type: 'none',
        appropriate: true,
    };

    // Natural urgency (good)
    const naturalUrgency = [
        /end of (quarter|month|year)/i,
        /before (the|your)/i,
        /upcoming/i,
        /this week/i,
        /planning for/i,
    ];

    // Artificial urgency (potentially bad)
    const artificialUrgency = [
        /limited time/i,
        /only \d+ (spots|seats)/i,
        /offer expires/i,
        /act now/i,
        /don't miss out/i,
    ];

    // Aggressive urgency (bad)
    const aggressiveUrgency = [
        /last chance/i,
        /final opportunity/i,
        /hurry/i,
        /urgent/i,
        /asap/i,
    ];

    if (aggressiveUrgency.some(p => p.test(lowerBody))) {
        analysis.type = 'aggressive';
        analysis.appropriate = false;
        analysis.score = 30;
    } else if (artificialUrgency.some(p => p.test(lowerBody))) {
        analysis.type = 'artificial';
        analysis.appropriate = false;
        analysis.score = 50;
    } else if (naturalUrgency.some(p => p.test(lowerBody))) {
        analysis.type = 'natural';
        analysis.appropriate = true;
        analysis.score = 80;
    }

    return analysis;
}

/**
 * Analyze call-to-action effectiveness
 */
export function analyzeCTA(body: string): CTAScore {
    let score = 40;
    const analysis: CTAScore = {
        score: 40,
        hasClearCTA: false,
        singleAsk: true,
        lowFriction: false,
        specific: false,
    };

    // Check for strong CTAs
    for (const { pattern, score: ctaScore } of STRONG_CTA_PATTERNS) {
        if (pattern.test(body)) {
            analysis.hasClearCTA = true;
            analysis.specific = true;
            score += ctaScore;
            break;
        }
    }

    // Check for weak CTAs (penalties)
    for (const { pattern, penalty } of WEAK_CTA_PATTERNS) {
        if (pattern.test(body)) {
            score -= penalty;
        }
    }

    // Check if it's a question (good)
    const lines = body.split(/[.\n]/);
    const lastFewLines = lines.slice(-3).join(' ');
    if (lastFewLines.includes('?')) {
        analysis.hasClearCTA = true;
        score += 15;
    }

    // Check for time-specific requests (low friction)
    if (/\d+ (min|minute)/i.test(body)) {
        analysis.lowFriction = true;
        score += 10;
    }

    // Check for multiple asks (bad)
    const askCount = (body.match(/\?/g) || []).length;
    if (askCount > 2) {
        analysis.singleAsk = false;
        score -= 15;
    }

    analysis.score = Math.min(100, Math.max(0, score));
    return analysis;
}

/**
 * Generate improvements based on analysis
 */
export function generateSalesImprovements(analysis: SalesEmailAnalysis): SalesImprovement[] {
    const improvements: SalesImprovement[] = [];

    // Opening line improvements
    if (analysis.scores.openingLine.score < 60) {
        improvements.push({
            category: 'opening',
            priority: 'critical',
            issue: analysis.scores.openingLine.issue || 'Weak opening line',
            suggestion: analysis.scores.openingLine.suggestion || 'Start with a personalized observation or pattern interrupt',
            impact: '+35% reply rate with strong openers',
            example: 'Try: "Noticed you recently [specific observation] - quick question about that..."',
        });
    }

    // Personalization improvements
    if (analysis.scores.personalization.score < 60) {
        improvements.push({
            category: 'personalization',
            priority: 'high',
            issue: 'Low personalization detected',
            suggestion: 'Add specific references to the recipient\'s company, role, or recent activity',
            impact: '+26% response rate with relevant personalization',
            example: 'Reference a recent company announcement, LinkedIn post, or industry news',
        });
    }

    // Value proposition improvements
    if (analysis.scores.valueProposition.score < 60) {
        improvements.push({
            category: 'value_prop',
            priority: 'high',
            issue: analysis.scores.valueProposition.clarity === 'missing' ? 'No clear value proposition' : 'Vague value proposition',
            suggestion: 'Focus on specific benefits and outcomes for the recipient, not your product features',
            impact: '+22% engagement with clear value statements',
            example: 'Instead of "Our platform has X feature", say "This helps you achieve Y result"',
        });
    }

    // Recipient-centric language
    if (!analysis.scores.valueProposition.recipientCentric) {
        improvements.push({
            category: 'value_prop',
            priority: 'medium',
            issue: 'Too much I/we language, not enough you/your',
            suggestion: 'Rewrite to focus on the recipient - use "you" and "your" more than "I" and "we"',
            impact: '+18% higher engagement with recipient-focused copy',
        });
    }

    // Social proof improvements
    if (analysis.scores.socialProof.score < 50) {
        improvements.push({
            category: 'social_proof',
            priority: 'medium',
            issue: 'Missing social proof elements',
            suggestion: 'Add relevant metrics, case studies, or mentions of similar companies',
            impact: '+15% credibility boost',
            example: '"We helped companies like [similar company] achieve [specific result]"',
        });
    }

    // Urgency improvements
    if (!analysis.scores.urgency.appropriate) {
        improvements.push({
            category: 'urgency',
            priority: 'medium',
            issue: `${analysis.scores.urgency.type} urgency detected`,
            suggestion: 'Use natural urgency tied to real events rather than artificial pressure',
            impact: 'Avoid spam filters and improve trust',
        });
    }

    // CTA improvements
    if (analysis.scores.callToAction.score < 60) {
        improvements.push({
            category: 'cta',
            priority: 'critical',
            issue: analysis.scores.callToAction.hasClearCTA ? 'Weak CTA' : 'Missing clear call-to-action',
            suggestion: 'End with a specific, low-friction ask with a clear time commitment',
            impact: '+28% response rate with strong CTAs',
            example: 'Try: "Worth a 15-minute call this week?" or "Would you be open to a quick chat?"',
        });
    }

    if (!analysis.scores.callToAction.singleAsk) {
        improvements.push({
            category: 'cta',
            priority: 'high',
            issue: 'Multiple asks detected',
            suggestion: 'Focus on one clear ask - multiple options reduce response rates',
            impact: 'Single ask increases responses by 25%',
        });
    }

    return improvements.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Main function to analyze a sales email
 */
export function analyzeSalesEmail(subject: string, body: string, recipientData?: any): SalesEmailAnalysis {
    const { isSalesEmail, confidence } = detectSalesEmail(subject, body);
    const content = subject + '\n' + body;

    const scores = {
        openingLine: analyzeOpeningLine(body),
        personalization: analyzePersonalization(content, recipientData),
        valueProposition: analyzeValueProposition(body),
        socialProof: analyzeSocialProof(body),
        urgency: analyzeUrgency(body),
        callToAction: analyzeCTA(body),
    };

    // Calculate weighted overall score
    const weights = {
        openingLine: 0.2,
        personalization: 0.2,
        valueProposition: 0.2,
        socialProof: 0.1,
        urgency: 0.05,
        callToAction: 0.25,
    };

    const overallScore = Math.round(
        scores.openingLine.score * weights.openingLine +
        scores.personalization.score * weights.personalization +
        scores.valueProposition.score * weights.valueProposition +
        scores.socialProof.score * weights.socialProof +
        scores.urgency.score * weights.urgency +
        scores.callToAction.score * weights.callToAction
    );

    const analysis: SalesEmailAnalysis = {
        isSalesEmail,
        confidence,
        scores,
        overallScore,
        improvements: [],
    };

    analysis.improvements = generateSalesImprovements(analysis);

    return analysis;
}
