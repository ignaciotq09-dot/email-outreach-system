import type { PatternValidationResult } from "./types";
import { STRONG_YES_PHRASES, STRONG_NO_PHRASES, NEGATION_PATTERNS, QUESTION_PATTERNS, CONSTRAINT_PATTERNS, RESCHEDULE_PATTERNS } from "./constants";

export function runPatternValidation(content: string): PatternValidationResult {
  const lowerContent = content.toLowerCase();
  const patterns: string[] = [];
  let hasBookingLanguage = false; let hasNegationLanguage = false; let hasQuestionLanguage = false; let hasRescheduleRequest = false; let hasConstraints = false;
  for (const phrase of STRONG_YES_PHRASES) { if (lowerContent.includes(phrase)) { hasBookingLanguage = true; patterns.push(`yes:${phrase}`); break; } }
  for (const phrase of STRONG_NO_PHRASES) { if (lowerContent.includes(phrase)) { hasNegationLanguage = true; patterns.push(`no:${phrase}`); break; } }
  for (const pattern of NEGATION_PATTERNS) { if (lowerContent.includes(pattern)) { hasNegationLanguage = true; patterns.push(`negation:${pattern}`); break; } }
  for (const pattern of QUESTION_PATTERNS) { if (lowerContent.includes(pattern)) { hasQuestionLanguage = true; patterns.push(`question:${pattern}`); break; } }
  for (const pattern of CONSTRAINT_PATTERNS) { if (lowerContent.includes(pattern)) { hasConstraints = true; patterns.push(`constraint:${pattern}`); break; } }
  for (const pattern of RESCHEDULE_PATTERNS) { if (lowerContent.includes(pattern)) { hasRescheduleRequest = true; patterns.push(`reschedule:${pattern}`); break; } }
  return { hasBookingLanguage, hasNegationLanguage, hasQuestionLanguage, hasRescheduleRequest, hasConstraints, patterns };
}
