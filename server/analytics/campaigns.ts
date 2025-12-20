import { db } from "../db";
import { sentEmails, contacts, campaigns, campaignContacts, analyticsEvents } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export async function getEngagementTrends(days: number = 30, userId: number) {
  try {
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const trends = await db.select({
      date: sql<string>`DATE(${analyticsEvents.timestamp})`,
      sends: sql<number>`COUNT(CASE WHEN ${analyticsEvents.eventType} = 'send' THEN 1 END)`,
      opens: sql<number>`COUNT(CASE WHEN ${analyticsEvents.eventType} = 'open' THEN 1 END)`,
      clicks: sql<number>`COUNT(CASE WHEN ${analyticsEvents.eventType} = 'click' THEN 1 END)`,
      replies: sql<number>`COUNT(CASE WHEN ${analyticsEvents.eventType} = 'reply' THEN 1 END)`,
    }).from(analyticsEvents).innerJoin(sentEmails, eq(analyticsEvents.sentEmailId, sentEmails.id)).where(and(gte(analyticsEvents.timestamp, startDate), eq(sentEmails.userId, userId))).groupBy(sql`DATE(${analyticsEvents.timestamp})`).orderBy(sql`DATE(${analyticsEvents.timestamp})`);
    return trends;
  } catch (error) { console.error('[Analytics] Error fetching engagement trends:', error); throw error; }
}

export async function getTopCampaigns(limit: number = 5, userId: number) {
  try {
    const topCampaigns = await db.select({
      id: campaigns.id, subject: campaigns.subject, status: campaigns.status, createdAt: campaigns.createdAt,
      totalSent: sql<number>`COUNT(DISTINCT ${campaignContacts.id})`,
      totalOpened: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`,
      totalClicks: sql<number>`COALESCE(SUM(${sentEmails.clickCount}), 0)`,
      totalReplies: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.replyReceived} = true THEN ${sentEmails.id} END)`,
    }).from(campaigns).leftJoin(campaignContacts, eq(campaignContacts.campaignId, campaigns.id)).leftJoin(sentEmails, eq(sentEmails.id, campaignContacts.sentEmailId)).where(eq(campaigns.userId, userId)).groupBy(campaigns.id, campaigns.subject, campaigns.status, campaigns.createdAt).orderBy(desc(sql`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`)).limit(limit);

    return topCampaigns.map(c => ({ ...c, openRate: c.totalSent > 0 ? (c.totalOpened / c.totalSent) * 100 : 0, clickRate: c.totalSent > 0 ? (c.totalClicks / c.totalSent) * 100 : 0, replyRate: c.totalSent > 0 ? (c.totalReplies / c.totalSent) * 100 : 0 }));
  } catch (error) { console.error('[Analytics] Error fetching top campaigns:', error); throw error; }
}

export async function getContactEngagement(limit: number = 10, userId: number) {
  try {
    const contactEngagement = await db.select({
      id: contacts.id, name: contacts.name, email: contacts.email, company: contacts.company, engagementScore: contacts.engagementScore,
      totalSent: sql<number>`COUNT(DISTINCT ${sentEmails.id})`,
      totalOpened: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`,
      totalClicks: sql<number>`COALESCE(SUM(${sentEmails.clickCount}), 0)`,
      totalReplies: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.replyReceived} = true THEN ${sentEmails.id} END)`,
      lastEngaged: sql<Date>`MAX(${sentEmails.lastOpenedAt})`,
    }).from(contacts).leftJoin(sentEmails, eq(sentEmails.contactId, contacts.id)).where(eq(contacts.userId, userId)).groupBy(contacts.id, contacts.name, contacts.email, contacts.company, contacts.engagementScore).orderBy(desc(contacts.engagementScore)).limit(limit);
    return contactEngagement;
  } catch (error) { console.error('[Analytics] Error fetching contact engagement:', error); throw error; }
}
