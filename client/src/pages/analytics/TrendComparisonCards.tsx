import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Mail, Eye, Reply, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import type { TrendComparisonData, DailyMetricsData } from "./types";
import { VelocityCard } from "./VelocityCard";
import { formatDelta } from "./utils";

interface TrendComparisonCardsProps {
  data7?: TrendComparisonData;
  data30?: TrendComparisonData;
  dailyMetrics7?: DailyMetricsData;
  dailyMetrics30?: DailyMetricsData;
  isLoading: boolean;
}

function DeltaIndicator({ delta, inverse = false }: { delta: number; inverse?: boolean }) {
  const isPositive = inverse ? delta < 0 : delta > 0;
  const isNeutral = Math.abs(delta) < 0.5;
  
  if (isNeutral) return <span className="text-muted-foreground text-sm">No change</span>;
  
  return (
    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      <span>{formatDelta(Math.abs(delta))}</span>
    </div>
  );
}

export function TrendComparisonCards({ data7, data30, dailyMetrics7, dailyMetrics30, isLoading }: TrendComparisonCardsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(7);
  const data = selectedPeriod === 7 ? data7 : data30;
  const dailyMetrics = selectedPeriod === 7 ? dailyMetrics7 : dailyMetrics30;

  if (isLoading) {
    return (
      <Card data-testid="card-trend-comparison">
        <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-trend-comparison">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Performance Trends</CardTitle>
            <CardDescription>Compare your metrics vs the previous period</CardDescription>
          </div>
          <Tabs value={String(selectedPeriod)} onValueChange={(v) => setSelectedPeriod(Number(v) as 7 | 30)}>
            <TabsList>
              <TabsTrigger value="7" data-testid="tab-7-day">7 Days</TabsTrigger>
              <TabsTrigger value="30" data-testid="tab-30-day">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {!data || !data.hasPreviousPeriodData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Not enough historical data for comparison</p>
            <p className="text-sm mt-1">{selectedPeriod === 7 ? 'Need data from the past 2 weeks' : 'Need data from the past 2 months'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <VelocityCard dailyMetrics={dailyMetrics} />
            <div className="p-4 rounded-lg border bg-card" data-testid="trend-emails-sent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Emails Sent</span>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-2xl font-bold">{data.currentPeriod.totalSent}</div>
                {dailyMetrics && dailyMetrics.data.length > 0 && (
                  <div className="h-[40px] flex-1 min-w-[80px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyMetrics.data}><Line type="monotone" dataKey="totalSent" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">vs {data.previousPeriod.totalSent} last {data.periodLabel}</span>
                <DeltaIndicator delta={data.deltas.sentPercentChange} />
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-card" data-testid="trend-open-rate">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Open Rate</span>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-2xl font-bold">{data.currentPeriod.openRate.toFixed(1)}%</div>
                {dailyMetrics && dailyMetrics.data.length > 0 && (
                  <div className="h-[40px] flex-1 min-w-[80px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyMetrics.data}><Line type="monotone" dataKey="openRate" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} /></LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">vs {data.previousPeriod.openRate.toFixed(1)}% last {data.periodLabel}</span>
                <DeltaIndicator delta={data.deltas.openRate} />
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-card" data-testid="trend-reply-rate">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Reply Rate</span>
                <Reply className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-2xl font-bold">{data.currentPeriod.replyRate.toFixed(1)}%</div>
                {dailyMetrics && dailyMetrics.data.length > 0 && (
                  <div className="h-[40px] flex-1 min-w-[80px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyMetrics.data}><Line type="monotone" dataKey="replyRate" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} /></LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">vs {data.previousPeriod.replyRate.toFixed(1)}% last {data.periodLabel}</span>
                <DeltaIndicator delta={data.deltas.replyRate} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
