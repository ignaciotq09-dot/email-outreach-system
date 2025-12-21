import type { Express } from "express";
import { requireAuth } from "../../auth/middleware";
import { getReplies, getStats, updateReplyStatus, markAllRead, archiveReply } from "./reply-handlers";
import { checkReplies, checkThread, searchContact } from "./check-handlers";

export function registerInboxRoutes(app: Express): void {
  app.get("/api/inbox/replies", requireAuth, getReplies);
  app.get("/api/inbox/stats", requireAuth, getStats);
  app.patch("/api/inbox/replies/:id/status", requireAuth, updateReplyStatus);
  app.put("/api/inbox/replies/mark-all-read", requireAuth, markAllRead);
  app.put("/api/inbox/replies/:id/archive", requireAuth, archiveReply);
  app.post("/api/emails/check-replies", requireAuth, checkReplies);
  app.get("/api/inbox/check-thread/:sentEmailId", requireAuth, checkThread);
  app.get("/api/inbox/search-contact/:contactId", requireAuth, searchContact);
}
