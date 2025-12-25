// Subject Line Optimizer Types and Interfaces

export interface SubjectLineOptimization {
    score: number;
    analysis: {
        length: LengthAnalysis;
        hookType: HookTypeAnalysis;
        emotionalTriggers: EmotionalTriggerAnalysis;
        spamRisk: SpamRiskAnalysis;
        mobilePreview: MobilePreviewAnalysis;
        personalization: PersonalizationAnalysis;
    };
    improvements: SubjectImprovement[];
    suggestions: SuggestedSubject[];
}

export interface LengthAnalysis {
    charCount: number;
    wordCount: number;
    status: 'too_short' | 'optimal' | 'too_long' | 'mobile_optimal';
    mobileVisible: number;
    desktopVisible: number;
}

export interface HookTypeAnalysis {
    detected: string[];
    effective: boolean;
    recommendations: string[];
}

export interface EmotionalTriggerAnalysis {
    triggers: Array<{ type: string; word: string; boost: string }>;
    score: number;
}

export interface SpamRiskAnalysis {
    score: number;
    triggers: string[];
    recommendations: string[];
}

export interface MobilePreviewAnalysis {
    previewText: string;
    isComplete: boolean;
    recommendations: string[];
}

export interface PersonalizationAnalysis {
    hasTokens: boolean;
    hasName: boolean;
    hasCompany: boolean;
    score: number;
}

export interface SubjectImprovement {
    issue: string;
    suggestion: string;
    impact: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface SuggestedSubject {
    text: string;
    hookType: string;
    predictedBoost: string;
}
