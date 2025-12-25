// SMS Optimizer Helper Functions
import { SMS_HOOK_RULES, type SmsOptimizationContext, getSmsLengthRules } from '../../optimization-rules/channel-rules';
import type { SmsOptimizationInput } from './types';

export function buildSystemPrompt(context: SmsOptimizationContext, lengthRules: ReturnType<typeof getSmsLengthRules>): string {
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

export function buildUserPrompt(input: SmsOptimizationInput, lengthRules: ReturnType<typeof getSmsLengthRules>): string {
    const parts: string[] = [];
    parts.push(`=== ORIGINAL MESSAGE TO OPTIMIZE ===`);
    parts.push(`"${input.baseMessage}"`);
    parts.push(`(${input.baseMessage.length} characters)\n`);
    parts.push(`=== RECIPIENT DATA ===`);
    if (input.recipientFirstName) parts.push(`First name: ${input.recipientFirstName} (MUST start message with this)`);
    else parts.push(`No name provided - use "Hey" or skip greeting entirely`);
    if (input.recipientCompany) parts.push(`Company: ${input.recipientCompany} (reference if space allows)`);
    if (input.recipientPosition) parts.push(`Position: ${input.recipientPosition}`);
    parts.push(`\n=== OPTIMIZATION TARGETS ===`);
    parts.push(`Target length: ${lengthRules.targetChars} characters`);
    parts.push(`Maximum allowed: ${lengthRules.maxChars} characters`);
    parts.push(`Must end with: ? (question format)`);
    parts.push(`\nOptimize now. Output ONLY the SMS text.`);
    return parts.join('\n');
}

export function detectMessageType(message: string): SmsOptimizationContext['messageType'] {
    const lower = message.toLowerCase();
    if (/\b(reminder|appointment|meeting|scheduled|confirm)\b/.test(lower)) return 'appointment_reminder';
    if (/\b(following up|follow up|checking in|just wanted to)\b/.test(lower)) return 'follow_up';
    if (/\b(confirmed|booked|receipt|thank you for)\b/.test(lower)) return 'confirmation';
    if (/\b(sale|discount|offer|promo|deal|limited time)\b/.test(lower)) return 'promotional';
    return 'cold_outreach';
}

export function hasEmoji(message: string): boolean {
    try { return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message); }
    catch { return false; }
}

export function scoreHook(message: string, name?: string): number {
    const hook = message.slice(0, SMS_HOOK_RULES.hookZoneChars);
    let score = 0;
    if (name && hook.toLowerCase().startsWith(name.toLowerCase())) score += SMS_HOOK_RULES.hookScoring.startsWithName;
    if (SMS_HOOK_RULES.hookPatterns.question.test(message)) score += SMS_HOOK_RULES.hookScoring.hasQuestion;
    if (SMS_HOOK_RULES.hookPatterns.curiosity.test(hook)) score += SMS_HOOK_RULES.hookScoring.hasCuriosityWord;
    if (SMS_HOOK_RULES.hookPatterns.urgency.test(hook)) score += SMS_HOOK_RULES.hookScoring.hasUrgency;
    if (hook.includes(',') || hook.includes('-') || hook.includes('?')) score += SMS_HOOK_RULES.hookScoring.under40chars;
    return Math.min(100, score);
}

export function smartTruncate(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;
    const truncated = message.slice(0, maxLength);
    const lastQuestion = truncated.lastIndexOf('?');
    const lastPeriod = truncated.lastIndexOf('.');
    const breakPoint = Math.max(lastQuestion, lastPeriod);
    if (breakPoint > maxLength * 0.6) return message.slice(0, breakPoint + 1);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) return message.slice(0, lastSpace) + '?';
    return truncated.slice(0, -3) + '...';
}

export function analyzeMessage(message: string, lengthRules: ReturnType<typeof getSmsLengthRules>, name?: string): { charCount: number; segmentCount: number; hookScore: number; warnings: string[]; suggestions: string[]; rulesApplied: string[]; } {
    const charCount = message.length;
    const containsEmoji = hasEmoji(message);
    const hasJargon = /\b(synergy|leverage|circle back|touch base|low-hanging|move the needle)\b/i.test(message);
    const endsWithQuestion = message.trim().endsWith('?');
    const hookScoreValue = scoreHook(message, name);
    const warnings: string[] = [], suggestions: string[] = [], rulesApplied: string[] = [];
    let segmentCount = containsEmoji ? Math.ceil(charCount / 70) : Math.ceil(charCount / 160);
    if (containsEmoji) warnings.push('Contains emoji - reduces character limit to 70 per segment');
    if (charCount > lengthRules.maxChars) warnings.push(`Exceeds max ${lengthRules.maxChars} chars by ${charCount - lengthRules.maxChars}`);
    else if (charCount > lengthRules.warningThreshold) suggestions.push(`At ${charCount} chars - could be shorter for better response`);
    else if (charCount <= lengthRules.targetChars) rulesApplied.push(`✓ Within target of ${lengthRules.targetChars} chars`);
    if (hasJargon) warnings.push('Contains corporate jargon - reduces authenticity'); else rulesApplied.push('✓ No jargon detected');
    if (!endsWithQuestion) suggestions.push('Ending with ? increases response rate 2-5x'); else rulesApplied.push('✓ Ends with question');
    if (hookScoreValue >= 50) rulesApplied.push(`✓ Strong hook (score: ${hookScoreValue}/100)`); else if (hookScoreValue >= 30) suggestions.push(`Hook score ${hookScoreValue}/100 - could be stronger`); else warnings.push(`Weak hook (score: ${hookScoreValue}/100) - first 40 chars don't grab attention`);
    if (name && message.toLowerCase().startsWith(name.toLowerCase())) rulesApplied.push('✓ Starts with recipient name'); else if (name) suggestions.push('Consider starting with recipient name for personalization');
    return { charCount, segmentCount, hookScore: hookScoreValue, warnings, suggestions, rulesApplied };
}
