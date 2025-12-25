// Sales Email Analysis Types and Interfaces
// Extracted from sales-analyzer.ts

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
