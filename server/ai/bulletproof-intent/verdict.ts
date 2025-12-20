import type { IntentResult, PatternValidationResult, FinalVerdict } from "./types";

export function determineFinalVerdict(pass1: IntentResult, pass2: IntentResult, patterns: PatternValidationResult): FinalVerdict {
  if (patterns.hasNegationLanguage) return { isConfirmedYes: false, shouldAutoReply: false, shouldFlagForReview: false, confidence: 0, decision: 'no_action', reasoning: 'Negation language detected - not a yes' };
  const bothSayBooking = pass1.intentType === 'booking' && pass2.intentType === 'booking';
  const hasBookingPatterns = patterns.hasBookingLanguage;
  const hasNoConstraints = !patterns.hasConstraints;
  const pass1HighConfidence = pass1.confidence >= 93;
  const pass2ConfirmsIntent = pass2.confidence >= 80;
  const combinedHighConfidence = pass1HighConfidence && pass2ConfirmsIntent;
  if (bothSayBooking && combinedHighConfidence && hasBookingPatterns && hasNoConstraints) return { isConfirmedYes: true, shouldAutoReply: true, shouldFlagForReview: false, confidence: Math.min(pass1.confidence, pass2.confidence), decision: 'auto_reply', reasoning: `Both AI passes agree on booking intent (Pass 1: ${pass1.confidence}%, Pass 2: ${pass2.confidence}%), pattern validation confirms, no constraints detected` };
  if (bothSayBooking && pass1.confidence >= 75 && pass2.confidence >= 60 && hasBookingPatterns) return { isConfirmedYes: false, shouldAutoReply: false, shouldFlagForReview: true, confidence: Math.min(pass1.confidence, pass2.confidence), decision: 'flag_for_review', reasoning: `Both passes say booking but confidence is below threshold (${pass1.confidence}%, ${pass2.confidence}%). Flagged for manual review.` };
  if (pass1.intentType === 'booking' && pass2.intentType !== 'booking') return { isConfirmedYes: false, shouldAutoReply: false, shouldFlagForReview: true, confidence: 0, decision: 'flag_for_review', reasoning: `AI passes DISAGREE: Pass 1 says ${pass1.intentType}, Pass 2 says ${pass2.intentType}. Flagged for manual review.` };
  if (patterns.hasConstraints && (pass1.intentType === 'booking' || pass2.intentType === 'booking')) return { isConfirmedYes: false, shouldAutoReply: false, shouldFlagForReview: true, confidence: 0, decision: 'flag_for_review', reasoning: 'Booking intent detected but reply contains constraints or questions. Flagged for manual review.' };
  return { isConfirmedYes: false, shouldAutoReply: false, shouldFlagForReview: false, confidence: 0, decision: 'no_action', reasoning: 'Not a confirmed booking intent' };
}
