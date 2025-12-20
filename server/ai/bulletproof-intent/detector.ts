import type { TwoPassIntentResult, AuditEntry } from "./types";
import { runPatternValidation } from "./pattern-validator";
import { runFirstPassAnalysis, runSecondPassAnalysis } from "./ai-passes";
import { determineFinalVerdict } from "./verdict";

export async function detectIntentBulletproof(replyContent: string): Promise<TwoPassIntentResult> {
  const auditTrail: AuditEntry[] = []; const startTime = Date.now();
  auditTrail.push({ timestamp: new Date().toISOString(), step: 'start', result: 'Initiating bulletproof intent detection', details: { contentLength: replyContent.length } });
  const patterns = runPatternValidation(replyContent);
  auditTrail.push({ timestamp: new Date().toISOString(), step: 'pattern_validation', result: `Found ${patterns.patterns.length} patterns`, details: patterns });
  if (patterns.hasNegationLanguage && !patterns.hasBookingLanguage) { return { pass1: { intentType: 'not_interested', confidence: 90, reasoning: 'Negation patterns detected' }, pass2: { intentType: 'not_interested', confidence: 90, reasoning: 'Skipped - fast path' }, patternValidation: patterns, finalVerdict: { isConfirmedYes: false, shouldAutoReply: false, shouldFlagForReview: false, confidence: 0, decision: 'no_action', reasoning: 'Strong negation language detected - definitely not a yes' }, auditTrail }; }
  const pass1 = await runFirstPassAnalysis(replyContent); auditTrail.push({ timestamp: new Date().toISOString(), step: 'pass1_complete', result: `${pass1.intentType} at ${pass1.confidence}%`, details: pass1 });
  const pass2 = await runSecondPassAnalysis(replyContent, pass1); auditTrail.push({ timestamp: new Date().toISOString(), step: 'pass2_complete', result: `${pass2.intentType} at ${pass2.confidence}%`, details: pass2 });
  const finalVerdict = determineFinalVerdict(pass1, pass2, patterns); auditTrail.push({ timestamp: new Date().toISOString(), step: 'final_verdict', result: finalVerdict.decision, details: { ...finalVerdict, totalTimeMs: Date.now() - startTime } });
  console.log(`[BulletproofIntent] Detection complete: ${finalVerdict.decision} (${finalVerdict.confidence}%) - ${finalVerdict.reasoning}`);
  return { pass1, pass2, patternValidation: patterns, finalVerdict, auditTrail };
}
