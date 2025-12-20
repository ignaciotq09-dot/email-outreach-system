import type { Express, Request, Response } from "express";
import type { SessionData } from "./types";
import { validateCsrfToken, generateCsrfToken } from "./utils";

export function registerSessionRoutes(app: Express) {
  app.post('/api/auth/cleanup-session', async (req: Request, res: Response) => {
    try {
      const { csrfToken } = req.body;
      if (!validateCsrfToken(req, csrfToken)) {
        console.warn('[Auth][Security] Invalid CSRF token for cleanup-session');
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      const session = req.session as SessionData;
      if (session.pendingUserInfo) {
        delete session.pendingUserInfo;
        console.log('[Auth] Cleared pending user info from session');
      }
      const newCsrfToken = generateCsrfToken(req);
      res.json({ success: true, csrfToken: newCsrfToken });
    } catch (error) {
      console.error('[Auth] Session cleanup error:', error);
      res.status(500).json({ error: 'Failed to cleanup session' });
    }
  });

  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const { csrfToken } = req.body;
      if (!validateCsrfToken(req, csrfToken)) {
        console.warn('[Auth][Security] Invalid CSRF token for logout');
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      const session = req.session as SessionData;
      const userId = session.userId;
      req.session.destroy((err: Error | null) => {
        if (err) {
          console.error('[Auth] Logout session destroy error:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        console.log('[Auth] User logged out:', userId);
        res.json({ success: true });
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  });
}
