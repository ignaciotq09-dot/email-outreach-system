import { Response } from "express";
import { db } from "../../db";
import { contacts } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { calculateOptimalSendTime, calculateBatchOptimalSendTimes } from "../../services/send-time-optimizer";
import { createScheduledSend, getUserScheduledSends, getQueueStats, cancelScheduledSend } from "../../services/scheduled-send-engine";

export async function handleScheduleSend(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { contactId, campaignId, subject, body, scheduledFor, enableSpintax, useOptimalTime, preferredTimezone } = req.body; if (!contactId || !subject || !body) return res.status(400).json({ error: "contactId, subject, and body are required" }); const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1); if (!contact) return res.status(404).json({ error: "Contact not found" }); let sendTime: Date, optimizationReason: string | undefined, confidenceScore: number | undefined, timezone: string | undefined;
  if (useOptimalTime) { const optimalTime = await calculateOptimalSendTime({ userId: req.user.id, contact, preferredTimezone }); sendTime = optimalTime.scheduledFor; optimizationReason = optimalTime.reason; confidenceScore = optimalTime.confidenceScore; timezone = optimalTime.timezone; } else if (scheduledFor) { sendTime = new Date(scheduledFor); } else { return res.status(400).json({ error: "Either scheduledFor or useOptimalTime is required" }); }
  const sendId = await createScheduledSend({ userId: req.user.id, contactId, campaignId, subject, body, scheduledFor: sendTime, timezone, optimizationReason, confidenceScore, metadata: { enableSpintax } }); res.json({ id: sendId, scheduledFor: sendTime.toISOString(), optimizationReason, confidenceScore }); } catch (error: any) { console.error("[ScheduledSend] Error scheduling send:", error); res.status(500).json({ error: error.message }); }
}

export async function handleScheduleBatch(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { contactIds, campaignId, subject, body, enableSpintax, preferredTimezone } = req.body; if (!contactIds || !Array.isArray(contactIds) || !subject || !body) return res.status(400).json({ error: "contactIds, subject, and body are required" }); const contactsList = await db.select().from(contacts).where(inArray(contacts.id, contactIds)); if (contactsList.length === 0) return res.status(404).json({ error: "No contacts found" }); const optimalTimes = await calculateBatchOptimalSendTimes(req.user.id, contactsList, preferredTimezone); const scheduledIds: number[] = [];
  for (const contact of contactsList) { const optimalTime = optimalTimes.get(contact.id); if (!optimalTime) continue; const sendId = await createScheduledSend({ userId: req.user.id, contactId: contact.id, campaignId, subject, body, scheduledFor: optimalTime.scheduledFor, timezone: optimalTime.timezone, optimizationReason: optimalTime.reason, confidenceScore: optimalTime.confidenceScore, metadata: { enableSpintax } }); scheduledIds.push(sendId); }
  res.json({ scheduled: scheduledIds.length, ids: scheduledIds }); } catch (error: any) { console.error("[ScheduledSend] Error scheduling batch:", error); res.status(500).json({ error: error.message }); }
}

export async function handleGetScheduledSends(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const status = req.query.status as string | undefined; const sends = await getUserScheduledSends(req.user.id, status); res.json({ sends }); } catch (error: any) { console.error("[ScheduledSend] Error getting scheduled sends:", error); res.status(500).json({ error: error.message }); }
}

export async function handleGetQueueStats(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const stats = await getQueueStats(req.user.id); res.json(stats); } catch (error: any) { console.error("[ScheduledSend] Error getting queue stats:", error); res.status(500).json({ error: error.message }); }
}

export async function handleCancelSend(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const id = parseInt(req.params.id); await cancelScheduledSend(id); res.json({ success: true }); } catch (error: any) { console.error("[ScheduledSend] Error cancelling send:", error); res.status(500).json({ error: error.message }); }
}
