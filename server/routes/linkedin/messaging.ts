import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { LinkedInService } from "../../services/linkedin";
import { db } from "../../db";
import { contacts } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerMessagingRoutes(app: Express) {
  app.post("/api/linkedin/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { contactId, campaignId, message, messageType } = req.body;
      if (!contactId || !message) return res.status(400).json({ error: 'contactId and message are required' });
      
      const contact = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
      if (contact.length === 0) return res.status(404).json({ error: 'Contact not found' });
      const linkedinProfileUrl = contact[0].linkedinUrl;
      if (!linkedinProfileUrl) return res.status(400).json({ error: 'Contact does not have a LinkedIn profile URL' });
      
      const result = await LinkedInService.sendMessage({ userId, contactId, campaignId, linkedinProfileUrl, message, messageType: messageType || 'connection_request' });
      res.json(result);
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error sending message:', error);
      res.status(500).json({ error: error.message || 'Failed to send LinkedIn message' });
    }
  });

  app.post("/api/linkedin/send-bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { contactIds, campaignId, message, messageType } = req.body;
      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) return res.status(400).json({ error: 'contactIds array is required' });
      if (!message) return res.status(400).json({ error: 'message is required' });
      
      const results: Array<{ contactId: number; success: boolean; error?: string; messageId?: number }> = [];
      for (const contactId of contactIds) {
        const contact = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
        if (contact.length === 0) { results.push({ contactId, success: false, error: 'Contact not found' }); continue; }
        const linkedinProfileUrl = contact[0].linkedinUrl;
        if (!linkedinProfileUrl) { results.push({ contactId, success: false, error: 'No LinkedIn profile URL' }); continue; }
        const result = await LinkedInService.sendMessage({ userId, contactId, campaignId, linkedinProfileUrl, message, messageType: messageType || 'connection_request' });
        results.push({ contactId, success: result.success, error: result.error, messageId: result.messageId });
        if (!result.success && result.error?.includes('limit')) break;
      }
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      res.json({ success: successCount > 0, totalProcessed: results.length, successCount, failCount, results });
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error sending bulk messages:', error);
      res.status(500).json({ error: error.message || 'Failed to send bulk LinkedIn messages' });
    }
  });

  app.get("/api/linkedin/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const messageType = req.query.messageType as string | undefined;
      const messages = await LinkedInService.getSentMessages(userId, { campaignId, limit, offset, messageType });
      res.json(messages);
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error getting messages:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn messages' });
    }
  });

  app.get("/api/linkedin/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const stats = await LinkedInService.getMessageStats(userId, days);
      res.json(stats);
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error getting stats:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn stats' });
    }
  });
}
