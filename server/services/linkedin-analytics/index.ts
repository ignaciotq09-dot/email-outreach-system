import { getOverviewMetrics } from "./overview";
import { getEngagementTrends, getTrendComparison } from "./trends";
import { getBestSendTimes, getWeeklySendPattern } from "./send-times";
import { getCampaignMetrics } from "./campaigns";
import { getDailyMetrics } from "./daily";

export class LinkedInAnalyticsService {
  static getOverviewMetrics = getOverviewMetrics;
  static getEngagementTrends = getEngagementTrends;
  static getTrendComparison = getTrendComparison;
  static getBestSendTimes = getBestSendTimes;
  static getWeeklySendPattern = getWeeklySendPattern;
  static getCampaignMetrics = getCampaignMetrics;
  static getDailyMetrics = getDailyMetrics;
}

export default LinkedInAnalyticsService;
