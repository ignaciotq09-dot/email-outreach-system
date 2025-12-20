import type { Router } from "express";
import { db } from "../../db";
import { sentEmails } from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";
import { getUserId } from "./utils";

export function registerAnalyticsRoutes(app: Router) {
  app.get("/api/workflows/schedule/best-time", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const emailData = await db.select({ sentAt: sentEmails.sentAt, opened: sentEmails.opened, clicked: sentEmails.clicked, replyReceived: sentEmails.replyReceived }).from(sentEmails).where(and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, ninetyDaysAgo)));

      if (emailData.length < 5) {
        return res.json({ hasData: false, recommendation: { dayOfWeek: 2, time: "10:00", label: "Tuesday at 10:00 AM" }, message: "Based on industry best practices (not enough personal data yet)", confidence: 0 });
      }

      const dayHourStats: Record<string, { sent: number; engaged: number }> = {};
      for (const email of emailData) {
        if (!email.sentAt) continue;
        const date = new Date(email.sentAt);
        const key = `${date.getDay()}-${date.getHours()}`;
        if (!dayHourStats[key]) dayHourStats[key] = { sent: 0, engaged: 0 };
        dayHourStats[key].sent++;
        if (email.opened || email.clicked || email.replyReceived) dayHourStats[key].engaged++;
      }

      let bestSlot: { dayOfWeek: number; hour: number; rate: number } | null = null;
      for (const [key, stats] of Object.entries(dayHourStats)) {
        if (stats.sent >= 3) {
          const rate = stats.engaged / stats.sent;
          if (!bestSlot || rate > bestSlot.rate) {
            const [day, hour] = key.split("-").map(Number);
            bestSlot = { dayOfWeek: day, hour, rate };
          }
        }
      }

      if (!bestSlot) {
        return res.json({ hasData: false, recommendation: { dayOfWeek: 2, time: "10:00", label: "Tuesday at 10:00 AM" }, message: "Based on industry best practices (need more data per time slot)", confidence: 0 });
      }

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const timeStr = `${bestSlot.hour.toString().padStart(2, "0")}:00`;
      const period = bestSlot.hour >= 12 ? "PM" : "AM";
      const displayHour = bestSlot.hour > 12 ? bestSlot.hour - 12 : (bestSlot.hour === 0 ? 12 : bestSlot.hour);

      res.json({ hasData: true, recommendation: { dayOfWeek: bestSlot.dayOfWeek, time: timeStr, label: `${dayNames[bestSlot.dayOfWeek]} at ${displayHour}:00 ${period}` }, engagementRate: Math.round(bestSlot.rate * 100), totalEmails: emailData.length, message: `${Math.round(bestSlot.rate * 100)}% engagement rate`, confidence: Math.min(100, Math.round((emailData.length / 50) * 100)) });
    } catch (error: any) {
      console.error("[Workflows] Best time error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
