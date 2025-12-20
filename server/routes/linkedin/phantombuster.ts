import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { PhantombusterService } from "../../services/phantombuster";

export function registerPhantombusterRoutes(app: Express) {
  app.get("/api/linkedin/phantombuster/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const config = await PhantombusterService.getConfig(userId);
      res.json({ connected: config?.apiKey ? true : false, hasAutoConnectAgent: !!config?.autoConnectAgentId, hasMessageSenderAgent: !!config?.messageSenderAgentId });
    } catch (error: any) {
      console.error('[LinkedIn Phantombuster] Error getting status:', error);
      res.status(500).json({ error: error.message || 'Failed to get Phantombuster status' });
    }
  });

  app.post("/api/linkedin/phantombuster/verify-key", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: 'API key is required' });
      const result = await PhantombusterService.verifyApiKey(apiKey);
      res.json(result);
    } catch (error: any) {
      console.error('[LinkedIn Phantombuster] Error verifying key:', error);
      res.status(500).json({ error: error.message || 'Failed to verify API key' });
    }
  });

  app.post("/api/linkedin/phantombuster/verify-agent", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { apiKey, agentId } = req.body;
      if (!apiKey || !agentId) return res.status(400).json({ error: 'API key and agent ID are required' });
      const result = await PhantombusterService.verifyAgentId(apiKey, agentId);
      res.json(result);
    } catch (error: any) {
      console.error('[LinkedIn Phantombuster] Error verifying agent:', error);
      res.status(500).json({ error: error.message || 'Failed to verify agent' });
    }
  });

  app.post("/api/linkedin/phantombuster/connect", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { apiKey, autoConnectAgentId, messageSenderAgentId } = req.body;
      if (!apiKey) return res.status(400).json({ error: 'API key is required' });
      
      const keyVerify = await PhantombusterService.verifyApiKey(apiKey);
      if (!keyVerify.valid) return res.status(400).json({ error: `Invalid API key: ${keyVerify.error}` });
      
      if (autoConnectAgentId) {
        const agentVerify = await PhantombusterService.verifyAgentId(apiKey, autoConnectAgentId);
        if (!agentVerify.valid) return res.status(400).json({ error: `Invalid Auto Connect agent: ${agentVerify.error}` });
      }
      if (messageSenderAgentId) {
        const agentVerify = await PhantombusterService.verifyAgentId(apiKey, messageSenderAgentId);
        if (!agentVerify.valid) return res.status(400).json({ error: `Invalid Message Sender agent: ${agentVerify.error}` });
      }
      
      const result = await PhantombusterService.saveConfig(userId, { apiKey, autoConnectAgentId, messageSenderAgentId });
      if (result.success) res.json({ success: true, message: 'Phantombuster connected successfully' });
      else res.status(500).json({ error: result.error || 'Failed to save configuration' });
    } catch (error: any) {
      console.error('[LinkedIn Phantombuster] Error connecting:', error);
      res.status(500).json({ error: error.message || 'Failed to connect Phantombuster' });
    }
  });

  app.post("/api/linkedin/phantombuster/disconnect", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const result = await PhantombusterService.disconnect(userId);
      if (result.success) res.json({ success: true, message: 'Phantombuster disconnected' });
      else res.status(500).json({ error: 'Failed to disconnect Phantombuster' });
    } catch (error: any) {
      console.error('[LinkedIn Phantombuster] Error disconnecting:', error);
      res.status(500).json({ error: error.message || 'Failed to disconnect Phantombuster' });
    }
  });
}
