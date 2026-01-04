// Smart Gap Question Generator
// Generates context-aware, high-value questions based on extraction gaps
// NOT generic templates - each question is AI-crafted for the specific company

import OpenAI from 'openai';
import type { ExtractedCompanyData, ExtractionGap } from './types';

function getOpenAI(): OpenAI {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');
    return new OpenAI({ apiKey });
}

export interface SmartQuestion {
    id: string;
    field: string;                    // The gap field this fills
    question: string;                 // The context-aware question
    context: string;                  // What we already know (shown to user)
    examples?: string[];              // Relevant examples for this company
    inputType: 'text' | 'multiselect' | 'select';
    options?: string[];               // For select/multiselect
    priority: 'critical' | 'high' | 'medium';
    whyWeNeed: string;               // Brief explanation of why this matters
}

export interface SmartQuestionSet {
    companyContext: string;           // "Based on what we found about [Company]..."
    questions: SmartQuestion[];
    totalGaps: number;
    criticalGaps: number;
}

// Priority mapping for gap fields
const FIELD_PRIORITY: Record<string, 'critical' | 'high' | 'medium'> = {
    // CRITICAL - Can't do effective outreach without these
    'idealCustomerDescription': 'critical',
    'targetJobTitles': 'critical',
    'problemSolved': 'critical',
    'uniqueDifferentiator': 'critical',

    // HIGH - Significantly improves outreach quality
    'targetIndustries': 'high',
    'targetCompanySizes': 'high',
    'typicalDealSize': 'high',
    'keyBenefits': 'high',

    // MEDIUM - Nice to have for personalization
    'targetGeographies': 'medium',
    'salesCycleLength': 'medium',
    'buyingTriggers': 'medium',
    'typicalResults': 'medium',
};

// Why we need each field (for transparency)
const WHY_WE_NEED: Record<string, string> = {
    'idealCustomerDescription': 'To find and target the right prospects for you',
    'targetJobTitles': 'To reach the decision-makers who can actually buy',
    'problemSolved': 'To craft emails that resonate with prospect pain points',
    'uniqueDifferentiator': 'To make your outreach stand out from competitors',
    'targetIndustries': 'To focus on industries where you have the best fit',
    'targetCompanySizes': 'To filter leads by company size you work best with',
    'typicalDealSize': 'To qualify leads and prioritize high-value opportunities',
    'keyBenefits': 'To highlight the most compelling reasons to work with you',
    'targetGeographies': 'To focus outreach on regions you can serve',
    'salesCycleLength': 'To set appropriate follow-up timing',
    'buyingTriggers': 'To reach prospects at the right moment',
    'typicalResults': 'To add credibility with specific outcomes you deliver',
};

/**
 * Generate smart, context-aware questions for extraction gaps
 * Uses AI to craft questions specific to this company
 */
export async function generateSmartQuestions(
    gaps: ExtractionGap[],
    extractedData: ExtractedCompanyData
): Promise<SmartQuestionSet> {
    const openai = getOpenAI();

    // Filter to only high-value gaps (skip low-priority fields)
    const prioritizedGaps = gaps.filter(gap =>
        FIELD_PRIORITY[gap.field] === 'critical' || FIELD_PRIORITY[gap.field] === 'high'
    );

    // If no high-value gaps, return empty
    if (prioritizedGaps.length === 0) {
        return {
            companyContext: '',
            questions: [],
            totalGaps: gaps.length,
            criticalGaps: 0,
        };
    }

    // Build context from what we know
    const knownContext = buildKnownContext(extractedData);

    console.log('[SmartQuestions] Generating questions for gaps:', prioritizedGaps.map(g => g.field).join(', '));
    console.log('[SmartQuestions] Using context:', knownContext.slice(0, 200) + '...');

    // Generate context-aware questions using AI
    const questions = await generateQuestionsWithAI(openai, prioritizedGaps, extractedData, knownContext);

    return {
        companyContext: `Based on what we found about ${extractedData.companyName || 'your company'}...`,
        questions,
        totalGaps: gaps.length,
        criticalGaps: prioritizedGaps.filter(g => FIELD_PRIORITY[g.field] === 'critical').length,
    };
}

/**
 * Build a context string from extracted data
 */
function buildKnownContext(data: ExtractedCompanyData): string {
    const parts: string[] = [];

    if (data.companyName) parts.push(`Company: ${data.companyName}`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.businessDescription) parts.push(`What they do: ${data.businessDescription}`);
    if (data.primaryOffering) parts.push(`Main offering: ${data.primaryOffering}`);
    if (data.productsServices?.length) parts.push(`Products/Services: ${data.productsServices.join(', ')}`);
    if (data.targetIndustries?.length) parts.push(`Target industries: ${data.targetIndustries.join(', ')}`);
    if (data.notableClients) parts.push(`Notable clients: ${data.notableClients}`);
    if (data.brandPersonality?.length) parts.push(`Brand voice: ${data.brandPersonality.join(', ')}`);

    return parts.join('\n');
}

/**
 * Use AI to generate context-specific questions
 */
async function generateQuestionsWithAI(
    openai: OpenAI,
    gaps: ExtractionGap[],
    extractedData: ExtractedCompanyData,
    knownContext: string
): Promise<SmartQuestion[]> {
    const gapFields = gaps.map(g => g.field);

    const prompt = `You are helping onboard ${extractedData.companyName || 'a company'} for B2B sales outreach.

WHAT WE ALREADY KNOW:
${knownContext}

GAPS WE NEED TO FILL:
${gapFields.map(f => `- ${f}: ${WHY_WE_NEED[f] || 'Needed for effective outreach'}`).join('\n')}

YOUR TASK:
Generate conversational, context-aware questions to fill these gaps.

RULES:
1. Each question must reference what we already know about this specific company
2. Provide 2-3 relevant examples based on their industry/business
3. Questions should feel like a helpful conversation, not a form
4. Be specific to THIS company - no generic questions
5. Keep questions concise but informative

For each gap field, generate a question in this JSON format:
{
  "questions": [
    {
      "field": "the gap field name",
      "question": "The conversational question to ask",
      "context": "A brief acknowledgment of what we know (1 sentence)",
      "examples": ["example 1 relevant to their business", "example 2", "example 3"],
      "inputType": "text" | "multiselect" | "select",
      "options": ["option1", "option2"] // only for select/multiselect, make these specific to their industry
    }
  ]
}

EXAMPLES OF GOOD QUESTIONS:

For a construction company missing 'uniqueDifferentiator':
{
  "field": "uniqueDifferentiator",
  "question": "What makes Coastal Construction the choice over other South Florida contractors?",
  "context": "We see you specialize in hospitality and commercial projects.",
  "examples": ["40+ years of regional expertise", "Fast-track construction methods", "Strong permitting relationships"],
  "inputType": "text"
}

For a SaaS company missing 'targetJobTitles':
{
  "field": "targetJobTitles",
  "question": "Who typically makes the decision to purchase your HR platform?",
  "context": "Your platform serves mid-market companies with 50-500 employees.",
  "examples": ["VP of People Operations", "HR Director", "Chief People Officer"],
  "inputType": "multiselect",
  "options": ["HR Director", "VP of People Ops", "Chief People Officer", "CEO/Founder", "Operations Manager"]
}

Generate questions for the gaps listed above. Be specific to ${extractedData.companyName || 'this company'} and their ${extractedData.industry || 'industry'}.`;

    try {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,  // Some creativity for natural questions
            max_tokens: 2000,
        });

        const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
        const rawQuestions = parsed.questions || [];

        // Add metadata to each question
        const questions: SmartQuestion[] = rawQuestions.map((q: any, index: number) => ({
            id: `q-${Date.now()}-${index}`,
            field: q.field,
            question: q.question,
            context: q.context || '',
            examples: q.examples || [],
            inputType: q.inputType || 'text',
            options: q.options || [],
            priority: FIELD_PRIORITY[q.field] || 'medium',
            whyWeNeed: WHY_WE_NEED[q.field] || 'Helps personalize your outreach',
        }));

        console.log(`[SmartQuestions] Generated ${questions.length} context-aware questions`);

        // Sort by priority (critical first)
        return questions.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

    } catch (error) {
        console.error('[SmartQuestions] AI generation failed:', error);
        // Fallback to template questions if AI fails
        return generateFallbackQuestions(gaps, extractedData);
    }
}

/**
 * Fallback template questions if AI generation fails
 * Still uses context, but less dynamic
 */
function generateFallbackQuestions(
    gaps: ExtractionGap[],
    data: ExtractedCompanyData
): SmartQuestion[] {
    const company = data.companyName || 'your company';
    const industry = data.industry || 'your industry';

    const templateQuestions: Record<string, Partial<SmartQuestion>> = {
        'uniqueDifferentiator': {
            question: `What makes ${company} stand out from other ${industry} companies?`,
            context: `We found that you offer ${data.primaryOffering || 'various services'}.`,
            examples: ['Faster delivery', 'Better pricing', 'Specialized expertise', 'Superior quality'],
            inputType: 'text',
        },
        'targetJobTitles': {
            question: `Who typically decides to work with ${company}?`,
            context: `Understanding your buyers helps us find the right contacts.`,
            inputType: 'multiselect',
            options: ['CEO/Founder', 'VP/Director', 'Manager', 'Owner', 'Procurement'],
        },
        'problemSolved': {
            question: `What's the main problem ${company} solves for clients?`,
            context: `This helps us craft compelling outreach messages.`,
            examples: ['Saves time', 'Reduces costs', 'Improves quality', 'Increases revenue'],
            inputType: 'text',
        },
        'idealCustomerDescription': {
            question: `Describe your ideal client for ${company}.`,
            context: `We'll use this to find the best-fit prospects.`,
            examples: ['Mid-size companies', 'Fast-growing startups', 'Enterprise organizations'],
            inputType: 'text',
        },
        'targetIndustries': {
            question: `Which industries does ${company} primarily serve?`,
            context: `This helps us focus on the right prospects.`,
            inputType: 'multiselect',
            options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Professional Services'],
        },
        'targetCompanySizes': {
            question: `What size companies work best with ${company}?`,
            context: `We'll filter leads to match your ideal customer.`,
            inputType: 'multiselect',
            options: ['Startups (1-10)', 'Small Business (11-50)', 'Mid-Market (51-500)', 'Enterprise (500+)'],
        },
        'typicalDealSize': {
            question: `What's a typical project or contract value for ${company}?`,
            context: `This helps us qualify and prioritize leads.`,
            inputType: 'select',
            options: ['Under $5K', '$5K-$25K', '$25K-$100K', '$100K-$500K', '$500K+'],
        },
    };

    return gaps
        .filter(gap => templateQuestions[gap.field])
        .map((gap, index) => ({
            id: `fallback-${Date.now()}-${index}`,
            field: gap.field,
            question: templateQuestions[gap.field].question || `Tell us about ${gap.field}`,
            context: templateQuestions[gap.field].context || '',
            examples: templateQuestions[gap.field].examples,
            inputType: templateQuestions[gap.field].inputType || 'text',
            options: templateQuestions[gap.field].options,
            priority: FIELD_PRIORITY[gap.field] || 'medium',
            whyWeNeed: WHY_WE_NEED[gap.field] || 'Helps with outreach',
        })) as SmartQuestion[];
}

/**
 * Process user answers and update extracted data
 */
export function applyAnswersToData(
    data: ExtractedCompanyData,
    answers: Record<string, string | string[]>
): ExtractedCompanyData {
    const updated = { ...data };

    for (const [field, answer] of Object.entries(answers)) {
        if (answer && (typeof answer === 'string' ? answer.trim() : answer.length > 0)) {
            (updated as any)[field] = answer;
        }
    }

    return updated;
}
