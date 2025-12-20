import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, CheckCircle2, AlertTriangle } from "lucide-react";
import type { SmsCampaignMetrics } from "./types";

interface SmsCampaignLeaderboardProps {
  data?: SmsCampaignMetrics[];
  isLoading: boolean;
}

export function SmsCampaignLeaderboard({ data, isLoading }: SmsCampaignLeaderboardProps) {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  if (isLoading) {
    return (
      <Card data-testid="card-sms-campaign-leaderboard">
        <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64 mt-2" /></CardHeader>
        <CardContent><div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div></CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-sms-campaign-leaderboard">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />SMS Campaign Performance</CardTitle>
            <CardDescription>Track delivery rates for your SMS campaigns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No SMS campaigns yet</p>
            <p className="text-sm mt-1">Send some SMS messages in campaigns to see their performance</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b text-xs">
              <div className="col-span-5 font-medium text-muted-foreground">Campaign</div>
              <div className="col-span-2 text-center font-medium text-muted-foreground">Sent</div>
              <div className="col-span-2 text-center font-medium text-muted-foreground">Delivered</div>
              <div className="col-span-3 text-center font-medium text-muted-foreground">Delivery Rate</div>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {data.map((campaign, index) => (
                <div key={campaign.campaignId} className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-muted/50 transition-colors items-center" data-testid={`sms-leaderboard-campaign-${campaign.campaignId}`}>
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-medium text-xs flex-shrink-0">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm" data-testid={`text-sms-leaderboard-subject-${campaign.campaignId}`}>{campaign.subject || 'Untitled Campaign'}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center"><span className="font-medium text-sm">{campaign.smsSent}</span></div>
                  <div className="col-span-2 text-center"><span className="font-medium text-sm text-green-600 dark:text-green-400">{campaign.smsDelivered}</span></div>
                  <div className="col-span-3 text-center flex items-center justify-center gap-1">
                    <span className="font-medium text-sm">{formatPercent(campaign.smsDeliveryRate)}</span>
                    {campaign.smsDeliveryRate >= 95 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    {campaign.smsDeliveryRate < 80 && campaign.smsDeliveryRate > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
