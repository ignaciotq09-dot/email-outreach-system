// Types for company onboarding service

export interface OnlinePresenceInput {
    websiteUrl: string;
    instagramHandle?: string;
}

export interface ExtractedCompanyData {
    // 1. Company Identity
    companyName?: string;
    foundedYear?: string;
    headquarters?: string;
    employeeCount?: string;
    companyStage?: string;
    industry?: string;
    subIndustry?: string;

    // 2. Product Catalog
    primaryOffering?: string;
    productCatalog?: string[];
    keyFeatures?: string[];
    useCases?: string[];
    integrations?: string[];

    // 3. Pricing
    pricingModel?: string;
    pricePerProduct?: string;
    productTiers?: string[];
    typicalDealSize?: string;
    billingOptions?: string[];
    trialOptions?: string;
    discountPolicy?: string;

    // 4. Target Customers
    idealCustomerDescription?: string;
    targetCompanySizes?: string[];
    targetIndustries?: string[];
    targetJobTitles?: string[];
    targetGeographies?: string[];
    secondaryTargets?: string;
    buyingTriggers?: string[];

    // 5. Value Proposition
    problemSolved?: string;
    uniqueDifferentiator?: string;
    keyBenefits?: string[];
    proofPoints?: string;
    guarantees?: string;

    // 6. Social Proof
    notableClients?: string;
    customerCount?: string;
    caseStudies?: string[];
    testimonialThemes?: string[];
    awards?: string;
    certifications?: string[];

    // 7. Competitive Landscape
    directCompetitors?: string[];
    competitorWeaknesses?: string;
    ourAdvantages?: string;
    replacementNarrative?: string;

    // 8. Sales Process
    salesCycleLength?: string;
    typicalBuyingProcess?: string;
    decisionMakers?: string[];
    implementationTimeline?: string;
    onboardingProcess?: string;
    supportChannels?: string;

    // 9. Brand Voice
    brandPersonality?: string[];
    formalityLevel?: string;

    // Legacy fields for backwards compatibility
    businessDescription?: string;
    productsServices?: string[];
    tagline?: string;
    missionStatement?: string;
    businessType?: string;
    typicalResults?: string;
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
