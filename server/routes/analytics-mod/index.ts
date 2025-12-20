import type { Express } from "express";
import { requireAuth } from "../../auth/middleware";
import { handleOverview, handleEngagementTrends, handleTopCampaigns, handleContactEngagement, handleBestSendTimes, handleDeliverability, handleDailyMetrics, handleVelocity, handleTrendComparison, handleCampaignLeaderboard } from "./email-analytics";
import { handleSmsOverview, handleSmsTrends, handleSmsResponseTrends, handleSmsDailyMetrics, handleSmsDeliverability, handleSmsVelocity, handleSmsWeeklyPattern, handleSmsCampaignMetrics, handleSmsBestSendTimes } from "./sms-analytics";
import {
  handleEngagementFunnel, handleFunnelDropoff, handleReplyVelocity, handleCampaignFunnelComparison,
  handleReplyQualityBreakdown, handleReplyQualityTrends, handleTopResponsiveContacts,
  handleAIComparison, handleAIPredictionAccuracy, handleOptimizationRuleEffectiveness, handleABTestResults, handleAIOptimizationROI
} from "./advanced-analytics";

export function registerAnalyticsRoutes(app: Express) {
  // Existing email analytics
  app.get("/api/analytics/overview", requireAuth, handleOverview);
  app.get("/api/analytics/engagement-trends", requireAuth, handleEngagementTrends);
  app.get("/api/analytics/top-campaigns", requireAuth, handleTopCampaigns);
  app.get("/api/analytics/contact-engagement", requireAuth, handleContactEngagement);
  app.get("/api/analytics/best-send-times", requireAuth, handleBestSendTimes);
  app.get("/api/analytics/deliverability", requireAuth, handleDeliverability);
  app.get("/api/analytics/daily-metrics", requireAuth, handleDailyMetrics);
  app.get("/api/analytics/velocity", requireAuth, handleVelocity);
  app.get("/api/analytics/trend-comparison", requireAuth, handleTrendComparison);
  app.get("/api/analytics/campaign-leaderboard", requireAuth, handleCampaignLeaderboard);

  // SMS analytics
  app.get("/api/analytics/sms/overview", requireAuth, handleSmsOverview);
  app.get("/api/analytics/sms/trends", requireAuth, handleSmsTrends);
  app.get("/api/analytics/sms/response-trends", requireAuth, handleSmsResponseTrends);
  app.get("/api/analytics/sms/daily-metrics", requireAuth, handleSmsDailyMetrics);
  app.get("/api/analytics/sms/deliverability", requireAuth, handleSmsDeliverability);
  app.get("/api/analytics/sms/velocity", requireAuth, handleSmsVelocity);
  app.get("/api/analytics/sms/weekly-pattern", requireAuth, handleSmsWeeklyPattern);
  app.get("/api/analytics/sms/campaign-metrics", requireAuth, handleSmsCampaignMetrics);
  app.get("/api/analytics/sms/best-send-times", requireAuth, handleSmsBestSendTimes);

  // NEW: Engagement Funnel analytics
  app.get("/api/analytics/funnel", requireAuth, handleEngagementFunnel);
  app.get("/api/analytics/funnel/dropoff", requireAuth, handleFunnelDropoff);
  app.get("/api/analytics/funnel/velocity", requireAuth, handleReplyVelocity);
  app.get("/api/analytics/funnel/campaigns", requireAuth, handleCampaignFunnelComparison);

  // NEW: Reply Quality analytics
  app.get("/api/analytics/replies/quality", requireAuth, handleReplyQualityBreakdown);
  app.get("/api/analytics/replies/trends", requireAuth, handleReplyQualityTrends);
  app.get("/api/analytics/replies/top-contacts", requireAuth, handleTopResponsiveContacts);

  // NEW: AI Performance analytics
  app.get("/api/analytics/ai/comparison", requireAuth, handleAIComparison);
  app.get("/api/analytics/ai/accuracy", requireAuth, handleAIPredictionAccuracy);
  app.get("/api/analytics/ai/rules", requireAuth, handleOptimizationRuleEffectiveness);
  app.get("/api/analytics/ai/ab-tests", requireAuth, handleABTestResults);
  app.get("/api/analytics/ai/roi", requireAuth, handleAIOptimizationROI);
}

