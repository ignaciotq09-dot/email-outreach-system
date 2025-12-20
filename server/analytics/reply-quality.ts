import { db } from "../db";
import { sentEmails, replies } from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import OpenAI from "openai";

// Lazy initialization - only create OpenAI client when actually needed
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

export type ReplyClassification =
    | 'positive'
    | 'negative'
    | 'neutral'
    | 'meeting_request'
    | 'question'
    | 'out_of_office'
    | 'unsubscribe'
    | 'referral'
    | 'not_interested';

export interface ReplyQualityBreakdown {
    total: number;
    byClassification: Record<ReplyClassification, number>;
    positiveRate: number;
    meetingRequestRate: number;
    unsubscribeRate: number;
    hasEnoughData: boolean;
}

export interface ReplyQualityTrend {
    date: string;
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    meetingRequest: number;
}

/**
 * Classify a reply using AI to determine sentiment/intent
 */
export async function classifyReply(replyContent: string): Promise<{
    classification: ReplyClassification;
    confidence: number;
    reasoning: string;
}> {
    try {
        if (!replyContent || replyContent.trim().length < 5) {
            return { classification: 'neutral', confidence: 0.5, reasoning: 'Content too short to analyze' };
        }

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an email reply classifier. Analyze the reply and return a JSON object with:
- classification: one of 'positive', 'negative', 'neutral', 'meeting_request', 'question', 'out_of_office', 'unsubscribe', 'referral', 'not_interested'
- confidence: 0.0 to 1.0
- reasoning: brief explanation (max 50 words)

Classification meanings:
- positive: Shows interest, wants to learn more, engaged response
- negative: Hostile, rude, or angry response
- neutral: Polite but non-committal, generic acknowledgment
- meeting_request: Explicitly asks for or agrees to a meeting/call
- question: Asks for more information before deciding
- out_of_office: Auto-reply or vacation message
- unsubscribe: Requests to stop emails or be removed
- referral: Suggests another person to contact
- not_interested: Politely declines without hostility`
                },
                {
                    role: "user",
                    content: `Classify this email reply:\n\n${replyContent.slice(0, 1000)}`
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 200,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
            classification: result.classification || 'neutral',
            confidence: result.confidence || 0.5,
            reasoning: result.reasoning || 'Unable to determine',
        };
    } catch (error) {
        console.error('[Analytics] Error classifying reply:', error);
        return { classification: 'neutral', confidence: 0.5, reasoning: 'Classification failed' };
    }
}

/**
 * Get breakdown of reply quality by classification type
 */
export async function getReplyQualityBreakdown(userId: number, days: number = 30): Promise<ReplyQualityBreakdown> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get reply sentiment counts from sentEmails
        const [sentimentStats] = await db.select({
            total: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
            positive: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'positive' THEN 1 END)`,
            negative: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'negative' THEN 1 END)`,
            neutral: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'neutral' OR ${sentEmails.replySentiment} IS NULL THEN 1 END)`,
            meetingRequest: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'meeting_request' THEN 1 END)`,
            question: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'question' THEN 1 END)`,
            outOfOffice: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'out_of_office' THEN 1 END)`,
            unsubscribe: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'unsubscribe' THEN 1 END)`,
            referral: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'referral' THEN 1 END)`,
            notInterested: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'not_interested' THEN 1 END)`,
        })
            .from(sentEmails)
            .where(and(
                eq(sentEmails.userId, userId),
                gte(sentEmails.sentAt, startDate),
                eq(sentEmails.replyReceived, true)
            ));

        const total = Number(sentimentStats?.total || 0);
        const byClassification: Record<ReplyClassification, number> = {
            positive: Number(sentimentStats?.positive || 0),
            negative: Number(sentimentStats?.negative || 0),
            neutral: Number(sentimentStats?.neutral || 0),
            meeting_request: Number(sentimentStats?.meetingRequest || 0),
            question: Number(sentimentStats?.question || 0),
            out_of_office: Number(sentimentStats?.outOfOffice || 0),
            unsubscribe: Number(sentimentStats?.unsubscribe || 0),
            referral: Number(sentimentStats?.referral || 0),
            not_interested: Number(sentimentStats?.notInterested || 0),
        };

        const positiveRate = total > 0
            ? ((byClassification.positive + byClassification.meeting_request + byClassification.referral) / total) * 100
            : 0;
        const meetingRequestRate = total > 0 ? (byClassification.meeting_request / total) * 100 : 0;
        const unsubscribeRate = total > 0 ? (byClassification.unsubscribe / total) * 100 : 0;

        return {
            total,
            byClassification,
            positiveRate,
            meetingRequestRate,
            unsubscribeRate,
            hasEnoughData: total >= 5,
        };
    } catch (error) {
        console.error('[Analytics] Error fetching reply quality breakdown:', error);
        throw error;
    }
}

/**
 * Get daily trends of reply quality
 */
export async function getReplyQualityTrends(userId: number, days: number = 30): Promise<ReplyQualityTrend[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dailyStats = await db.select({
            date: sql<string>`DATE(${replies.replyReceivedAt})`,
            total: sql<number>`COUNT(*)`,
            positive: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'positive' THEN 1 END)`,
            negative: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'negative' THEN 1 END)`,
            neutral: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'neutral' OR ${sentEmails.replySentiment} IS NULL THEN 1 END)`,
            meetingRequest: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'meeting_request' THEN 1 END)`,
        })
            .from(replies)
            .innerJoin(sentEmails, eq(replies.sentEmailId, sentEmails.id))
            .where(and(
                eq(sentEmails.userId, userId),
                gte(replies.replyReceivedAt, startDate)
            ))
            .groupBy(sql`DATE(${replies.replyReceivedAt})`)
            .orderBy(sql`DATE(${replies.replyReceivedAt})`);

        // Fill in missing days with zeros
        const result: ReplyQualityTrend[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const existing = dailyStats.find(d => d.date === dateStr);
            result.push({
                date: dateStr,
                total: Number(existing?.total || 0),
                positive: Number(existing?.positive || 0),
                negative: Number(existing?.negative || 0),
                neutral: Number(existing?.neutral || 0),
                meetingRequest: Number(existing?.meetingRequest || 0),
            });
        }

        return result;
    } catch (error) {
        console.error('[Analytics] Error fetching reply quality trends:', error);
        throw error;
    }
}

/**
 * Get top contacts by positive reply rate
 */
export async function getTopResponsiveContacts(userId: number, limit: number = 10): Promise<Array<{
    contactId: number;
    contactEmail: string;
    contactName: string;
    totalReplies: number;
    positiveReplies: number;
    meetingRequests: number;
}>> {
    try {
        const results = await db.select({
            contactId: sentEmails.contactId,
            totalReplies: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
            positiveReplies: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'positive' THEN 1 END)`,
            meetingRequests: sql<number>`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'meeting_request' THEN 1 END)`,
        })
            .from(sentEmails)
            .where(and(
                eq(sentEmails.userId, userId),
                eq(sentEmails.replyReceived, true)
            ))
            .groupBy(sentEmails.contactId)
            .having(sql`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END) > 0`)
            .orderBy(desc(sql`COUNT(CASE WHEN ${sentEmails.replySentiment} = 'positive' OR ${sentEmails.replySentiment} = 'meeting_request' THEN 1 END)`))
            .limit(limit);

        // Would need to join with contacts table to get email/name
        // Returning contactId for now, can be enriched by caller
        return results.map(r => ({
            contactId: r.contactId,
            contactEmail: '', // Enriched by caller
            contactName: '', // Enriched by caller
            totalReplies: Number(r.totalReplies),
            positiveReplies: Number(r.positiveReplies),
            meetingRequests: Number(r.meetingRequests),
        }));
    } catch (error) {
        console.error('[Analytics] Error fetching top responsive contacts:', error);
        throw error;
    }
}
