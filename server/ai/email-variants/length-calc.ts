export function calculateSentenceCounts(inputWords: number): { tier: string; ultraSentences: string; warmSentences: string; valueSentences: string } {
  if (inputWords <= 12) return { tier: "MINIMAL", ultraSentences: "2", warmSentences: "3", valueSentences: "3-4" };
  if (inputWords <= 25) return { tier: "SHORT", ultraSentences: "3", warmSentences: "4", valueSentences: "4-5" };
  if (inputWords <= 50) return { tier: "MEDIUM", ultraSentences: "4", warmSentences: "5", valueSentences: "5-6" };
  if (inputWords <= 80) return { tier: "DETAILED", ultraSentences: "5", warmSentences: "6", valueSentences: "6-7" };
  return { tier: "COMPREHENSIVE", ultraSentences: "6", warmSentences: "7", valueSentences: "7-8" };
}

export function buildLengthSection(inputWords: number, tier: string, ultraSentences: string, warmSentences: string, valueSentences: string): string {
  return `=== EMAIL LENGTH (Sentence Count) ===
Input: ${inputWords} words → ${tier}
Write EXACTLY this many sentences per variant:
• Ultra-Direct: ${ultraSentences} sentences
• Warm but Brief: ${warmSentences} sentences  
• Value-First: ${valueSentences} sentences
More input = more details to include = more sentences.`;
}

export function buildPreferencesText(preferences?: { tonePreference?: string | null; lengthPreference?: string | null; styleNotes?: string | null; defaultSignature?: string | null } | null): string {
  if (!preferences) return '';
  const prefLines: string[] = [];
  if (preferences.tonePreference) prefLines.push(`Tone: ${preferences.tonePreference}`);
  if (preferences.lengthPreference) prefLines.push(`Length: ${preferences.lengthPreference}`);
  if (preferences.styleNotes) prefLines.push(`Notes: ${preferences.styleNotes}`);
  if (preferences.defaultSignature) prefLines.push(`Sign off: ${preferences.defaultSignature}`);
  return prefLines.length > 0 ? `\nPreferences: ${prefLines.join(' | ')}` : '';
}
