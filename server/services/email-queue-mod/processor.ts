import { storage } from '../../storage';
import { personalizeVariantForContact } from '../../ai';
import { optimizationContextBuilder } from '../optimization-context-builder';
import { emailOptimizationOrchestrator, performancePredictor } from '../../ai';
import { EmailTrackingService } from '../email-tracking';
import type { QueuedEmail } from './types';

export async function processEmail(email: QueuedEmail, callbacks: { onSuccess: (result: any) => void; onFailure: (error: Error, retries: number) => void }) {
  try { const optimizationContext = await optimizationContextBuilder.buildContext(email.userId, { contactId: email.contact.id, campaignId: email.campaignId }); const optimizationResult = await emailOptimizationOrchestrator.optimizeEmail({ subject: email.variant.subject, body: email.variant.body, approach: email.variant.approach || 'queue' }, optimizationContext); const scores = performancePredictor.calculateEmailScore(optimizationResult.optimizedVariant, optimizationContext); const predictions = performancePredictor.predictPerformance(scores.totalScore, optimizationContext);
  const preferences = await storage.getEmailPreferences("default"); const personalized = await personalizeVariantForContact(optimizationResult.optimizedVariant, email.contact.name, email.contact.company, email.contact.pronoun || '', email.contact.notes || undefined, preferences);
  const sendResult = await EmailTrackingService.sendTrackedEmail({ userId: email.userId, contactId: email.contact.id, to: email.contact.email, subject: personalized.subject, body: personalized.body, writingStyle: email.variant.approach, campaignId: email.campaignId, provider: 'gmail' }); if (!sendResult.success) throw new Error(sendResult.error || 'Failed to send email via tracking service');
  await storage.logOptimizationRun({ sentEmailId: sendResult.sentEmailId, emailId: sendResult.sentEmailId, variantId: email.variant.approach || 'queue', rulesApplied: optimizationResult.appliedRules || [], scores: scores || {}, predictions: predictions || {}, suggestions: optimizationResult.improvements || [], intent: optimizationContext.intent || null, industry: optimizationContext.industry || null });
  callbacks.onSuccess({ sentEmailId: sendResult.sentEmailId, optimizationScore: scores.totalScore }); console.log(`[EmailQueue] Sent tracked email to ${email.contact.email} (Score: ${scores.totalScore})`); } catch (error: any) { console.error(`[EmailQueue] Failed to send email to ${email.contact.email}:`, error.message); callbacks.onFailure(error, email.retries); }
}
