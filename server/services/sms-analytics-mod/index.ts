import { getOverviewMetrics } from "./overview";
import { getEngagementTrends, getResponseTrends } from "./trends";
import { getDailyMetrics } from "./daily";
import { getDeliverabilityMetrics } from "./deliverability";
import { getCampaignSmsMetrics } from "./campaigns";
import { getVelocityMetrics, getWeeklySendPattern } from "./velocity";

export class SmsAnalyticsService {
  static getOverviewMetrics = getOverviewMetrics;
  static getEngagementTrends = getEngagementTrends;
  static getResponseTrends = getResponseTrends;
  static getDailyMetrics = getDailyMetrics;
  static getDeliverabilityMetrics = getDeliverabilityMetrics;
  static getCampaignSmsMetrics = getCampaignSmsMetrics;
  static getVelocityMetrics = getVelocityMetrics;
  static getWeeklySendPattern = getWeeklySendPattern;
}

export * from "./types";
