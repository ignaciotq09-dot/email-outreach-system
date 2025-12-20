import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { replyDetectionEngine } from "../../services/reply-detection-engine";
import type { SessionData } from "./types";
import { validateAndGetPendingInfo, getConnectorConnection } from "./utils";

export function registerOnboardingRoutes(app: Express) {
  app.get('/api/auth/complete-onboarding', async (req: Request, res: Response) => {
    try {
      const setupSuccess = req.query.setup_success;
      const providedState = req.query.state as string;
      if (setupSuccess === 'false') {
        console.warn('[Auth] Connector setup failed');
        return res.redirect('/signup?error=connector_failed');
      }
      const pendingInfo = validateAndGetPendingInfo(req);
      if (!pendingInfo) {
        console.warn('[Auth] Session expired or missing');
        return res.redirect('/signup?error=session_expired');
      }
      if (!providedState || providedState !== pendingInfo.state) {
        console.error('[Auth][Security] Invalid state token in connector callback');
        delete (req.session as SessionData).pendingUserInfo;
        return res.redirect('/signup?error=invalid_state');
      }
      const { name, companyName, position, provider } = pendingInfo;
      if (!name) {
        console.error('[Auth][Security] Attempted signup with empty name');
        delete (req.session as SessionData).pendingUserInfo;
        return res.redirect('/signup?error=invalid_flow');
      }
      console.log('[Auth] Completing onboarding:', { provider, name, stateValid: true });
      const connection = await getConnectorConnection(provider, true);
      if (!connection || !connection.settings?.access_token) {
        console.warn('[Auth] Connector not ready');
        return res.redirect('/signup?error=connector_not_ready');
      }
      const email = connection.settings.email;
      if (!email) {
        console.error('[Auth] No email from connector');
        return res.redirect('/signup?error=no_email_from_connector');
      }
      let user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('[Auth] Creating new user:', email);
        user = await storage.createUser({ email, name, companyName, position, emailProvider: provider, profileImageUrl: null, roleId: null, active: true, lastLoginAt: new Date() });
      } else {
        console.log('[Auth] Updating existing user:', email);
        await storage.updateUser(user.id, { name, companyName, position, emailProvider: provider, lastLoginAt: new Date() });
      }
      delete (req.session as SessionData).pendingUserInfo;
      delete (req.session as SessionData).csrfToken;
      (req.session as SessionData).userId = user.id;
      console.log('[Auth] Onboarding complete, user logged in:', user.id);
      try {
        await replyDetectionEngine.start(user.id, provider as 'gmail' | 'outlook');
        console.log('[Auth] Reply detection engine started for user:', user.id);
      } catch (engineError) {
        console.error('[Auth] Failed to start reply detection engine:', engineError);
      }
      res.redirect('/app');
    } catch (error) {
      console.error('[Auth] Complete onboarding error:', error);
      res.redirect('/signup?error=onboarding_failed');
    }
  });

  app.get('/api/auth/complete-login', async (req: Request, res: Response) => {
    try {
      const setupSuccess = req.query.setup_success;
      const providedState = req.query.state as string;
      if (setupSuccess === 'false') {
        console.warn('[Auth] Connector setup failed');
        return res.redirect('/login?error=connector_failed');
      }
      const pendingInfo = validateAndGetPendingInfo(req);
      if (!pendingInfo || !providedState || providedState !== pendingInfo.state) {
        console.error('[Auth][Security] Invalid state token in login callback');
        if (req.session) delete (req.session as SessionData).pendingUserInfo;
        return res.redirect('/login?error=invalid_state');
      }
      console.log('[Auth] Completing login, state validated');
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? 'depl ' + process.env.WEB_REPL_RENEWAL : null;
      if (!xReplitToken || !hostname) {
        console.error('[Auth] Connector config missing');
        return res.redirect('/login?error=connector_config_missing');
      }
      const [gmailRes, outlookRes] = await Promise.all([
        fetch(`https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-mail`, { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }),
        fetch(`https://${hostname}/api/v2/connection?include_secrets=true&connector_names=outlook`, { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } })
      ]);
      const [gmailData, outlookData] = await Promise.all([gmailRes.json(), outlookRes.json()]);
      const gmailConn = gmailData.items?.[0];
      const outlookConn = outlookData.items?.[0];
      let email: string | null = null;
      let provider: string | null = null;
      if (gmailConn?.settings?.access_token && gmailConn?.settings?.email) { email = gmailConn.settings.email; provider = 'gmail'; }
      else if (outlookConn?.settings?.access_token && outlookConn?.settings?.email) { email = outlookConn.settings.email; provider = 'outlook'; }
      if (!email || !provider) {
        console.warn('[Auth] No connector found during login');
        return res.redirect('/login?error=no_connector');
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.warn('[Auth] Account not found:', email);
        return res.redirect('/signup?error=account_not_found');
      }
      await storage.updateUserLastLogin(user.id);
      delete (req.session as SessionData).pendingUserInfo;
      delete (req.session as SessionData).csrfToken;
      (req.session as SessionData).userId = user.id;
      console.log('[Auth] Login complete:', user.id);
      try {
        await replyDetectionEngine.start(user.id, provider as 'gmail' | 'outlook');
        console.log('[Auth] Reply detection engine started for user:', user.id);
      } catch (engineError) {
        console.error('[Auth] Failed to start reply detection engine:', engineError);
      }
      res.redirect('/app');
    } catch (error) {
      console.error('[Auth] Complete login error:', error);
      res.redirect('/login?error=login_failed');
    }
  });
}
