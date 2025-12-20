import { Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BestSendTimesData, HeatmapCell } from "./types";
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FULL } from "./constants";
import { formatHour, getHeatmapColor } from "./utils";

interface SendTimesHeatmapProps {
  data: BestSendTimesData;
  metricType: 'open' | 'reply';
}

export function SendTimesHeatmap({ data, metricType }: SendTimesHeatmapProps) {
  if (!data.hasEnoughData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Not Enough Data Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Send at least {data.minimumRequired} emails to see your best send times. You've sent {data.totalEmails} so far.
        </p>
        <div className="mt-4 w-full max-w-xs bg-muted/50 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (data.totalEmails / data.minimumRequired) * 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{data.totalEmails} / {data.minimumRequired} emails</p>
      </div>
    );
  }

  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  const getCellData = (day: number, hour: number): HeatmapCell | undefined => data.heatmapData.find(cell => cell.dayOfWeek === day && cell.hour === hour);
  const isBestTime = (day: number, hour: number): boolean => data.bestTimes.some(bt => bt.dayOfWeek === day && bt.hour === hour);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex">
            <div className="w-12 flex-shrink-0" />
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-muted-foreground pb-2">{formatHour(hour)}</div>
            ))}
          </div>
          
          {DAYS_OF_WEEK.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-12 flex-shrink-0 text-xs text-muted-foreground text-right pr-2">{day}</div>
              {hours.map(hour => {
                const cell = getCellData(dayIndex, hour);
                const rate = metricType === 'open' ? (cell?.openRate || 0) : (cell?.replyRate || 0);
                const hasData = cell?.hasEnoughData || false;
                const isBest = isBestTime(dayIndex, hour);
                
                return (
                  <Tooltip key={hour}>
                    <TooltipTrigger asChild>
                      <div className={`flex-1 h-8 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 relative ${getHeatmapColor(rate, hasData, metricType)}`} data-testid={`heatmap-cell-${dayIndex}-${hour}`}>
                        {isBest && data.canShowBestTimes && <Star className="absolute top-0.5 right-0.5 h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-sm">
                        <div className="font-medium">{DAYS_OF_WEEK_FULL[dayIndex]} {formatHour(hour)}</div>
                        {hasData ? (
                          <>
                            <div className="mt-1"><span className="text-muted-foreground">Open Rate:</span> <span className="font-medium">{cell?.openRate.toFixed(1)}%</span></div>
                            <div><span className="text-muted-foreground">Reply Rate:</span> <span className="font-medium">{cell?.replyRate.toFixed(1)}%</span></div>
                            <div className="text-xs text-muted-foreground mt-1">Based on {cell?.totalSent} emails</div>
                          </>
                        ) : (
                          <div className="text-muted-foreground mt-1">
                            {cell?.totalSent === 0 ? 'No emails sent at this time' : `Only ${cell?.totalSent} email${(cell?.totalSent || 0) > 1 ? 's' : ''} - need 3+ for stats`}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-2">
          <span>Low</span>
          <div className="flex gap-0.5">
            {metricType === 'open' ? (
              <><div className="w-4 h-3 rounded-sm bg-green-100" /><div className="w-4 h-3 rounded-sm bg-green-200" /><div className="w-4 h-3 rounded-sm bg-green-300" /><div className="w-4 h-3 rounded-sm bg-green-400" /><div className="w-4 h-3 rounded-sm bg-green-500" /><div className="w-4 h-3 rounded-sm bg-green-600" /></>
            ) : (
              <><div className="w-4 h-3 rounded-sm bg-purple-100" /><div className="w-4 h-3 rounded-sm bg-purple-200" /><div className="w-4 h-3 rounded-sm bg-purple-300" /><div className="w-4 h-3 rounded-sm bg-purple-400" /><div className="w-4 h-3 rounded-sm bg-purple-500" /><div className="w-4 h-3 rounded-sm bg-purple-600" /></>
            )}
          </div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-muted/30 rounded-sm" /><span>Not enough data</span>
        </div>
      </div>
      
      {data.canShowBestTimes && data.bestTimes.length > 0 && (
        <div className="mt-4 p-3 rounded-md bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /><span className="font-medium text-sm">Your Best Send Times</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {data.bestTimes.map((time, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="font-mono">#{index + 1}</Badge>
                <span>{DAYS_OF_WEEK_FULL[time.dayOfWeek]} {formatHour(time.hour)}</span>
                <span className="text-muted-foreground">({time.openRate.toFixed(0)}% opens)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
