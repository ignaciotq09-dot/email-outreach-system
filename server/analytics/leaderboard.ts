import { db } from "../db";
import { sentEmails, campaigns, campaignContacts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export async function getCampaignLeaderboard(userId: number, options: { limit?: number; sortBy?: 'sent' | 'openRate' | 'replyRate' | 'date'; sortOrder?: 'asc' | 'desc'; } = {}) {
  try {
    const { limit = 20, sortBy = 'openRate', sortOrder = 'desc' } = options;

    const [userAverages] = await db.select({
      avgOpenRate: sql<number>`CASE WHEN COUNT(CASE WHEN ${sentEmails.trackingEnabled} = true THEN 1 END) > 0 THEN (COUNT(CASE WHEN ${sentEmails.opened} = true AND ${sentEmails.trackingEnabled} = true THEN 1 END)::float / COUNT(CASE WHEN ${sentEmails.trackingEnabled} = true THEN 1 END)) * 100 ELSE 0 END`,
      avgReplyRate: sql<number>`CASE WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)::float / COUNT(*)) * 100 ELSE 0 END`,
    }).from(sentEmails).where(eq(sentEmails.userId, userId));

    const avgOpenRate = Number(userAverages?.avgOpenRate || 0);
    const avgReplyRate = Number(userAverages?.avgReplyRate || 0);

    const allCampaigns = await db.select({
      id: campaigns.id, subject: campaigns.subject, status: campaigns.status, createdAt: campaigns.createdAt,
      totalSent: sql<number>`COUNT(DISTINCT CASE WHEN ${campaignContacts.sentEmailId} IS NOT NULL THEN ${campaignContacts.id} END)`,
      totalOpened: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`,
      totalReplies: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.replyReceived} = true THEN ${sentEmails.id} END)`,
    }).from(campaigns).leftJoin(campaignContacts, eq(campaignContacts.campaignId, campaigns.id)).leftJoin(sentEmails, eq(sentEmails.id, campaignContacts.sentEmailId)).where(eq(campaigns.userId, userId)).groupBy(campaigns.id, campaigns.subject, campaigns.status, campaigns.createdAt);

    let campaignsWithRates = allCampaigns.map(campaign => {
      const totalSent = Number(campaign.totalSent) || 0;
      const totalOpened = Number(campaign.totalOpened) || 0;
      const totalReplies = Number(campaign.totalReplies) || 0;
      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const replyRate = totalSent > 0 ? (totalReplies / totalSent) * 100 : 0;
      const canCompare = totalSent > 0;
      const openRatePerformance = canCompare && avgOpenRate > 0 ? ((openRate - avgOpenRate) / avgOpenRate) * 100 : null;
      const replyRatePerformance = canCompare && avgReplyRate > 0 ? ((replyRate - avgReplyRate) / avgReplyRate) * 100 : null;
      const isAboveAverageOpen = canCompare && (avgOpenRate > 0 ? openRate > avgOpenRate : openRate > 0);
      const isAboveAverageReply = canCompare && (avgReplyRate > 0 ? replyRate > avgReplyRate : replyRate > 0);
      const hasValidOpenComparison = canCompare && (avgOpenRate > 0 || openRate > 0);
      const hasValidReplyComparison = canCompare && (avgReplyRate > 0 || replyRate > 0);
      return { id: campaign.id, subject: campaign.subject, status: campaign.status, createdAt: campaign.createdAt, totalSent, totalOpened, totalReplies, openRate, replyRate, openRatePerformance, replyRatePerformance, isAboveAverageOpen, isAboveAverageReply, hasValidOpenComparison, hasValidReplyComparison };
    });

    campaignsWithRates.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'sent': comparison = a.totalSent - b.totalSent; break;
        case 'openRate': comparison = a.openRate - b.openRate; break;
        case 'replyRate': comparison = a.replyRate - b.replyRate; break;
        case 'date': comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return { campaigns: campaignsWithRates.slice(0, limit), averages: { openRate: avgOpenRate, replyRate: avgReplyRate }, total: allCampaigns.length };
  } catch (error) { console.error('[Analytics] Error fetching campaign leaderboard:', error); throw error; }
}
