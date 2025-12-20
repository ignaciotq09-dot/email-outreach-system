import type { Request, Response } from "express";
import { createGoogleOAuth2Client, GMAIL_SCOPES } from "../../auth/oauth-config";
import crypto from "crypto";
import type { SessionData } from "./types";

export async function handleConnect(req: Request, res: Response) {
  try { const session = req.session as SessionData; const pendingInfo = session.pendingUserInfo; const userId = session.userId; let flowType: "signup" | "login" | "reconnect"; if (pendingInfo) flowType = pendingInfo.name ? "signup" : "login"; else if (userId) flowType = "reconnect"; else flowType = "login"; const state = crypto.randomBytes(32).toString("hex"); session.oauthState = state; session.oauthFlow = flowType; const oauth2Client = createGoogleOAuth2Client(req); const authUrl = oauth2Client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: GMAIL_SCOPES, state, include_granted_scopes: true }); console.log("[Gmail OAuth] Redirecting to Google auth:", { state, flowType }); res.redirect(authUrl); } catch (error) { console.error("[Gmail OAuth] Init error:", error); res.redirect("/login?error=oauth_init_failed"); }
}
