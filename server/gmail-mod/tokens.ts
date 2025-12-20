import { google } from 'googleapis';
import { storage } from '../storage';
import { decryptToken } from '../auth/token-encryption';
import { createGoogleOAuth2Client } from '../auth/oauth-config';

export async function getAccessToken(userId: number): Promise<string> {
  const tokens = await storage.getOAuthTokens(userId, 'gmail'); if (!tokens) throw new Error('Gmail not connected. Please connect your Gmail account in Settings.'); const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now;
  if (isExpired && tokens.refreshToken) { const oauth2Client = createGoogleOAuth2Client(); const decryptedRefreshToken = decryptToken(tokens.refreshToken); oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken }); const { credentials } = await oauth2Client.refreshAccessToken(); const newExpiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000); await storage.updateOAuthTokens(userId, 'gmail', { accessToken: credentials.access_token!, expiresAt: newExpiresAt }); return credentials.access_token!; }
  return decryptToken(tokens.accessToken);
}

export async function getUncachableGmailClient(userId: number) { const accessToken = await getAccessToken(userId); const oauth2Client = new google.auth.OAuth2(); oauth2Client.setCredentials({ access_token: accessToken }); return google.gmail({ version: 'v1', auth: oauth2Client }); }

export async function getGmailUserEmail(userId: number) { try { const gmail = await getUncachableGmailClient(userId); const profile = await gmail.users.getProfile({ userId: 'me' }); return profile.data.emailAddress; } catch (error) { console.error('Error getting Gmail user email:', error); return null; } }
