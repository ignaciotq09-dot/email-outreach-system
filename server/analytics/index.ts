import { logSendEvent, logOpenEvent, logClickEvent, logReplyEvent, logBounceEvent } from "./event-logging";
import { updateContactEngagement, updateCampaignMetrics } from "./engagement";
import { getContactTimeline, getCampaignTimeline, getEventStats } from "./timeline";
import { recordEmailOpen, recordLinkClick } from "./tracking";
import { getOverviewMetrics } from "./dashboard";
import { getEngagementTrends, getTopCampaigns, getContactEngagement } from "./campaigns";
import { getCampaignLeaderboard } from "./leaderboard";
import { getBestSendTimes } from "./heatmap";
import { getDeliverabilityMetrics } from "./deliverability";
import { getDailyMetrics, getWeeklySendPattern, getTrendComparison } from "./trends";
import { getSmsBestSendTimes } from "./sms";
import { generateTrackingPixelId, embedTrackingPixel, wrapLinksForTracking } from "./utils";

// New analytics modules
import {
  getEngagementFunnel,
  getFunnelDropoffAnalysis,
  getReplyVelocityMetrics,
  getCampaignFunnelComparison
} from "./engagement-funnel";
import {
  classifyReply,
  getReplyQualityBreakdown,
  getReplyQualityTrends,
  getTopResponsiveContacts
} from "./reply-quality";
import {
  getAIOptimizationComparison,
  getAIPredictionAccuracy,
  getOptimizationRuleEffectiveness,
  getABTestResults,
  getAIOptimizationROI
} from "./ai-performance";

export class AnalyticsService {
  // Event logging
  static logSendEvent = logSendEvent;
  static logOpenEvent = logOpenEvent;
  static logClickEvent = logClickEvent;
  static logReplyEvent = logReplyEvent;
  static logBounceEvent = logBounceEvent;

  // Engagement
  static updateContactEngagement = updateContactEngagement;
  static updateCampaignMetrics = updateCampaignMetrics;

  // Timeline
  static getContactTimeline = getContactTimeline;
  static getCampaignTimeline = getCampaignTimeline;
  static getEventStats = getEventStats;

  // Tracking
  static recordEmailOpen = recordEmailOpen;
  static recordLinkClick = recordLinkClick;

  // Dashboard & Overview
  static getOverviewMetrics = getOverviewMetrics;
  static getEngagementTrends = getEngagementTrends;
  static getTopCampaigns = getTopCampaigns;
  static getCampaignLeaderboard = getCampaignLeaderboard;
  static getContactEngagement = getContactEngagement;
  static getBestSendTimes = getBestSendTimes;
  static getDeliverabilityMetrics = getDeliverabilityMetrics;
  static getDailyMetrics = getDailyMetrics;
  static getWeeklySendPattern = getWeeklySendPattern;
  static getTrendComparison = getTrendComparison;
  static getSmsBestSendTimes = getSmsBestSendTimes;

  // NEW: Engagement Funnel
  static getEngagementFunnel = getEngagementFunnel;
  static getFunnelDropoffAnalysis = getFunnelDropoffAnalysis;
  static getReplyVelocityMetrics = getReplyVelocityMetrics;
  static getCampaignFunnelComparison = getCampaignFunnelComparison;

  // NEW: Reply Quality
  static classifyReply = classifyReply;
  static getReplyQualityBreakdown = getReplyQualityBreakdown;
  static getReplyQualityTrends = getReplyQualityTrends;
  static getTopResponsiveContacts = getTopResponsiveContacts;

  // NEW: AI Performance
  static getAIOptimizationComparison = getAIOptimizationComparison;
  static getAIPredictionAccuracy = getAIPredictionAccuracy;
  static getOptimizationRuleEffectiveness = getOptimizationRuleEffectiveness;
  static getABTestResults = getABTestResults;
  static getAIOptimizationROI = getAIOptimizationROI;
}

export { generateTrackingPixelId, embedTrackingPixel, wrapLinksForTracking };

