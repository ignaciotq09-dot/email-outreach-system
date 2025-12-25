// SMS Optimizer - Main Entry Point

export * from "./types";
export * from "./helpers";

import { callOpenAIFast } from '../../openai-client';
import { getSmsLengthRules, detectPersonalizationRichness, type SmsOptimizationContext } from '../../optimization-rules/channel-rules';
import type { SmsOptimizationInput, SmsOptimizationResult } from './types';
import { buildSystemPrompt, buildUserPrompt, detectMessageType, analyzeMessage, smartTruncate } from './helpers';

export async function optimizeSms(input: SmsOptimizationInput): Promise<SmsOptimizationResult> {
    const { baseMessage, recipientFirstName } = input;
    const messageType = detectMessageType(baseMessage);
    const personalizationRichness = detectPersonalizationRichness({ hasName: !!input.recipientFirstName, hasCompany: !!input.recipientCompany, hasTriggerEvent: !!input.hasTriggerEvent, hasMutualConnection: !!input.hasMutualConnection, hasRecentActivity: !!input.hasRecentActivity, hasPainPoint: false });
    const optimizationContext: SmsOptimizationContext = { messageType, hasRecipientName: !!input.recipientFirstName, hasCompanyName: !!input.recipientCompany, hasSpecificDetails: personalizationRichness !== 'minimal', inputLength: baseMessage.length, urgency: input.urgency || 'medium' };
    const lengthRules = getSmsLengthRules(optimizationContext);
    if (!baseMessage || baseMessage.trim().length < 5) return { optimizedMessage: baseMessage || '', charCount: baseMessage?.length || 0, segmentCount: 1, hookPreview: baseMessage?.slice(0, 40) || '', hookScore: 0, warnings: ['Message too short to optimize'], suggestions: [], rulesApplied: [], targetChars: lengthRules.targetChars, maxChars: lengthRules.maxChars };
    if (baseMessage.length <= lengthRules.targetChars && baseMessage.trim().endsWith('?')) { const analysis = analyzeMessage(baseMessage, lengthRules, recipientFirstName); return { optimizedMessage: baseMessage, ...analysis, hookPreview: baseMessage.slice(0, 40), targetChars: lengthRules.targetChars, maxChars: lengthRules.maxChars }; }
    try {
        const systemPrompt = buildSystemPrompt(optimizationContext, lengthRules);
        const userPrompt = buildUserPrompt(input, lengthRules);
        let optimizedMessage = await callOpenAIFast([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { maxTokens: 200 });
        optimizedMessage = optimizedMessage.trim(); if (optimizedMessage.startsWith('"') && optimizedMessage.endsWith('"')) optimizedMessage = optimizedMessage.slice(1, -1);
        if (optimizedMessage.length > lengthRules.maxChars) optimizedMessage = smartTruncate(optimizedMessage, lengthRules.maxChars);
        const analysis = analyzeMessage(optimizedMessage, lengthRules, recipientFirstName);
        return { optimizedMessage, ...analysis, hookPreview: optimizedMessage.slice(0, 40), targetChars: lengthRules.targetChars, maxChars: lengthRules.maxChars };
    } catch (error) {
        console.error('[SmsOptimizer] Error:', error);
        const fallback = smartTruncate(baseMessage, lengthRules.maxChars);
        const analysis = analyzeMessage(fallback, lengthRules, recipientFirstName);
        return { optimizedMessage: fallback, ...analysis, hookPreview: fallback.slice(0, 40), warnings: [...analysis.warnings, 'AI optimization failed - used fallback'], targetChars: lengthRules.targetChars, maxChars: lengthRules.maxChars };
    }
}

export function quickOptimize(message: string, firstName?: string): string {
    let result = message.trim();
    if (firstName && !result.toLowerCase().startsWith(firstName.toLowerCase())) result = `${firstName}, ${result}`;
    const jargonReplacements: [RegExp, string][] = [[/\bsynergy\b/gi, 'teamwork'], [/\bleverage\b/gi, 'use'], [/\bcircle back\b/gi, 'reconnect'], [/\btouch base\b/gi, 'connect'], [/\bmoving forward\b/gi, 'next'], [/\bat the end of the day\b/gi, 'ultimately']];
    for (const [pattern, replacement] of jargonReplacements) result = result.replace(pattern, replacement);
    if (!result.endsWith('?') && !result.endsWith('!') && !result.endsWith('.')) { if (result.match(/\b(thoughts|interested|help|chat|call|meet)\b/i)) result = result + '?'; }
    return smartTruncate(result, 160);
}
