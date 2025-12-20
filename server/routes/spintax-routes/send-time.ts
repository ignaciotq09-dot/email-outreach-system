import { Response } from "express";
import { db } from "../../db";
import { contacts } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { calculateOptimalSendTime, calculateBatchOptimalSendTimes, getSendTimeInsights } from "../../services/send-time-optimizer";

export async function handleOptimalSendTime(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { contactId, preferredTimezone } = req.body; if (!contactId) return res.status(400).json({ error: "contactId is required" }); const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1); if (!contact) return res.status(404).json({ error: "Contact not found" }); const optimalTime = await calculateOptimalSendTime({ userId: req.user.id, contact, preferredTimezone }); res.json(optimalTime); } catch (error: any) { console.error("[SendTime] Error calculating optimal time:", error); res.status(500).json({ error: error.message }); }
}

export async function handleBatchOptimalTimes(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { contactIds, preferredTimezone } = req.body; if (!contactIds || !Array.isArray(contactIds)) return res.status(400).json({ error: "contactIds array is required" }); const contactsList = await db.select().from(contacts).where(inArray(contacts.id, contactIds)); if (contactsList.length === 0) return res.status(404).json({ error: "No contacts found" }); const optimalTimes = await calculateBatchOptimalSendTimes(req.user.id, contactsList, preferredTimezone); const result: Record<number, any> = {}; for (const [contactId, time] of optimalTimes) result[contactId] = time; res.json({ optimalTimes: result }); } catch (error: any) { console.error("[SendTime] Error calculating batch optimal times:", error); res.status(500).json({ error: error.message }); }
}

export async function handleGetInsights(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const insights = await getSendTimeInsights(req.user.id); res.json(insights); } catch (error: any) { console.error("[SendTime] Error getting insights:", error); res.status(500).json({ error: error.message }); }
}
