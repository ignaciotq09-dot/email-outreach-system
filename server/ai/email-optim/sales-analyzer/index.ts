// Sales Email Analyzer - Main Entry Point
// Re-exports all functions and types

export * from "./types";
export * from "./patterns";
export * from "./analysis";

import type { SalesEmailAnalysis } from "./types";
import { detectSalesEmail, analyzeOpeningLine, analyzePersonalization, analyzeValueProposition, analyzeSocialProof, analyzeUrgency, analyzeCTA, generateSalesImprovements } from "./analysis";

// Main function to analyze a sales email
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

    const weights = { openingLine: 0.2, personalization: 0.2, valueProposition: 0.2, socialProof: 0.1, urgency: 0.05, callToAction: 0.25 };
    const overallScore = Math.round(
        scores.openingLine.score * weights.openingLine + scores.personalization.score * weights.personalization +
        scores.valueProposition.score * weights.valueProposition + scores.socialProof.score * weights.socialProof +
        scores.urgency.score * weights.urgency + scores.callToAction.score * weights.callToAction
    );

    const analysis: SalesEmailAnalysis = { isSalesEmail, confidence, scores, overallScore, improvements: [] };
    analysis.improvements = generateSalesImprovements(analysis);
    return analysis;
}
