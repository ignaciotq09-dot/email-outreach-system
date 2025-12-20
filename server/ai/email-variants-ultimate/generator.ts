import type { EmailPreferences } from "@shared/schema";
import type { WritingStyleId } from "@shared/writing-styles";
import { WRITING_STYLES } from "@shared/writing-styles";
import { openai, type EmailVariant } from "../openai-client";
import { hasActivePersonalization, translateDiversityToGuidance, buildStyleSeasoning } from "../tone-translator";
import { buildPersonalizationPrompt } from "../voice-analyzer";
import type { PersonalizationOptions, SimplePersonalization, GenerationResult } from "./types";
import { STYLE_PROMPTS } from "./style-prompts";
import { calculateQualityScore } from "./quality-scoring";
import { selectModelConfig, getSentenceCounts } from "./model-config";
import { generateCacheKey, getCachedVariants, setCachedVariants } from "./cache";
import { buildChainOfThoughtPrompt } from "./prompt-builder";

export async function generateEmailVariantsUltimate(baseMessage: string, preferences?: EmailPreferences | null, writingStyle?: WritingStyleId, options: { useCache?: boolean; personalization?: PersonalizationOptions; simplePersonalization?: SimplePersonalization | null; variantDiversity?: number } = {}): Promise<GenerationResult> {
  const startTime = Date.now();
  const styleId = writingStyle || 'professional-adult';
  const useCache = options.useCache !== false;
  const personalizationOpts = options.personalization || null;
  const simplePersonalization = options.simplePersonalization || null;
  const variantDiversity = options.variantDiversity ?? 5;
  const inputWords = baseMessage.trim().split(/\s+/).length;
  const counts = getSentenceCounts(inputWords);
  if (simplePersonalization && hasActivePersonalization(simplePersonalization.userInstructions, { formality: simplePersonalization.toneFormality, warmth: simplePersonalization.toneWarmth, directness: simplePersonalization.toneDirectness })) {
    console.log('[EmailUltimate] Simple personalization ACTIVE (light touch)');
  } else if (personalizationOpts?.personalization?.isEnabled) {
    console.log('[EmailUltimate] Legacy personalization ENABLED');
  }
  if (useCache) {
    const cacheKey = generateCacheKey(baseMessage, styleId, preferences);
    const cached = getCachedVariants(cacheKey);
    if (cached) return { variants: cached.variants, scores: cached.scores, meta: { model: 'cached', inputWords, tier: counts.tier, duration: Date.now() - startTime, cached: true, retried: false } };
  }
  const stylePrompt = STYLE_PROMPTS[styleId];
  const styleName = WRITING_STYLES[styleId].name;
  const modelConfig = selectModelConfig(inputWords, false);
  console.log('[EmailUltimate] Variant diversity level:', variantDiversity);
  const prompt = buildChainOfThoughtPrompt(baseMessage, styleName, stylePrompt, counts, preferences, personalizationOpts, simplePersonalization, variantDiversity);
  const systemPrompt = `You are an elite cold email copywriter with a 45%+ reply rate track record. Your emails feel like personal messages from a smart friend, not sales templates.\n\nCRITICAL RULES:\n1. NEVER INVENT DETAILS - Only use information provided. "next week" stays "next week", not "Tuesday"\n2. SENTENCE COUNTS - Ultra: ${counts.ultra}, Warm: ${counts.warm}, Value: ${counts.value}\n3. FLOW - Each sentence leads naturally to the next. Vary lengths. Use transitions.\n4. FIRST CONTACT - Unless user mentions prior conversation, write as COLD OUTREACH\n\nReturn valid JSON only.`;
  let variants: EmailVariant[] = [];
  let retried = false;
  let actualModel = modelConfig.model;
  try {
    console.log(`[EmailUltimate] Generating (${counts.tier}, ${inputWords} words, model: ${modelConfig.model})`);
    const completion = await openai.chat.completions.create({ model: modelConfig.model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], response_format: { type: "json_object" }, max_completion_tokens: modelConfig.maxTokens, temperature: modelConfig.temperature, presence_penalty: modelConfig.presencePenalty, frequency_penalty: modelConfig.frequencyPenalty });
    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content in response');
    const result = JSON.parse(content);
    variants = result.variants || [];
  } catch (error: any) {
    console.error(`[EmailUltimate] Error with ${modelConfig.model}:`, error.message);
    if (modelConfig.model === 'gpt-4o-mini') {
      console.log('[EmailUltimate] Retrying with gpt-4o...');
      retried = true; actualModel = 'gpt-4o';
      const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], response_format: { type: "json_object" }, max_completion_tokens: 3000, temperature: 0.75, presence_penalty: 0.15, frequency_penalty: 0.1 });
      const content = completion.choices[0].message.content;
      if (!content) throw new Error('No content in retry response');
      const result = JSON.parse(content);
      variants = result.variants || [];
    } else throw error;
  }
  const scores = variants.map(v => calculateQualityScore(v.subject, v.body));
  const duration = Date.now() - startTime;
  console.log(`[EmailUltimate] Generated ${variants.length} variants in ${duration}ms`);
  const lowScoreVariant = scores.findIndex(s => s.overall < 50);
  if (lowScoreVariant !== -1 && !retried && modelConfig.model !== 'gpt-4o') {
    console.log(`[EmailUltimate] Variant ${lowScoreVariant + 1} scored ${scores[lowScoreVariant].overall} - below threshold, retrying...`);
    return generateEmailVariantsUltimate(baseMessage, preferences, writingStyle, { useCache: false });
  }
  if (useCache && variants.length > 0) { const cacheKey = generateCacheKey(baseMessage, styleId, preferences); setCachedVariants(cacheKey, variants, scores); }
  return { variants, scores, meta: { model: actualModel, inputWords, tier: counts.tier, duration, cached: false, retried } };
}

export async function regenerateEmailVariantsUltimate(baseMessage: string, feedback: string, previousVariants: EmailVariant[], preferences?: EmailPreferences | null, writingStyle?: WritingStyleId, options: { personalization?: PersonalizationOptions; simplePersonalization?: SimplePersonalization | null; variantDiversity?: number } = {}): Promise<GenerationResult> {
  const startTime = Date.now();
  const styleId = writingStyle || 'professional-adult';
  const stylePrompt = STYLE_PROMPTS[styleId];
  const styleName = WRITING_STYLES[styleId].name;
  const inputWords = baseMessage.trim().split(/\s+/).length;
  const counts = getSentenceCounts(inputWords);
  const personalizationOpts = options.personalization || null;
  const simplePersonalization = options.simplePersonalization || null;
  const variantDiversity = options.variantDiversity ?? 5;
  const modelConfig = selectModelConfig(inputWords, true);
  const prevText = previousVariants.map(v => `[${v.approach}]\nSubject: ${v.subject}\nBody: ${v.body}`).join('\n\n');
  const prefLines: string[] = [];
  if (preferences?.tonePreference) prefLines.push(`Tone: ${preferences.tonePreference}`);
  if (preferences?.lengthPreference) prefLines.push(`Length: ${preferences.lengthPreference}`);
  if (preferences?.defaultSignature) prefLines.push(`Sign off: ${preferences.defaultSignature}`);
  const prefsSection = prefLines.length ? `\nPreferences: ${prefLines.join(' | ')}` : '';
  let personalizationSection = '';
  if (simplePersonalization && hasActivePersonalization(simplePersonalization.userInstructions, { formality: simplePersonalization.toneFormality, warmth: simplePersonalization.toneWarmth, directness: simplePersonalization.toneDirectness })) {
    personalizationSection = buildStyleSeasoning(simplePersonalization.userInstructions, { formality: simplePersonalization.toneFormality, warmth: simplePersonalization.toneWarmth, directness: simplePersonalization.toneDirectness }, simplePersonalization.favoriteEmailSamples);
  } else if (personalizationOpts?.personalization?.isEnabled) {
    personalizationSection = buildPersonalizationPrompt({ personalization: personalizationOpts.personalization, voicePatterns: personalizationOpts.voicePatterns || null, personaInstructions: personalizationOpts.persona?.instructions || null, baseStyle: styleName.toLowerCase() });
  }
  const prompt = `IMPROVE these emails based on user feedback.\n\n=== USER FEEDBACK (Priority #1) ===\n"${feedback}"\n\n=== ORIGINAL MESSAGE ===\n"${baseMessage}"\n\n=== CURRENT EMAILS ===\n${prevText}\n\n=== STYLE TO APPLY ===\n${styleName}\n${stylePrompt}${prefsSection}\n${personalizationSection}\n\n=== VARIANT DIVERSITY ===\n${translateDiversityToGuidance(variantDiversity)}\n\n=== OUTPUT ===\nReturn ONLY valid JSON:\n{"variants":[{"subject":"","body":"","approach":"Ultra-Direct"},{"subject":"","body":"","approach":"Warm but Brief"},{"subject":"","body":"","approach":"Value-First"}]}`;
  const systemPrompt = `You are an elite cold email copywriter applying user feedback. Your #1 job is to implement the feedback precisely while maintaining natural, flowing prose.\n\nReturn valid JSON only.`;
  try {
    console.log(`[EmailUltimate] Regenerating with feedback: "${feedback.substring(0, 50)}..." (diversity: ${variantDiversity}/10)`);
    const completion = await openai.chat.completions.create({ model: modelConfig.model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], response_format: { type: "json_object" }, max_completion_tokens: modelConfig.maxTokens, temperature: modelConfig.temperature, presence_penalty: modelConfig.presencePenalty, frequency_penalty: modelConfig.frequencyPenalty });
    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content in response');
    const result = JSON.parse(content);
    const variants = result.variants || [];
    const scores = variants.map((v: EmailVariant) => calculateQualityScore(v.subject, v.body));
    const duration = Date.now() - startTime;
    console.log(`[EmailUltimate] Regenerated ${variants.length} variants in ${duration}ms`);
    return { variants, scores, meta: { model: modelConfig.model, inputWords, tier: counts.tier, duration, cached: false, retried: false } };
  } catch (error: any) {
    console.error('[EmailUltimate] Regeneration error:', error.message);
    throw new Error(`Failed to regenerate: ${error.message}`);
  }
}
