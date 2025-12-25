import type { Contact } from "@shared/schema";

export type ChannelFilter = 'email' | 'sms' | 'both';
export type SortField = 'sent' | 'openRate' | 'replyRate' | 'date';
export type SortOrder = 'asc' | 'desc';

export interface SmsOverviewMetrics {
  totalSent: number;
  totalDelivered: number;
  responseRate: number;
  optOutRate: number;
  totalOptOuts: number;
  totalReplies: number;
}

export interface SmsTrendData {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface SmsResponseTrendData {
  date: string;
  sent: number;
  replied: number;
  responseRate: number;
}

export interface SmsCampaignMetrics {
  campaignId: number;
  subject: string;
  smsSent: number;
  smsDelivered: number;
  smsFailed: number;
  smsDeliveryRate: number;
}

export interface TrackingInfo {
  withTracking: number;
  withoutTracking: number;
  trackingCoveragePercent: number;
}

export interface OverviewMetrics {
  totalSent: number;
  uniqueOpens: number;
  totalOpens: number;
  uniqueClicks: number;
  totalClicks: number;
  totalReplies: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  tracking: TrackingInfo;
}

export interface EngagementTrend {
  date: string;
  sends: number;
  opens: number;
  clicks: number;
  replies: number;
}

export interface TopCampaign {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
  totalSent: number;
  totalOpened: number;
  totalClicks: number;
  totalReplies: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

export interface ContactEngagement {
  id: number;
  name: string;
  email: string;
  company: string | null;
  engagementScore: number;
  totalSent: number;
  totalOpened: number;
  totalClicks: number;
  totalReplies: number;
  lastEngaged: string | null;
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  openRate: number;
  replyRate: number;
  hasEnoughData: boolean;
}

export interface BestTime {
  dayOfWeek: number;
  hour: number;
  openRate: number;
  replyRate: number;
  totalSent: number;
}

export interface BestSendTimesData {
  hasEnoughData: boolean;
  totalEmails: number;
  minimumRequired: number;
  heatmapData: HeatmapCell[];
  bestTimes: BestTime[];
  canShowBestTimes: boolean;
  averages?: { openRate: number; replyRate: number };
}

export interface SmsHeatmapCell {
  dayOfWeek: number;
  hour: number;
  totalSent: number;
  totalDelivered: number;
  deliveryRate: number;
  hasEnoughData: boolean;
}

export interface SmsBestTime {
  dayOfWeek: number;
  hour: number;
  deliveryRate: number;
  totalSent: number;
}

export interface SmsBestSendTimesData {
  hasEnoughData: boolean;
  totalMessages: number;
  minimumRequired: number;
  heatmapData: SmsHeatmapCell[];
  bestTimes: SmsBestTime[];
  canShowBestTimes: boolean;
  averages?: { deliveryRate: number };
}


export interface TrendPeriod {
  startDate: string;
  endDate: string;
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  openRate: number;
  replyRate: number;
}

export interface TrendComparisonData {
  period: number;
  periodLabel: string;
  currentPeriod: TrendPeriod;
  previousPeriod: TrendPeriod;
  deltas: { openRate: number; replyRate: number; sent: number; sentPercentChange: number };
  hasPreviousPeriodData: boolean;
}

export interface LeaderboardCampaign {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
  totalSent: number;
  totalOpened: number;
  totalReplies: number;
  openRate: number;
  replyRate: number;
  openRatePerformance: number | null;
  replyRatePerformance: number | null;
  isAboveAverageOpen: boolean;
  isAboveAverageReply: boolean;
  hasValidOpenComparison: boolean;
  hasValidReplyComparison: boolean;
}

export interface CampaignLeaderboardData {
  campaigns: LeaderboardCampaign[];
  averages: { openRate: number; replyRate: number };
  total: number;
}

export interface WeeklyPatternData {
  weeks: {
    week: number;
    weekLabel: string;
    weekStart: string;
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    openRate: number;
    replyRate: number;
  }[];
  averageSentPerWeek: number;
  trendDirection: 'up' | 'down' | 'stable';
  totalWeeks: number;
}

export interface DailyMetricsData {
  days: number;
  data: {
    date: string;
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    openRate: number;
    replyRate: number;
  }[];
}

export interface DeliverabilityMetrics {
  totalSent: number;
  deliveryRate: number;
  bounceRate: number;
  bounces: { total: number; hard: number; soft: number };
  spam: { averageScore: number; lowRisk: number; mediumRisk: number; highRisk: number };
  hasEnoughData: boolean;
}

// NEW: Engagement Funnel Types
export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface EngagementFunnelData {
  stages: FunnelStage[];
  conversionRates: {
    sentToOpened: number;
    openedToClicked: number;
    openedToReplied: number;
    clickedToReplied: number;
    sentToReplied: number;
  };
  totalSent: number;
  hasEnoughData: boolean;
}

export interface DropoffAnalysis {
  stage: string;
  dropoffCount: number;
  dropoffPercentage: number;
  recommendation: string;
}

export interface ReplyVelocityMetrics {
  averageHoursToReply: number;
  medianHoursToReply: number;
  fastestReplyHours: number;
  slowestReplyHours: number;
  repliesByTimeframe: {
    within1Hour: number;
    within24Hours: number;
    within3Days: number;
    after3Days: number;
  };
}

// NEW: Reply Quality Types
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

// NEW: AI Performance Types
export interface AIComparisonData {
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

export interface AIPredictionAccuracy {
  totalPredictions: number;
  averageOpenRateError: number;
  averageReplyRateError: number;
  accuracyScore: number;
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

export interface AIOptimizationROI {
  totalEmailsOptimized: number;
  estimatedExtraReplies: number;
  optimizationValue: string;
  topInsights: string[];
}

