import type { Request, Response } from "express";
import { storage } from "../../storage";
import { createGoogleOAuth2Client, GMAIL_SCOPES } from "../../auth/oauth-config";
import crypto from "crypto";
import type { SessionData } from "./types";

export async function handleStatus(req: Request, res: Response) {
  try { const session = req.session as SessionData; const userId = session.userId; if (!userId) return res.json({ connected: false, hasCustomOAuth: false }); const tokens = await storage.getOAuthTokens(userId, "gmail"); if (tokens) return res.json({ connected: true, hasCustomOAuth: true, email: tokens.email, hasRefreshToken: !!tokens.refreshToken, expiresAt: tokens.expiresAt }); return res.json({ connected: false, hasCustomOAuth: false }); } catch (error) { console.error("[Gmail OAuth] Status check error:", error); res.json({ connected: false, hasCustomOAuth: false, error: true }); }
}

export async function handleReconnect(req: Request, res: Response) {
  try { const session = req.session as SessionData; const userId = session.userId; if (!userId) return res.status(401).json({ error: "Not authenticated" }); const user = await storage.getUserById(userId); if (!user) return res.status(401).json({ error: "User not found" }); const state = crypto.randomBytes(32).toString("hex"); session.oauthState = state; session.oauthFlow = "reconnect"; const oauth2Client = createGoogleOAuth2Client(req); const authUrl = oauth2Client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: GMAIL_SCOPES, state, include_granted_scopes: true }); res.json({ authUrl }); } catch (error) { console.error("[Gmail OAuth] Reconnect error:", error); res.status(500).json({ error: "Failed to initiate reconnection" }); }
}

export async function handleDisconnect(req: Request, res: Response) {
  try { const session = req.session as SessionData; const userId = session.userId; if (!userId) return res.status(401).json({ error: "Not authenticated" }); await storage.deleteOAuthTokens(userId, "gmail"); console.log("[Gmail OAuth] Tokens deleted for user:", userId); res.json({ success: true }); } catch (error) { console.error("[Gmail OAuth] Disconnect error:", error); res.status(500).json({ error: "Failed to disconnect Gmail" }); }
}
