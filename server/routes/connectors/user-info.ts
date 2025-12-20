import type { Express, Request, Response } from "express";
import { registerRateLimiter } from "../../auth/middleware";
import { v4 as uuidv4 } from 'uuid';
import type { SessionData, PendingUserInfo } from "./types";
import { validateCsrfToken, validateAndGetPendingInfo } from "./utils";

export function registerUserInfoRoutes(app: Express) {
  app.post('/api/auth/store-user-info', registerRateLimiter, async (req: Request, res: Response) => {
    try {
      const { name, companyName, position, provider, csrfToken } = req.body;
      if (!validateCsrfToken(req, csrfToken)) {
        console.warn('[Auth][Security] Invalid CSRF token for store-user-info');
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      if (!name || !companyName || !provider) {
        console.warn('[Auth] Missing required fields in store-user-info');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (provider !== 'gmail' && provider !== 'outlook') {
        console.warn('[Auth] Invalid provider:', provider);
        return res.status(400).json({ error: 'Invalid provider' });
      }
      const stateToken = uuidv4();
      const sessionData: PendingUserInfo = { name, companyName, position: position || null, provider, timestamp: Date.now(), expiresAt: Date.now() + (60 * 60 * 1000), state: stateToken };
      (req.session as SessionData).pendingUserInfo = sessionData;
      const newCsrfToken = (req.session as SessionData).csrfToken || '';
      console.log('[Auth] User info stored in session:', { provider, name, state: stateToken });
      res.json({ success: true, state: stateToken, csrfToken: newCsrfToken });
    } catch (error) {
      console.error('[Auth] Store user info error:', error);
      res.status(500).json({ error: 'Failed to store user info' });
    }
  });

  app.get('/api/auth/gmail/connect', registerRateLimiter, async (req: Request, res: Response) => {
    try {
      const pendingInfo = validateAndGetPendingInfo(req);
      if (!pendingInfo) {
        console.error('[Auth] No pending user info found');
        return res.redirect('/signup?error=session_expired');
      }
      console.log('[Auth] Redirecting to custom Gmail OAuth with full scopes');
      return res.redirect('/api/connect/gmail');
    } catch (error) {
      console.error('[Auth] Gmail connection error:', error);
      res.redirect('/signup?error=connection_failed');
    }
  });

  app.get('/api/auth/outlook/connect', registerRateLimiter, async (req: Request, res: Response) => {
    try {
      const pendingInfo = validateAndGetPendingInfo(req);
      if (!pendingInfo) {
        console.error('[Auth] No pending user info found');
        return res.redirect('/signup?error=session_expired');
      }
      const isSignup = !!pendingInfo.name;
      const stateToken = pendingInfo.state;
      console.log('[Auth] Using existing Outlook connection:', { isSignup, state: stateToken });
      if (isSignup) {
        return res.redirect(`/api/auth/complete-onboarding?state=${stateToken}&setup_success=true`);
      } else {
        return res.redirect(`/api/auth/complete-login?state=${stateToken}&setup_success=true`);
      }
    } catch (error) {
      console.error('[Auth] Outlook connection error:', error);
      res.redirect('/signup?error=connection_failed');
    }
  });
}
