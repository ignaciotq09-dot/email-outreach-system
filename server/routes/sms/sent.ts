import { Express } from "express";
import { db } from "../../db";
import { sentSms, contacts } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getSmsStats } from "../../services/twilio-sms";
import { requireAuth } from "./schemas";

export function registerSentRoutes(app: Express) {
  // Get recent (non-archived) sent SMS
  app.get("/api/sms/sent", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Cap at 100
      const offset = parseInt(req.query.offset as string) || 0;
      const smsList = await db.select({ sms: sentSms, contact: contacts })
        .from(sentSms)
        .leftJoin(contacts, eq(sentSms.contactId, contacts.id))
        .where(and(eq(sentSms.userId, userId), eq(sentSms.archived, false)))
        .orderBy(desc(sentSms.sentAt))
        .limit(limit)
        .offset(offset);

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

  // Get archived SMS with pagination
  app.get("/api/sms/archived", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const page = parseInt(req.query.page as string) || 0;
      const pageSize = parseInt(req.query.pageSize as string) || 50;

      const [smsList, countResult] = await Promise.all([
        db.select({ sms: sentSms, contact: contacts })
          .from(sentSms)
          .leftJoin(contacts, eq(sentSms.contactId, contacts.id))
          .where(and(eq(sentSms.userId, userId), eq(sentSms.archived, true)))
          .orderBy(desc(sentSms.sentAt))
          .limit(pageSize)
          .offset(page * pageSize),
        db.select({ count: sql<number>`count(*)` })
          .from(sentSms)
          .where(and(eq(sentSms.userId, userId), eq(sentSms.archived, true)))
      ]);

      const totalCount = Number(countResult[0]?.count || 0);
      const formattedSms = smsList.map(row => ({
        ...row.sms,
        contact: row.contact || {
          id: row.sms.contactId,
          name: 'Unknown Contact',
          email: '',
          company: null,
        }
      }));

      res.json({
        sms: formattedSms,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasMore: (page + 1) * pageSize < totalCount
        }
      });
    } catch (error) {
      console.error("[SMS] Error fetching archived SMS:", error);
      res.status(500).json({ error: "Failed to fetch archived SMS" });
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
