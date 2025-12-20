/**
 * SMS Optimizer - Research-Backed "Perfect SMS" Engine
 * 
 * Dynamic optimization based on:
 * - Message type (cold outreach, reminder, follow-up, etc.)
 * - Input length (more data = more precision possible)
 * - Personalization data available
 * - Urgency level
 * 
 * Research findings applied:
 * - Under 100 chars = 2-5x higher response rate
 * - First 35-40 chars = hook zone (notification preview)
 * - Questions end with ? = higher engagement
 * - No emojis in B2B (drops char limit to 70)
 * - Multi-segment SMS has lower engagement
 */

import { callOpenAIFast } from '../openai-client';
import {
    getSmsLengthRules,
    SMS_HOOK_RULES,
    detectPersonalizationRichness,
    type SmsOptimizationContext
} from '../optimization-rules/channel-rules';

export interface SmsOptimizationInput {
    baseMessage: string;
    recipientFirstName?: string;
    recipientCompany?: string;
    recipientPosition?: string;
    context?: 'sales' | 'non-sales' | 'reminder' | 'follow-up';
    urgency?: 'low' | 'medium' | 'high';
    // Additional personalization signals
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

/**
 * Build dynamic system prompt based on context
 */
function buildSystemPrompt(context: SmsOptimizationContext, lengthRules: ReturnType<typeof getSmsLengthRules>): string {
    return `You are an elite SMS copywriter specialized in high-conversion B2B messages.

## YOUR MISSION
Convert the user's message into a ${lengthRules.targetChars}-character "perfect SMS" that maximizes opens and responses.

## CHARACTER LIMITS (CRITICAL)
- TARGET: ${lengthRules.targetChars} characters
- MAXIMUM: ${lengthRules.maxChars} characters (HARD LIMIT - never exceed)
- REASON: ${lengthRules.rationale}

## MESSAGE TYPE: ${context.messageType.toUpperCase().replace('_', ' ')}

## HOOK ZONE RULES (First ${SMS_HOOK_RULES.hookZoneChars} characters)
The first ${SMS_HOOK_RULES.hookZoneChars} characters appear in notification previews. They MUST:
1. Start with recipient's first name (if provided)
2. Immediately communicate value or curiosity
3. NOT start with "Hi", "Hey", or "Hello" (wastes precious chars)

## STRUCTURE FORMULA
[Name], [Value/Curiosity hook] - [Single CTA as question]?

## PSYCHOLOGY TRIGGERS TO USE
- Curiosity: "Quick thought about..."
- Urgency: "Before Friday...", "Today only..."
- Direct value: "Noticed X about Y..."
- Question ending: ALWAYS end with "?" (2-5x engagement boost)

## FORBIDDEN (WILL REDUCE RESPONSE RATES)
- ❌ Emojis (drops limit to 70 chars in B2B)
- ❌ Corporate jargon (synergy, leverage, circle back)
- ❌ Lengthy greetings or pleasantries
- ❌ Multiple CTAs or questions
- ❌ Links (unless specifically requested)
- ❌ ALL CAPS for emphasis

## NO-FABRICATION RULES (CRITICAL)
- ONLY use information explicitly provided
- Do NOT invent compliments or achievements
- Do NOT make up mutual connections
- If data is missing, use generic but effective patterns

## OUTPUT
Return ONLY the optimized SMS text. No quotes, no explanations, no labels.`;
}

/**
 * Build user prompt with all available data
 */
function buildUserPrompt(input: SmsOptimizationInput, lengthRules: ReturnType<typeof getSmsLengthRules>): string {
    const parts: string[] = [];

    parts.push(`=== ORIGINAL MESSAGE TO OPTIMIZE ===`);
    parts.push(`"${input.baseMessage}"`);
    parts.push(`(${input.baseMessage.length} characters)\n`);

    parts.push(`=== RECIPIENT DATA ===`);
    if (input.recipientFirstName) {
        parts.push(`First name: ${input.recipientFirstName} (MUST start message with this)`);
    } else {
        parts.push(`No name provided - use "Hey" or skip greeting entirely`);
    }

    if (input.recipientCompany) {
        parts.push(`Company: ${input.recipientCompany} (reference if space allows)`);
    }

    if (input.recipientPosition) {
        parts.push(`Position: ${input.recipientPosition}`);
    }

    parts.push(`\n=== OPTIMIZATION TARGETS ===`);
    parts.push(`Target length: ${lengthRules.targetChars} characters`);
    parts.push(`Maximum allowed: ${lengthRules.maxChars} characters`);
    parts.push(`Must end with: ? (question format)`);

    parts.push(`\nOptimize now. Output ONLY the SMS text.`);

    return parts.join('\n');
}

/**
 * Detect message type from content
 */
function detectMessageType(message: string): SmsOptimizationContext['messageType'] {
    const lower = message.toLowerCase();

    if (/\b(reminder|appointment|meeting|scheduled|confirm)\b/.test(lower)) {
        return 'appointment_reminder';
    }
    if (/\b(following up|follow up|checking in|just wanted to)\b/.test(lower)) {
        return 'follow_up';
    }
    if (/\b(confirmed|booked|receipt|thank you for)\b/.test(lower)) {
        return 'confirmation';
    }
    if (/\b(sale|discount|offer|promo|deal|limited time)\b/.test(lower)) {
        return 'promotional';
    }

    return 'cold_outreach';
}

/**
 * Check if message has emoji
 */
function hasEmoji(message: string): boolean {
    try {
        return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message);
    } catch {
        return false;
    }
}

/**
 * Score the hook (first 40 chars)
 */
function scoreHook(message: string, name?: string): number {
    const hook = message.slice(0, SMS_HOOK_RULES.hookZoneChars);
    let score = 0;

    // Starts with name
    if (name && hook.toLowerCase().startsWith(name.toLowerCase())) {
        score += SMS_HOOK_RULES.hookScoring.startsWithName;
    }

    // Has question
    if (SMS_HOOK_RULES.hookPatterns.question.test(message)) {
        score += SMS_HOOK_RULES.hookScoring.hasQuestion;
    }

    // Has curiosity word
    if (SMS_HOOK_RULES.hookPatterns.curiosity.test(hook)) {
        score += SMS_HOOK_RULES.hookScoring.hasCuriosityWord;
    }

    // Has urgency
    if (SMS_HOOK_RULES.hookPatterns.urgency.test(hook)) {
        score += SMS_HOOK_RULES.hookScoring.hasUrgency;
    }

    // Hook under 40 chars contains complete thought
    if (hook.includes(',') || hook.includes('-') || hook.includes('?')) {
        score += SMS_HOOK_RULES.hookScoring.under40chars;
    }

    return Math.min(100, score);
}

/**
 * Analyze and provide feedback on message
 */
function analyzeMessage(
    message: string,
    lengthRules: ReturnType<typeof getSmsLengthRules>,
    name?: string
): {
    charCount: number;
    segmentCount: number;
    hookScore: number;
    warnings: string[];
    suggestions: string[];
    rulesApplied: string[];
} {
    const charCount = message.length;
    const containsEmoji = hasEmoji(message);
    const hasJargon = /\b(synergy|leverage|circle back|touch base|low-hanging|move the needle)\b/i.test(message);
    const endsWithQuestion = message.trim().endsWith('?');
    const hookScore = scoreHook(message, name);

    const warnings: string[] = [];
    const suggestions: string[] = [];
    const rulesApplied: string[] = [];

    // Segment calculation
    let segmentCount = 1;
    if (containsEmoji) {
        segmentCount = Math.ceil(charCount / 70);
        warnings.push('Contains emoji - reduces character limit to 70 per segment');
    } else {
        segmentCount = Math.ceil(charCount / 160);
    }

    // Length analysis
    if (charCount > lengthRules.maxChars) {
        warnings.push(`Exceeds max ${lengthRules.maxChars} chars by ${charCount - lengthRules.maxChars}`);
    } else if (charCount > lengthRules.warningThreshold) {
        suggestions.push(`At ${charCount} chars - could be shorter for better response`);
    } else if (charCount <= lengthRules.targetChars) {
        rulesApplied.push(`✓ Within target of ${lengthRules.targetChars} chars`);
    }

    // Content analysis
    if (hasJargon) {
        warnings.push('Contains corporate jargon - reduces authenticity');
    } else {
        rulesApplied.push('✓ No jargon detected');
    }

    if (!endsWithQuestion) {
        suggestions.push('Ending with ? increases response rate 2-5x');
    } else {
        rulesApplied.push('✓ Ends with question');
    }

    if (hookScore >= 50) {
        rulesApplied.push(`✓ Strong hook (score: ${hookScore}/100)`);
    } else if (hookScore >= 30) {
        suggestions.push(`Hook score ${hookScore}/100 - could be stronger`);
    } else {
        warnings.push(`Weak hook (score: ${hookScore}/100) - first 40 chars don't grab attention`);
    }

    if (name && message.toLowerCase().startsWith(name.toLowerCase())) {
        rulesApplied.push('✓ Starts with recipient name');
    } else if (name) {
        suggestions.push('Consider starting with recipient name for personalization');
    }

    return { charCount, segmentCount, hookScore, warnings, suggestions, rulesApplied };
}

/**
 * Smart truncation that preserves meaning
 */
function smartTruncate(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;

    const truncated = message.slice(0, maxLength);
    const lastQuestion = truncated.lastIndexOf('?');
    const lastPeriod = truncated.lastIndexOf('.');

    const breakPoint = Math.max(lastQuestion, lastPeriod);

    if (breakPoint > maxLength * 0.6) {
        return message.slice(0, breakPoint + 1);
    }

    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
        return message.slice(0, lastSpace) + '?';  // Add question if truncating
    }

    return truncated.slice(0, -3) + '...';
}

/**
 * Main optimization function - THE PERFECT SMS
 */
export async function optimizeSms(input: SmsOptimizationInput): Promise<SmsOptimizationResult> {
    const { baseMessage, recipientFirstName } = input;

    // Build optimization context
    const messageType = detectMessageType(baseMessage);
    const personalizationRichness = detectPersonalizationRichness({
        hasName: !!input.recipientFirstName,
        hasCompany: !!input.recipientCompany,
        hasTriggerEvent: !!input.hasTriggerEvent,
        hasMutualConnection: !!input.hasMutualConnection,
        hasRecentActivity: !!input.hasRecentActivity,
        hasPainPoint: false,
    });

    const optimizationContext: SmsOptimizationContext = {
        messageType,
        hasRecipientName: !!input.recipientFirstName,
        hasCompanyName: !!input.recipientCompany,
        hasSpecificDetails: personalizationRichness !== 'minimal',
        inputLength: baseMessage.length,
        urgency: input.urgency || 'medium',
    };

    // Get dynamic length rules
    const lengthRules = getSmsLengthRules(optimizationContext);

    // Handle empty input
    if (!baseMessage || baseMessage.trim().length < 5) {
        return {
            optimizedMessage: baseMessage || '',
            charCount: baseMessage?.length || 0,
            segmentCount: 1,
            hookPreview: baseMessage?.slice(0, 40) || '',
            hookScore: 0,
            warnings: ['Message too short to optimize'],
            suggestions: [],
            rulesApplied: [],
            targetChars: lengthRules.targetChars,
            maxChars: lengthRules.maxChars,
        };
    }

    // If already within target, just analyze
    if (baseMessage.length <= lengthRules.targetChars && baseMessage.trim().endsWith('?')) {
        const analysis = analyzeMessage(baseMessage, lengthRules, recipientFirstName);
        return {
            optimizedMessage: baseMessage,
            ...analysis,
            hookPreview: baseMessage.slice(0, 40),
            targetChars: lengthRules.targetChars,
            maxChars: lengthRules.maxChars,
        };
    }

    try {
        const systemPrompt = buildSystemPrompt(optimizationContext, lengthRules);
        const userPrompt = buildUserPrompt(input, lengthRules);

        let optimizedMessage = await callOpenAIFast([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], { maxTokens: 200 });

        // Clean up response
        optimizedMessage = optimizedMessage.trim();
        if (optimizedMessage.startsWith('"') && optimizedMessage.endsWith('"')) {
            optimizedMessage = optimizedMessage.slice(1, -1);
        }

        // Enforce hard max limit
        if (optimizedMessage.length > lengthRules.maxChars) {
            optimizedMessage = smartTruncate(optimizedMessage, lengthRules.maxChars);
        }

        const analysis = analyzeMessage(optimizedMessage, lengthRules, recipientFirstName);

        return {
            optimizedMessage,
            ...analysis,
            hookPreview: optimizedMessage.slice(0, 40),
            targetChars: lengthRules.targetChars,
            maxChars: lengthRules.maxChars,
        };

    } catch (error) {
        console.error('[SmsOptimizer] Error:', error);

        // Fallback: simple truncation
        const fallback = smartTruncate(baseMessage, lengthRules.maxChars);
        const analysis = analyzeMessage(fallback, lengthRules, recipientFirstName);

        return {
            optimizedMessage: fallback,
            ...analysis,
            hookPreview: fallback.slice(0, 40),
            warnings: [...analysis.warnings, 'AI optimization failed - used fallback'],
            targetChars: lengthRules.targetChars,
            maxChars: lengthRules.maxChars,
        };
    }
}

/**
 * Quick optimization without AI (rule-based only)
 */
export function quickOptimize(message: string, firstName?: string): string {
    let result = message.trim();

    // Add name if provided and missing
    if (firstName && !result.toLowerCase().startsWith(firstName.toLowerCase())) {
        result = `${firstName}, ${result}`;
    }

    // Remove jargon
    const jargonReplacements: [RegExp, string][] = [
        [/\bsynergy\b/gi, 'teamwork'],
        [/\bleverage\b/gi, 'use'],
        [/\bcircle back\b/gi, 'reconnect'],
        [/\btouch base\b/gi, 'connect'],
        [/\bmoving forward\b/gi, 'next'],
        [/\bat the end of the day\b/gi, 'ultimately'],
    ];

    for (const [pattern, replacement] of jargonReplacements) {
        result = result.replace(pattern, replacement);
    }

    // Ensure ends with question if actionable
    if (!result.endsWith('?') && !result.endsWith('!') && !result.endsWith('.')) {
        if (result.match(/\b(thoughts|interested|help|chat|call|meet)\b/i)) {
            result = result + '?';
        }
    }

    return smartTruncate(result, 160);
}

export { smartTruncate, scoreHook, detectMessageType };
