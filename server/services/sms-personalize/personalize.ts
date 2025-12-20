import type { Contact } from "@shared/schema";
import type { SmsPersonalizationOptions, SmsPersonalizationResult, SmsVariant } from "./types";
import { getOpenAIClient } from "./openai-client";
import { getStyleInstruction, getReadableStyleName } from "./style-config";
import { getFirstName, replacePlaceholders, smartTruncate, calculateOptimalSendTime, calculateContactWarmth, extractTriggerContext } from "./utils";
import { generateSmsVariant } from "./variant-generator";

export async function personalizeSmsWithVariants(options: SmsPersonalizationOptions): Promise<SmsPersonalizationResult> {
  const { baseMessage, contact, senderName, writingStyle } = options;
  if (!baseMessage.trim()) throw new Error("SMS message is required");
  const firstName = getFirstName(contact.name);
  const triggerContext = extractTriggerContext(contact);
  const warmth = calculateContactWarmth(contact);
  const timing = calculateOptimalSendTime(contact);
  const styleInstruction = getStyleInstruction(writingStyle);
  const readableStyleName = getReadableStyleName(writingStyle);
  const hookTypes: Array<'curiosity' | 'question' | 'direct' | 'social-proof'> = warmth === 'hot' ? ['direct', 'question', 'curiosity'] : warmth === 'warm' ? ['question', 'curiosity', 'social-proof'] : ['curiosity', 'question', 'direct'];
  const variants: SmsVariant[] = [];
  try {
    const openai = getOpenAIClient();
    const variantPromises = hookTypes.map((hookType, index) => generateSmsVariant(openai, { baseMessage, contact, firstName, senderName, writingStyle, styleInstruction, readableStyleName, hookType, triggerContext, warmth, variantIndex: index }));
    const results = await Promise.allSettled(variantPromises);
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value) { variants.push(result.value); }
      else { const fallbackMessage = replacePlaceholders(baseMessage, contact); variants.push({ id: `variant-${i + 1}`, hookType: hookTypes[i], message: smartTruncate(fallbackMessage, 160), charCount: Math.min(fallbackMessage.length, 160), hookPreview: fallbackMessage.substring(0, 40) }); }
    }
  } catch (error) { console.error("[SmsPersonalization] Error generating variants:", error); const fallbackMessage = replacePlaceholders(baseMessage, contact); variants.push({ id: 'variant-1', hookType: 'direct', message: smartTruncate(fallbackMessage, 160), charCount: Math.min(fallbackMessage.length, 160), hookPreview: fallbackMessage.substring(0, 40) }); }
  const recommended = variants[0] || { id: 'fallback', hookType: 'direct' as const, message: baseMessage, charCount: baseMessage.length, hookPreview: baseMessage.substring(0, 40) };
  return { recommended, variants, timing, contactWarmth: warmth };
}

export async function personalizeSmsForContact(options: SmsPersonalizationOptions): Promise<string> {
  try { const result = await personalizeSmsWithVariants(options); return result.recommended.message; }
  catch (error) { console.error("[SmsPersonalization] Error:", error); return replacePlaceholders(options.baseMessage, options.contact); }
}

export async function personalizeSmsForContacts(baseMessage: string, contacts: Contact[], senderName?: string, writingStyle?: string): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  for (const contact of contacts) { try { const personalized = await personalizeSmsForContact({ baseMessage, contact, senderName, writingStyle }); results.set(contact.id, personalized); } catch (error) { console.error(`[SmsPersonalization] Failed for contact ${contact.id}:`, error); results.set(contact.id, replacePlaceholders(baseMessage, contact)); } }
  return results;
}
