// Re-export from modular structure for backward compatibility
export { detectIntentBulletproof, determineFinalVerdict, runPatternValidation, runFirstPassAnalysis, runSecondPassAnalysis, generateAutoReplyMessage, STRONG_YES_PHRASES, STRONG_NO_PHRASES, NEGATION_PATTERNS, QUESTION_PATTERNS, CONSTRAINT_PATTERNS, RESCHEDULE_PATTERNS } from "./bulletproof-intent/index";
export type { TwoPassIntentResult, IntentResult, PatternValidationResult, FinalVerdict, AuditEntry } from "./bulletproof-intent/index";
