import type { EmailPreferences } from "@shared/schema";
import { callOpenAIFast, callOpenAIWithTimeout, type EmailVariant } from "./openai-client";
import { WRITING_STYLES, type WritingStyleId } from "@shared/writing-styles";
import crypto from "crypto";

const STYLE_PROMPTS_COMPRESSED: Record<WritingStyleId, string> = {
  "professional-adult": `Confident peer sharing insights. Direct: "Here's what I'm seeing". No hedging ("just wanted to..."), no filler ("hope this finds you well").`,
  "professional-humble": `Curious, respectful. Lead with genuine interest in their work. Ask real questions. No sycophancy or over-apologizing.`,
  "friendly-conversational": `Texting a friendly colleague. Contractions, short sentences. "Hey" / "Quick thought". No corporate jargon.`,
  "thoughtful-educated": `Logical depth. Build points step-by-step. Precise language. No pretension or unnecessary complexity.`,
  "poetic-lyrical": `Distinctive, memorable language. Varied rhythm. Vivid words over generic. No clichés or purple prose.`,
  "inspiring-uplifting": `Genuine energy about possibility. "Imagine" / "What if". Empowering but grounded. No empty hype.`,
  "strong-confident": `Decisive clarity. Active voice, strong verbs. "Here's what I recommend". No wishy-washy language.`,
  "precise-technical": `Engineering precision. Problem → solution → outcome. Specific examples. Eliminate ambiguity.`,
};

interface CacheEntry {
  variants: EmailVariant[];
  createdAt: number;
  hits: number;
}

const variantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

function generateCacheKey(baseMessage: string, writingStyle: WritingStyleId, preferences?: EmailPreferences | null): string {
  const normalized = {
    msg: baseMessage.trim().toLowerCase(),
    style: writingStyle,
    prefs: preferences ? {
      tone: preferences.tonePreference,
      length: preferences.lengthPreference,
      notes: preferences.styleNotes,
      sig: preferences.defaultSignature,
    } : null,
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex').substring(0, 24);
}

function getCachedVariants(key: string): EmailVariant[] | null {
  const entry = variantCache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.createdAt;
  if (age > CACHE_TTL_MS) {
    variantCache.delete(key);
    return null;
  }
  
  entry.hits++;
  console.log(`[EmailVariants] CACHE HIT (age: ${Math.round(age / 1000)}s, hits: ${entry.hits})`);
  return entry.variants.map(v => ({ ...v }));
}

function setCachedVariants(key: string, variants: EmailVariant[]): void {
  if (variantCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = variantCache.keys().next().value;
    if (oldestKey) variantCache.delete(oldestKey);
  }
  variantCache.set(key, {
    variants: variants.map(v => ({ ...v })),
    createdAt: Date.now(),
    hits: 0,
  });
}

function getSentenceCounts(inputWords: number): { tier: string; ultra: string; warm: string; value: string } {
  if (inputWords <= 12) return { tier: "MINIMAL", ultra: "2", warm: "3", value: "3-4" };
  if (inputWords <= 25) return { tier: "SHORT", ultra: "3", warm: "4", value: "4-5" };
  if (inputWords <= 50) return { tier: "MEDIUM", ultra: "4", warm: "5", value: "5-6" };
  if (inputWords <= 80) return { tier: "DETAILED", ultra: "5", warm: "6", value: "6-7" };
  return { tier: "COMPREHENSIVE", ultra: "6", warm: "7", value: "7-8" };
}

function buildCompressedPrompt(
  baseMessage: string,
  stylePrompt: string,
  styleName: string,
  counts: { tier: string; ultra: string; warm: string; value: string },
  inputWords: number,
  preferences?: EmailPreferences | null
): string {
  const prefParts: string[] = [];
  if (preferences?.tonePreference) prefParts.push(`Tone:${preferences.tonePreference}`);
  if (preferences?.lengthPreference) prefParts.push(`Len:${preferences.lengthPreference}`);
  if (preferences?.styleNotes) prefParts.push(`Notes:${preferences.styleNotes}`);
  if (preferences?.defaultSignature) prefParts.push(`Sign:${preferences.defaultSignature}`);
  const prefs = prefParts.length ? `\nPrefs: ${prefParts.join('|')}` : '';

  return `Write 3 cold email variants from: "${baseMessage}"

ANALYZE: Intent (cold/follow-up/meeting), Hook (their achievement/pain), Goal (call/reply/action)
Assume FIRST CONTACT unless user mentions prior conversation.

SUBJECT FORMULAS (proven 47-64% opens):
• Number: "3 ways to..." • Curiosity: "Noticed something about..." • Question: "Still struggling with...?" • Personal: "Re: your [specific]"
AVOID: "Quick question", "Introduction", "Following up"

OPENING: Lead with THEM ("Saw your post...", "Congrats on..."). Never: "I hope this finds you well", "My name is..."

STRUCTURE:
• PAS: Problem→Agitate→Solve
• Star-Chain-Hook: Big result→Proof→CTA
• Value-First: Insight→Opportunity→Soft CTA

LENGTH (${counts.tier}): Ultra-Direct:${counts.ultra}, Warm:${counts.warm}, Value-First:${counts.value} sentences

CTA: Use EXACT timing from input. "next week"→keep as is. Low-friction: "Worth a look?" / "When works?"

STYLE: ${styleName}
${stylePrompt}${prefs}

CRITICAL - NEVER INVENT:
❌ "as discussed/suggested" (unless user said follow-up)
❌ Specific days/times/prices not in input
❌ Prior context that doesn't exist
✅ Keep vague inputs vague. "next week"→"next week", NOT "Tuesday"

ANTI-SPAM: No FREE/URGENT/guaranteed/!!!/ALL CAPS/act now/limited time

VARIANTS:
1. Ultra-Direct (PAS): Hook→Pain→Solution→CTA [${counts.ultra} sentences]
2. Warm but Brief (Value-First): Connection→Value→Soft CTA [${counts.warm} sentences]
3. Value-First (Star-Chain-Hook): Result→Proof→CTA [${counts.value} sentences]

JSON only:
{"variants":[{"subject":"","body":"","approach":"Ultra-Direct"},{"subject":"","body":"","approach":"Warm but Brief"},{"subject":"","body":"","approach":"Value-First"}]}`;
}

export async function generateEmailVariantsOptimized(
  baseMessage: string,
  preferences?: EmailPreferences | null,
  writingStyle?: WritingStyleId,
  options: { useCache?: boolean; useFastModel?: boolean } = {}
): Promise<EmailVariant[]> {
  const startTime = Date.now();
  const styleId = writingStyle || 'professional-adult';
  const useCache = options.useCache !== false;
  const useFastModel = options.useFastModel !== false;

  if (useCache) {
    const cacheKey = generateCacheKey(baseMessage, styleId, preferences);
    const cached = getCachedVariants(cacheKey);
    if (cached) {
      console.log(`[EmailVariants] Returned from cache in ${Date.now() - startTime}ms`);
      return cached;
    }
  }

  const stylePrompt = STYLE_PROMPTS_COMPRESSED[styleId];
  const styleName = WRITING_STYLES[styleId].name;
  const inputWords = baseMessage.trim().split(/\s+/).length;
  const counts = getSentenceCounts(inputWords);

  const prompt = buildCompressedPrompt(baseMessage, stylePrompt, styleName, counts, inputWords, preferences);

  const systemPrompt = `Elite cold email copywriter. TWO RULES:
1. NEVER INVENT: Only use info provided. "next week"→"next week", NOT "Tuesday"
2. SENTENCE COUNTS: Ultra:${counts.ultra}, Warm:${counts.warm}, Value:${counts.value}
Return valid JSON only.`;

  try {
    console.log(`[EmailVariants] Generating (${counts.tier}, ${inputWords} words, fast:${useFastModel})`);

    const apiCall = useFastModel ? callOpenAIFast : callOpenAIWithTimeout;
    const content = await apiCall(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      { responseFormat: { type: "json_object" }, maxTokens: 1800 }
    );

    const result = JSON.parse(content);
    const variants = result.variants || [];

    if (variants.length > 0) {
      variants.forEach((v: any, i: number) => {
        const sentences = v.body?.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length || 0;
        console.log(`[EmailVariants] Variant ${i + 1} (${v.approach}): ${sentences} sentences`);
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[EmailVariants] Generated ${variants.length} variants in ${duration}ms`);

    if (useCache && variants.length > 0) {
      const cacheKey = generateCacheKey(baseMessage, styleId, preferences);
      setCachedVariants(cacheKey, variants);
    }

    return variants;
  } catch (error: any) {
    console.error('[EmailVariants] Error:', error.message);
    throw new Error(`Failed to generate email variants: ${error.message}`);
  }
}

export async function regenerateEmailVariantsOptimized(
  baseMessage: string,
  feedback: string,
  previousVariants: EmailVariant[],
  preferences?: EmailPreferences | null,
  writingStyle?: WritingStyleId
): Promise<EmailVariant[]> {
  const startTime = Date.now();
  const styleId = writingStyle || 'professional-adult';
  const stylePrompt = STYLE_PROMPTS_COMPRESSED[styleId];
  const styleName = WRITING_STYLES[styleId].name;
  const inputWords = baseMessage.trim().split(/\s+/).length;
  const counts = getSentenceCounts(inputWords);

  const prevText = previousVariants.map(v => 
    `[${v.approach}] Subject: ${v.subject}\nBody: ${v.body}`
  ).join('\n\n');

  const prefParts: string[] = [];
  if (preferences?.tonePreference) prefParts.push(`Tone:${preferences.tonePreference}`);
  if (preferences?.lengthPreference) prefParts.push(`Len:${preferences.lengthPreference}`);
  if (preferences?.defaultSignature) prefParts.push(`Sign:${preferences.defaultSignature}`);
  const prefs = prefParts.length ? `\nPrefs: ${prefParts.join('|')}` : '';

  const prompt = `IMPROVE emails based on feedback.

FEEDBACK: "${feedback}"
ORIGINAL: "${baseMessage}"

CURRENT EMAILS:
${prevText}

TASK: Apply feedback precisely. Keep what works, fix what's criticized.

SUBJECT FORMULAS: Number("3 ways..."), Curiosity("Noticed..."), Question("Still struggling?"), Personal("Re: your...")
OPENING: Lead with THEM. Never "I hope this finds you well"
STRUCTURES: PAS, Star-Chain-Hook, Value-First
CTA: Use EXACT timing from input. Low-friction asks.

STYLE: ${styleName}
${stylePrompt}${prefs}

NEVER INVENT: Only use info provided. Keep vague inputs vague.
ANTI-SPAM: No FREE/URGENT/guaranteed/!!!

COUNTS (${counts.tier}): Ultra:${counts.ultra}, Warm:${counts.warm}, Value:${counts.value}

JSON only:
{"variants":[{"subject":"","body":"","approach":"Ultra-Direct"},{"subject":"","body":"","approach":"Warm but Brief"},{"subject":"","body":"","approach":"Value-First"}]}`;

  try {
    console.log('[EmailVariants] Regenerating with feedback:', feedback.substring(0, 50));

    const content = await callOpenAIFast(
      [
        { role: "system", content: `Apply feedback precisely. NEVER INVENT details. Counts: Ultra:${counts.ultra}, Warm:${counts.warm}, Value:${counts.value}. JSON only.` },
        { role: "user", content: prompt }
      ],
      { responseFormat: { type: "json_object" }, maxTokens: 1800 }
    );

    const result = JSON.parse(content);
    const duration = Date.now() - startTime;
    console.log(`[EmailVariants] Regenerated in ${duration}ms`);
    return result.variants || [];
  } catch (error: any) {
    console.error('[EmailVariants] Regenerate error:', error.message);
    throw new Error(`Failed to regenerate email variants: ${error.message}`);
  }
}

export function getCacheStats(): { size: number; entries: Array<{ key: string; age: number; hits: number }> } {
  const now = Date.now();
  const entries: Array<{ key: string; age: number; hits: number }> = [];
  
  variantCache.forEach((entry, key) => {
    entries.push({
      key: key.substring(0, 8),
      age: Math.round((now - entry.createdAt) / 1000),
      hits: entry.hits,
    });
  });
  
  return { size: variantCache.size, entries };
}

export function clearVariantCache(): void {
  variantCache.clear();
  console.log('[EmailVariants] Cache cleared');
}
