// Types for company onboarding service

export interface OnlinePresenceInput {
    websiteUrl: string;
    instagramHandle?: string;
}

export interface ExtractedCompanyData {
    // === TIER 1: CRITICAL (Must Extract) ===
    // 1. Company Identity (4 fields)
    companyName?: string;
    industry?: string;
    businessDescription?: string;
    employeeCount?: string;

    // 2. Products & Services (3 fields)
    primaryOffering?: string;
    productsServices?: string[]; // Legacy name for productCatalog
    pricingModel?: string;

    // 3. Target Customers - ICP (5 fields) - CRITICAL
    idealCustomerDescription?: string;
    targetJobTitles?: string[];
    targetCompanySizes?: string[];
    targetIndustries?: string[];
    notableClients?: string;

    // === TIER 2: HIGH VALUE (ICP & Brand) ===
    // 4. Pricing (3 fields)
    typicalDealSize?: string;
    productTiers?: string[];
    typicalResults?: string;

    // 5. Value Proposition (4 fields)
    problemSolved?: string;
    uniqueDifferentiator?: string;
    keyBenefits?: string[];
    proofPoints?: string;

    // 6. Sales Context (3 fields)
    salesCycleLength?: string;
    targetGeographies?: string[];
    buyingTriggers?: string[];

    // 7. Brand Voice (2 fields)
    brandPersonality?: string[];
    formalityLevel?: string;

    // === TIER 3: NICE TO HAVE ===
    // 8. Social Proof (2 fields)
    customerCount?: string;
    caseStudies?: string[];

    // 9. Product Details (3 fields)
    keyFeatures?: string[];
    useCases?: string[];
    headquarters?: string;

    // 10. Competitive (3 fields)
    directCompetitors?: string[];
    awards?: string;
    certifications?: string[];

    // === NEW: Brand Summary ===
    brandSummary?: string; // 2-3 sentence synthesized brand identity

    // === DEPRECATED (kept for backward compatibility, not extracted) ===
    foundedYear?: string;
    companyStage?: string;
    subIndustry?: string;
    productCatalog?: string[];
    integrations?: string[];
    pricePerProduct?: string;
    billingOptions?: string[];
    trialOptions?: string;
    discountPolicy?: string;
    secondaryTargets?: string;
    guarantees?: string;
    testimonialThemes?: string[];
    competitorWeaknesses?: string;
    ourAdvantages?: string;
    replacementNarrative?: string;
    typicalBuyingProcess?: string;
    decisionMakers?: string[];
    implementationTimeline?: string;
    onboardingProcess?: string;
    supportChannels?: string;
    tagline?: string;
    missionStatement?: string;
    businessType?: string;
    phrasesToUse?: string;
    phrasesToAvoid?: string;
    currentChallenges?: string;
}

// Tracks fields that couldn't be extracted from the website
export interface ExtractionGap {
    field: keyof ExtractedCompanyData;
    reason: 'not_found' | 'low_confidence' | 'ambiguous';
    searchedPages?: string[];
}

export interface ExtractionResult {
    success: boolean;
    data: ExtractedCompanyData;
    confidence: Record<keyof ExtractedCompanyData, number>; // 0-100 for each field
    gaps: ExtractionGap[]; // Fields that couldn't be extracted
    sources: {
        website?: {
            url: string;
            pagesAnalyzed: string[];
        };
        instagram?: {
            handle: string;
            postsAnalyzed: number;
        };
    };
    error?: string;
}

export interface ValidationSection {
    id: string;
    title: string;
    icon: string;
    fields: {
        key: keyof ExtractedCompanyData;
        label: string;
        value: any;
        confidence: number;
        editable: boolean;
    }[];
}

export interface GapQuestion {
    id: string;
    field: keyof ExtractedCompanyData;
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
    field: keyof ExtractedCompanyData | string;
    question: string;
    type: 'short_answer' | 'single_select' | 'multi_select' | 'multi_select_with_other';
    options?: string[];
    placeholder?: string;
    helpText?: string;
    required: boolean;
    maxSelections?: number;
}

export interface FieldValidation {
    validated: boolean;
    wasCorrect: boolean;
    correctedAt?: string;
}

export type ValidatedFields = Record<string, FieldValidation>;
