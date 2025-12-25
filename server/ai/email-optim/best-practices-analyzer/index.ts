// Best Practices Analyzer - Main Entry Point

export * from "./types";
export * from "./patterns";
export * from "./analysis";

import type { BestPracticesAnalysis } from "./types";
import { analyzeReadability, analyzeStructure, analyzeTone, analyzeActionClarity, analyzeLength, generateBestPracticeImprovements } from "./analysis";

// Main function to analyze email best practices
export function analyzeEmailBestPractices(text: string, emailType: 'sales' | 'general' | 'follow_up' = 'general'): BestPracticesAnalysis {
    const readability = analyzeReadability(text);
    const structure = analyzeStructure(text);
    const tone = analyzeTone(text);
    const actionClarity = analyzeActionClarity(text);
    const lengthAnalysis = analyzeLength(text, emailType);

    const overallScore = Math.round(
        readability.score * 0.25 + structure.score * 0.2 + tone.score * 0.2 +
        actionClarity.score * 0.2 + (lengthAnalysis.recommendation === 'optimal' ? 100 : 60) * 0.15
    );

    const analysis: BestPracticesAnalysis = { overallScore, readability, structure, tone, actionClarity, lengthAnalysis, improvements: [] };
    analysis.improvements = generateBestPracticeImprovements(analysis);
    return analysis;
}
