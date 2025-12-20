import type { Request, Response } from "express";
import { SmsAnalyticsService } from "../../services/sms-analytics";
import { AnalyticsService } from "../../analytics";

export async function handleSmsOverview(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const metrics = await SmsAnalyticsService.getOverviewMetrics(userId); res.json(metrics); } catch (error: any) { console.error('Error fetching SMS overview:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS analytics' }); }
}

export async function handleSmsTrends(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = parseInt(req.query.days as string) || 30; const trends = await SmsAnalyticsService.getEngagementTrends(days, userId); res.json(trends); } catch (error: any) { console.error('Error fetching SMS trends:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS trends' }); }
}

export async function handleSmsResponseTrends(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = parseInt(req.query.days as string) || 30; const trends = await SmsAnalyticsService.getResponseTrends(days, userId); res.json(trends); } catch (error: any) { console.error('Error fetching SMS response trends:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS response trends' }); }
}

export async function handleSmsDailyMetrics(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 7)); const metrics = await SmsAnalyticsService.getDailyMetrics(userId, days); res.json(metrics); } catch (error: any) { console.error('Error fetching SMS daily metrics:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS daily metrics' }); }
}

export async function handleSmsDeliverability(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const metrics = await SmsAnalyticsService.getDeliverabilityMetrics(userId); res.json(metrics); } catch (error: any) { console.error('Error fetching SMS deliverability:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS deliverability' }); }
}

export async function handleSmsVelocity(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const days = parseInt(req.query.days as string) || 7; const velocity = await SmsAnalyticsService.getVelocityMetrics(userId, days); res.json(velocity); } catch (error: any) { console.error('Error fetching SMS velocity:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS velocity' }); }
}

export async function handleSmsWeeklyPattern(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const pattern = await SmsAnalyticsService.getWeeklySendPattern(userId); res.json(pattern); } catch (error: any) { console.error('Error fetching SMS weekly pattern:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS weekly pattern' }); }
}

export async function handleSmsCampaignMetrics(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const limit = parseInt(req.query.limit as string) || 20; const metrics = await SmsAnalyticsService.getCampaignSmsMetrics(userId, limit); res.json(metrics); } catch (error: any) { console.error('Error fetching SMS campaign metrics:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS campaign metrics' }); }
}

export async function handleSmsBestSendTimes(req: Request, res: Response) {
  try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const timezoneOffset = parseInt(req.query.timezoneOffset as string) || 0; const bestSendTimes = await AnalyticsService.getSmsBestSendTimes(userId, timezoneOffset); res.json(bestSendTimes); } catch (error: any) { console.error('Error fetching SMS best send times:', error); res.status(500).json({ error: error.message || 'Failed to fetch SMS best send times' }); }
}
