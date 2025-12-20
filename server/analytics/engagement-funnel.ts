import { db } from "../db";
import { sentEmails, replies, campaigns, campaignContacts, emailBounces } from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export interface FunnelStage {
    stage: string;
    count: number;
    percentage: number;
}

export interface EngagementFunnelResult {
    stages: FunnelStage[];
    conversionRates: {
        sentToOpened: number;
        openedToClicked: number;
        openedToReplied: number;
        clickedToReplied: number;
        sentToReplied: number;
    };
    totalSent: number;
    hasEnoughData: boolean;
}

export interface DropoffAnalysis {
    stage: string;
    dropoffCount: number;
    dropoffPercentage: number;
    recommendation: string;
}

export interface ReplyVelocityMetrics {
    averageHoursToReply: number;
    medianHoursToReply: number;
    fastestReplyHours: number;
    slowestReplyHours: number;
    repliesByTimeframe: {
        within1Hour: number;
        within24Hours: number;
        within3Days: number;
        after3Days: number;
    };
}

/**
 * Get the full engagement funnel: Sent → Delivered → Opened → Clicked → Replied
 */
export async function getEngagementFunnel(userId: number, campaignId?: number, days: number = 30): Promise<EngagementFunnelResult> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const whereConditions = campaignId
            ? and(
                eq(sentEmails.userId, userId),
                gte(sentEmails.sentAt, startDate),
                sql`${sentEmails.id} IN (SELECT sent_email_id FROM campaign_contacts WHERE campaign_id = ${campaignId})`
            )
            : and(eq(sentEmails.userId, userId), gte(sentEmails.sentAt, startDate));

        // Get funnel metrics in a single query
        const [metrics] = await db.select({
            totalSent: sql<number>`COUNT(*)`,
            totalDelivered: sql<number>`COUNT(*) - COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM email_bounces WHERE sent_email_id = ${sentEmails.id}) THEN ${sentEmails.id} END)`,
            totalOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`,
            totalClicked: sql<number>`COUNT(CASE WHEN ${sentEmails.clicked} = true THEN 1 END)`,
            totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
        }).from(sentEmails).where(whereConditions);

        const totalSent = Number(metrics?.totalSent || 0);
        const totalDelivered = Number(metrics?.totalDelivered || 0);
        const totalOpened = Number(metrics?.totalOpened || 0);
        const totalClicked = Number(metrics?.totalClicked || 0);
        const totalReplied = Number(metrics?.totalReplied || 0);

        const stages: FunnelStage[] = [
            { stage: "Sent", count: totalSent, percentage: 100 },
            { stage: "Delivered", count: totalDelivered, percentage: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0 },
            { stage: "Opened", count: totalOpened, percentage: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0 },
            { stage: "Clicked", count: totalClicked, percentage: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0 },
            { stage: "Replied", count: totalReplied, percentage: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0 },
        ];

        const conversionRates = {
            sentToOpened: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
            openedToClicked: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
            openedToReplied: totalOpened > 0 ? (totalReplied / totalOpened) * 100 : 0,
            clickedToReplied: totalClicked > 0 ? (totalReplied / totalClicked) * 100 : 0,
            sentToReplied: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
        };

        return {
            stages,
            conversionRates,
            totalSent,
            hasEnoughData: totalSent >= 10,
        };
    } catch (error) {
        console.error('[Analytics] Error fetching engagement funnel:', error);
        throw error;
    }
}

/**
 * Analyze where contacts drop off in the funnel
 */
export async function getFunnelDropoffAnalysis(userId: number, days: number = 30): Promise<DropoffAnalysis[]> {
    try {
        const funnel = await getEngagementFunnel(userId, undefined, days);
        const dropoffs: DropoffAnalysis[] = [];

        const stageRecommendations: Record<string, string> = {
            "Sent → Delivered": "Check email deliverability. Verify email addresses and reduce spam triggers in content.",
            "Delivered → Opened": "Improve subject lines. Test shorter subjects, add personalization, create urgency.",
            "Opened → Clicked": "Improve CTAs in email body. Make links more visible and compelling.",
            "Opened → Replied": "Make ask clearer. Reduce friction, ask simpler questions, add value proposition.",
        };

        for (let i = 0; i < funnel.stages.length - 1; i++) {
            const current = funnel.stages[i];
            const next = funnel.stages[i + 1];
            const dropoffCount = current.count - next.count;
            const dropoffPercentage = current.count > 0 ? (dropoffCount / current.count) * 100 : 0;
            const stageKey = `${current.stage} → ${next.stage}`;

            dropoffs.push({
                stage: stageKey,
                dropoffCount,
                dropoffPercentage,
                recommendation: stageRecommendations[stageKey] || "Analyze this stage for improvement opportunities.",
            });
        }

        return dropoffs.sort((a, b) => b.dropoffPercentage - a.dropoffPercentage);
    } catch (error) {
        console.error('[Analytics] Error fetching dropoff analysis:', error);
        throw error;
    }
}

/**
 * Analyze reply velocity - how fast contacts reply
 */
export async function getReplyVelocityMetrics(userId: number, days: number = 30): Promise<ReplyVelocityMetrics> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get reply times by joining sentEmails with replies
        const replyTimes = await db.select({
            sentAt: sentEmails.sentAt,
            replyReceivedAt: replies.replyReceivedAt,
        })
            .from(sentEmails)
            .innerJoin(replies, eq(replies.sentEmailId, sentEmails.id))
            .where(and(
                eq(sentEmails.userId, userId),
                gte(sentEmails.sentAt, startDate),
                sql`${replies.replyReceivedAt} IS NOT NULL`
            ));

        if (replyTimes.length === 0) {
            return {
                averageHoursToReply: 0,
                medianHoursToReply: 0,
                fastestReplyHours: 0,
                slowestReplyHours: 0,
                repliesByTimeframe: {
                    within1Hour: 0,
                    within24Hours: 0,
                    within3Days: 0,
                    after3Days: 0,
                },
            };
        }

        const hoursToReply = replyTimes.map(r => {
            const sent = new Date(r.sentAt!).getTime();
            const replied = new Date(r.replyReceivedAt!).getTime();
            return (replied - sent) / (1000 * 60 * 60); // Convert to hours
        }).filter(h => h > 0);

        hoursToReply.sort((a, b) => a - b);

        const sum = hoursToReply.reduce((a, b) => a + b, 0);
        const avg = sum / hoursToReply.length;
        const median = hoursToReply[Math.floor(hoursToReply.length / 2)];

        const within1Hour = hoursToReply.filter(h => h <= 1).length;
        const within24Hours = hoursToReply.filter(h => h > 1 && h <= 24).length;
        const within3Days = hoursToReply.filter(h => h > 24 && h <= 72).length;
        const after3Days = hoursToReply.filter(h => h > 72).length;

        return {
            averageHoursToReply: Math.round(avg * 10) / 10,
            medianHoursToReply: Math.round(median * 10) / 10,
            fastestReplyHours: Math.round(hoursToReply[0] * 10) / 10,
            slowestReplyHours: Math.round(hoursToReply[hoursToReply.length - 1] * 10) / 10,
            repliesByTimeframe: {
                within1Hour,
                within24Hours,
                within3Days,
                after3Days,
            },
        };
    } catch (error) {
        console.error('[Analytics] Error fetching reply velocity metrics:', error);
        throw error;
    }
}

/**
 * Get campaign-level funnel comparison
 */
export async function getCampaignFunnelComparison(userId: number, limit: number = 10): Promise<Array<{
    campaignId: number;
    campaignSubject: string;
    funnel: EngagementFunnelResult;
}>> {
    try {
        const topCampaigns = await db.select({
            id: campaigns.id,
            subject: campaigns.subject,
        })
            .from(campaigns)
            .where(eq(campaigns.userId, userId))
            .orderBy(desc(campaigns.createdAt))
            .limit(limit);

        const results = await Promise.all(
            topCampaigns.map(async (campaign) => ({
                campaignId: campaign.id,
                campaignSubject: campaign.subject || 'Untitled Campaign',
                funnel: await getEngagementFunnel(userId, campaign.id),
            }))
        );

        return results.filter(r => r.funnel.totalSent > 0);
    } catch (error) {
        console.error('[Analytics] Error fetching campaign funnel comparison:', error);
        throw error;
    }
}
