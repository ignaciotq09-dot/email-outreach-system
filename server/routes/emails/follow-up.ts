import type { Request, Response, Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { followUpSchema } from "../validation-schemas";
import { requireAuth } from "../../auth/middleware";
import { attachUserEmailService } from "../../auth/email-service-middleware";
import { EmailTrackingService } from "../../services/email-tracking";

export function registerFollowUpRoutes(app: Express) {
  app.post("/api/emails/follow-up", requireAuth, attachUserEmailService, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = followUpSchema.parse({ sentEmailId: req.body.originalEmailId, followUpBody: req.body.followUpMessage });
      const originalEmailId = validatedData.sentEmailId;
      const followUpMessage = validatedData.followUpBody;
      const originalEmail = await storage.getSentEmailById(userId, originalEmailId);
      if (!originalEmail) return res.status(404).json({ error: 'Original email not found' });
      const result = await EmailTrackingService.sendTrackedReply({
        userId,
        contactId: originalEmail.contactId,
        to: originalEmail.contact.email,
        subject: originalEmail.subject || '',
        body: followUpMessage,
        threadId: originalEmail.gmailThreadId || '',
        messageId: originalEmail.gmailMessageId || undefined,
        writingStyle: 'follow-up',
        campaignId: originalEmail.campaignId || undefined,
        provider: req.emailService!.provider as 'gmail' | 'outlook' | 'yahoo',
      });
      if (!result.success) throw new Error(result.error || 'Failed to send follow-up');
      const followUp = await storage.createFollowUp(userId, { originalEmailId, followUpBody: followUpMessage, gmailMessageId: result.messageId || '' });
      res.json({ success: true, followUp });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error('[FollowUp] Validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      console.error('[FollowUp] Error sending follow-up:', error);
      res.status(500).json({ error: error.message || 'Failed to send follow-up email' });
    }
  });
}
