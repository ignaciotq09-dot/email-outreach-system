// Subject Line Optimizer - Main Entry Point

export * from "./types";
export * from "./patterns";
export * from "./analysis";

import type { SubjectLineOptimization } from "./types";
import { analyzeSubjectLength, analyzeHookType, analyzeEmotionalTriggers, analyzeSpamRisk, analyzeMobilePreview, analyzeSubjectPersonalization, generateSubjectImprovements, generateSubjectSuggestions } from "./analysis";

// Main function to optimize subject line
export function optimizeSubjectLine(subject: string): SubjectLineOptimization {
    const analysis = {
        length: analyzeSubjectLength(subject),
        hookType: analyzeHookType(subject),
        emotionalTriggers: analyzeEmotionalTriggers(subject),
        spamRisk: analyzeSpamRisk(subject),
        mobilePreview: analyzeMobilePreview(subject),
        personalization: analyzeSubjectPersonalization(subject),
    };
    let score = 50;
    if (analysis.length.status === 'mobile_optimal') score += 15;
    else if (analysis.length.status === 'optimal') score += 10;
    else if (analysis.length.status === 'too_long') score -= 10;
    if (analysis.hookType.effective) score += 20;
    score += Math.min(15, analysis.emotionalTriggers.triggers.length * 5);
    score -= Math.min(30, analysis.spamRisk.score / 3);
    if (analysis.personalization.hasTokens) score += 10;
    const improvements = generateSubjectImprovements(analysis);
    const suggestions = generateSubjectSuggestions(subject);
    return { score: Math.max(0, Math.min(100, Math.round(score))), analysis, improvements, suggestions };
}
