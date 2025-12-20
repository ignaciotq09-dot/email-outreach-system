import type { EmailPreferences } from "@shared/schema";
import type { PersonalizationOptions, SimplePersonalization, SentenceCounts } from "./types";
import { FEW_SHOT_EXAMPLES, ANTI_EXAMPLES, TRANSITION_LIBRARY } from "./examples";
import { buildPersonalizationPrompt } from "../voice-analyzer";
import { buildStyleSeasoning, hasActivePersonalization, translateDiversityToGuidance } from "../tone-translator";

export function buildChainOfThoughtPrompt(baseMessage: string, styleName: string, stylePrompt: string, counts: SentenceCounts, preferences?: EmailPreferences | null, personalizationOpts?: PersonalizationOptions | null, simplePersonalization?: SimplePersonalization | null, variantDiversity: number = 5): string {
  const prefLines: string[] = [];
  if (preferences?.tonePreference) prefLines.push(`Tone preference: ${preferences.tonePreference}`);
  if (preferences?.lengthPreference) prefLines.push(`Length preference: ${preferences.lengthPreference}`);
  if (preferences?.styleNotes) prefLines.push(`Style notes: ${preferences.styleNotes}`);
  if (preferences?.defaultSignature) prefLines.push(`Sign off with: ${preferences.defaultSignature}`);
  const prefsSection = prefLines.length ? `\n\nUSER PREFERENCES:\n${prefLines.join('\n')}` : '';
  let personalizationSection = '';
  if (simplePersonalization && hasActivePersonalization(simplePersonalization.userInstructions, { formality: simplePersonalization.toneFormality, warmth: simplePersonalization.toneWarmth, directness: simplePersonalization.toneDirectness })) {
    personalizationSection = buildStyleSeasoning(simplePersonalization.userInstructions, { formality: simplePersonalization.toneFormality, warmth: simplePersonalization.toneWarmth, directness: simplePersonalization.toneDirectness }, simplePersonalization.favoriteEmailSamples);
  } else if (personalizationOpts?.personalization?.isEnabled) {
    const personalizationPrompt = buildPersonalizationPrompt({ personalization: personalizationOpts.personalization, voicePatterns: personalizationOpts.voicePatterns || null, personaInstructions: personalizationOpts.persona?.instructions || null, baseStyle: styleName.toLowerCase() });
    const editPatternLines: string[] = [];
    if (personalizationOpts.editPatterns) {
      const ep = personalizationOpts.editPatterns;
      if (ep.commonRemovals.length > 0) editPatternLines.push(`Words this user always removes: ${ep.commonRemovals.join(', ')}`);
      if (ep.commonAdditions.length > 0) editPatternLines.push(`Words/phrases this user always adds: ${ep.commonAdditions.join(', ')}`);
      if (ep.lengthPreference !== 'same') editPatternLines.push(`This user prefers ${ep.lengthPreference} emails`);
      if (ep.formalityAdjustment !== 0) editPatternLines.push(`This user tends to make emails ${ep.formalityAdjustment > 0 ? 'more formal' : 'more casual'}`);
    }
    const editPatternsSection = editPatternLines.length > 0 ? `\n\n## LEARNED FROM USER EDITS:\n${editPatternLines.join('\n')}` : '';
    personalizationSection = `\n\n=== USER PERSONALIZATION (CRITICAL - MUST FOLLOW) ===\n${personalizationPrompt}${editPatternsSection}`;
  }
  return `You are a top 1% cold email copywriter. Your emails consistently achieve 40-50% reply rates because they feel like personal messages, not templates. You write emails that flow naturally, like a smart friend sharing something useful.

=== YOUR TASK ===
Write 3 high-converting email variants from this message:
"${baseMessage}"

=== STEP 1: THINK FIRST (Required) ===
Before writing, analyze silently:
1. What specific thing about the RECIPIENT would catch their attention?
2. What's the ONE insight or value I can offer them?
3. What objection might they have? How do I preemptively address it?
4. What's a natural, low-pressure next step?
5. Is this COLD OUTREACH (first contact) or a FOLLOW-UP (prior conversation mentioned)?

CRITICAL: If the message doesn't explicitly mention prior contact ("following up on...", "as we discussed..."), treat this as COLD OUTREACH - first time reaching out.

=== STEP 2: LEARN FROM THESE EXAMPLES ===
${FEW_SHOT_EXAMPLES}

=== STEP 3: AVOID THESE MISTAKES ===
${ANTI_EXAMPLES}

=== STEP 4: USE NATURAL TRANSITIONS ===
${TRANSITION_LIBRARY}

=== STEP 5: APPLY THIS STYLE ===
Style: ${styleName}
${stylePrompt}${prefsSection}${personalizationSection}

=== STEP 6: FOLLOW THESE STRUCTURES ===

VARIANT 1 - Ultra-Direct (PAS: Problem-Agitate-Solve)
Sentences: ${counts.ultra}
Pattern: Name their problem → Twist slightly → Present solution → Clear CTA

VARIANT 2 - Warm but Brief (Value-First)  
Sentences: ${counts.warm}
Pattern: Personal connection → Offer value → Soft, curious CTA

VARIANT 3 - Value-First (Star-Chain-Hook)
Sentences: ${counts.value}
Pattern: Big result/claim → Brief proof → Low-friction CTA

=== VARIANT DIVERSITY ===
${translateDiversityToGuidance(variantDiversity)}

=== CRITICAL RULES ===

RULE 1 - 🚫 ABSOLUTE NO-FABRICATION (CRITICAL):
Only use information actually provided. NEVER invent:
- Company news, funding, or achievements not mentioned
- Mutual connections or referrals not provided
- Specific metrics, percentages, or results not given
- Dates, times, or deadlines not specified
Examples:
- "next week" → keep as "next week" (NOT "Tuesday at 2pm")
- "discuss pricing" → keep as "discuss pricing" (NOT "$99/month")
- No "Congrats on the Series B" unless user mentioned it
- No "I saw your recent expansion" unless user mentioned it
When data is missing, use generic but effective patterns instead.

RULE 2 - SALES PSYCHOLOGY (Research-Backed):
- Use "you/your" 4x more than "I/we" (+28% engagement)
- Odd numbers are more credible (23% not 20%)
- Lead with THEM, not yourself
- Curiosity gap in subject lines (+47% opens)
- One clear CTA only (multiple CTAs reduce response)

RULE 3 - SUBJECT LINE FORMULAS:
✓ Number: "3 ways to..." / "5 insights from..."
✓ Curiosity: "Noticed something about..." / "Quick thought on..."
✓ Question: "Still struggling with...?" / "What if...?"
✓ Personal: "Re: your [specific]" / "For [Name] -"
✗ AVOID: "Introduction", "Quick question", "Following up", "Checking in"

RULE 4 - WORDS TO AVOID:
✗ Corporate jargon: synergy, leverage, utilize, facilitate, endeavor
✗ Weak openers: "I hope this finds you well", "My name is", "Just checking in"
✗ Spam triggers: FREE, GUARANTEED, URGENT, act now
✓ Use simple alternatives: utilize → use, facilitate → help, endeavor → try

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{"variants":[
  {"subject":"","body":"","approach":"Ultra-Direct"},
  {"subject":"","body":"","approach":"Warm but Brief"},
  {"subject":"","body":"","approach":"Value-First"}
]}`;
}
