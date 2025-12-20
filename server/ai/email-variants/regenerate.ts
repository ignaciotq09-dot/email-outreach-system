import type { EmailPreferences } from "@shared/schema";
import { callOpenAIFast, type EmailVariant } from "../openai-client";
import { WRITING_STYLES, type WritingStyleId } from "@shared/writing-styles";
import { STYLE_PROMPTS } from "./style-prompts";
import { calculateSentenceCounts, buildPreferencesText } from "./length-calc";
import { REGEN_SYSTEM_PROMPT, SPAM_AVOID_TEXT, JSON_RETURN_FORMAT } from "./prompts";

export async function regenerateEmailVariants(baseMessage: string, feedback: string, previousVariants: EmailVariant[], preferences?: EmailPreferences | null, writingStyle?: WritingStyleId): Promise<EmailVariant[]> {
  const startTime = Date.now();
  const styleId = writingStyle || 'professional-adult';
  const stylePrompt = STYLE_PROMPTS[styleId];
  const styleName = WRITING_STYLES[styleId].name;
  const inputWords = baseMessage.trim().split(/\s+/).length;
  const { tier, ultraSentences, warmSentences, valueSentences } = calculateSentenceCounts(inputWords);
  const prefsText = buildPreferencesText(preferences);
  const prevText = previousVariants.map((v) => `--- ${v.approach} ---\nSubject: ${v.subject}\nBody: ${v.body}`).join('\n\n');
  const lengthRequirement = `SENTENCE COUNTS (${tier}): Ultra-Direct: ${ultraSentences}, Warm but Brief: ${warmSentences}, Value-First: ${valueSentences}`;

  const prompt = `IMPROVE these emails based on user feedback.

=== FEEDBACK TO APPLY ===
"${feedback}"

=== ORIGINAL MESSAGE ===
"${baseMessage}"

=== CURRENT EMAILS ===
${prevText}

=== YOUR TASK ===
1. Apply the feedback PRECISELY - this is #1 priority
2. Keep what's working well
3. Fix what the feedback criticizes

=== SUBJECT LINE FORMULAS ===
Use: Number Formula, Curiosity Gap, Question Hook, Personalized + Specific
AVOID: "Quick question", "Following up", "Introduction", "Checking in"

=== APPLY STYLE ===
Style: ${styleName}
${stylePrompt}${prefsText}

=== ${lengthRequirement}

=== CRITICAL: NEVER INVENT DETAILS ===
Only use info the user PROVIDED. Don't make up days, times, prices, percentages, or specifics.

=== ANTI-PATTERNS ===
❌ Generic subjects ❌ Starting with "I" ❌ "Hope this finds you well"

${SPAM_AVOID_TEXT}

${JSON_RETURN_FORMAT}`;

  try {
    console.log('[regenerateEmailVariants] Starting regeneration with feedback:', feedback);
    const systemPrompt = REGEN_SYSTEM_PROMPT.replace('as specified', `Ultra-Direct: ${ultraSentences}, Warm: ${warmSentences}, Value-First: ${valueSentences}`);
    const content = await callOpenAIFast([{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], { responseFormat: { type: "json_object" }, maxTokens: 2500 });
    const result = JSON.parse(content);
    console.log(`[regenerateEmailVariants] Done in ${Date.now() - startTime}ms, ${result.variants?.length || 0} variants`);
    return result.variants || [];
  } catch (error: any) { console.error('[regenerateEmailVariants] Error:', error.message); throw new Error(`Failed to regenerate email variants: ${error.message}`); }
}
