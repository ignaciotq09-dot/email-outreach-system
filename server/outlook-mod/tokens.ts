import { Client } from '@microsoft/microsoft-graph-client';
import { storage } from '../storage';
import { decryptToken } from '../auth/token-encryption';
import { createMsalClient, OUTLOOK_SCOPES } from '../auth/oauth-config';

export async function getAccessToken(userId: number): Promise<string> {
  const tokens = await storage.getOAuthTokens(userId, 'outlook'); if (!tokens) throw new Error('Outlook not connected. Please connect your Outlook account in Settings.'); const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now;
  if (isExpired && tokens.refreshToken) { const msalClient = createMsalClient(); const decryptedRefreshToken = decryptToken(tokens.refreshToken); const tokenRequest = { refreshToken: decryptedRefreshToken, scopes: OUTLOOK_SCOPES }; const response = await msalClient.acquireTokenByRefreshToken(tokenRequest); const newExpiresAt = response.expiresOn ? new Date(response.expiresOn) : new Date(Date.now() + 3600 * 1000); const responseRefreshToken = (response as any).refreshToken as string | undefined; await storage.updateOAuthTokens(userId, 'outlook', { accessToken: response.accessToken, expiresAt: newExpiresAt, ...(responseRefreshToken && { refreshToken: responseRefreshToken }) }); return response.accessToken; }
  return decryptToken(tokens.accessToken);
}

export async function graphApiRequest(userId: number, endpoint: string, options?: RequestInit) {
  const accessToken = await getAccessToken(userId); const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, { ...options, headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...options?.headers } }); if (!response.ok) { const errorText = await response.text(); throw new Error(`Graph API error: ${response.status} ${errorText}`); } if (response.status === 202) return null; return response.json();
}

export async function getOutlookUserEmail(userId: number) { try { const profile = await graphApiRequest(userId, '/me'); return profile.mail || profile.userPrincipalName; } catch (error) { console.error('Error getting Outlook user email:', error); return null; } }
