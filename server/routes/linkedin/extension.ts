import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { LinkedInService } from "../../services/linkedin";
import { db } from "../../db";
import { linkedinMessages, linkedinSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export function registerExtensionRoutes(app: Express) {
  app.post("/api/linkedin/extension/generate-token", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const token = await LinkedInCookieApiService.createExtensionToken(userId);
      res.json({ success: true, token, expiresIn: "15 minutes" });
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error generating token:', error);
      res.status(500).json({ error: error.message || 'Failed to generate token' });
    }
  });

  app.post("/api/linkedin/extension/connect", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization header' });
      const token = authHeader.substring(7);
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const userId = await LinkedInCookieApiService.validateExtensionToken(token);
      if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
      const { cookies } = req.body;
      if (!cookies || typeof cookies !== 'object') return res.status(400).json({ error: 'Cookies object is required' });
      if (!cookies.li_at?.value) return res.status(400).json({ error: 'Missing required li_at cookie - please ensure you are logged in to LinkedIn' });
      const result = await LinkedInCookieApiService.storeSessionCookies(userId, cookies);
      if (result.success) {
        const verification = await LinkedInCookieApiService.verifySession(userId);
        res.json({ success: true, message: 'LinkedIn connected successfully via extension', verified: verification.valid });
      } else res.status(400).json({ error: result.error || 'Failed to store cookies' });
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error connecting:', error);
      res.status(500).json({ error: error.message || 'Failed to connect LinkedIn' });
    }
  });

  app.get("/api/linkedin/extension/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const status = await LinkedInCookieApiService.getExtensionStatus(userId);
      res.json(status);
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error getting status:', error);
      res.status(500).json({ error: error.message || 'Failed to get extension status' });
    }
  });

  app.post("/api/linkedin/extension/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const result = await LinkedInCookieApiService.verifySession(userId);
      res.json(result);
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error verifying session:', error);
      res.status(500).json({ error: error.message || 'Failed to verify session' });
    }
  });

  app.post("/api/linkedin/extension/disconnect", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const success = await LinkedInCookieApiService.disconnectExtension(userId);
      if (success) res.json({ success: true, message: 'LinkedIn extension disconnected' });
      else res.status(500).json({ error: 'Failed to disconnect extension' });
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error disconnecting:', error);
      res.status(500).json({ error: error.message || 'Failed to disconnect extension' });
    }
  });

  app.post("/api/linkedin/extension/send-connection", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { profileUrl, message, contactId, campaignId } = req.body;
      if (!profileUrl) return res.status(400).json({ error: 'profileUrl is required' });
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const status = await LinkedInCookieApiService.getExtensionStatus(userId);
      if (!status.connected) return res.status(400).json({ error: 'LinkedIn not connected via extension' });
      const canSend = await LinkedInService.canSendConnectionRequest(userId);
      if (!canSend.allowed) return res.status(400).json({ error: canSend.reason });
      const result = await LinkedInCookieApiService.sendConnectionRequest(userId, profileUrl, message);
      if (result.success) {
        const now = new Date();
        const [insertedMessage] = await db.insert(linkedinMessages).values({ userId, contactId: contactId || null, campaignId: campaignId || null, linkedinProfileUrl: profileUrl, messageType: 'connection_request', message: message || '', personalizedMessage: message || '', status: 'sent', sentAt: now, updatedAt: now }).returning();
        await db.update(linkedinSettings).set({ connectionsSentToday: sql`${linkedinSettings.connectionsSentToday} + 1`, updatedAt: now }).where(eq(linkedinSettings.userId, userId));
        res.json({ success: true, messageId: insertedMessage?.id, message: 'Connection request sent successfully' });
      } else res.status(400).json({ error: result.error });
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error sending connection:', error);
      res.status(500).json({ error: error.message || 'Failed to send connection request' });
    }
  });

  app.post("/api/linkedin/extension/send-message", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { profileUrl, message, contactId, campaignId } = req.body;
      if (!profileUrl || !message) return res.status(400).json({ error: 'profileUrl and message are required' });
      const { LinkedInCookieApiService } = await import("../../services/linkedin-cookie-api");
      const status = await LinkedInCookieApiService.getExtensionStatus(userId);
      if (!status.connected) return res.status(400).json({ error: 'LinkedIn not connected via extension' });
      const canSend = await LinkedInService.canSendMessage(userId);
      if (!canSend.allowed) return res.status(400).json({ error: canSend.reason });
      const result = await LinkedInCookieApiService.sendDirectMessage(userId, profileUrl, message);
      if (result.success) {
        const now = new Date();
        const [insertedMessage] = await db.insert(linkedinMessages).values({ userId, contactId: contactId || null, campaignId: campaignId || null, linkedinProfileUrl: profileUrl, messageType: 'direct_message', message, personalizedMessage: message, status: 'sent', sentAt: now, updatedAt: now }).returning();
        await db.update(linkedinSettings).set({ messagesSentToday: sql`${linkedinSettings.messagesSentToday} + 1`, updatedAt: now }).where(eq(linkedinSettings.userId, userId));
        res.json({ success: true, messageId: insertedMessage?.id, message: 'Direct message sent successfully' });
      } else res.status(400).json({ error: result.error });
    } catch (error: any) {
      console.error('[LinkedIn Extension] Error sending message:', error);
      res.status(500).json({ error: error.message || 'Failed to send message' });
    }
  });
}
