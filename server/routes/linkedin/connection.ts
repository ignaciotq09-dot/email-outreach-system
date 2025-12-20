import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { LinkedInService } from "../../services/linkedin";

export function registerConnectionRoutes(app: Express) {
  app.get("/api/linkedin/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const status = await LinkedInService.getConnectionStatus(userId);
      res.json(status);
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error getting status:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn status' });
    }
  });

  app.get("/api/linkedin/configured", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const connected = await LinkedInService.isConnected(userId);
      res.json({ configured: connected });
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error checking configuration:', error);
      res.status(500).json({ error: error.message || 'Failed to check LinkedIn configuration' });
    }
  });

  app.post("/api/linkedin/connect", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { linkedinProfileUrl, displayName, linkedinEmail } = req.body;
      if (!linkedinProfileUrl) return res.status(400).json({ error: 'LinkedIn profile URL is required' });
      const success = await LinkedInService.connectAccount(userId, { linkedinProfileUrl, displayName, linkedinEmail });
      if (success) res.json({ success: true, message: 'LinkedIn account connected successfully' });
      else res.status(500).json({ error: 'Failed to connect LinkedIn account' });
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error connecting account:', error);
      res.status(500).json({ error: error.message || 'Failed to connect LinkedIn account' });
    }
  });

  app.post("/api/linkedin/disconnect", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const success = await LinkedInService.disconnectAccount(userId);
      if (success) res.json({ success: true, message: 'LinkedIn account disconnected' });
      else res.status(500).json({ error: 'Failed to disconnect LinkedIn account' });
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error disconnecting account:', error);
      res.status(500).json({ error: error.message || 'Failed to disconnect LinkedIn account' });
    }
  });

  app.patch("/api/linkedin/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { dailyConnectionLimit, dailyMessageLimit, enabled } = req.body;
      const success = await LinkedInService.updateSettings(userId, { dailyConnectionLimit, dailyMessageLimit, enabled });
      if (success) res.json({ success: true, message: 'Settings updated' });
      else res.status(500).json({ error: 'Failed to update settings' });
    } catch (error: any) {
      console.error('[LinkedIn Routes] Error updating settings:', error);
      res.status(500).json({ error: error.message || 'Failed to update settings' });
    }
  });
}
