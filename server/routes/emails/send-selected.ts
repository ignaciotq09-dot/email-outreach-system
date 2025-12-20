import type { Request, Response, Express } from "express";
import { z } from "zod";
import pLimit from "p-limit";
import { storage } from "../../storage";
import { personalizeVariantForContact } from "../../ai";
import { sendToSelectedSchema } from "../validation-schemas";
import { optimizationContextBuilder } from "../../services/optimization-context-builder";
import { requireAuth } from "../../auth/middleware";
import { attachUserEmailService } from "../../auth/email-service-middleware";
import { queueReplyDetectionForSentEmail } from "../../services/reply-detection-engine";
import type { DetectionProvider } from "../../services/reply-detection-engine";

export function registerSendSelectedRoutes(app: Express) {
  app.post("/api/emails/send-to-selected", requireAuth, attachUserEmailService, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = sendToSelectedSchema.parse(req.body);
      const { selectedVariant, contactIds } = validatedData;
      console.log('[SendToSelected] User', userId, ': Sending to', contactIds.length, 'contacts');
      const selectedContacts = await storage.getContactsByIds(userId, contactIds);
      if (selectedContacts.length === 0) return res.status(400).json({ error: 'No valid contacts found' });
      const preferences = await storage.getEmailPreferences(userId);
      const limit = pLimit(3);
      const sendPromises = selectedContacts.map((contact) => limit(async () => {
        try {
          const optimizationContext = await optimizationContextBuilder.buildContactContext(selectedVariant.body, contact, req.body.campaignId);
          const { emailOptimizationOrchestrator, performancePredictor } = await import('../../ai');
          const optimizationResult = await emailOptimizationOrchestrator.optimizeEmailVariant(selectedVariant, optimizationContext);
          const scores = performancePredictor.calculateEmailScore(optimizationResult.optimizedVariant, optimizationContext);
          const predictions = performancePredictor.predictPerformance(scores.totalScore, optimizationContext);
          const personalized = await personalizeVariantForContact(optimizationResult.optimizedVariant, contact.name, contact.company, contact.pronoun || '', contact.notes || undefined, preferences);
          const { messageId, threadId } = await req.emailService!.sendEmail(contact.email, personalized.subject, personalized.body);
          const sentEmail = await storage.createSentEmail(userId, { contactId: contact.id, subject: personalized.subject, body: personalized.body, gmailMessageId: messageId || '', gmailThreadId: threadId || '', writingStyle: selectedVariant.approach });
          try { await queueReplyDetectionForSentEmail(req.emailService!.userId, sentEmail.id, contact.id, req.emailService!.provider as DetectionProvider, 5); } catch (e) { console.error('[SendToSelected] Failed to queue reply detection:', e); }
          await storage.logOptimizationRun(userId, { sentEmailId: sentEmail.id, emailId: sentEmail.id, variantId: selectedVariant.approach || 'default', rulesApplied: optimizationResult.rulesApplied || {}, scores: scores || {}, predictions: predictions || {}, suggestions: optimizationResult.suggestions || [], intent: optimizationContext.intent || null, industry: optimizationContext.company?.industry || null, createdAt: new Date() });
          return { contactId: contact.id, success: true, sentEmailId: sentEmail.id, optimizationScore: scores.totalScore, optimizationDetails: { scores, predictions, rulesApplied: optimizationResult.rulesApplied, suggestions: optimizationResult.suggestions, intent: optimizationContext.intent, industry: optimizationContext.company?.industry } };
        } catch (error) {
          console.error(`Error sending to ${contact.name}:`, error);
          return { contactId: contact.id, success: false, error: 'Failed to send email' };
        }
      }));
      const settledResults = await Promise.allSettled(sendPromises);
      const results = settledResults.map(s => s.status === 'fulfilled' ? s.value : { contactId: -1, success: false, error: 'Promise rejected' });
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      const totalScore = results.reduce((sum, r) => sum + (r.optimizationScore || 0), 0);
      const avgScore = successCount > 0 ? totalScore / successCount : 0;
      console.log('[SendToSelected] Successful:', successCount, 'Failed:', failCount, 'Avg Score:', avgScore.toFixed(2));
      const accurateResults = results.map(r => ({ contactId: r.contactId, success: r.success, sentEmailId: r.sentEmailId || null, optimizationScore: r.optimizationScore || 0, error: r.error || null, recordedAt: new Date().toISOString() }));
      res.json({ results: accurateResults, summary: { total: results.length, successful: successCount, failed: failCount, optimizationApplied: true, averageOptimizationScore: avgScore, timestamp: new Date().toISOString() } });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      console.error('[SendToSelected] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to send emails' });
    }
  });
}
