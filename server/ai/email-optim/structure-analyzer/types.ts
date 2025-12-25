// Email Structure Analyzer Types and Interfaces

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
