import type { ToneValues, ConflictResolution } from "./types";

export function detectAndResolveConflicts(toneValues: ToneValues): ConflictResolution {
  const { formality, warmth, directness } = toneValues;
  if (formality >= 8 && warmth >= 8) {
    return { hasConflict: true, conflictType: 'formal_warm', resolutionGuidance: `CONFLICT RESOLUTION (High Formality + High Warmth):\nYou're aiming for "warmly professional" - think of a respected mentor expressing genuine appreciation.\n- FORMALITY wins for LANGUAGE REGISTER: Use proper grammar, no contractions, polished vocabulary\n- WARMTH wins for SENTIMENT: Express sincere appreciation, genuine care, heartfelt thanks\n- Combine them: "Dear Ms. Chen, I am truly grateful for your thoughtful guidance. Your insights have been invaluable..."\n- Avoid: Cold formality OR sloppy enthusiasm. Find the dignified warmth.` };
  }
  if (directness >= 8 && formality <= 3) {
    return { hasConflict: true, conflictType: 'direct_casual', resolutionGuidance: `CONFLICT RESOLUTION (High Directness + Low Formality):\nYou're aiming for "casual but efficient" - think friendly text message that gets to the point.\n- DIRECTNESS wins for STRUCTURE: Lead with the ask, minimal preamble\n- FORMALITY wins for VOCABULARY: Casual language, contractions, informal tone\n- Combine them: "Hey! Quick favor - can you review this by Friday? Would really help."\n- Avoid: Lengthy casual chat OR stiff direct demands. Be a friendly efficiency expert.` };
  }
  if (formality >= 8 && directness >= 8) {
    return { hasConflict: true, conflictType: 'formal_direct', resolutionGuidance: `CONFLICT RESOLUTION (High Formality + High Directness):\nYou're aiming for "executive brevity" - think senior leader who respects everyone's time.\n- FORMALITY wins for LANGUAGE: Polished, professional vocabulary, proper structure\n- DIRECTNESS wins for STRUCTURE: Lead with the ask, minimal context, respect their time\n- Combine them: "Hello Dr. Martinez, I am requesting your approval on the attached proposal by Thursday. Please advise if you require additional information."\n- Avoid: Overly elaborate formal intros OR casual bluntness. Be efficiently dignified.` };
  }
  if (warmth <= 3 && directness <= 3) {
    return { hasConflict: true, conflictType: 'reserved_indirect', resolutionGuidance: `CONFLICT RESOLUTION (Low Warmth + Low Directness):\nYou're aiming for "diplomatic reserve" - think careful diplomatic correspondence.\n- WARMTH setting means: Minimal emotional language, factual, reserved\n- DIRECTNESS setting means: Gradual build-up, context before ask, soft approach\n- Combine them: Build context methodically without emotional language, ease into the ask\n- Avoid: Cold abruptness OR fake warmth. Be professionally measured and patient.` };
  }
  return { hasConflict: false, conflictType: null, resolutionGuidance: null };
}
