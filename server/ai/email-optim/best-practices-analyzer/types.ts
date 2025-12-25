// Best Practices Analyzer Types and Interfaces

export interface BestPracticesAnalysis {
    overallScore: number;
    readability: ReadabilityScore;
    structure: StructureScore;
    tone: ToneScore;
    actionClarity: ActionClarityScore;
    lengthAnalysis: LengthAnalysis;
    improvements: BestPracticeImprovement[];
}

export interface ReadabilityScore {
    score: number;
    gradeLevel: number;
    avgSentenceLength: number;
    avgWordLength: number;
    complexWordPercentage: number;
    issues: string[];
}

export interface StructureScore {
    score: number;
    paragraphCount: number;
    avgParagraphLength: number;
    hasWhiteSpace: boolean;
    isVisuallyClean: boolean;
    issues: string[];
}

export interface ToneScore {
    score: number;
    detectedTone: 'formal' | 'professional' | 'casual' | 'friendly' | 'aggressive' | 'passive';
    isConsistent: boolean;
    sentimentBalance: 'positive' | 'neutral' | 'negative';
}

export interface ActionClarityScore {
    score: number;
    hasNextStep: boolean;
    isSpecific: boolean;
    isEasyToAction: boolean;
}

export interface LengthAnalysis {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
    recommendation: 'too_short' | 'optimal' | 'too_long';
    suggestedWordCount: { min: number; max: number };
}

export interface BestPracticeImprovement {
    category: 'readability' | 'structure' | 'tone' | 'action' | 'length';
    priority: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    impact: string;
}
