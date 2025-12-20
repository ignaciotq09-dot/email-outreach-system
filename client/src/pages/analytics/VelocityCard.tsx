import { Zap, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import type { DailyMetricsData, WeeklyPatternData } from "./types";

interface VelocityCardProps {
  dailyMetrics?: DailyMetricsData;
  weeklyPattern?: WeeklyPatternData;
}

export function VelocityCard({ dailyMetrics, weeklyPattern }: VelocityCardProps) {
  if (!dailyMetrics || !dailyMetrics.data.length) return null;

  const totalSent = dailyMetrics.data.reduce((sum, d) => sum + d.totalSent, 0);
  const avgPerDay = totalSent / dailyMetrics.days;
  const lastDaySent = dailyMetrics.data[dailyMetrics.data.length - 1]?.totalSent || 0;
  
  const velocityTrend = lastDaySent > avgPerDay ? 'up' : lastDaySent < avgPerDay ? 'down' : 'stable';
  const TrendIcon = velocityTrend === 'up' ? ArrowUp : velocityTrend === 'down' ? ArrowDown : null;

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Send Velocity</span>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">{avgPerDay.toFixed(1)}</div>
        <span className="text-sm text-muted-foreground">emails/day</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground">{totalSent} sent in last {dailyMetrics.days} days</span>
        {TrendIcon && (
          <div className={`flex items-center gap-1 text-xs ${velocityTrend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{velocityTrend === 'up' ? 'Speeding up' : 'Slowing down'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface WeeklyPatternChartProps {
  data: WeeklyPatternData;
}

export function WeeklyPatternChart({ data }: WeeklyPatternChartProps) {
  if (data.weeks.length === 0) {
    return <div className="text-center py-4 text-muted-foreground text-sm">No send data from the last 4 weeks</div>;
  }

  const TrendIcon = data.trendDirection === 'up' ? ArrowUp : data.trendDirection === 'down' ? ArrowDown : null;

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Weekly Send Volume</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Avg: {data.averageSentPerWeek}/week</span>
          {TrendIcon && (
            <Badge variant="secondary" className={`text-xs ${data.trendDirection === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {data.trendDirection === 'up' ? 'Trending up' : 'Trending down'}
            </Badge>
          )}
        </div>
      </div>
      <div className="h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.weeks} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Bar dataKey="totalSent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const week = payload[0].payload;
                return (
                  <div className="bg-popover border rounded-md shadow-md p-2 text-xs">
                    <div className="font-medium">{week.weekLabel}</div>
                    <div className="text-muted-foreground">{week.totalSent} emails sent</div>
                    <div className="text-muted-foreground">{week.openRate.toFixed(1)}% open rate</div>
                  </div>
                );
              }}
            />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
