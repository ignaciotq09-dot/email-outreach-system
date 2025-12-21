import type { Request, Response, Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth/middleware";
import { getArchivedSentEmails, getArchivedEmailsCount } from "../../storage/emails";

export function registerCrudRoutes(app: Express) {
  // Get recent (non-archived) sent emails - limited to 100
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

  // Get archived sent emails with pagination
  app.get("/api/emails/archived", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const page = parseInt(req.query.page as string) || 0;
      const pageSize = parseInt(req.query.pageSize as string) || 50;

      const [emails, totalCount] = await Promise.all([
        getArchivedSentEmails(userId, pageSize, page * pageSize),
        getArchivedEmailsCount(userId)
      ]);

      res.json({
        emails,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasMore: (page + 1) * pageSize < totalCount
        }
      });
    } catch (error) {
      console.error('Error fetching archived emails:', error);
      res.status(500).json({ error: 'Failed to fetch archived emails' });
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
