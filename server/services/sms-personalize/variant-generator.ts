import OpenAI from "openai";
import type { SmsVariant, VariantGenerationOptions } from "./types";
import { getHookInstructions, getHookTypeGuidance, getQuestionEndingInstruction } from "./style-config";
import { smartTruncate, hasEmoji, stripEmojis } from "./utils";

export async function generateSmsVariant(openai: OpenAI, opts: VariantGenerationOptions): Promise<SmsVariant> {
  const { baseMessage, contact, firstName, senderName, styleInstruction, readableStyleName, hookType, triggerContext, warmth, variantIndex } = opts;
  const hookInstructions = getHookInstructions(hookType, warmth);
  const questionEnding = getQuestionEndingInstruction(warmth);
  const systemPrompt = `You are an elite SMS copywriter trained in sales psychology. Your job: maximize responses.

## WRITING STYLE: ${readableStyleName}
${styleInstruction}

## THE HOOK ZONE (CRITICAL - First 30-40 chars)
${hookInstructions}

## HOOK TYPE: ${hookType.toUpperCase()}
${getHookTypeGuidance(hookType)}

## ENDING RULE
${questionEnding}

## 🚫 NO-FABRICATION RULES (CRITICAL):
- ONLY use information provided below - NEVER invent details
- Do NOT make up company news, achievements, or trigger events
- Do NOT fabricate mutual connections or referrals
- Do NOT assume specific metrics, dates, or times not provided
- If company/trigger is "unknown" or generic, use universal patterns instead

## SMS PSYCHOLOGY (Research-Backed):
- Under 100 chars = 2-5x higher response (aim for this)
- Lead with VALUE in first 5-10 words
- FOMO triggers: "Quick opportunity", "Before Friday"
- End with question mark (proven higher engagement)
- Single CTA only

## HARD RULES
- EXACTLY 160 characters or less (under 100 is optimal)
- First word must be recipient's first name
- End with a question mark
- NO emojis (drops char limit to 70)
- NO corporate jargon
${senderName ? `- Sign with: - ${senderName}` : ''}

Return ONLY the SMS text.`;

  const companyContext = contact.company ? `- Company: ${contact.company} (ONLY mention if it fits naturally)` : '- Company: Not provided (do NOT make one up)';
  const roleContext = contact.position ? `- Role: ${contact.position}` : '- Role: Not provided (use generic "professional" terms)';
  const industryContext = triggerContext.industry && triggerContext.industry !== 'unknown' ? `- Industry: ${triggerContext.industry}` : '- Industry: Not specified (do NOT assume)';
  const triggerInfo = triggerContext.hasTrigger && triggerContext.triggerText ? `- User-provided trigger: ${triggerContext.triggerText}` : '- No trigger event provided (do NOT fabricate one)';
  
  const userPrompt = `Create a ${hookType.toUpperCase()}-style SMS for ${contact.name}:

CORE MESSAGE TO ADAPT:
${baseMessage}

AVAILABLE DATA (ONLY USE THESE - NEVER FABRICATE):
- First Name: ${firstName}
${companyContext}
${roleContext}
${industryContext}
${triggerInfo}
- Engagement Level: ${warmth.toUpperCase()} lead

CRITICAL: If data is missing, use generic but effective patterns. DO NOT invent company news, achievements, or details.

Generate a punchy SMS under 100 chars. Front-load the hook. End with a question.`;

  try {
    const response = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.8, max_tokens: 200 });
    let message = response.choices[0]?.message?.content?.trim();
    if (!message) throw new Error("Empty response from OpenAI");
    if (message.length > 160) message = await shortenSmsMessage(openai, message, firstName);
    if (message.length > 160) message = smartTruncate(message, 160);
    if (hasEmoji(message)) message = stripEmojis(message);
    return { id: `variant-${variantIndex + 1}`, hookType, message, charCount: message.length, hookPreview: message.substring(0, 40) };
  } catch (error) { console.error(`[SmsPersonalization] Error generating ${hookType} variant:`, error); throw error; }
}

async function shortenSmsMessage(openai: OpenAI, message: string, firstName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: `Shorten this SMS to UNDER 160 characters. Keep:\n1. Recipient's name (${firstName}) at the start\n2. The core hook/value\n3. The ending question\n\nReturn ONLY the shortened message.` }, { role: "user", content: `Shorten to under 160 chars (currently ${message.length}):\n\n${message}` }], temperature: 0.5, max_tokens: 100 });
    const shortened = response.choices[0]?.message?.content?.trim();
    if (shortened && shortened.length <= 160) return shortened;
    return message;
  } catch (error) { console.error("[SmsPersonalization] Error shortening:", error); return message; }
}
