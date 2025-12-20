import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import type { SessionData } from "./types";
import { generateCsrfToken } from "./utils";

export function registerAuthRoutes(app: Express) {
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionData;
      const userId = session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await storage.getUserById(userId);
      if (!user) {
        delete session.userId;
        console.warn('[Auth] Invalid user ID in session, clearing');
        return res.status(401).json({ message: 'Unauthorized' });
      }
      res.json(user);
    } catch (error) {
      console.error('[Auth] Get current user error:', error);
      res.status(500).json({ error: 'Failed to get current user' });
    }
  });

  app.get('/api/auth/csrf-token', (req: Request, res: Response) => {
    const token = generateCsrfToken(req);
    res.json({ token });
  });
}
