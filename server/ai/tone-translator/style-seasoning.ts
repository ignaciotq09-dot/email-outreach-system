import type { ToneValues } from "./types";
import { translateToneToGuidance } from "./guidance";
import { detectAndResolveConflicts } from "./conflict-resolver";
import type { NormalizedInstruction } from '../instruction-normalizer';
import { formatNormalizedInstructions } from '../instruction-normalizer';

export function buildStyleSeasoning(userInstructions: string | null, toneValues: ToneValues, favoriteEmailSamples?: string | null): string {
  const guidance = translateToneToGuidance(toneValues);
  const sections: string[] = [];
  const hasInstructions = userInstructions && userInstructions.trim().length > 0;
  const hasSamples = favoriteEmailSamples && favoriteEmailSamples.trim().length > 0;
  if (!hasInstructions && !hasSamples && !guidance.formality && !guidance.warmth && !guidance.directness) return "";
  sections.push(`CRITICAL RULE: Never fabricate information. Only use details explicitly provided (names, context, history, relationships). If information is missing, work with what you have—never invent facts to fill gaps.`);
  sections.push(`You are ghostwriting for this person. Your job is to write emails they could have written themselves. Study their voice, internalize it, and become them.`);
  if (hasInstructions) {
    sections.push(`THEIR PREFERENCES (interpret flexibly, execute faithfully):\n"""\n${userInstructions!.trim()}\n"""\n\nINSTRUCTION INTERPRETATION RULES:\nThese instructions may be informal, messy, or use casual language. That's fine—your job is to understand their INTENT, not parse perfect grammar.\n\nStep 1 - Extract the Core Intent:\n• What feeling/vibe are they going for? (casual, professional, friendly, urgent, etc.)\n• What do they want to AVOID? (salesy, boring, long, formal, etc.)\n• What specific things do they want INCLUDED or EXCLUDED?\n\nStep 2 - Handle Seemingly Contradictory Instructions:\nPeople often write things like "professional but casual" or "friendly but not too informal"—these aren't contradictions, they're nuances.\n\nStep 3 - Common Messy Phrases (decode these):\n• "like how i text but for work" → conversational, uses contractions, but professional enough for email\n• "not too [X]" → moderate level of X, not zero\n• "make it sound like me" → natural, authentic, not robotic or templated\n\nStep 4 - What They DON'T Want (hard rules):\nScan for: don't, never, avoid, no, not, stop, without, skip\nThese are PROHIBITIONS—never violate them.\n\nStep 5 - What They DO Want (soft guidelines):\nScan for: always, use, keep, make sure, include, try to, more, less\nThese are PREFERENCES—follow them unless they conflict with prohibitions.\n\nMASTER PRIORITY HIERARCHY:\n1. PROHIBITIONS (don't/never/avoid) → Absolute rules, never break\n2. EXPLICIT PREFERENCES (always/must/keep) → Strong rules, honor unless #1 conflicts\n3. SOFT PREFERENCES (try to/more/less) → Guidance, follow when possible\n4. RECENCY TIE-BREAKER → When two instructions at SAME priority level conflict, follow whichever appears LATER\n5. HUMAN TIE-BREAKER → When still stuck, choose the option that sounds more natural and relationship-preserving\n\nTheir instructions—however they wrote them—override other settings in this prompt.`);
  }
  if (hasSamples) {
    const hasActiveSliders = !!(guidance.formality || guidance.warmth || guidance.directness);
    const sampleConflictNote = hasActiveSliders ? `\n\nIMPORTANT - SAMPLE VS SLIDER CONFLICT RULE:\nIf the samples show a different style than the tone sliders above, follow this priority:\n1. SLIDERS WIN for style traits (formality level, warmth level, directness structure)\n2. SAMPLES provide neutral traits only (greetings format, sign-off style, sentence rhythm, vocabulary preferences)` : '';
    sections.push(`THEIR ACTUAL WRITING:\n---\n${favoriteEmailSamples!.trim()}\n---\n\nRead these samples carefully. Notice how they open emails, how they close them, their sentence rhythm, their word choices, their personality. Don't just copy patterns—internalize their voice so deeply that you could write as them naturally.${hasInstructions ? `\n\nTheir explicit preferences (above) take priority, but use these samples to understand their authentic style.` : ''}${sampleConflictNote}`);
  }
  const toneRulebooks: string[] = [];
  if (guidance.formality) toneRulebooks.push(guidance.formality);
  if (guidance.warmth) toneRulebooks.push(guidance.warmth);
  if (guidance.directness) toneRulebooks.push(guidance.directness);
  if (toneRulebooks.length > 0) {
    const conflictNote = (hasInstructions || hasSamples) ? `\nIMPORTANT: Apply these tone rules ONLY if they don't contradict the sender's explicit preferences${hasSamples ? ' or their sample style' : ''} above.` : '';
    sections.push(`TONE RULEBOOK:\nFollow these specific rules for how to write:\n\n${toneRulebooks.join('\n\n')}${conflictNote}`);
  }
  const conflictResolution = detectAndResolveConflicts(toneValues);
  if (conflictResolution.hasConflict && conflictResolution.resolutionGuidance) sections.push(conflictResolution.resolutionGuidance);
  sections.push(`WHEN IN DOUBT - USE THESE EXPLICIT DEFAULTS:\nIf instructions are missing, vague, or contradictory, apply these concrete rules:\n\nTONE DEFAULTS (use these exact levels when unspecified):\n• Formality: Level 5 (balanced) - "Hi [Name]," openings, professional but not stiff\n• Warmth: Level 6 (slightly warm) - friendly without being overly casual\n• Directness: Level 6 (fairly direct) - get to the point within first 2 sentences\n\nSTRUCTURE DEFAULTS:\n• Length: 3-5 sentences for simple asks, 5-8 for complex topics\n• Opening: One sentence of context or connection, then the main point\n• Closing: Clear next step or question, then brief sign-off\n\nLANGUAGE DEFAULTS:\n• Use contractions naturally (I'm, you're, we'll)\n• Avoid: jargon, buzzwords, passive voice, filler phrases\n\nNEVER default to:\n• Overly formal language\n• Longer emails "just to be safe"\n• Adding qualifiers, disclaimers, or hedging\n• Robotic, templated phrases\n\nFill gaps with confidence, not caution.`);
  sections.push(`THE TEST: Before outputting, ask yourself—would this person's close colleague believe they wrote this email? If not, revise until they would.`);
  return `\n--- SENDER PERSONALIZATION ---\n\n${sections.join('\n\n')}\n`;
}

export function buildStyleSeasoningWithNormalized(normalizedInstructions: NormalizedInstruction | null, rawInstructions: string | null, toneValues: ToneValues, favoriteEmailSamples?: string | null): string {
  const guidance = translateToneToGuidance(toneValues);
  const sections: string[] = [];
  const hasNormalized = normalizedInstructions !== null;
  const hasRawInstructions = rawInstructions && rawInstructions.trim().length > 0;
  const hasSamples = favoriteEmailSamples && favoriteEmailSamples.trim().length > 0;
  if (!hasNormalized && !hasRawInstructions && !hasSamples && !guidance.formality && !guidance.warmth && !guidance.directness) return "";
  sections.push(`CRITICAL RULE: Never fabricate information. Only use details explicitly provided.`);
  sections.push(`You are ghostwriting for this person. Your job is to write emails they could have written themselves.`);
  if (hasNormalized) {
    sections.push(`THEIR PREFERENCES (pre-interpreted for consistency):\n${formatNormalizedInstructions(normalizedInstructions!)}\n\nThese rules have been parsed from their raw instructions. Follow them precisely.`);
  } else if (hasRawInstructions) {
    sections.push(`THEIR PREFERENCES (interpret flexibly, execute faithfully):\n"""\n${rawInstructions!.trim()}\n"""\n\nInterpret these instructions generously—understand their INTENT, not just their words.`);
  }
  if (hasSamples) {
    const hasActiveSliders = !!(guidance.formality || guidance.warmth || guidance.directness);
    const sampleConflictNote = hasActiveSliders ? `\n\nIMPORTANT - SAMPLE VS SLIDER CONFLICT RULE:\n1. SLIDERS WIN for style traits\n2. SAMPLES provide neutral traits only` : '';
    sections.push(`THEIR ACTUAL WRITING:\n---\n${favoriteEmailSamples!.trim()}\n---\n\nRead these samples carefully. Notice their patterns, rhythm, and personality. Don't copy—internalize.${sampleConflictNote}`);
  }
  const toneRulebooks: string[] = [];
  if (guidance.formality) toneRulebooks.push(guidance.formality);
  if (guidance.warmth) toneRulebooks.push(guidance.warmth);
  if (guidance.directness) toneRulebooks.push(guidance.directness);
  if (toneRulebooks.length > 0) sections.push(`TONE RULEBOOK:\nFollow these specific rules for how to write:\n\n${toneRulebooks.join('\n\n')}`);
  const conflictResolution = detectAndResolveConflicts(toneValues);
  if (conflictResolution.hasConflict && conflictResolution.resolutionGuidance) sections.push(conflictResolution.resolutionGuidance);
  sections.push(`WHEN IN DOUBT - USE THESE EXPLICIT DEFAULTS:\n• Tone: Formality 5, Warmth 6, Directness 6\n• Length: 3-5 sentences for simple asks\n• Language: Natural, uses contractions, avoids jargon\n• Honor prohibitions over preferences, recency breaks ties`);
  sections.push(`THE TEST: Would this person's close colleague believe they wrote this email?`);
  return `\n--- SENDER PERSONALIZATION ---\n\n${sections.join('\n\n')}\n`;
}
