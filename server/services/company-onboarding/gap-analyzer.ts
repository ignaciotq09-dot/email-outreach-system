// Gap analyzer - identifies missing fields and generates targeted questions

import type { ExtractedCompanyData, GapQuestion } from './types';

// Required fields with their priority and minimum confidence threshold
// Only ask for CRITICAL sales info - don't burden user with unnecessary questions
const fieldRequirements: Partial<Record<keyof ExtractedCompanyData, {
    priority: 'critical' | 'high' | 'medium' | 'low';
    minConfidence: number;
    question: string;
    type: GapQuestion['type'];
    options?: string[];
    helpText?: string;
}>> = {
    // 1. Company Identity - only ask for name
    companyName: {
        priority: 'critical',
        minConfidence: 95,
        question: 'What is your company name?',
        type: 'short_answer',
    },
    industry: {
        priority: 'high',
        minConfidence: 70,
        question: 'What industry is your business in?',
        type: 'single_select',
        options: [
            'Technology / Software / SaaS',
            'Professional Services',
            'Healthcare / Medical',
            'Real Estate',
            'Financial Services',
            'Marketing / Advertising',
            'E-commerce / Retail',
            'Manufacturing',
            'Construction / Trades',
            'Education / Training',
            'Other',
        ],
    },

    // 2. Product Catalog - CRITICAL
    primaryOffering: {
        priority: 'critical',
        minConfidence: 70,
        question: 'In one sentence, what does your company do?',
        type: 'short_answer',
        helpText: 'Keep it simple and clear',
    },
    productCatalog: {
        priority: 'critical',
        minConfidence: 60,
        question: 'What are ALL the specific products/services you offer?',
        type: 'short_answer',
        helpText: 'List EVERY product with variants (e.g., "Basic plan, Pro plan, Enterprise" or "Consulting, Training, Support")',
    },

    // 3. Pricing
    pricingModel: {
        priority: 'high',
        minConfidence: 40,
        question: 'How do you charge customers?',
        type: 'single_select',
        options: ['Subscription (SaaS)', 'Per-seat/user', 'Usage-based', 'One-time purchase', 'Project-based', 'Retainer', 'Custom/negotiated'],
    },
    productTiers: {
        priority: 'high',
        minConfidence: 30,
        question: "What are your pricing tiers?",
        type: 'short_answer',
        helpText: 'e.g., "Basic: $99/mo, Pro: $299/mo, Enterprise: Custom"',
    },
    typicalDealSize: {
        priority: 'high',
        minConfidence: 30,
        question: "What's your typical deal size or pricing tier?",
        type: 'single_select',
        options: ['Under $500', '$500-2000', '$2000-10,000', '$10,000+', 'Custom pricing'],
    },

    // 4. Target Customers - CRITICAL
    idealCustomerDescription: {
        priority: 'critical',
        minConfidence: 60,
        question: 'Who is your ideal customer?',
        type: 'short_answer',
        helpText: 'Be specific (e.g., "VP of Sales at mid-market B2B SaaS companies with 50-200 employees")',
    },
    targetJobTitles: {
        priority: 'high',
        minConfidence: 40,
        question: 'What job titles do you typically sell to?',
        type: 'short_answer',
        helpText: 'Example: CEO, Marketing Director, VP of Sales',
    },
    targetCompanySizes: {
        priority: 'high',
        minConfidence: 40,
        question: 'What size companies do you work with best?',
        type: 'multi_select',
        options: ['Startups (1-10)', 'Small Business (11-50)', 'Mid-Market (51-500)', 'Enterprise (500+)'],
    },
    targetIndustries: {
        priority: 'medium',
        minConfidence: 30,
        question: 'What industries are your ideal customers in?',
        type: 'multi_select',
        options: ['Technology', 'Healthcare', 'Financial', 'Professional Services', 'E-commerce', 'Manufacturing', 'Any industry'],
    },
    buyingTriggers: {
        priority: 'medium',
        minConfidence: 30,
        question: 'What typically triggers a customer to start looking for your solution?',
        type: 'short_answer',
        helpText: 'e.g., "New funding round", "Hiring surge", "Compliance deadline"',
    },

    // 5. Value Proposition - CRITICAL
    problemSolved: {
        priority: 'critical',
        minConfidence: 60,
        question: 'What main problem does your product/service solve?',
        type: 'short_answer',
        helpText: 'Think about the pain your customers had before finding you',
    },
    uniqueDifferentiator: {
        priority: 'high',
        minConfidence: 50,
        question: 'What makes you different from competitors?',
        type: 'short_answer',
        helpText: "What's the #1 reason customers choose you over alternatives?",
    },

    // 6. Social Proof
    notableClients: {
        priority: 'medium',
        minConfidence: 20,
        question: 'Do you have any notable clients or case studies?',
        type: 'short_answer',
    },

    // 7. Competitive Landscape
    directCompetitors: {
        priority: 'medium',
        minConfidence: 30,
        question: 'Who are your main competitors?',
        type: 'short_answer',
        helpText: 'List 2-5 companies prospects typically compare you against',
    },

    // 8. Sales Process
    salesCycleLength: {
        priority: 'high',
        minConfidence: 30,
        question: 'How long is your typical sales cycle?',
        type: 'single_select',
        options: ['Same day/week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', '6+ months'],
    },

    // 9. Brand Voice
    formalityLevel: {
        priority: 'medium',
        minConfidence: 50,
        question: 'How formal should your communication be?',
        type: 'single_select',
        options: ['Very formal', 'Professional but friendly', 'Casual and conversational'],
    },
    brandPersonality: {
        priority: 'medium',
        minConfidence: 40,
        question: "How would you describe your brand's personality?",
        type: 'multi_select',
        options: ['Professional', 'Friendly', 'Expert', 'Innovative', 'Casual', 'Bold', 'Warm', 'Practical'],
    },
};

export function analyzeGaps(
    extractedData: ExtractedCompanyData,
    confidenceScores: Record<keyof ExtractedCompanyData, number>
): GapQuestion[] {
    const gaps: GapQuestion[] = [];

    for (const [field, requirements] of Object.entries(fieldRequirements)) {
        const key = field as keyof ExtractedCompanyData;
        const value = extractedData[key];
        const confidence = confidenceScores[key] || 0;

        // Field is missing or confidence is too low
        const isMissing = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && value.length === 0);
        const isLowConfidence = confidence < requirements.minConfidence;

        if (isMissing || isLowConfidence) {
            // Only add critical and high priority gaps, or medium if we have fewer than 5 questions
            if (requirements.priority === 'critical' || requirements.priority === 'high') {
                gaps.push({
                    id: `gap_${field}`,
                    field: key,
                    question: requirements.question,
                    type: requirements.type,
                    options: requirements.options,
                    helpText: requirements.helpText,
                    required: requirements.priority === 'critical',
                    priority: requirements.priority,
                });
            }
        }
    }

    // If we have too few questions, add some medium priority ones
    if (gaps.length < 5) {
        for (const [field, requirements] of Object.entries(fieldRequirements)) {
            if (requirements.priority === 'medium') {
                const key = field as keyof ExtractedCompanyData;
                const value = extractedData[key];
                const confidence = confidenceScores[key] || 0;
                const isMissing = value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0);
                const isLowConfidence = confidence < requirements.minConfidence;

                if ((isMissing || isLowConfidence) && gaps.length < 8) {
                    gaps.push({
                        id: `gap_${field}`,
                        field: key,
                        question: requirements.question,
                        type: requirements.type,
                        options: requirements.options,
                        helpText: requirements.helpText,
                        required: false,
                        priority: requirements.priority,
                    });
                }
            }
        }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Limit to max 10 questions to avoid overwhelming the user
    return gaps.slice(0, 10);
}

export function getGapQuestions(
    extractedData: ExtractedCompanyData,
    confidenceScores: Record<keyof ExtractedCompanyData, number>
): GapQuestion[] {
    return analyzeGaps(extractedData, confidenceScores);
}

export function hasRequiredGaps(gaps: GapQuestion[]): boolean {
    return gaps.some(g => g.required);
}

export function getCriticalGapCount(gaps: GapQuestion[]): number {
    return gaps.filter(g => g.priority === 'critical').length;
}
