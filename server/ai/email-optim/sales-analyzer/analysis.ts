// Sales Email Analysis Functions
// Extracted from sales-analyzer.ts

import type { OpeningLineScore, PersonalizationScore, ValuePropScore, SocialProofScore, UrgencyScore, CTAScore, SalesEmailAnalysis, SalesImprovement } from "./types";
import { GENERIC_OPENERS, EFFECTIVE_OPENERS, SOCIAL_PROOF_PATTERNS, STRONG_CTA_PATTERNS, WEAK_CTA_PATTERNS } from "./patterns";

export function detectSalesEmail(subject: string, body: string): { isSalesEmail: boolean; confidence: number } {
    const content = (subject + ' ' + body).toLowerCase();
    let salesIndicators = 0, totalWeight = 0;
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
    salesPatterns.forEach(({ pattern, weight }) => { if (pattern.test(content)) salesIndicators += weight; totalWeight += weight; });
    const confidence = Math.min(100, Math.round((salesIndicators / totalWeight) * 100 * 2));
    return { isSalesEmail: confidence > 40, confidence };
}

export function analyzeOpeningLine(body: string): OpeningLineScore {
    const lines = body.split(/[.\n]/).filter(l => l.trim().length > 0);
    const firstLine = lines[0]?.toLowerCase().trim() || '';
    const firstTwoLines = lines.slice(0, 2).join(' ').toLowerCase();
    for (const opener of GENERIC_OPENERS) { if (firstTwoLines.includes(opener)) return { score: 20, type: 'generic', issue: 'Generic opener detected - these are ignored by 95% of recipients', suggestion: `Replace "${opener}" with a specific observation about the recipient or their company` }; }
    for (const { pattern, type, boost } of EFFECTIVE_OPENERS) { if (firstLine.includes(pattern)) return { score: 70 + boost, type: type as OpeningLineScore['type'] }; }
    if (firstLine.includes('?')) return { score: 75, type: 'question' };
    return { score: 55, type: 'generic', issue: 'Opening lacks a strong hook', suggestion: 'Start with a specific observation, relevant question, or personalized reference' };
}

export function analyzePersonalization(content: string, recipientData?: any): PersonalizationScore {
    let score = 30;
    const analysis: PersonalizationScore = { score: 30, hasCompanyMention: false, hasNameMention: false, hasSpecificReference: false, hasResearch: false };
    if (recipientData?.company && content.toLowerCase().includes(recipientData.company.toLowerCase())) { analysis.hasCompanyMention = true; score += 20; } else if (/your (company|team|organization)/i.test(content)) score += 10;
    if (recipientData?.name && content.toLowerCase().includes(recipientData.name.split(' ')[0].toLowerCase())) { analysis.hasNameMention = true; score += 10; }
    const researchIndicators = [/saw (your|you|that)/i, /noticed (your|you|that)/i, /read (your|about)/i, /listened to/i, /watched your/i, /your (recent|latest)/i, /congrats on/i, /loved your/i];
    for (const pattern of researchIndicators) { if (pattern.test(content)) { analysis.hasResearch = true; analysis.hasSpecificReference = true; score += 20; break; } }
    if (/\{[^}]+\}|\[[^\]]+\]/.test(content)) score += 5;
    analysis.score = Math.min(100, score);
    return analysis;
}

export function analyzeValueProposition(body: string): ValuePropScore {
    let score = 40;
    const analysis: ValuePropScore = { score: 40, clarity: 'vague', benefitFocused: false, recipientCentric: false };
    const lowerBody = body.toLowerCase();
    const youCount = (body.match(/\byou\b|\byour\b/gi) || []).length;
    const iCount = (body.match(/\bi\b|\bwe\b|\bour\b/gi) || []).length;
    if (youCount > iCount) { analysis.recipientCentric = true; score += 20; } else if (iCount > youCount * 1.5) score -= 10;
    const benefitWords = ['save', 'increase', 'improve', 'reduce', 'grow', 'boost', 'accelerate', 'simplify', 'automate', 'eliminate'];
    if (benefitWords.some(word => lowerBody.includes(word))) { analysis.benefitFocused = true; score += 15; }
    const valueIndicators = [/help you/i, /enable you/i, /so that you/i, /which means/i, /resulting in/i, /leading to/i];
    if (valueIndicators.some(pattern => pattern.test(body))) { analysis.clarity = 'clear'; score += 15; } else if (/our (product|solution|platform|tool)/i.test(body)) { analysis.clarity = 'vague'; score -= 5; }
    analysis.score = Math.min(100, Math.max(0, score));
    return analysis;
}

export function analyzeSocialProof(body: string): SocialProofScore {
    let score = 30;
    const analysis: SocialProofScore = { score: 30, hasCompanyProof: false, hasMetrics: false, hasTestimonial: false, hasSimilarCompany: false };
    for (const { pattern, type } of SOCIAL_PROOF_PATTERNS) {
        if (pattern.test(body)) {
            switch (type) { case 'metric': analysis.hasMetrics = true; score += 20; break; case 'similar_company': analysis.hasSimilarCompany = true; score += 25; break; case 'testimonial': analysis.hasTestimonial = true; score += 15; break; case 'result': score += 10; break; }
        }
    }
    if (/\b(fortune \d+|google|amazon|microsoft|meta|salesforce|hubspot)\b/i.test(body)) { analysis.hasCompanyProof = true; score += 15; }
    analysis.score = Math.min(100, score);
    return analysis;
}

export function analyzeUrgency(body: string): UrgencyScore {
    const lowerBody = body.toLowerCase();
    const analysis: UrgencyScore = { score: 60, type: 'none', appropriate: true };
    const naturalUrgency = [/end of (quarter|month|year)/i, /before (the|your)/i, /upcoming/i, /this week/i, /planning for/i];
    const artificialUrgency = [/limited time/i, /only \d+ (spots|seats)/i, /offer expires/i, /act now/i, /don't miss out/i];
    const aggressiveUrgency = [/last chance/i, /final opportunity/i, /hurry/i, /urgent/i, /asap/i];
    if (aggressiveUrgency.some(p => p.test(lowerBody))) { analysis.type = 'aggressive'; analysis.appropriate = false; analysis.score = 30; }
    else if (artificialUrgency.some(p => p.test(lowerBody))) { analysis.type = 'artificial'; analysis.appropriate = false; analysis.score = 50; }
    else if (naturalUrgency.some(p => p.test(lowerBody))) { analysis.type = 'natural'; analysis.appropriate = true; analysis.score = 80; }
    return analysis;
}

export function analyzeCTA(body: string): CTAScore {
    let score = 40;
    const analysis: CTAScore = { score: 40, hasClearCTA: false, singleAsk: true, lowFriction: false, specific: false };
    for (const { pattern, score: ctaScore } of STRONG_CTA_PATTERNS) { if (pattern.test(body)) { analysis.hasClearCTA = true; analysis.specific = true; score += ctaScore; break; } }
    for (const { pattern, penalty } of WEAK_CTA_PATTERNS) { if (pattern.test(body)) score -= penalty; }
    const lines = body.split(/[.\n]/);
    if (lines.slice(-3).join(' ').includes('?')) { analysis.hasClearCTA = true; score += 15; }
    if (/\d+ (min|minute)/i.test(body)) { analysis.lowFriction = true; score += 10; }
    const askCount = (body.match(/\?/g) || []).length;
    if (askCount > 2) { analysis.singleAsk = false; score -= 15; }
    analysis.score = Math.min(100, Math.max(0, score));
    return analysis;
}

export function generateSalesImprovements(analysis: SalesEmailAnalysis): SalesImprovement[] {
    const improvements: SalesImprovement[] = [];
    if (analysis.scores.openingLine.score < 60) improvements.push({ category: 'opening', priority: 'critical', issue: analysis.scores.openingLine.issue || 'Weak opening line', suggestion: analysis.scores.openingLine.suggestion || 'Start with a personalized observation or pattern interrupt', impact: '+35% reply rate with strong openers', example: 'Try: "Noticed you recently [specific observation] - quick question about that..."' });
    if (analysis.scores.personalization.score < 60) improvements.push({ category: 'personalization', priority: 'high', issue: 'Low personalization detected', suggestion: "Add specific references to the recipient's company, role, or recent activity", impact: '+26% response rate with relevant personalization', example: 'Reference a recent company announcement, LinkedIn post, or industry news' });
    if (analysis.scores.valueProposition.score < 60) improvements.push({ category: 'value_prop', priority: 'high', issue: analysis.scores.valueProposition.clarity === 'missing' ? 'No clear value proposition' : 'Vague value proposition', suggestion: 'Focus on specific benefits and outcomes for the recipient, not your product features', impact: '+22% engagement with clear value statements', example: 'Instead of "Our platform has X feature", say "This helps you achieve Y result"' });
    if (!analysis.scores.valueProposition.recipientCentric) improvements.push({ category: 'value_prop', priority: 'medium', issue: 'Too much I/we language, not enough you/your', suggestion: 'Rewrite to focus on the recipient - use "you" and "your" more than "I" and "we"', impact: '+18% higher engagement with recipient-focused copy' });
    if (analysis.scores.socialProof.score < 50) improvements.push({ category: 'social_proof', priority: 'medium', issue: 'Missing social proof elements', suggestion: 'Add relevant metrics, case studies, or mentions of similar companies', impact: '+15% credibility boost', example: '"We helped companies like [similar company] achieve [specific result]"' });
    if (!analysis.scores.urgency.appropriate) improvements.push({ category: 'urgency', priority: 'medium', issue: `${analysis.scores.urgency.type} urgency detected`, suggestion: 'Use natural urgency tied to real events rather than artificial pressure', impact: 'Avoid spam filters and improve trust' });
    if (analysis.scores.callToAction.score < 60) improvements.push({ category: 'cta', priority: 'critical', issue: analysis.scores.callToAction.hasClearCTA ? 'Weak CTA' : 'Missing clear call-to-action', suggestion: 'End with a specific, low-friction ask with a clear time commitment', impact: '+28% response rate with strong CTAs', example: 'Try: "Worth a 15-minute call this week?" or "Would you be open to a quick chat?"' });
    if (!analysis.scores.callToAction.singleAsk) improvements.push({ category: 'cta', priority: 'high', issue: 'Multiple asks detected', suggestion: 'Focus on one clear ask - multiple options reduce response rates', impact: 'Single ask increases responses by 25%' });
    return improvements.sort((a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 })[a.priority] - ({ critical: 0, high: 1, medium: 2, low: 3 })[b.priority]);
}
