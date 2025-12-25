// Email Analysis Module - Main Entry Point
// Re-exports all analyzers and provides comprehensive analysis

import { EmailIntent, StructureAnalysis, ComprehensiveAnalysis } from "../types";

// Re-export all analyzer functions
export * from "./spam-analyzers";
export * from "./content-analyzers";
export * from "./validation-analyzers";

// Import for use in comprehensive analysis
import { detectSpamTriggers, analyzeLinks, detectComplianceIssues } from "./spam-analyzers";
import { analyzeTone, analyzeReadability, analyzeCTA, enhancedIntentDetection, detectEmailContext } from "./content-analyzers";
import { sanitizeEmailInput, analyzeGreeting, analyzeSignature } from "./validation-analyzers";

// MASTER COMPREHENSIVE ANALYSIS FUNCTION
export function performComprehensiveAnalysis(subject: string, body: string): ComprehensiveAnalysis {
    const subjectValidation = sanitizeEmailInput(subject);
    const bodyValidation = sanitizeEmailInput(body);

    if (!subjectValidation.isValid || !bodyValidation.isValid) {
        return {
            validation: bodyValidation.isValid ? subjectValidation : bodyValidation,
            spam: { score: 0, triggers: [], severity: 'low' },
            readability: { gradeLevel: 0, avgWordsPerSentence: 0, avgSyllablesPerWord: 0, score: 0, assessment: 'N/A' },
            tone: { sentiment: 'neutral', formality: 'neutral', urgency: 'low', confidence: 0 },
            structure: { hasGreeting: false, greetingType: 'none', hasSignature: false, paragraphCount: 0, linkCount: 0, suspiciousLinks: [] },
            cta: { hasCTA: false, ctaCount: 0, ctaStrength: 'weak', ctaClarity: 0 },
            intent: { primary: EmailIntent.COLD_OUTREACH, secondary: [], confidence: 0 },
            compliance: { isCompliant: false, issues: [] },
            context: { isReply: false, isForward: false, sequencePosition: 1, hasQuotedText: false },
            overallScore: 0
        };
    }

    const sanitizedSubject = subjectValidation.sanitizedContent;
    const sanitizedBody = bodyValidation.sanitizedContent;

    const spam = detectSpamTriggers(sanitizedSubject + ' ' + sanitizedBody);
    const readability = analyzeReadability(sanitizedBody);
    const tone = analyzeTone(sanitizedBody);
    const greeting = analyzeGreeting(sanitizedBody);
    const signature = analyzeSignature(sanitizedBody);
    const links = analyzeLinks(sanitizedBody);

    const structure: StructureAnalysis = {
        hasGreeting: greeting.hasGreeting,
        greetingType: greeting.type as 'professional' | 'casual' | 'none',
        hasSignature: signature.hasSignature,
        paragraphCount: sanitizedBody.split('\n\n').length,
        linkCount: links.count,
        suspiciousLinks: links.suspicious
    };

    const cta = analyzeCTA(sanitizedBody);
    const intent = enhancedIntentDetection(sanitizedBody);
    const compliance = detectComplianceIssues(sanitizedSubject, sanitizedBody);
    const context = detectEmailContext(sanitizedBody);

    let overallScore = 50;
    if (spam.score < 15) overallScore += 15;
    if (readability.score >= 60) overallScore += 10;
    if (tone.sentiment === 'positive') overallScore += 5;
    if (structure.hasGreeting) overallScore += 5;
    if (structure.hasSignature) overallScore += 5;
    if (cta.hasCTA && cta.ctaStrength !== 'weak') overallScore += 10;
    if (intent.confidence >= 50) overallScore += 5;
    if (compliance.isCompliant) overallScore += 10;
    if (spam.score >= 30) overallScore -= 20;
    if (structure.suspiciousLinks.length > 0) overallScore -= 15;
    if (readability.score < 40) overallScore -= 10;
    if (!cta.hasCTA) overallScore -= 5;

    overallScore = Math.max(0, Math.min(100, overallScore));

    return { validation: bodyValidation, spam, readability, tone, structure, cta, intent, compliance, context, overallScore };
}
