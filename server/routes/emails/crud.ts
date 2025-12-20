import type { Request, Response, Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth/middleware";

export function registerCrudRoutes(app: Express) {
  app.get("/api/emails/sent", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const emails = await storage.getSentEmails(userId, limit, offset);
      res.json(emails);
    } catch (error) {
      console.error('Error fetching sent emails:', error);
      res.status(500).json({ error: 'Failed to fetch sent emails' });
    }
  });

  app.get("/api/emails/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const id = parseInt(req.params.id);
      const email = await storage.getSentEmailById(userId, id);
      if (!email) return res.status(404).json({ error: 'Email not found' });
      res.json(email);
    } catch (error) {
      console.error('Error fetching email:', error);
      res.status(500).json({ error: 'Failed to fetch email' });
    }
  });
}
