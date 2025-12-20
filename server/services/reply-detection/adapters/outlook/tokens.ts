import { Client } from '@microsoft/microsoft-graph-client';
import { storage } from "../../../../storage";
import { decryptToken } from "../../../../auth/token-encryption";
import { createMsalClient, OUTLOOK_SCOPES } from "../../../../auth/oauth-config";

export async function getOutlookClient(userId: number): Promise<Client> {
  const tokens = await storage.getOAuthTokens(userId, 'outlook'); if (!tokens) throw new Error('Outlook not connected'); const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now; let accessToken: string;
  if (isExpired && tokens.refreshToken) { const msalClient = createMsalClient(); const decryptedRefreshToken = decryptToken(tokens.refreshToken); const tokenRequest = { refreshToken: decryptedRefreshToken, scopes: OUTLOOK_SCOPES }; const response = await msalClient.acquireTokenByRefreshToken(tokenRequest); if (!response) throw new Error('Failed to refresh Outlook token'); const newExpiresAt = response.expiresOn ? new Date(response.expiresOn) : new Date(Date.now() + 3600 * 1000); const responseRefreshToken = (response as any).refreshToken as string | undefined; await storage.updateOAuthTokens(userId, 'outlook', { accessToken: response.accessToken, expiresAt: newExpiresAt, ...(responseRefreshToken && { refreshToken: responseRefreshToken }) }); accessToken = response.accessToken; } else { accessToken = decryptToken(tokens.accessToken); }
  return Client.initWithMiddleware({ authProvider: { getAccessToken: async () => accessToken } });
}

export async function isTokenValid(userId: number): Promise<boolean> { try { const tokens = await storage.getOAuthTokens(userId, 'outlook'); if (!tokens) return false; const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now; if (isExpired && !tokens.refreshToken) return false; try { decryptToken(tokens.accessToken); return true; } catch { return false; } } catch { return false; } }
