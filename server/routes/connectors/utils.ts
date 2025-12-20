import type { Request } from "express";
import crypto from 'crypto';
import type { SessionData, PendingUserInfo } from "./types";

export function validateAndGetPendingInfo(req: Request): PendingUserInfo | null {
  const session = req.session as SessionData;
  const pendingInfo = session.pendingUserInfo;
  if (!pendingInfo) return null;
  if (Date.now() > pendingInfo.expiresAt) {
    console.warn('[Auth] Session expired, clearing pendingUserInfo');
    delete session.pendingUserInfo;
    return null;
  }
  return pendingInfo;
}

export function generateCsrfToken(req: Request): string {
  const session = req.session as SessionData;
  if (session.csrfToken) return session.csrfToken;
  const token = crypto.randomBytes(32).toString('hex');
  session.csrfToken = token;
  return token;
}

export function validateCsrfToken(req: Request, providedToken: string | undefined): boolean {
  const session = req.session as SessionData;
  if (typeof providedToken !== 'string' || typeof session.csrfToken !== 'string') return false;
  if (!providedToken || !session.csrfToken) return false;
  if (providedToken.length !== session.csrfToken.length) return false;
  try {
    const sessionTokenBuf = Buffer.from(session.csrfToken);
    const providedTokenBuf = Buffer.from(providedToken);
    const isValid = crypto.timingSafeEqual(sessionTokenBuf, providedTokenBuf);
    if (isValid) {
      delete session.csrfToken;
      generateCsrfToken(req);
      console.log('[Auth][Security] CSRF token validated and rotated');
    }
    return isValid;
  } catch (error) {
    console.error('[Auth][Security] CSRF token validation unexpected error:', error);
    return false;
  }
}

export async function getConnectorConnection(provider: 'gmail' | 'outlook', includeSecrets: boolean = false): Promise<any | null> {
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;
    if (!xReplitToken || !hostname) return null;
    const connectorName = provider === 'gmail' ? 'google-mail' : 'outlook';
    const response = await fetch(`https://${hostname}/api/v2/connection?include_secrets=${includeSecrets}&connector_names=${connectorName}`, {
      headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken }
    });
    const data = await response.json();
    return data.items?.[0] || null;
  } catch (error) {
    console.error(`[Auth] Get ${provider} connector error:`, error);
    return null;
  }
}
