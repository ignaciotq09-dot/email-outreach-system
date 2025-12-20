import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Globe } from "lucide-react";
import type { BestSendTimesData, SmsBestSendTimesData, WeeklyPatternData } from "./types";
import { TIMEZONES } from "./constants";
import { SendTimesHeatmap } from "./SendTimesHeatmap";
import { SmsSendTimesHeatmap } from "./SmsSendTimesHeatmap";
import { WeeklyPatternChart } from "./VelocityCard";

interface EmailBestSendTimesCardProps {
  data?: BestSendTimesData;
  weeklyPattern?: WeeklyPatternData;
  isLoading: boolean;
  weeklyPatternLoading: boolean;
  selectedTimezone: string;
  onTimezoneChange: (value: string) => void;
  heatmapMetric: 'open' | 'reply';
  onMetricChange: (value: 'open' | 'reply') => void;
  currentTimezoneName: string;
}

export function EmailBestSendTimesCard({ data, weeklyPattern, isLoading, weeklyPatternLoading, selectedTimezone, onTimezoneChange, heatmapMetric, onMetricChange, currentTimezoneName }: EmailBestSendTimesCardProps) {
  return (
    <Card data-testid="card-best-send-times">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Best Send Times</CardTitle>
            <CardDescription>See when your emails get the most engagement</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
                <SelectTrigger className="w-[200px]" data-testid="select-timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                <SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Tabs value={heatmapMetric} onValueChange={(v) => onMetricChange(v as 'open' | 'reply')}>
              <TabsList><TabsTrigger value="open" data-testid="tab-open-rate">Open Rate</TabsTrigger><TabsTrigger value="reply" data-testid="tab-reply-rate">Reply Rate</TabsTrigger></TabsList>
            </Tabs>
          </div>
        </div>
        {selectedTimezone === 'auto' && <p className="text-xs text-muted-foreground mt-2">Showing times in {currentTimezoneName}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[280px] w-full" /> : data ? <SendTimesHeatmap data={data} metricType={heatmapMetric} /> : <div className="h-[280px] flex items-center justify-center text-muted-foreground">Unable to load heatmap data</div>}
        {weeklyPatternLoading ? <div className="mt-4 pt-4 border-t"><Skeleton className="h-[100px] w-full" /></div> : weeklyPattern ? <WeeklyPatternChart data={weeklyPattern} /> : null}
      </CardContent>
    </Card>
  );
}

interface SmsBestSendTimesCardProps {
  data?: SmsBestSendTimesData;
  isLoading: boolean;
  selectedTimezone: string;
  onTimezoneChange: (value: string) => void;
  currentTimezoneName: string;
}

export function SmsBestSendTimesCard({ data, isLoading, selectedTimezone, onTimezoneChange, currentTimezoneName }: SmsBestSendTimesCardProps) {
  return (
    <Card data-testid="card-sms-best-send-times">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Best SMS Send Times</CardTitle>
            <CardDescription>See when your SMS messages get the best delivery rates</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedTimezone} onValueChange={onTimezoneChange}>
              <SelectTrigger className="w-[200px]" data-testid="select-sms-timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
              <SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {selectedTimezone === 'auto' && <p className="text-xs text-muted-foreground mt-2">Showing times in {currentTimezoneName}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[280px] w-full" /> : data ? <SmsSendTimesHeatmap data={data} /> : <div className="h-[280px] flex items-center justify-center text-muted-foreground"><div className="text-center"><Clock className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No SMS send time data yet</p><p className="text-sm mt-1">Send some SMS messages to start seeing optimal times</p></div></div>}
      </CardContent>
    </Card>
  );
}
