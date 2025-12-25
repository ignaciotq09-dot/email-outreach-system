// Email Structure Analyzer Functions

import type { IntroductionAnalysis, BodyContentAnalysis, CTASectionAnalysis, ClosingAnalysis, FlowAnalysis, EmailStructureAnalysis, StructureImprovement } from "./types";
import { STRONG_OPENERS, WEAK_OPENERS, VALUE_INDICATORS, SOCIAL_PROOF_PATTERNS, QUESTION_CTA, SPECIFIC_TIME_CTA, LOW_FRICTION_PHRASES, SIGN_OFFS } from "./patterns";

function splitIntoSections(body: string): { intro: string; middle: string; closing: string } {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 1) {
        const sentences = paragraphs[0].split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length <= 2) return { intro: paragraphs[0], middle: '', closing: '' };
        return { intro: sentences.slice(0, 2).join('. ') + '.', middle: sentences.slice(2, -1).join('. ') + (sentences.length > 3 ? '.' : ''), closing: sentences.slice(-1).join('') };
    }
    return { intro: paragraphs[0] || '', middle: paragraphs.slice(1, -1).join('\n\n'), closing: paragraphs[paragraphs.length - 1] || '' };
}

export function analyzeIntroduction(body: string): IntroductionAnalysis {
    const { intro } = splitIntoSections(body);
    const lines = intro.split('\n').filter(l => l.trim()), words = intro.split(/\s+/).filter(w => w);
    let score = 50, hasPersonalHook = false;
    const issues: string[] = [];
    for (const pattern of STRONG_OPENERS) { if (pattern.test(intro)) { hasPersonalHook = true; score += 20; break; } }
    for (const pattern of WEAK_OPENERS) { if (pattern.test(intro)) { score -= 20; issues.push('Generic opening - replace with personalized hook'); break; } }
    const hasRelevanceStatement = /because|since|noticed|saw|given that/i.test(intro);
    if (hasRelevanceStatement) score += 15;
    if (words.length > 40) { score -= 10; issues.push('Introduction too long - get to the point faster'); }
    let quality: IntroductionAnalysis['quality'] = 'adequate';
    if (score >= 70 && hasPersonalHook) quality = 'strong'; else if (score < 50) quality = 'weak';
    return { score: Math.max(0, Math.min(100, score)), lineCount: lines.length, wordCount: words.length, quality, hasPersonalHook, hasRelevanceStatement, issues };
}

export function analyzeBodyContent(body: string): BodyContentAnalysis {
    const { middle } = splitIntoSections(body);
    if (!middle) return { score: 40, paragraphCount: 0, avgParagraphWords: 0, hasValueProposition: false, hasSocialProof: false, hasSpecificBenefit: false, issues: ['Email is too short - add more value content'] };
    const paragraphs = middle.split(/\n\n+/).filter(p => p.trim()), words = middle.split(/\s+/);
    const issues: string[] = [];
    let score = 60;
    const hasValueProposition = VALUE_INDICATORS.some(p => p.test(middle));
    if (hasValueProposition) score += 15; else issues.push('Missing clear value proposition');
    const hasSocialProof = SOCIAL_PROOF_PATTERNS.some(p => p.test(middle));
    if (hasSocialProof) score += 10;
    const hasSpecificBenefit = /\d+%|\d+x|\d+ hours?|\d+ minutes?|\$\d+/i.test(middle);
    if (hasSpecificBenefit) score += 10;
    const avgParagraphWords = paragraphs.length > 0 ? words.length / paragraphs.length : words.length;
    if (avgParagraphWords > 50) { score -= 10; issues.push('Paragraphs too long - break into smaller chunks'); }
    return { score: Math.max(0, Math.min(100, score)), paragraphCount: paragraphs.length, avgParagraphWords: Math.round(avgParagraphWords), hasValueProposition, hasSocialProof, hasSpecificBenefit, issues };
}

export function analyzeCTASection(body: string): CTASectionAnalysis {
    const { closing } = splitIntoSections(body);
    const issues: string[] = [];
    let score = 40;
    const hasClosingParagraph = closing.length > 0;
    if (!hasClosingParagraph) return { score: 20, hasClosingParagraph: false, ctaType: 'missing', isLowFriction: false, isSpecific: false, issues: ['Missing closing paragraph with call-to-action'] };
    let ctaType: CTASectionAnalysis['ctaType'] = 'statement';
    if (QUESTION_CTA.test(closing.trim())) { ctaType = 'question'; score += 20; }
    else if (/offer|free|bonus/i.test(closing)) { ctaType = 'offer'; score += 10; }
    const isLowFriction = LOW_FRICTION_PHRASES.some(p => p.test(closing));
    if (isLowFriction) score += 15; else issues.push('CTA could be lower friction - make it easier to say yes');
    const isSpecific = SPECIFIC_TIME_CTA.test(closing) || /this week|tomorrow|today/i.test(closing);
    if (isSpecific) score += 15; else issues.push('Add specific timeframe to increase response rate');
    return { score: Math.max(0, Math.min(100, score)), hasClosingParagraph, ctaType, isLowFriction, isSpecific, issues };
}

export function analyzeClosing(body: string): ClosingAnalysis {
    const lowerBody = body.toLowerCase();
    let score = 70, signOffType: ClosingAnalysis['signOffType'] = 'none', hasSignOff = false;
    for (const type of ['formal', 'casual', 'professional'] as const) {
        for (const phrase of SIGN_OFFS[type]) { if (lowerBody.includes(phrase)) { signOffType = type; hasSignOff = true; break; } }
        if (hasSignOff) break;
    }
    if (!hasSignOff) score -= 10;
    return { score, hasSignOff, signOffType, isAppropriate: signOffType !== 'none' };
}

export function analyzeFlow(body: string): FlowAnalysis {
    const paragraphs = body.split(/\n\n+/).filter(p => p.trim());
    const issues: string[] = [];
    let score = 70;
    const hasLogicalProgression = paragraphs.length >= 2 && paragraphs.length <= 4;
    if (!hasLogicalProgression) { score -= 10; if (paragraphs.length === 1) issues.push('Email needs paragraph breaks for better flow'); else if (paragraphs.length > 4) issues.push('Too many paragraphs - consolidate ideas'); }
    const transitionWords = ['because', 'so', 'which is why', "that's why", 'specifically', 'for example'];
    const hasTransitions = transitionWords.some(w => body.toLowerCase().includes(w));
    const transitionQuality: FlowAnalysis['transitionQuality'] = hasTransitions ? 'smooth' : 'choppy';
    if (!hasTransitions) { score -= 10; issues.push('Add transition words to improve flow between ideas'); }
    const youCount = (body.match(/\byou\b|\byour\b/gi) || []).length;
    const iCount = (body.match(/\bi\b|\bwe\b|\bour\b|\bmy\b/gi) || []).length;
    const focusScore = Math.round((youCount / (youCount + iCount + 1)) * 100);
    if (focusScore < 40) { score -= 10; issues.push('Email is too self-focused - use more "you" language'); }
    return { score: Math.max(0, Math.min(100, score)), hasLogicalProgression, transitionQuality, focusScore, issues };
}

export function generateStructureImprovements(analysis: EmailStructureAnalysis): StructureImprovement[] {
    const improvements: StructureImprovement[] = [];
    for (const issue of analysis.sections.introduction.issues) improvements.push({ section: 'introduction', priority: analysis.sections.introduction.quality === 'weak' ? 'critical' : 'high', issue, suggestion: 'Start with a personalized observation or pattern-interrupt question', example: 'Try: "Noticed your recent [specific thing] - quick question..."', impact: 'Strong openers increase read-through rate by 35%' });
    for (const issue of analysis.sections.body.issues) improvements.push({ section: 'body', priority: 'high', issue, suggestion: 'Focus on specific benefits with concrete numbers or outcomes', impact: 'Clear value props increase engagement by 40%' });
    for (const issue of analysis.sections.callToAction.issues) improvements.push({ section: 'cta', priority: 'critical', issue, suggestion: 'End with a specific, low-friction question', example: '"Worth a 15-minute call this week?"', impact: 'Specific CTAs get 28% more responses' });
    for (const issue of analysis.flow.issues) improvements.push({ section: 'flow', priority: 'medium', issue, suggestion: 'Use transition words and focus on recipient benefits', impact: 'Better flow increases comprehension and action' });
    return improvements.sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 })[a.priority] - ({ critical: 0, high: 1, medium: 2, low: 3 })[b.priority]);
}
