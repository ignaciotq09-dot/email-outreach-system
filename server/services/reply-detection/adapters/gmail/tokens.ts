import { google } from 'googleapis';
import { storage } from "../../../../storage";
import { decryptToken } from "../../../../auth/token-encryption";
import { createGoogleOAuth2Client } from "../../../../auth/oauth-config";

export async function getGmailClient(userId: number) {
  const tokens = await storage.getOAuthTokens(userId, 'gmail'); if (!tokens) throw new Error('Gmail not connected'); const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now; let accessToken: string;
  if (isExpired && tokens.refreshToken) { const oauth2Client = createGoogleOAuth2Client(); const decryptedRefreshToken = decryptToken(tokens.refreshToken); oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken }); const { credentials } = await oauth2Client.refreshAccessToken(); const newExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000); await storage.updateOAuthTokens(userId, 'gmail', { accessToken: credentials.access_token!, expiresAt: newExpiresAt }); accessToken = credentials.access_token!; } else { accessToken = decryptToken(tokens.accessToken); }
  const oauth2Client = new google.auth.OAuth2(); oauth2Client.setCredentials({ access_token: accessToken }); return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function isTokenValid(userId: number): Promise<boolean> {
  try { const tokens = await storage.getOAuthTokens(userId, 'gmail'); if (!tokens) return false; const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now; if (isExpired && !tokens.refreshToken) return false; try { decryptToken(tokens.accessToken); return true; } catch { return false; } } catch { return false; }
}
