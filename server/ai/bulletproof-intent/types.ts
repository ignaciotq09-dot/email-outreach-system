export interface TwoPassIntentResult { pass1: IntentResult; pass2: IntentResult; patternValidation: PatternValidationResult; finalVerdict: FinalVerdict; auditTrail: AuditEntry[]; }
export interface IntentResult { intentType: 'booking' | 'interested' | 'question' | 'not_interested' | 'unsubscribe' | 'out_of_office' | 'other'; confidence: number; reasoning: string; }
export interface PatternValidationResult { hasBookingLanguage: boolean; hasNegationLanguage: boolean; hasQuestionLanguage: boolean; hasRescheduleRequest: boolean; hasConstraints: boolean; patterns: string[]; }
export interface FinalVerdict { isConfirmedYes: boolean; shouldAutoReply: boolean; shouldFlagForReview: boolean; confidence: number; decision: 'auto_reply' | 'flag_for_review' | 'no_action'; reasoning: string; }
export interface AuditEntry { timestamp: string; step: string; result: string; details: any; }
