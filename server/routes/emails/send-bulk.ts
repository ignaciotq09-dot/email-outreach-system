import type { Request, Response, Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { sendBulkSchema } from "../validation-schemas";
import { optimizationContextBuilder } from "../../services/optimization-context-builder";
import { requireAuth } from "../../auth/middleware";
import { attachUserEmailService } from "../../auth/email-service-middleware";
import { queueReplyDetectionForSentEmail } from "../../services/reply-detection-engine";
import type { DetectionProvider } from "../../services/reply-detection-engine";

export function registerSendBulkRoutes(app: Express) {
  app.post("/api/emails/send-bulk", requireAuth, attachUserEmailService, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = sendBulkSchema.parse(req.body);
      const { emails } = validatedData;
      console.log('[SendBulk] User', userId, ': Sending', emails.length, 'emails');
      const results = [];
      let totalOptimizationScore = 0;
      let optimizedCount = 0;
      for (const email of emails) {
        try {
          const optimizationContext = await optimizationContextBuilder.buildContactContext(email.body, email.contact, req.body.campaignId);
          const { emailOptimizationOrchestrator, performancePredictor } = await import('../../ai');
          const variant = { subject: email.subject, body: email.body, approach: email.writingStyle || 'bulk' };
          const optimizationResult = await emailOptimizationOrchestrator.optimizeEmailVariant(variant, optimizationContext);
          const scores = performancePredictor.calculateEmailScore(optimizationResult.optimizedVariant, optimizationContext);
          const predictions = performancePredictor.predictPerformance(scores.totalScore, optimizationContext);
          const { messageId, threadId } = await req.emailService!.sendEmail(email.contact.email, optimizationResult.optimizedVariant.subject, optimizationResult.optimizedVariant.body);
          const sentEmail = await storage.createSentEmail(userId, { contactId: email.contactId, subject: optimizationResult.optimizedVariant.subject, body: optimizationResult.optimizedVariant.body, gmailMessageId: messageId || '', gmailThreadId: threadId || '', writingStyle: email.writingStyle || 'professional-adult' });
          try { await queueReplyDetectionForSentEmail(req.emailService!.userId, sentEmail.id, email.contactId, req.emailService!.provider as DetectionProvider, 5); } catch (e) { console.error('[SendBulk] Failed to queue reply detection:', e); }
          await storage.logOptimizationRun(userId, { sentEmailId: sentEmail.id, emailId: sentEmail.id, variantId: email.writingStyle || 'bulk', rulesApplied: optimizationResult.rulesApplied || {}, scores: scores || {}, predictions: predictions || {}, suggestions: optimizationResult.suggestions || [], intent: optimizationContext.intent || null, industry: optimizationContext.company?.industry || null, createdAt: new Date() });
          const optimizationScore = scores.totalScore;
          totalOptimizationScore += optimizationScore;
          optimizedCount++;
          results.push({ contactId: email.contactId, success: true, sentEmailId: sentEmail.id, optimizationScore, optimizationDetails: { scores, predictions, rulesApplied: optimizationResult.rulesApplied, suggestions: optimizationResult.suggestions, intent: optimizationContext.intent, industry: optimizationContext.company?.industry } });
        } catch (error) {
          console.error(`Error sending email to ${email.contact.name}:`, error);
          results.push({ contactId: email.contactId, success: false, error: 'Failed to send email' });
        }
      }
      const successCount = results.filter(r => r.success).length;
      const avgScore = successCount > 0 ? totalOptimizationScore / successCount : 0;
      console.log('[SendBulk] Sent', successCount, 'of', results.length, 'emails. Avg score:', avgScore);
      res.json({ results, optimizationApplied: true, averageOptimizationScore: avgScore });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      console.error('[SendBulk] Error:', error);
      res.status(500).json({ error: error.message || 'Failed to send bulk emails' });
    }
  });
}
