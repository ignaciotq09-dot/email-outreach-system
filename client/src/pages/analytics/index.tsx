import { useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Info, Linkedin } from "lucide-react";
import type { ChannelFilter, SortField, SortOrder } from "./types";
import { TIMEZONES } from "./constants";
import { useEmailQueries, useSmsQueries, useLinkedinQueries, useEngagementFunnelQueries, useReplyQualityQueries, useAIPerformanceQueries } from "./hooks/useAnalyticsQueries";
import { OverviewCards } from "./OverviewCards";
import { TrendComparisonCards } from "./TrendComparisonCards";
import { DeliverabilityCard } from "./DeliverabilityCard";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { SmsCampaignLeaderboard } from "./SmsCampaignLeaderboard";
import { EmailBestSendTimesCard, SmsBestSendTimesCard } from "./BestSendTimesCard";
import { EmailTrendsChart, SmsResponseTrendsChart, LinkedInTrendsChart } from "./EngagementTrendsChart";
import { ContactEngagementCard } from "./ContactEngagementCard";
import { EngagementFunnelCard } from "./EngagementFunnelCard";
import { AIPerformanceCard } from "./AIPerformanceCard";
import { ReplyQualityCard } from "./ReplyQualityCard";

export default function AnalyticsPage() {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('email');
  const [heatmapMetric, setHeatmapMetric] = useState<'open' | 'reply'>('open');
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<SortField>('openRate');
  const [leaderboardSortOrder, setLeaderboardSortOrder] = useState<SortOrder>('desc');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('auto');
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [leaderboardStatusFilter, setLeaderboardStatusFilter] = useState<'all' | 'active' | 'draft' | 'completed'>('all');

  const timezoneOffset = useMemo(() => selectedTimezone === 'auto' ? new Date().getTimezoneOffset() : parseInt(selectedTimezone), [selectedTimezone]);
  const currentTimezoneName = useMemo(() => {
    if (selectedTimezone === 'auto') { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'Local Time'; } }
    return TIMEZONES.find(tz => tz.value === selectedTimezone)?.label || 'Unknown';
  }, [selectedTimezone]);

  const emailQueries = useEmailQueries({ enabled: channelFilter !== 'sms' && channelFilter !== 'linkedin', timezoneOffset, leaderboardSortBy, leaderboardSortOrder });
  const smsQueries = useSmsQueries({ enabled: channelFilter !== 'email' && channelFilter !== 'linkedin', timezoneOffset });
  const linkedinQueries = useLinkedinQueries({ enabled: channelFilter === 'linkedin' || channelFilter === 'both', timezoneOffset });

  // NEW: Advanced analytics queries
  const funnelQueries = useEngagementFunnelQueries({ enabled: channelFilter === 'email' });
  const replyQualityQueries = useReplyQualityQueries({ enabled: channelFilter === 'email' });
  const aiPerformanceQueries = useAIPerformanceQueries({ enabled: channelFilter === 'email' });

  const handleLeaderboardSort = (field: SortField) => {
    if (field === leaderboardSortBy) setLeaderboardSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    else { setLeaderboardSortBy(field); setLeaderboardSortOrder('desc'); }
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-analytics-title">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track {channelFilter === 'email' ? 'email' : channelFilter === 'sms' ? 'SMS' : channelFilter === 'linkedin' ? 'LinkedIn' : 'all channel'} performance and engagement metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Channel:</span>
            <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilter)}>
              <TabsList data-testid="tabs-channel-filter">
                <TabsTrigger value="email" data-testid="tab-email" className="gap-1.5"><Mail className="h-4 w-4" />Email</TabsTrigger>
                <TabsTrigger value="sms" data-testid="tab-sms" className="gap-1.5"><MessageSquare className="h-4 w-4" />SMS</TabsTrigger>
                <TabsTrigger value="linkedin" data-testid="tab-linkedin" className="gap-1.5"><Linkedin className="h-4 w-4" />LinkedIn</TabsTrigger>
                <TabsTrigger value="both" data-testid="tab-both" className="gap-1.5">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {channelFilter === 'email' && emailQueries.overview.data?.tracking && emailQueries.overview.data.tracking.withoutTracking > 0 && (
          <Alert data-testid="alert-tracking-coverage">
            <Info className="h-4 w-4" />
            <AlertTitle>Tracking Data Notice</AlertTitle>
            <AlertDescription className="flex items-center gap-2 flex-wrap">
              <span>{emailQueries.overview.data.tracking.withTracking.toLocaleString()} of {emailQueries.overview.data.totalSent.toLocaleString()} emails have tracking enabled ({formatPercent(emailQueries.overview.data.tracking.trackingCoveragePercent)} coverage).</span>
              <Badge variant="secondary" data-testid="badge-legacy-emails">{emailQueries.overview.data.tracking.withoutTracking.toLocaleString()} legacy emails (no tracking data)</Badge>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <OverviewCards channelFilter={channelFilter} overview={emailQueries.overview.data} smsOverview={smsQueries.smsOverview.data} linkedinOverview={linkedinQueries.linkedinOverview.data} isLoading={channelFilter === 'email' ? emailQueries.overview.isLoading : channelFilter === 'sms' ? smsQueries.smsOverview.isLoading : linkedinQueries.linkedinOverview.isLoading} formatPercent={formatPercent} />
        </div>

        {channelFilter === 'email' && <TrendComparisonCards data7={emailQueries.trend7.data} data30={emailQueries.trend30.data} dailyMetrics7={emailQueries.dailyMetrics7.data} dailyMetrics30={emailQueries.dailyMetrics30.data} isLoading={emailQueries.trend7.isLoading || emailQueries.trend30.isLoading || emailQueries.dailyMetrics7.isLoading || emailQueries.dailyMetrics30.isLoading} />}
        {channelFilter === 'email' && <DeliverabilityCard data={emailQueries.deliverability.data} isLoading={emailQueries.deliverability.isLoading} />}

        {/* NEW: Advanced Analytics Section */}
        {channelFilter === 'email' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EngagementFunnelCard
              funnel={funnelQueries.funnel.data}
              dropoff={funnelQueries.dropoff.data}
              velocity={funnelQueries.velocity.data}
              isLoading={funnelQueries.funnel.isLoading || funnelQueries.dropoff.isLoading || funnelQueries.velocity.isLoading}
            />
            <AIPerformanceCard
              comparison={aiPerformanceQueries.comparison.data}
              accuracy={aiPerformanceQueries.accuracy.data}
              rules={aiPerformanceQueries.rules.data}
              roi={aiPerformanceQueries.roi.data}
              isLoading={aiPerformanceQueries.comparison.isLoading || aiPerformanceQueries.accuracy.isLoading}
            />
          </div>
        )}

        {channelFilter === 'email' && (
          <ReplyQualityCard
            quality={replyQualityQueries.quality.data}
            trends={replyQualityQueries.trends.data}
            isLoading={replyQualityQueries.quality.isLoading || replyQualityQueries.trends.isLoading}
          />
        )}

        {(channelFilter === 'sms' || channelFilter === 'both') && <SmsResponseTrendsChart data={smsQueries.smsResponseTrends.data} isLoading={smsQueries.smsResponseTrends.isLoading} />}
        {(channelFilter === 'linkedin' || channelFilter === 'both') && <LinkedInTrendsChart data={linkedinQueries.linkedinTrends.data} isLoading={linkedinQueries.linkedinTrends.isLoading} />}

        {channelFilter === 'sms' && <SmsBestSendTimesCard data={smsQueries.smsBestSendTimes.data} isLoading={smsQueries.smsBestSendTimes.isLoading} selectedTimezone={selectedTimezone} onTimezoneChange={setSelectedTimezone} currentTimezoneName={currentTimezoneName} />}
        {channelFilter === 'email' && <EmailBestSendTimesCard data={emailQueries.bestSendTimes.data} weeklyPattern={emailQueries.weeklyPattern.data} isLoading={emailQueries.bestSendTimes.isLoading} weeklyPatternLoading={emailQueries.weeklyPattern.isLoading} selectedTimezone={selectedTimezone} onTimezoneChange={setSelectedTimezone} heatmapMetric={heatmapMetric} onMetricChange={setHeatmapMetric} currentTimezoneName={currentTimezoneName} />}
        {channelFilter === 'email' && <EmailTrendsChart data={emailQueries.trends.data} isLoading={emailQueries.trends.isLoading} />}

        {(channelFilter === 'email' || channelFilter === 'both') && <CampaignLeaderboard data={emailQueries.campaignLeaderboard.data} isLoading={emailQueries.campaignLeaderboard.isLoading} sortBy={leaderboardSortBy} sortOrder={leaderboardSortOrder} onSort={handleLeaderboardSort} searchQuery={leaderboardSearch} onSearchChange={setLeaderboardSearch} statusFilter={leaderboardStatusFilter} onStatusFilterChange={setLeaderboardStatusFilter} />}
        {(channelFilter === 'sms' || channelFilter === 'both') && <SmsCampaignLeaderboard data={smsQueries.smsCampaignMetrics.data} isLoading={smsQueries.smsCampaignMetrics.isLoading} />}

        {channelFilter === 'email' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContactEngagementCard data={emailQueries.contactEngagement.data} isLoading={emailQueries.contactEngagement.isLoading} />
          </div>
        )}
      </div>
    </div>
  );
}

