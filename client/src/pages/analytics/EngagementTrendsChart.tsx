import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Reply } from "lucide-react";
import { format } from "date-fns";
import type { EngagementTrend, SmsResponseTrendData } from "./types";

interface EmailTrendsChartProps { data?: EngagementTrend[]; isLoading: boolean }

export function EmailTrendsChart({ data, isLoading }: EmailTrendsChartProps) {
  return (
    <Card data-testid="card-engagement-trends">
      <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Email Engagement Trends (Last 30 Days)</CardTitle><CardDescription>Track opens and replies over time</CardDescription></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM d')} />
              <YAxis />
              <RechartsTooltip labelFormatter={(value) => format(new Date(value as string), 'PPP')} />
              <Legend />
              <Line type="monotone" dataKey="sends" stroke="hsl(var(--primary))" name="Sent" strokeWidth={2} />
              <Line type="monotone" dataKey="opens" stroke="hsl(142, 76%, 36%)" name="Opens" strokeWidth={2} />
              <Line type="monotone" dataKey="replies" stroke="hsl(262, 83%, 58%)" name="Replies" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground">No engagement data available yet</div>}
      </CardContent>
    </Card>
  );
}

interface SmsResponseTrendsChartProps { data?: SmsResponseTrendData[]; isLoading: boolean }

export function SmsResponseTrendsChart({ data, isLoading }: SmsResponseTrendsChartProps) {
  return (
    <Card data-testid="card-sms-response-trends">
      <CardHeader><CardTitle className="flex items-center gap-2"><Reply className="h-5 w-5" />SMS Response Rate Trends</CardTitle><CardDescription>Track how often contacts reply to your SMS messages</CardDescription></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM d')} className="text-xs" />
              <YAxis yAxisId="left" tickFormatter={(value) => `${value}`} className="text-xs" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(0)}%`} className="text-xs" />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number, name: string) => { if (name === 'responseRate') return [`${value.toFixed(1)}%`, 'Response Rate']; return [value, name === 'sent' ? 'Sent' : 'Replied']; }} labelFormatter={(date) => format(new Date(date), 'MMMM d, yyyy')} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="sent" name="Sent" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
              <Area yAxisId="left" type="monotone" dataKey="replied" name="Replied" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.2} />
              <Line yAxisId="right" type="monotone" dataKey="responseRate" name="Response Rate" stroke="hsl(280, 65%, 60%)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-[300px] flex items-center justify-center text-muted-foreground"><div className="text-center"><Reply className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No SMS response data yet</p><p className="text-sm mt-1">Send some SMS messages to start tracking responses</p></div></div>}
      </CardContent>
    </Card>
  );
}
