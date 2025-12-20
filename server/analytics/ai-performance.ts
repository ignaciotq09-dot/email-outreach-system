import { db } from "../db";
import { sentEmails, optimizationRuns, abTests, abTestResults } from "@shared/schema";
import { eq, and, gte, sql, isNotNull, isNull, desc } from "drizzle-orm";

export interface AIComparisonResult {
    optimized: {
        totalSent: number;
        openRate: number;
        replyRate: number;
        clickRate: number;
    };
    nonOptimized: {
        totalSent: number;
        openRate: number;
        replyRate: number;
        clickRate: number;
    };
    lift: {
        openRateLift: number;
        replyRateLift: number;
        clickRateLift: number;
    };
    hasEnoughData: boolean;
    recommendation: string;
}

export interface PredictionAccuracy {
    totalPredictions: number;
    averageOpenRateError: number;
    averageReplyRateError: number;
    accuracyScore: number; // 0-100, higher is better
    accuracyTrend: 'improving' | 'stable' | 'declining';
}

export interface RuleEffectiveness {
    ruleName: string;
    timesApplied: number;
    avgOpenRateIncrease: number;
    avgReplyRateIncrease: number;
    effectivenessScore: number;
}

export interface ABTestSummary {
    testId: number;
    experimentId: string;
    name: string;
    status: string;
    variants: Array<{
        key: string;
        sent: number;
        opens: number;
        openRate: number;
        replies: number;
        replyRate: number;
    }>;
    winner: string | null;
    confidenceLevel: number;
    isStatisticallySignificant: boolean;
}

/**
 * Compare performance of AI-optimized emails vs non-optimized
 */
export async function getAIOptimizationComparison(userId: number, days: number = 30): Promise<AIComparisonResult> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get emails that were optimized (have optimization runs)
        const [optimizedStats] = await db.select({
            totalSent: sql<number>`COUNT(DISTINCT ${sentEmails.id})`,
            totalOpened: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`,
            totalClicked: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.clicked} = true THEN ${sentEmails.id} END)`,
            totalReplied: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.replyReceived} = true THEN ${sentEmails.id} END)`,
        })
            .from(sentEmails)
            .innerJoin(optimizationRuns, eq(optimizationRuns.sentEmailId, sentEmails.id))
            .where(and(
                eq(sentEmails.userId, userId),
                gte(sentEmails.sentAt, startDate)
            ));

        // Get emails without optimization runs
        const [nonOptimizedStats] = await db.select({
            totalSent: sql<number>`COUNT(*)`,
            totalOpened: sql<number>`COUNT(CASE WHEN ${sentEmails.opened} = true THEN 1 END)`,
            totalClicked: sql<number>`COUNT(CASE WHEN ${sentEmails.clicked} = true THEN 1 END)`,
            totalReplied: sql<number>`COUNT(CASE WHEN ${sentEmails.replyReceived} = true THEN 1 END)`,
        })
            .from(sentEmails)
            .where(and(
                eq(sentEmails.userId, userId),
                gte(sentEmails.sentAt, startDate),
                sql`NOT EXISTS (SELECT 1 FROM optimization_runs WHERE sent_email_id = ${sentEmails.id})`
            ));

        const optSent = Number(optimizedStats?.totalSent || 0);
        const optOpened = Number(optimizedStats?.totalOpened || 0);
        const optClicked = Number(optimizedStats?.totalClicked || 0);
        const optReplied = Number(optimizedStats?.totalReplied || 0);

        const nonOptSent = Number(nonOptimizedStats?.totalSent || 0);
        const nonOptOpened = Number(nonOptimizedStats?.totalOpened || 0);
        const nonOptClicked = Number(nonOptimizedStats?.totalClicked || 0);
        const nonOptReplied = Number(nonOptimizedStats?.totalReplied || 0);

        const optimized = {
            totalSent: optSent,
            openRate: optSent > 0 ? (optOpened / optSent) * 100 : 0,
            replyRate: optSent > 0 ? (optReplied / optSent) * 100 : 0,
            clickRate: optSent > 0 ? (optClicked / optSent) * 100 : 0,
        };

        const nonOptimized = {
            totalSent: nonOptSent,
            openRate: nonOptSent > 0 ? (nonOptOpened / nonOptSent) * 100 : 0,
            replyRate: nonOptSent > 0 ? (nonOptReplied / nonOptSent) * 100 : 0,
            clickRate: nonOptSent > 0 ? (nonOptClicked / nonOptSent) * 100 : 0,
        };

        const lift = {
            openRateLift: nonOptimized.openRate > 0
                ? ((optimized.openRate - nonOptimized.openRate) / nonOptimized.openRate) * 100
                : optimized.openRate > 0 ? 100 : 0,
            replyRateLift: nonOptimized.replyRate > 0
                ? ((optimized.replyRate - nonOptimized.replyRate) / nonOptimized.replyRate) * 100
                : optimized.replyRate > 0 ? 100 : 0,
            clickRateLift: nonOptimized.clickRate > 0
                ? ((optimized.clickRate - nonOptimized.clickRate) / nonOptimized.clickRate) * 100
                : optimized.clickRate > 0 ? 100 : 0,
        };

        const hasEnoughData = optSent >= 10 && nonOptSent >= 10;

        let recommendation = '';
        if (!hasEnoughData) {
            recommendation = 'Send more emails to get statistically meaningful comparison.';
        } else if (lift.openRateLift > 10 && lift.replyRateLift > 10) {
            recommendation = 'AI optimization is significantly improving your results. Keep using it!';
        } else if (lift.openRateLift > 0 || lift.replyRateLift > 0) {
            recommendation = 'AI optimization is showing positive results. Consider optimizing all emails.';
        } else {
            recommendation = 'Review your optimization settings. Consider adjusting AI parameters.';
        }

        return { optimized, nonOptimized, lift, hasEnoughData, recommendation };
    } catch (error) {
        console.error('[Analytics] Error fetching AI optimization comparison:', error);
        throw error;
    }
}

/**
 * Measure AI prediction accuracy (predicted vs actual open/reply rates)
 */
export async function getAIPredictionAccuracy(userId: number, days: number = 30): Promise<PredictionAccuracy> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get optimization runs with predictions that have actual results
        const runs = await db.select({
            predictions: optimizationRuns.predictions,
            sentEmailId: optimizationRuns.sentEmailId,
            opened: sentEmails.opened,
            replyReceived: sentEmails.replyReceived,
        })
            .from(optimizationRuns)
            .innerJoin(sentEmails, eq(optimizationRuns.sentEmailId, sentEmails.id))
            .where(and(
                eq(sentEmails.userId, userId),
                gte(optimizationRuns.createdAt, startDate),
                isNotNull(optimizationRuns.predictions)
            ))
            .limit(1000);

        if (runs.length === 0) {
            return {
                totalPredictions: 0,
                averageOpenRateError: 0,
                averageReplyRateError: 0,
                accuracyScore: 0,
                accuracyTrend: 'stable',
            };
        }

        let openRateErrors: number[] = [];
        let replyRateErrors: number[] = [];

        for (const run of runs) {
            const predictions = run.predictions as any;
            if (predictions?.openRate !== undefined) {
                const actualOpen = run.opened ? 100 : 0;
                openRateErrors.push(Math.abs(predictions.openRate - actualOpen));
            }
            if (predictions?.responseRate !== undefined) {
                const actualReply = run.replyReceived ? 100 : 0;
                replyRateErrors.push(Math.abs(predictions.responseRate - actualReply));
            }
        }

        const avgOpenError = openRateErrors.length > 0
            ? openRateErrors.reduce((a, b) => a + b, 0) / openRateErrors.length
            : 0;
        const avgReplyError = replyRateErrors.length > 0
            ? replyRateErrors.reduce((a, b) => a + b, 0) / replyRateErrors.length
            : 0;

        // Accuracy score: 100 - average error (clamped to 0-100)
        const avgError = (avgOpenError + avgReplyError) / 2;
        const accuracyScore = Math.max(0, Math.min(100, 100 - avgError));

        return {
            totalPredictions: runs.length,
            averageOpenRateError: Math.round(avgOpenError * 10) / 10,
            averageReplyRateError: Math.round(avgReplyError * 10) / 10,
            accuracyScore: Math.round(accuracyScore),
            accuracyTrend: 'stable', // Would need historical comparison for actual trend
        };
    } catch (error) {
        console.error('[Analytics] Error fetching AI prediction accuracy:', error);
        throw error;
    }
}

/**
 * Analyze which optimization rules are most effective
 */
export async function getOptimizationRuleEffectiveness(userId: number, days: number = 30): Promise<RuleEffectiveness[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get optimization runs with rules applied
        const runs = await db.select({
            rulesApplied: optimizationRuns.rulesApplied,
            opened: sentEmails.opened,
            replyReceived: sentEmails.replyReceived,
        })
            .from(optimizationRuns)
            .innerJoin(sentEmails, eq(optimizationRuns.sentEmailId, sentEmails.id))
            .where(and(
                eq(sentEmails.userId, userId),
                gte(optimizationRuns.createdAt, startDate),
                isNotNull(optimizationRuns.rulesApplied)
            ))
            .limit(1000);

        // Aggregate by rule
        const ruleStats: Map<string, { applied: number; opened: number; replied: number }> = new Map();

        for (const run of runs) {
            const rules = run.rulesApplied as string[] | null;
            if (!rules || !Array.isArray(rules)) continue;

            for (const rule of rules) {
                const existing = ruleStats.get(rule) || { applied: 0, opened: 0, replied: 0 };
                existing.applied++;
                if (run.opened) existing.opened++;
                if (run.replyReceived) existing.replied++;
                ruleStats.set(rule, existing);
            }
        }

        // Calculate effectiveness
        const results: RuleEffectiveness[] = [];
        for (const [ruleName, stats] of Array.from(ruleStats.entries())) {
            if (stats.applied < 5) continue; // Skip rules with too few applications

            const openRate = (stats.opened / stats.applied) * 100;
            const replyRate = (stats.replied / stats.applied) * 100;
            // Simple effectiveness score based on reply rate (most important) and open rate
            const effectivenessScore = (replyRate * 2) + openRate;

            results.push({
                ruleName,
                timesApplied: stats.applied,
                avgOpenRateIncrease: Math.round(openRate * 10) / 10,
                avgReplyRateIncrease: Math.round(replyRate * 10) / 10,
                effectivenessScore: Math.round(effectivenessScore),
            });
        }

        return results.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
    } catch (error) {
        console.error('[Analytics] Error fetching optimization rule effectiveness:', error);
        throw error;
    }
}

/**
 * Get A/B test results summary
 */
export async function getABTestResults(userId: number, experimentId?: string): Promise<ABTestSummary[]> {
    try {
        const whereConditions = experimentId
            ? and(eq(abTests.userId, userId), eq(abTests.experimentId, experimentId))
            : eq(abTests.userId, userId);

        const tests = await db.select()
            .from(abTests)
            .where(whereConditions)
            .orderBy(desc(abTests.createdAt))
            .limit(10);

        const summaries: ABTestSummary[] = [];

        for (const test of tests) {
            const results = await db.select()
                .from(abTestResults)
                .where(eq(abTestResults.experimentId, test.experimentId));

            const variants = results.map(r => ({
                key: r.variantKey,
                sent: Number(r.totalSent || 0),
                opens: Number(r.opens || 0),
                openRate: r.totalSent && r.totalSent > 0 ? (Number(r.opens || 0) / r.totalSent) * 100 : 0,
                replies: Number(r.replies || 0),
                replyRate: r.totalSent && r.totalSent > 0 ? (Number(r.replies || 0) / r.totalSent) * 100 : 0,
            }));

            // Determine winner based on reply rate (most valuable metric)
            let winner: string | null = null;
            let highestReplyRate = 0;
            for (const variant of variants) {
                if (variant.replyRate > highestReplyRate && variant.sent >= 10) {
                    highestReplyRate = variant.replyRate;
                    winner = variant.key;
                }
            }

            // Simple statistical significance check (need 50+ samples and 20%+ difference)
            const totalSent = variants.reduce((sum, v) => sum + v.sent, 0);
            const hasEnoughSamples = variants.every(v => v.sent >= 25);
            const maxReplyRate = Math.max(...variants.map(v => v.replyRate));
            const minReplyRate = Math.min(...variants.map(v => v.replyRate));
            const isStatisticallySignificant = hasEnoughSamples && maxReplyRate > 0 &&
                ((maxReplyRate - minReplyRate) / minReplyRate > 0.2 || minReplyRate === 0);

            summaries.push({
                testId: test.id,
                experimentId: test.experimentId,
                name: test.name,
                status: test.status || 'active',
                variants,
                winner: isStatisticallySignificant ? winner : null,
                confidenceLevel: isStatisticallySignificant ? 95 : 0,
                isStatisticallySignificant,
            });
        }

        return summaries;
    } catch (error) {
        console.error('[Analytics] Error fetching A/B test results:', error);
        throw error;
    }
}

/**
 * Get overall AI optimization ROI
 */
export async function getAIOptimizationROI(userId: number, days: number = 30): Promise<{
    totalEmailsOptimized: number;
    estimatedExtraReplies: number;
    optimizationValue: string;
    topInsights: string[];
}> {
    try {
        const comparison = await getAIOptimizationComparison(userId, days);

        // Estimate extra replies from AI optimization
        const baseReplyRate = comparison.nonOptimized.replyRate / 100;
        const optimizedReplyRate = comparison.optimized.replyRate / 100;
        const extraRepliesPerEmail = optimizedReplyRate - baseReplyRate;
        const estimatedExtraReplies = Math.round(comparison.optimized.totalSent * extraRepliesPerEmail);

        const topInsights: string[] = [];

        if (comparison.lift.openRateLift > 10) {
            topInsights.push(`AI optimization increased open rates by ${comparison.lift.openRateLift.toFixed(1)}%`);
        }
        if (comparison.lift.replyRateLift > 10) {
            topInsights.push(`AI optimization increased reply rates by ${comparison.lift.replyRateLift.toFixed(1)}%`);
        }
        if (!comparison.hasEnoughData) {
            topInsights.push('Send more emails to get accurate AI performance metrics');
        }

        return {
            totalEmailsOptimized: comparison.optimized.totalSent,
            estimatedExtraReplies: Math.max(0, estimatedExtraReplies),
            optimizationValue: estimatedExtraReplies > 0 ? 'Positive' : 'Neutral',
            topInsights,
        };
    } catch (error) {
        console.error('[Analytics] Error calculating AI optimization ROI:', error);
        throw error;
    }
}
