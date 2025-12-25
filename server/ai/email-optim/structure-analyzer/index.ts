// Email Structure Analyzer - Main Entry Point

export * from "./types";
export * from "./patterns";
export * from "./analysis";

import type { EmailStructureAnalysis } from "./types";
import { analyzeIntroduction, analyzeBodyContent, analyzeCTASection, analyzeClosing, analyzeFlow, generateStructureImprovements } from "./analysis";

// Main function to analyze email structure
export function analyzeEmailStructure(body: string): EmailStructureAnalysis {
    const sections = {
        introduction: analyzeIntroduction(body),
        body: analyzeBodyContent(body),
        callToAction: analyzeCTASection(body),
        closing: analyzeClosing(body),
    };
    const flow = analyzeFlow(body);
    const overallScore = Math.round(
        sections.introduction.score * 0.25 + sections.body.score * 0.25 +
        sections.callToAction.score * 0.3 + sections.closing.score * 0.05 + flow.score * 0.15
    );
    const analysis: EmailStructureAnalysis = { overallScore, sections, flow, improvements: [] };
    analysis.improvements = generateStructureImprovements(analysis);
    return analysis;
}
