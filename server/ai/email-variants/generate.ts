import type { EmailPreferences } from "@shared/schema";
import { callOpenAIWithTimeout, type EmailVariant } from "../openai-client";
import { WRITING_STYLES, type WritingStyleId } from "@shared/writing-styles";
import { STYLE_PROMPTS } from "./style-prompts";
import { calculateSentenceCounts, buildPreferencesText } from "./length-calc";
import { BASE_SYSTEM_PROMPT, SPAM_AVOID_TEXT, ANTI_PATTERNS_TEXT, JSON_RETURN_FORMAT, PSYCHOLOGY_RULES_TEXT } from "./prompts";

export async function generateEmailVariants(baseMessage: string, preferences?: EmailPreferences | null, writingStyle?: WritingStyleId): Promise<EmailVariant[]> {
  const startTime = Date.now();
  const styleId = writingStyle || 'professional-adult';
  const stylePrompt = STYLE_PROMPTS[styleId];
  const styleName = WRITING_STYLES[styleId].name;
  const inputWords = baseMessage.trim().split(/\s+/).length;
  const { tier: lengthTier, ultraSentences, warmSentences, valueSentences } = calculateSentenceCounts(inputWords);
  const prefsText = buildPreferencesText(preferences);
  const lengthSection = `=== EMAIL LENGTH (Sentence Count) ===
Input: ${inputWords} words → ${lengthTier}
Write EXACTLY: Ultra-Direct: ${ultraSentences}, Warm but Brief: ${warmSentences}, Value-First: ${valueSentences} sentences`;

  const prompt = `Write 3 high-converting email variants from: "${baseMessage}"

=== ANALYZE FIRST ===
• INTENT: Cold outreach / Follow-up / Meeting request / Introduction
• HOOK: Most compelling element to lead with
• GOAL: What response you want
• RELATIONSHIP: Assume FIRST CONTACT unless explicitly mentioned otherwise

=== SUBJECT LINE FORMULAS ===
Use: Number Formula, Curiosity Gap, Question Hook, Personalized + Specific
AVOID: Generic subjects like "Introduction", "Quick question", "Following up"

=== OPENING LINE RULES ===
Lead with THEM: "Saw your post about..." / "Congrats on the..." / "Your work on..."
NEVER: "I hope this finds you well" / "My name is..."

=== APPLY STYLE ===
Style: ${styleName}
${stylePrompt}${prefsText}

${lengthSection}

${PSYCHOLOGY_RULES_TEXT}

${ANTI_PATTERNS_TEXT}
${SPAM_AVOID_TEXT}

${JSON_RETURN_FORMAT}`;

  try {
    console.log('[generateEmailVariants] Starting fast generation...');
    const systemPrompt = BASE_SYSTEM_PROMPT.replace('as specified', `Ultra-Direct: ${ultraSentences}, Warm: ${warmSentences}, Value-First: ${valueSentences}`);
    const content = await callOpenAIWithTimeout([{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], { responseFormat: { type: "json_object" }, maxTokens: 3000 });
    const result = JSON.parse(content);
    if (result.variants) { result.variants.forEach((v: any, i: number) => { const sentences = v.body?.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length || 0; console.log(`[generateEmailVariants] Variant ${i + 1} (${v.approach}): ${sentences} sentences`); }); }
    console.log(`[generateEmailVariants] Done in ${Date.now() - startTime}ms, ${result.variants?.length || 0} variants`);
    return result.variants || [];
  } catch (error: any) { console.error('[generateEmailVariants] Error:', error.message); throw new Error(`Failed to generate email variants: ${error.message}`); }
}
