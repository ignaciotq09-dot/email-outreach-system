import type { Request, Response } from "express";
import { AnalyticsService } from "../../analytics";

export async function handleOverview(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const metrics = await AnalyticsService.getOverviewMetrics(userId); res.json(metrics); } catch (error: any) { console.error('Error fetching analytics overview:', error); res.status(500).json({ error: error.message || 'Failed to fetch analytics' }); }
}

export async function handleEngagementTrends(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = parseInt(req.query.days as string) || 30; const trends = await AnalyticsService.getEngagementTrends(days, userId); res.json(trends); } catch (error: any) { console.error('Error fetching engagement trends:', error); res.status(500).json({ error: error.message || 'Failed to fetch trends' }); }
}

export async function handleTopCampaigns(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const limit = parseInt(req.query.limit as string) || 5; const topCampaigns = await AnalyticsService.getTopCampaigns(limit, userId); res.json(topCampaigns); } catch (error: any) { console.error('Error fetching top campaigns:', error); res.status(500).json({ error: error.message || 'Failed to fetch campaigns' }); }
}

export async function handleContactEngagement(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const limit = parseInt(req.query.limit as string) || 10; const contactEngagement = await AnalyticsService.getContactEngagement(limit, userId); res.json(contactEngagement); } catch (error: any) { console.error('Error fetching contact engagement:', error); res.status(500).json({ error: error.message || 'Failed to fetch contact engagement' }); }
}

export async function handleBestSendTimes(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0; const bestSendTimes = await AnalyticsService.getBestSendTimes(userId, timezoneOffset); res.json(bestSendTimes); } catch (error: any) { console.error('Error fetching best send times:', error); res.status(500).json({ error: error.message || 'Failed to fetch best send times' }); }
}

export async function handleDeliverability(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const metrics = await AnalyticsService.getDeliverabilityMetrics(userId); res.json(metrics); } catch (error: any) { console.error('Error fetching deliverability metrics:', error); res.status(500).json({ error: error.message || 'Failed to fetch deliverability metrics' }); }
}

export async function handleDailyMetrics(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 7)); const metrics = await AnalyticsService.getDailyMetrics(userId, days); res.json(metrics); } catch (error: any) { console.error('Error fetching daily metrics:', error); res.status(500).json({ error: error.message || 'Failed to fetch daily metrics' }); }
}

export async function handleVelocity(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = parseInt(req.query.days as string) || 7; const velocity = await AnalyticsService.getVelocityMetrics(userId, days); res.json(velocity); } catch (error: any) { console.error('Error fetching velocity metrics:', error); res.status(500).json({ error: error.message || 'Failed to fetch velocity metrics' }); }
}

export async function handleTrendComparison(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const daysParam = parseInt(req.query.days as string); const days: 7 | 30 = daysParam === 30 ? 30 : 7; const trendComparison = await AnalyticsService.getTrendComparison(userId, days); res.json(trendComparison); } catch (error: any) { console.error('Error fetching trend comparison:', error); res.status(500).json({ error: error.message || 'Failed to fetch trend comparison' }); }
}

export async function handleCampaignLeaderboard(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const limit = parseInt(req.query.limit as string) || 20; const sortBy = (req.query.sortBy as string) || 'openRate'; const sortOrder = (req.query.sortOrder as string) || 'desc'; const validSortBy = ['sent', 'openRate', 'replyRate', 'date'].includes(sortBy) ? sortBy as 'sent' | 'openRate' | 'replyRate' | 'date' : 'openRate'; const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder as 'asc' | 'desc' : 'desc'; const leaderboard = await AnalyticsService.getCampaignLeaderboard(userId, { limit, sortBy: validSortBy, sortOrder: validSortOrder }); res.json(leaderboard); } catch (error: any) { console.error('Error fetching campaign leaderboard:', error); res.status(500).json({ error: error.message || 'Failed to fetch campaign leaderboard' }); }
}
