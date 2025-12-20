import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth/middleware";
import { LinkedInAnalyticsService } from "../../services/linkedin-analytics";

export function registerAnalyticsRoutes(app: Express) {
  app.get("/api/analytics/linkedin/overview", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const metrics = await LinkedInAnalyticsService.getOverviewMetrics(userId);
      res.json(metrics);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting overview:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn analytics' });
    }
  });

  app.get("/api/analytics/linkedin/trends", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const days = parseInt(req.query.days as string) || 30;
      const trends = await LinkedInAnalyticsService.getEngagementTrends(days, userId);
      res.json(trends);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting trends:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn trends' });
    }
  });

  app.get("/api/analytics/linkedin/daily-metrics", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 7));
      const metrics = await LinkedInAnalyticsService.getDailyMetrics(userId, days);
      res.json(metrics);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting daily metrics:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn daily metrics' });
    }
  });

  app.get("/api/analytics/linkedin/best-send-times", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0;
      const bestSendTimes = await LinkedInAnalyticsService.getBestSendTimes(userId, timezoneOffset);
      res.json(bestSendTimes);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting best send times:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn best send times' });
    }
  });

  app.get("/api/analytics/linkedin/weekly-pattern", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const pattern = await LinkedInAnalyticsService.getWeeklySendPattern(userId);
      res.json(pattern);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting weekly pattern:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn weekly pattern' });
    }
  });

  app.get("/api/analytics/linkedin/campaign-metrics", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const limit = parseInt(req.query.limit as string) || 20;
      const metrics = await LinkedInAnalyticsService.getCampaignMetrics(userId, limit);
      res.json(metrics);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting campaign metrics:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn campaign metrics' });
    }
  });

  app.get("/api/analytics/linkedin/trend-comparison", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const daysParam = parseInt(req.query.days as string);
      const days: 7 | 30 = daysParam === 30 ? 30 : 7;
      const comparison = await LinkedInAnalyticsService.getTrendComparison(userId, days);
      res.json(comparison);
    } catch (error: any) {
      console.error('[LinkedIn Analytics] Error getting trend comparison:', error);
      res.status(500).json({ error: error.message || 'Failed to get LinkedIn trend comparison' });
    }
  });
}
