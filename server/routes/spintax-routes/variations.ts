import { Response } from "express";
import { db } from "../../db";
import { contacts } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { generateEmailVariations, getUniqueVariationForContact, getVariationStats, generateBatchVariations } from "../../services/spintax-generator";

export async function handleGenerateVariations(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { subject, body, campaignId, numVariations } = req.body; if (!subject || !body) return res.status(400).json({ error: "Subject and body are required" }); const variations = await generateEmailVariations({ userId: req.user.id, campaignId, originalSubject: subject, originalBody: body, numVariations: numVariations || 5 }); res.json({ variations }); } catch (error: any) { console.error("[Spintax] Error generating variations:", error); res.status(500).json({ error: error.message }); }
}

export async function handlePreviewVariation(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { subject, body, contactId, campaignId } = req.body; if (!subject || !body || !contactId) return res.status(400).json({ error: "Subject, body, and contactId are required" }); const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1); if (!contact) return res.status(404).json({ error: "Contact not found" }); const variation = await getUniqueVariationForContact({ userId: req.user.id, campaignId, contactId, contact, originalSubject: subject, originalBody: body }); res.json({ variation }); } catch (error: any) { console.error("[Spintax] Error previewing variation:", error); res.status(500).json({ error: error.message }); }
}

export async function handleGetStats(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined; const stats = await getVariationStats(req.user.id, campaignId); res.json(stats); } catch (error: any) { console.error("[Spintax] Error getting stats:", error); res.status(500).json({ error: error.message }); }
}

export async function handleBatchVariations(req: any, res: Response) {
  try { if (!req.user?.id) return res.status(401).json({ error: "Not authenticated" }); const { subject, body, campaignId, contactIds } = req.body; if (!subject || !body || !contactIds) return res.status(400).json({ error: "Subject, body, and contactIds are required" }); const contactsList = await db.select().from(contacts).where(inArray(contacts.id, contactIds)); if (contactsList.length === 0) return res.status(404).json({ error: "No contacts found" }); const variations = await generateBatchVariations({ userId: req.user.id, campaignId, originalSubject: subject, originalBody: body, contacts: contactsList }); res.json({ variations }); } catch (error: any) { console.error("[Spintax] Error generating batch:", error); res.status(500).json({ error: error.message }); }
}
