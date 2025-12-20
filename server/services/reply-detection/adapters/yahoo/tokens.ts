import { storage } from "../../../../storage";
import { decryptToken, encryptToken } from "../../../../auth/token-encryption";
import { refreshYahooAccessToken } from "../../../../auth/oauth-config";

export async function getAccessToken(userId: number): Promise<string> {
  const tokens = await storage.getOAuthTokens(userId, 'yahoo'); if (!tokens) throw new Error('Yahoo not connected'); const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now;
  if (isExpired && tokens.refreshToken) { const decryptedRefreshToken = decryptToken(tokens.refreshToken); const response = await refreshYahooAccessToken(decryptedRefreshToken); const newExpiresAt = response.expires_in ? new Date(Date.now() + response.expires_in * 1000) : new Date(Date.now() + 3600 * 1000); await storage.updateOAuthTokens(userId, 'yahoo', { accessToken: encryptToken(response.access_token), expiresAt: newExpiresAt, ...(response.refresh_token && { refreshToken: encryptToken(response.refresh_token) }) }); return response.access_token; }
  return decryptToken(tokens.accessToken);
}

export async function getYahooEmail(userId: number): Promise<string | null> {
  try { const accessToken = await getAccessToken(userId); const response = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', { headers: { 'Authorization': `Bearer ${accessToken}` } }); if (!response.ok) return null; const userInfo = await response.json(); return userInfo.email || null; } catch { return null; }
}

export async function isTokenValid(userId: number): Promise<boolean> {
  try { const tokens = await storage.getOAuthTokens(userId, 'yahoo'); if (!tokens) return false; const now = new Date(); const isExpired = tokens.expiresAt && new Date(tokens.expiresAt) <= now; if (isExpired && !tokens.refreshToken) return false; try { decryptToken(tokens.accessToken); return true; } catch { return false; } } catch { return false; }
}
