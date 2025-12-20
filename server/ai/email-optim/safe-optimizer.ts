/**
 * Safe Email Optimizer
 * Provides suggestions WITHOUT fabricating content
 * Only works with information present in the original email
 */

import { callOpenAIWithTimeout } from '../openai-client';
import { validateSuggestion, validateOptimizationResult } from './content-validator';
import { analyzeEmailComprehensive } from './comprehensive-analyzer';
import type { RecipientData, DetailedAnalysisResult } from './types';

export interface SafeSuggestion {
    id: string;
    element: 'subject' | 'opening' | 'greeting' | 'body' | 'closing' | 'cta';
    original: string;
    suggested: string;
    reason: string;
    impact: string;
    isValid: boolean;
    validationWarning?: string;
}

export interface SafeOptimizationResult {
    originalEmail: {
        subject: string;
        body: string;
    };
    analysis: DetailedAnalysisResult;
    suggestions: SafeSuggestion[];
    warnings: string[];
    previewWithSuggestions?: {
        subject: string;
        body: string;
    };
}

/**
 * System prompt that strictly prevents fabrication
 */
const SAFE_SYSTEM_PROMPT = `You are an email optimization expert. Your job is to suggest IMPROVEMENTS to an email.

CRITICAL RULES - FOLLOW EXACTLY:
1. NEVER add information, claims, facts, names, companies, or topics not in the original email
2. NEVER invent personalization like "I noticed your..." or "Congratulations on..."
3. ONLY suggest improvements to the EXISTING content
4. If the email is too short or vague, say so - do NOT invent context
5. Focus on: clarity, structure, call-to-action, and tone - not adding new content

You may suggest:
- Better word choices for existing ideas
- Restructuring existing sentences
- Adding specific time to vague "let's meet" requests
- Making existing CTAs clearer
- Improving subject line based on email content

You may NOT suggest:
- Adding compliments or observations not in original
- Adding claims about the recipient's company/work
- Adding statistics or benefits not mentioned
- Adding social proof not in original
- Completely rewriting with new topics`;

/**
 * Build user prompt for safe optimization
 */
function buildUserPrompt(subject: string, body: string, recipientData?: RecipientData): string {
    let prompt = `ORIGINAL EMAIL:
Subject: ${subject || '(no subject)'}
Body:
${body}

`;

    if (recipientData?.name) {
        prompt += `Recipient name: ${recipientData.name}\n`;
    }
    if (recipientData?.company) {
        prompt += `Recipient company: ${recipientData.company}\n`;
    }

    prompt += `
TASK: Suggest up to 5 specific improvements. For each, provide:
1. Which element (subject/opening/body/closing/cta)
2. The EXACT original text being improved
3. Your suggested improvement
4. Why this helps (1 sentence)

IMPORTANT: If the email is very short or lacks context, acknowledge this limitation instead of inventing content.

Respond in JSON format:
{
  "emailQuality": "good" | "needs_work" | "too_short",
  "qualityNote": "Brief assessment",
  "suggestions": [
    {
      "element": "subject" | "opening" | "body" | "closing" | "cta",
      "original": "exact text from email",
      "suggested": "improved version",
      "reason": "why this helps"
    }
  ]
}`;

    return prompt;
}

/**
 * Parse AI response safely
 */
function parseAIResponse(content: string): any {
    try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('[SafeOptimizer] Failed to parse AI response:', e);
    }
    return null;
}

/**
 * Generate rule-based suggestions without AI
 * Used as fallback or when email is too short
 */
function generateRuleBasedSuggestions(subject: string, body: string): SafeSuggestion[] {
    const suggestions: SafeSuggestion[] = [];
    let id = 0;

    // Check for missing subject
    if (!subject || subject.trim().length === 0) {
        suggestions.push({
            id: `rule-${id++}`,
            element: 'subject',
            original: '(empty)',
            suggested: 'Add a clear subject line based on your email content',
            reason: 'Emails without subjects have 70% lower open rates',
            impact: 'Critical for email deliverability',
            isValid: true,
        });
    }

    // Check for very short email
    const wordCount = body.split(/\s+/).filter(w => w).length;
    if (wordCount < 10) {
        suggestions.push({
            id: `rule-${id++}`,
            element: 'body',
            original: body,
            suggested: 'Consider adding more context to your message',
            reason: 'Very short emails may lack the context needed for a response',
            impact: 'Improves clarity',
            isValid: true,
        });
    }

    // Check for generic greeting
    if (/^(hi|hello|hey)[\s,!]*$/i.test(body.split('\n')[0]?.trim() || '')) {
        suggestions.push({
            id: `rule-${id++}`,
            element: 'greeting',
            original: body.split('\n')[0]?.trim() || '',
            suggested: 'Add recipient name if known',
            reason: 'Personalized greetings increase engagement',
            impact: '+26% response rate with names',
            isValid: true,
        });
    }

    // Check for missing CTA
    const hasCTA = /\?|let me know|interested|available|thoughts|call|meet|chat/i.test(body);
    if (!hasCTA) {
        suggestions.push({
            id: `rule-${id++}`,
            element: 'cta',
            original: '(no clear call-to-action)',
            suggested: 'End with a clear question or request',
            reason: 'Emails with questions get more replies',
            impact: '+44% response rate with question CTAs',
            isValid: true,
        });
    }

    // Check for vague meeting request
    if (/let's meet|catch up|get together/i.test(body) && !/\d/.test(body)) {
        const meetMatch = body.match(/let's meet|catch up|get together/i);
        if (meetMatch) {
            suggestions.push({
                id: `rule-${id++}`,
                element: 'cta',
                original: meetMatch[0],
                suggested: `${meetMatch[0]} at [specific time]?`,
                reason: 'Specific times make scheduling easier',
                impact: 'Reduces back-and-forth emails',
                isValid: true,
            });
        }
    }

    return suggestions;
}

/**
 * Main safe optimization function
 */
export async function safeOptimizeEmail(
    subject: string,
    body: string,
    recipientData?: RecipientData
): Promise<SafeOptimizationResult> {
    const fullOriginal = `${subject} ${body}`;
    const warnings: string[] = [];

    // Run comprehensive analysis first (rule-based, no AI fabrication)
    const analysis = analyzeEmailComprehensive(subject, body, recipientData);

    // Start with rule-based suggestions
    let suggestions = generateRuleBasedSuggestions(subject, body);

    // Only call AI if email has enough content to work with
    const wordCount = body.split(/\s+/).filter(w => w).length;

    if (wordCount >= 5) {
        try {
            const response = await callOpenAIWithTimeout(
                [
                    { role: 'system', content: SAFE_SYSTEM_PROMPT },
                    { role: 'user', content: buildUserPrompt(subject, body, recipientData) },
                ],
                'gpt-4o-mini',
                30000
            );

            const content = response?.choices?.[0]?.message?.content || '';
            const parsed = parseAIResponse(content);

            if (parsed && parsed.suggestions && Array.isArray(parsed.suggestions)) {
                // Validate each AI suggestion
                for (const aiSuggestion of parsed.suggestions) {
                    const validation = validateSuggestion(
                        aiSuggestion.original || '',
                        aiSuggestion.suggested || '',
                        fullOriginal
                    );

                    const safeSuggestion: SafeSuggestion = {
                        id: `ai-${suggestions.length}`,
                        element: aiSuggestion.element || 'body',
                        original: aiSuggestion.original || '',
                        suggested: aiSuggestion.suggested || '',
                        reason: aiSuggestion.reason || '',
                        impact: getImpactFromElement(aiSuggestion.element),
                        isValid: validation.isValid,
                        validationWarning: validation.isValid ? undefined : validation.rejectedReason,
                    };

                    // Only include valid suggestions (no fabrication)
                    if (validation.isValid) {
                        suggestions.push(safeSuggestion);
                    } else {
                        warnings.push(`Rejected AI suggestion: ${validation.rejectedReason}`);
                    }
                }

                // Add quality note if provided
                if (parsed.qualityNote) {
                    warnings.push(`AI assessment: ${parsed.qualityNote}`);
                }
            }
        } catch (error) {
            console.error('[SafeOptimizer] AI call failed:', error);
            warnings.push('AI optimization unavailable - showing rule-based suggestions only');
        }
    } else {
        warnings.push('Email is too short for AI optimization - showing rule-based suggestions');
    }

    // Deduplicate suggestions
    suggestions = deduplicateSuggestions(suggestions);

    // Generate preview with valid suggestions applied
    const preview = generatePreview(subject, body, suggestions.filter(s => s.isValid));

    return {
        originalEmail: { subject, body },
        analysis,
        suggestions,
        warnings,
        previewWithSuggestions: preview,
    };
}

/**
 * Get impact description based on element type
 */
function getImpactFromElement(element: string): string {
    const impacts: Record<string, string> = {
        subject: 'Improves open rate',
        opening: 'Increases read-through',
        greeting: 'Adds personal touch',
        body: 'Improves clarity',
        closing: 'Strengthens impression',
        cta: 'Increases response rate',
    };
    return impacts[element] || 'Improves email quality';
}

/**
 * Remove duplicate suggestions
 */
function deduplicateSuggestions(suggestions: SafeSuggestion[]): SafeSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
        const key = `${s.element}-${s.original.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Generate preview with suggestions applied
 */
function generatePreview(
    subject: string,
    body: string,
    suggestions: SafeSuggestion[]
): { subject: string; body: string } {
    let previewSubject = subject;
    let previewBody = body;

    for (const suggestion of suggestions) {
        if (!suggestion.original || suggestion.original === '(empty)' || suggestion.original.startsWith('(no ')) {
            continue; // Skip meta-suggestions
        }

        if (suggestion.element === 'subject') {
            previewSubject = suggestion.suggested;
        } else {
            // Try to replace the original text with suggestion
            if (previewBody.includes(suggestion.original)) {
                previewBody = previewBody.replace(suggestion.original, suggestion.suggested);
            }
        }
    }

    return { subject: previewSubject, body: previewBody };
}

// Export for testing
export { generateRuleBasedSuggestions, SAFE_SYSTEM_PROMPT };
