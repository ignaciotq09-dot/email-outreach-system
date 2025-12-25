import { useQuery } from "@tanstack/react-query";
import type {
  OverviewMetrics, EngagementTrend, TopCampaign, ContactEngagement, BestSendTimesData,
  WeeklyPatternData, DeliverabilityMetrics, DailyMetricsData, TrendComparisonData,
  CampaignLeaderboardData, SmsOverviewMetrics, SmsResponseTrendData, SmsCampaignMetrics,
  SmsBestSendTimesData, ChannelFilter, SortField, SortOrder,
  // New types for advanced analytics
  EngagementFunnelData, DropoffAnalysis, ReplyVelocityMetrics,
  ReplyQualityBreakdown, ReplyQualityTrend,
  AIComparisonData, AIPredictionAccuracy, RuleEffectiveness, ABTestSummary, AIOptimizationROI
} from "../types";

interface UseEmailQueriesParams { enabled: boolean; timezoneOffset: number; leaderboardSortBy: SortField; leaderboardSortOrder: SortOrder }

export function useEmailQueries({ enabled, timezoneOffset, leaderboardSortBy, leaderboardSortOrder }: UseEmailQueriesParams) {
  const overview = useQuery<OverviewMetrics>({ queryKey: ["/api/analytics/overview"], enabled });
  const trends = useQuery<EngagementTrend[]>({ queryKey: ["/api/analytics/engagement-trends"], enabled });
  const topCampaigns = useQuery<TopCampaign[]>({ queryKey: ["/api/analytics/top-campaigns"], enabled });
  const contactEngagement = useQuery<ContactEngagement[]>({ queryKey: ["/api/analytics/contact-engagement"], enabled });

  const bestSendTimes = useQuery<BestSendTimesData>({
    queryKey: ["/api/analytics/best-send-times", timezoneOffset],
    queryFn: async () => { const res = await fetch(`/api/analytics/best-send-times?timezoneOffset=${timezoneOffset}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const weeklyPattern = useQuery<WeeklyPatternData>({ queryKey: ["/api/analytics/weekly-pattern"], staleTime: 60 * 60 * 1000, enabled });
  const deliverability = useQuery<DeliverabilityMetrics>({ queryKey: ["/api/analytics/deliverability"], staleTime: 60 * 60 * 1000, enabled });

  const dailyMetrics7 = useQuery<DailyMetricsData>({
    queryKey: ["/api/analytics/daily-metrics", 7],
    queryFn: async () => { const res = await fetch('/api/analytics/daily-metrics?days=7'); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const dailyMetrics30 = useQuery<DailyMetricsData>({
    queryKey: ["/api/analytics/daily-metrics", 30],
    queryFn: async () => { const res = await fetch('/api/analytics/daily-metrics?days=30'); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const trend7 = useQuery<TrendComparisonData>({ queryKey: ["/api/analytics/trend-comparison", 7], staleTime: 60 * 60 * 1000, enabled });
  const trend30 = useQuery<TrendComparisonData>({ queryKey: ["/api/analytics/trend-comparison", 30], staleTime: 60 * 60 * 1000, enabled });

  const campaignLeaderboard = useQuery<CampaignLeaderboardData>({
    queryKey: [`/api/analytics/campaign-leaderboard?sortBy=${leaderboardSortBy}&sortOrder=${leaderboardSortOrder}`],
    staleTime: 60 * 60 * 1000, enabled,
  });

  return { overview, trends, topCampaigns, contactEngagement, bestSendTimes, weeklyPattern, deliverability, dailyMetrics7, dailyMetrics30, trend7, trend30, campaignLeaderboard };
}

export function useSmsQueries({ enabled, timezoneOffset }: { enabled: boolean; timezoneOffset: number }) {
  const smsOverview = useQuery<SmsOverviewMetrics>({ queryKey: ["/api/analytics/sms/overview"], staleTime: 60 * 60 * 1000, enabled });
  const smsResponseTrends = useQuery<SmsResponseTrendData[]>({ queryKey: ["/api/analytics/sms/response-trends"], staleTime: 60 * 60 * 1000, enabled });
  const smsCampaignMetrics = useQuery<SmsCampaignMetrics[]>({ queryKey: ["/api/analytics/sms/campaign-metrics"], staleTime: 60 * 60 * 1000, enabled });

  const smsBestSendTimes = useQuery<SmsBestSendTimesData>({
    queryKey: ["/api/analytics/sms/best-send-times", timezoneOffset],
    queryFn: async () => { const res = await fetch(`/api/analytics/sms/best-send-times?timezoneOffset=${timezoneOffset}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  return { smsOverview, smsResponseTrends, smsCampaignMetrics, smsBestSendTimes };
}

// NEW: Engagement Funnel Queries
export function useEngagementFunnelQueries({ enabled, days = 30 }: { enabled: boolean; days?: number }) {
  const funnel = useQuery<EngagementFunnelData>({
    queryKey: ["/api/analytics/funnel", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/funnel?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const dropoff = useQuery<DropoffAnalysis[]>({
    queryKey: ["/api/analytics/funnel/dropoff", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/funnel/dropoff?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const velocity = useQuery<ReplyVelocityMetrics>({
    queryKey: ["/api/analytics/funnel/velocity", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/funnel/velocity?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  return { funnel, dropoff, velocity };
}

// NEW: Reply Quality Queries
export function useReplyQualityQueries({ enabled, days = 30 }: { enabled: boolean; days?: number }) {
  const quality = useQuery<ReplyQualityBreakdown>({
    queryKey: ["/api/analytics/replies/quality", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/replies/quality?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const trends = useQuery<ReplyQualityTrend[]>({
    queryKey: ["/api/analytics/replies/trends", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/replies/trends?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  return { quality, trends };
}

// NEW: AI Performance Queries
export function useAIPerformanceQueries({ enabled, days = 30 }: { enabled: boolean; days?: number }) {
  const comparison = useQuery<AIComparisonData>({
    queryKey: ["/api/analytics/ai/comparison", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/ai/comparison?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const accuracy = useQuery<AIPredictionAccuracy>({
    queryKey: ["/api/analytics/ai/accuracy", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/ai/accuracy?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const rules = useQuery<RuleEffectiveness[]>({
    queryKey: ["/api/analytics/ai/rules", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/ai/rules?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  const abTests = useQuery<ABTestSummary[]>({
    queryKey: ["/api/analytics/ai/ab-tests"],
    staleTime: 60 * 60 * 1000, enabled,
  });

  const roi = useQuery<AIOptimizationROI>({
    queryKey: ["/api/analytics/ai/roi", days],
    queryFn: async () => { const res = await fetch(`/api/analytics/ai/roi?days=${days}`); if (!res.ok) throw new Error('Failed'); return res.json(); },
    staleTime: 60 * 60 * 1000, enabled,
  });

  return { comparison, accuracy, rules, abTests, roi };
}
