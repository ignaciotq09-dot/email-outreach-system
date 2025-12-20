import { Express } from "express";
import { db } from "../../db";
import { sentSms, contacts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { getSmsStats } from "../../services/twilio-sms";
import { requireAuth } from "./schemas";

export function registerSentRoutes(app: Express) {
  app.get("/api/sms/sent", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const smsList = await db.select({ sms: sentSms, contact: contacts }).from(sentSms).leftJoin(contacts, eq(sentSms.contactId, contacts.id)).where(eq(sentSms.userId, userId)).orderBy(desc(sentSms.sentAt)).limit(limit).offset(offset);

      // Ensure contact data is always present with fallbacks for null contacts
      const formattedSms = smsList.map(row => ({
        ...row.sms,
        contact: row.contact || {
          id: row.sms.contactId,
          name: 'Unknown Contact',
          email: '',
          company: null,
        }
      }));

      res.json(formattedSms);
    } catch (error) {
      console.error("[SMS] Error fetching sent SMS:", error);
      res.status(500).json({ error: "Failed to fetch sent SMS" });
    }
  });

  app.get("/api/sms/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const stats = await getSmsStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("[SMS] Error fetching SMS stats:", error);
      res.status(500).json({ error: "Failed to fetch SMS stats" });
    }
  });
}
