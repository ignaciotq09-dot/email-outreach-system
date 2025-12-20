import type { Express, Request, Response } from "express";
import { getConnectorConnection } from "./utils";

export function registerStatusRoutes(app: Express) {
  app.get('/api/auth/connector-status', async (req: Request, res: Response) => {
    try {
      const provider = req.query.provider as 'gmail' | 'outlook' | undefined;
      if (!provider) {
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? 'depl ' + process.env.WEB_REPL_RENEWAL : null;
        if (!xReplitToken || !hostname) return res.json({ connected: false, provider: null, email: null });
        const [gmailRes, outlookRes] = await Promise.all([
          fetch(`https://${hostname}/api/v2/connection?include_secrets=false&connector_names=google-mail`, { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }),
          fetch(`https://${hostname}/api/v2/connection?include_secrets=false&connector_names=outlook`, { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } })
        ]);
        const [gmailData, outlookData] = await Promise.all([gmailRes.json(), outlookRes.json()]);
        const gmailConn = gmailData.items?.[0];
        const outlookConn = outlookData.items?.[0];
        if (gmailConn?.settings?.access_token) return res.json({ connected: true, provider: 'gmail', email: gmailConn.settings.email || null });
        if (outlookConn?.settings?.access_token) return res.json({ connected: true, provider: 'outlook', email: outlookConn.settings.email || null });
        return res.json({ connected: false, provider: null, email: null });
      }
      const connection = await getConnectorConnection(provider, false);
      if (connection?.settings?.access_token) {
        res.json({ connected: true, provider, email: connection.settings.email || null });
      } else {
        res.json({ connected: false, provider, email: null });
      }
    } catch (error) {
      console.error('[Auth] Connector status check error:', error);
      res.json({ connected: false, provider: null, email: null });
    }
  });

  app.get('/api/gmail/status', async (req: Request, res: Response) => {
    try {
      const connection = await getConnectorConnection('gmail', false);
      if (connection && connection.settings?.access_token) {
        res.json({ connected: true, email: connection.settings.email || 'Connected' });
      } else {
        res.json({ connected: false, email: null });
      }
    } catch (error) {
      console.error('[Gmail Status] Error:', error);
      res.json({ connected: false, email: null });
    }
  });

  app.get('/api/outlook/status', async (req: Request, res: Response) => {
    try {
      const connection = await getConnectorConnection('outlook', false);
      if (connection && connection.settings?.access_token) {
        res.json({ connected: true, email: connection.settings.email || 'Connected' });
      } else {
        res.json({ connected: false, email: null });
      }
    } catch (error) {
      console.error('[Outlook Status] Error:', error);
      res.json({ connected: false, email: null });
    }
  });
}
