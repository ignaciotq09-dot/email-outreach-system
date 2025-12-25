// Types for company onboarding service

export interface OnlinePresenceInput {
    websiteUrl: string;
    instagramHandle?: string;
}

export interface ExtractedCompanyData {
    // Company Identity
    companyName?: string;
    legalName?: string;
    businessType?: string;
    industry?: string;
    subIndustry?: string;
    yearsInBusiness?: string;
    employeeCount?: string;
    companyStage?: string;
    tagline?: string;
    missionStatement?: string;
    headquarters?: string;

    // Business Model
    businessModel?: string;
    revenueModel?: string;
    typicalDealSize?: string;
    pricingTiers?: string;

    // Products & Services (CRITICAL)
    primaryOffering?: string;
    productCatalog?: string[];  // Every specific product/service variant
    productsServices?: string[];  // High-level category list
    businessDescription?: string;
    keyFeatures?: string[];
    useCases?: string[];
    integrations?: string[];
    deliverables?: string;
    pricingModel?: string[];

    // Target Customers (CRITICAL for Lead Qualification)
    idealCustomerDescription?: string;
    targetIndustries?: string[];
    targetCompanySizes?: string[];
    targetJobTitles?: string[];
    targetGeographies?: string[];
    buyerPersonas?: string[];
    disqualificationCriteria?: string;

    // Value Proposition
    problemSolved?: string;
    uniqueDifferentiator?: string;
    keyBenefits?: string[];
    proofPoints?: string;
    competitiveAdvantages?: string;
    whatTheyDontDo?: string;
    typicalResults?: string;
    notableClients?: string;
    awards?: string;

    // Sales Process
    salesCycleLength?: string;
    decisionMakers?: string[];
    buyingTriggers?: string[];
    commonObjections?: string[];
    competitorsList?: string[];
    dealBreakers?: string[];
    reasonsCustomersSwitch?: string;
    successCriteria?: string;
    currentChallenges?: string;

    // Brand Voice
    brandPersonality?: string[];
    formalityLevel?: string;
    toneDescriptors?: string[];
    keyMessages?: string[];
    phrasesToUse?: string;
    phrasesToAvoid?: string;
    communicationStyle?: string;
    valueWords?: string;

    // Social Proof
    caseStudies?: string[];
    testimonialThemes?: string[];
    certifications?: string[];
    partnerRelationships?: string[];
    mediaPress?: string;
}

export interface ExtractionResult {
    success: boolean;
    data: ExtractedCompanyData;
    confidence: Record<keyof ExtractedCompanyData, number>; // 0-100 for each field
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
