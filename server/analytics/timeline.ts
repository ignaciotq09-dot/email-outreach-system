import { db } from "../db";
import { analyticsEvents } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export async function getContactTimeline(contactId: number, limit: number = 50) {
  return await db.select().from(analyticsEvents).where(eq(analyticsEvents.contactId, contactId)).orderBy(desc(analyticsEvents.timestamp)).limit(limit);
}

export async function getCampaignTimeline(campaignId: number, limit: number = 100) {
  return await db.select().from(analyticsEvents).where(eq(analyticsEvents.campaignId, campaignId)).orderBy(desc(analyticsEvents.timestamp)).limit(limit);
}

export async function getEventStats(params: { campaignId?: number; contactId?: number; startDate?: Date; endDate?: Date; }) {
  let query = db.select({ eventType: analyticsEvents.eventType, count: sql<number>`COUNT(*)` }).from(analyticsEvents).groupBy(analyticsEvents.eventType);
  
  const conditions = [];
  if (params.campaignId) conditions.push(eq(analyticsEvents.campaignId, params.campaignId));
  if (params.contactId) conditions.push(eq(analyticsEvents.contactId, params.contactId));
  if (params.startDate) conditions.push(gte(analyticsEvents.timestamp, params.startDate));
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;
  
  return await query;
}
