// SMS Optimizer Types and Interfaces

export interface SmsOptimizationInput {
    baseMessage: string;
    recipientFirstName?: string;
    recipientCompany?: string;
    recipientPosition?: string;
    context?: 'sales' | 'non-sales' | 'reminder' | 'follow-up';
    urgency?: 'low' | 'medium' | 'high';
    hasTriggerEvent?: boolean;
    hasMutualConnection?: boolean;
    hasRecentActivity?: boolean;
}

export interface SmsOptimizationResult {
    optimizedMessage: string;
    charCount: number;
    segmentCount: number;
    hookPreview: string;
    hookScore: number;
    warnings: string[];
    suggestions: string[];
    rulesApplied: string[];
    targetChars: number;
    maxChars: number;
}
