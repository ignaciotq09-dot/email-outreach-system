import type { Request, Response } from "express";
import { AnalyticsService } from "../../analytics";

// Engagement Funnel Handlers

export async function handleEngagementFunnel(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
        const days = parseInt(req.query.days as string) || 30;
        const funnel = await AnalyticsService.getEngagementFunnel(userId, campaignId, days);
        res.json(funnel);
    } catch (error: any) {
        console.error('Error fetching engagement funnel:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch engagement funnel' });
    }
}

export async function handleFunnelDropoff(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const dropoffs = await AnalyticsService.getFunnelDropoffAnalysis(userId, days);
        res.json(dropoffs);
    } catch (error: any) {
        console.error('Error fetching dropoff analysis:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch dropoff analysis' });
    }
}

export async function handleReplyVelocity(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const velocity = await AnalyticsService.getReplyVelocityMetrics(userId, days);
        res.json(velocity);
    } catch (error: any) {
        console.error('Error fetching reply velocity:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch reply velocity' });
    }
}

export async function handleCampaignFunnelComparison(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const limit = parseInt(req.query.limit as string) || 10;
        const comparison = await AnalyticsService.getCampaignFunnelComparison(userId, limit);
        res.json(comparison);
    } catch (error: any) {
        console.error('Error fetching campaign funnel comparison:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch campaign funnel comparison' });
    }
}

// Reply Quality Handlers

export async function handleReplyQualityBreakdown(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const breakdown = await AnalyticsService.getReplyQualityBreakdown(userId, days);
        res.json(breakdown);
    } catch (error: any) {
        console.error('Error fetching reply quality:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch reply quality' });
    }
}

export async function handleReplyQualityTrends(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const trends = await AnalyticsService.getReplyQualityTrends(userId, days);
        res.json(trends);
    } catch (error: any) {
        console.error('Error fetching reply trends:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch reply trends' });
    }
}

export async function handleTopResponsiveContacts(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const limit = parseInt(req.query.limit as string) || 10;
        const contacts = await AnalyticsService.getTopResponsiveContacts(userId, limit);
        res.json(contacts);
    } catch (error: any) {
        console.error('Error fetching top contacts:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch top contacts' });
    }
}

// AI Performance Handlers

export async function handleAIComparison(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const comparison = await AnalyticsService.getAIOptimizationComparison(userId, days);
        res.json(comparison);
    } catch (error: any) {
        console.error('Error fetching AI comparison:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch AI comparison' });
    }
}

export async function handleAIPredictionAccuracy(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const accuracy = await AnalyticsService.getAIPredictionAccuracy(userId, days);
        res.json(accuracy);
    } catch (error: any) {
        console.error('Error fetching AI accuracy:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch AI accuracy' });
    }
}

export async function handleOptimizationRuleEffectiveness(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const rules = await AnalyticsService.getOptimizationRuleEffectiveness(userId, days);
        res.json(rules);
    } catch (error: any) {
        console.error('Error fetching rule effectiveness:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch rule effectiveness' });
    }
}

export async function handleABTestResults(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const experimentId = req.query.experimentId as string | undefined;
        const results = await AnalyticsService.getABTestResults(userId, experimentId);
        res.json(results);
    } catch (error: any) {
        console.error('Error fetching A/B test results:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch A/B test results' });
    }
}

export async function handleAIOptimizationROI(req: Request, res: Response) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const days = parseInt(req.query.days as string) || 30;
        const roi = await AnalyticsService.getAIOptimizationROI(userId, days);
        res.json(roi);
    } catch (error: any) {
        console.error('Error fetching AI ROI:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch AI ROI' });
    }
}
