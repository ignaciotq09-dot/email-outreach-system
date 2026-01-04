// AI Self-Review Module - Has AI critique and improve its own extraction
// Part of production-quality extraction system

import OpenAI from 'openai';
import type { ExtractedCompanyData } from './types';
import { validateExtraction, type ValidationResult } from './extraction-validator';

function getOpenAI(): OpenAI {
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    return new OpenAI({ apiKey });
}

const SELF_REVIEW_PROMPT = `You are reviewing your previous extraction for quality issues.

ORIGINAL EXTRACTION:
{extraction}

VALIDATION ISSUES DETECTED:
{issues}

ORIGINAL WEBSITE CONTENT:
{content}

YOUR TASK:
Review each flagged issue and provide IMPROVED values for the problematic fields.

QUALITY RULES:
1. businessDescription MUST:
   ✓ Use action verbs (build, create, provide, manufacture, develop)
   ✓ Include specific nouns (products, services, project types)
   ✓ Describe what they DO/BUILD/SELL
   ✗ NOT be generic corporate speak ("committed to excellence")
   ✗ NOT be about company culture or values

2. problemSolved MUST:
   ✓ Describe a CLIENT problem
   ✓ Explain what CUSTOMERS get
   ✗ NOT be about employee safety or internal culture
   ✗ NOT be generic ("delivering value")

3. All fields MUST:
   ✓ Be specific to THIS company
   ✓ Be useful for sales outreach
   ✓ Be extracted from actual website content

RE-READ the website content and provide BETTER extractions for the flagged fields.

Return JSON:
{
  "improvements": {
    "businessDescription": "IMPROVED: [better description here]",
    "problemSolved": "IMPROVED: [better value here]",
    ...
  },
  "explanation": "I improved X because Y. I found better content in Z section."
}

Only include fields that need improvement. If a field is actually fine, don't include it.`;

export interface SelfReviewResult {
    improved: Partial<ExtractedCompanyData>;
    explanation: string;
    fieldsImproved: string[];
    originalScore: number;
    newScore: number;
}

/**
 * Have AI review and improve its own extraction
 */
export async function selfReviewExtraction(
    originalData: ExtractedCompanyData,
    websiteContent: string,
    validation: ValidationResult
): Promise<SelfReviewResult> {
    const openai = getOpenAI();
    const startTime = Date.now();

    console.log('[SelfReview] Starting AI self-review...');
    console.log(`[SelfReview] Original score: ${validation.score}/100`);
    console.log(`[SelfReview] Issues to fix: ${validation.issues.length}`);

    // Skip if no issues or score is high enough
    if (validation.score >= 80 || validation.issues.length === 0) {
        console.log('[SelfReview] Skipping - extraction quality is good enough');
        return {
            improved: {},
            explanation: 'No improvements needed - extraction quality is sufficient',
            fieldsImproved: [],
            originalScore: validation.score,
            newScore: validation.score,
        };
    }

    // Prepare issue summary for prompt
    const issuesSummary = validation.issues
        .map(i => `- ${i.field}: ${i.message}`)
        .join('\n');

    const suggestionsText = validation.suggestions.join('\n- ');

    // Build the prompt
    const prompt = SELF_REVIEW_PROMPT
        .replace('{extraction}', JSON.stringify({
            businessDescription: originalData.businessDescription,
            problemSolved: originalData.problemSolved,
            uniqueDifferentiator: originalData.uniqueDifferentiator,
            primaryOffering: originalData.primaryOffering,
            industry: originalData.industry,
        }, null, 2))
        .replace('{issues}', issuesSummary + '\n\nSuggestions:\n- ' + suggestionsText)
        .replace('{content}', websiteContent.slice(0, 15000));

    try {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',  // Use mini for cost efficiency
            messages: [
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 1500,
        });

        console.log(`[SelfReview] Complete in ${Date.now() - startTime}ms`);

        const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
        const improvements = parsed.improvements || {};
        const explanation = parsed.explanation || 'No explanation provided';

        // Apply improvements to get the enhanced data
        const improvedData = { ...originalData };
        const fieldsImproved: string[] = [];

        for (const [field, value] of Object.entries(improvements)) {
            if (value && typeof value === 'string' && value.length > 10) {
                // Remove "IMPROVED:" prefix if present
                const cleanValue = value.replace(/^IMPROVED:\s*/i, '');
                (improvedData as any)[field] = cleanValue;
                fieldsImproved.push(field);
                console.log(`[SelfReview] Improved ${field}`);
            }
        }

        // Re-validate with improvements
        const newValidation = validateExtraction(improvedData);
        console.log(`[SelfReview] New score: ${newValidation.score}/100 (was ${validation.score})`);

        return {
            improved: improvements,
            explanation,
            fieldsImproved,
            originalScore: validation.score,
            newScore: newValidation.score,
        };

    } catch (error) {
        console.error('[SelfReview] Error:', error);
        return {
            improved: {},
            explanation: 'Self-review failed due to error',
            fieldsImproved: [],
            originalScore: validation.score,
            newScore: validation.score,
        };
    }
}

/**
 * Apply improvements to original data
 */
export function applyImprovements(
    original: ExtractedCompanyData,
    improvements: Partial<ExtractedCompanyData>
): ExtractedCompanyData {
    const result = { ...original };

    for (const [field, value] of Object.entries(improvements)) {
        if (value !== undefined && value !== null) {
            // Clean up the value
            let cleanValue = value;
            if (typeof value === 'string') {
                cleanValue = value.replace(/^IMPROVED:\s*/i, '').trim();
            }
            (result as any)[field] = cleanValue;
        }
    }

    return result;
}
