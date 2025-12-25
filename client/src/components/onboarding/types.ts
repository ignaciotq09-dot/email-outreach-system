// Types for company onboarding frontend components

export interface OnboardingStatus {
    complete: boolean;
    currentStep: string;
    hasProfile: boolean;
}

export interface CompanyProfile {
    id: number;
    userId: number;
    hasOnlinePresence: boolean;
    websiteUrl?: string;
    instagramHandle?: string;

    // Business Identity
    companyName?: string;
    businessType?: string;
    industry?: string;
    industryOther?: string;
    yearsInBusiness?: string;
    employeeCount?: string;
    tagline?: string;
    missionStatement?: string;

    // Products & Services
    businessDescription?: string;
    productsServices?: string[];
    pricingModel?: string[];
    typicalDealSize?: string;

    // Target Customers
    idealCustomerDescription?: string;
    targetJobTitles?: string[];
    targetIndustries?: string[];
    targetCompanySizes?: string[];
    targetGeographies?: string[];

    // Value Proposition
    problemSolved?: string;
    uniqueDifferentiator?: string;
    typicalResults?: string;
    notableClients?: string;

    // Sales Process
    salesCycleLength?: string;
    commonObjections?: string[];
    currentChallenges?: string;

    // Brand Voice
    brandPersonality?: string[];
    formalityLevel?: string;
    phrasesToUse?: string;
    phrasesToAvoid?: string;

    // CTA
    desiredLeadAction?: string[];
    additionalNotes?: string;

    // Metadata
    dataSource?: string;
    extractionConfidence?: number;
    onboardingStep?: string;
    onboardingComplete?: boolean;
}

export interface ExtractionResult {
    success: boolean;
    data: Partial<CompanyProfile>;
    confidence: Record<string, number>;
    sources?: {
        website?: { url: string; pagesAnalyzed: string[] };
        instagram?: { handle: string; postsAnalyzed: number };
    };
    error?: string;
}

export interface GapQuestion {
    id: string;
    field: string;
    question: string;
    type: 'short_answer' | 'single_select' | 'multi_select' | 'structured';
    options?: string[];
    helpText?: string;
    required: boolean;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface QuestionnaireSection {
    id: string;
    title: string;
    description: string;
    questions: QuestionnaireQuestion[];
}

export interface QuestionnaireQuestion {
    id: string;
    field: string;
    question: string;
    type: 'short_answer' | 'single_select' | 'multi_select' | 'multi_select_with_other';
    options?: string[];
    placeholder?: string;
    helpText?: string;
    required: boolean;
    maxSelections?: number;
}

export type OnboardingStep =
    | 'not_started'
    | 'presence_check'
    | 'url_input'
    | 'ai_extraction'
    | 'validation'
    | 'gap_questions'
    | 'manual_questionnaire'
    | 'review'
    | 'complete';
