import { db } from "../../db";
import { emailVariations } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function getVariationStats(userId: number, campaignId?: number) {
  const conditions = [eq(emailVariations.userId, userId)]; if (campaignId) conditions.push(eq(emailVariations.campaignId, campaignId)); const variations = await db.select().from(emailVariations).where(and(...conditions)); const totalVariations = variations.length; const uniqueHashes = new Set(variations.map(v => v.variationHash)).size; const openedVariations = variations.filter(v => v.opened).length; const repliedVariations = variations.filter(v => v.replied).length; return { totalVariations, uniqueVariations: uniqueHashes, openRate: totalVariations > 0 ? (openedVariations / totalVariations) * 100 : 0, replyRate: totalVariations > 0 ? (repliedVariations / totalVariations) * 100 : 0 };
}

export async function recordVariationUsage(userId: number, contactId: number, campaignId: number | null, variation: any, originalSubject: string, originalBody: string, sentEmailId?: number): Promise<void> {
  try { await db.insert(emailVariations).values({ userId, contactId, campaignId, originalSubject, originalBody, variationSubject: variation.subject, variationBody: variation.body, variationHash: variation.variationHash, variationIndex: variation.variationIndex, sentEmailId }); console.log(`[SpintaxGenerator] Recorded variation usage for contact ${contactId}`); } catch (error: any) { console.error("[SpintaxGenerator] Error recording variation:", error.message); }
}

export async function updateVariationOutcome(sentEmailId: number, opened: boolean, replied: boolean): Promise<void> { try { await db.update(emailVariations).set({ opened, replied }).where(eq(emailVariations.sentEmailId, sentEmailId)); } catch (error: any) { console.error("[SpintaxGenerator] Error updating variation outcome:", error.message); } }
