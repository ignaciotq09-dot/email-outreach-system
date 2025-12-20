import type { Express } from "express";
import { handleConnect } from "./init";
import { handleCallback } from "./callback";
import { handleStatus, handleReconnect, handleDisconnect } from "./status";

export function registerCustomGmailOAuthRoutes(app: Express) {
  app.get("/api/connect/gmail", handleConnect);
  app.get("/api/connect/gmail/callback", handleCallback);
  app.get("/api/connect/gmail/status", handleStatus);
  app.post("/api/connect/gmail/reconnect", handleReconnect);
  app.post("/api/connect/gmail/disconnect", handleDisconnect);
}
