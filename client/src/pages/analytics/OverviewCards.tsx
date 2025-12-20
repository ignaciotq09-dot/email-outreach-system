import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Eye, Reply, MessageSquare, Users, CheckCircle2, Linkedin } from "lucide-react";
import type { OverviewMetrics, SmsOverviewMetrics, LinkedInOverviewMetrics, ChannelFilter } from "./types";

interface OverviewCardsProps {
  channelFilter: ChannelFilter;
  overview?: OverviewMetrics;
  smsOverview?: SmsOverviewMetrics;
  linkedinOverview?: LinkedInOverviewMetrics;
  isLoading: boolean;
  formatPercent: (value: number) => string;
}

export function OverviewCards({ channelFilter, overview, smsOverview, linkedinOverview, isLoading, formatPercent }: OverviewCardsProps) {
  if (isLoading) {
    return <>{[1, 2, 3].map((i) => <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-20" /></CardContent></Card>)}</>;
  }

  if (channelFilter === 'email') {
    return (
      <>
        <Card data-testid="card-metric-sent"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Total Sent</CardTitle><Mail className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-total-sent">{overview?.totalSent || 0}</div><p className="text-xs text-muted-foreground">Emails delivered</p></CardContent></Card>
        <Card data-testid="card-metric-opens"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Open Rate</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-open-rate">{formatPercent(overview?.openRate || 0)}</div><p className="text-xs text-muted-foreground">{overview?.uniqueOpens || 0} unique opens</p></CardContent></Card>
        <Card data-testid="card-metric-replies"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Reply Rate</CardTitle><Reply className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-reply-rate">{formatPercent(overview?.replyRate || 0)}</div><p className="text-xs text-muted-foreground">{overview?.totalReplies || 0} conversations</p></CardContent></Card>
      </>
    );
  }

  if (channelFilter === 'sms') {
    return (
      <>
        <Card data-testid="card-metric-sms-sent"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Messages Sent</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-sms-total-sent">{smsOverview?.totalSent || 0}</div><p className="text-xs text-muted-foreground">total SMS messages</p></CardContent></Card>
        <Card data-testid="card-metric-sms-delivered"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Messages Delivered</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-sms-delivered">{smsOverview?.totalDelivered || 0}</div><p className="text-xs text-muted-foreground">successfully received</p></CardContent></Card>
        <Card data-testid="card-metric-sms-response"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Response Rate</CardTitle><Reply className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-sms-response-rate">{formatPercent(smsOverview?.responseRate || 0)}</div><p className="text-xs text-muted-foreground">{smsOverview?.totalReplies || 0} replies received</p></CardContent></Card>
        <Card data-testid="card-metric-sms-optout"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Opt-Out Rate</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-sms-optout-rate">{formatPercent(smsOverview?.optOutRate || 0)}</div><p className="text-xs text-muted-foreground">{smsOverview?.totalOptOuts || 0} contacts opted out</p></CardContent></Card>
      </>
    );
  }

  if (channelFilter === 'linkedin') {
    return (
      <>
        <Card data-testid="card-metric-linkedin-sent"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Messages Sent</CardTitle><Linkedin className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-linkedin-total-sent">{linkedinOverview?.totalSent || 0}</div><p className="text-xs text-muted-foreground">{linkedinOverview?.connectionRequests || 0} connections, {linkedinOverview?.directMessages || 0} messages</p></CardContent></Card>
        <Card data-testid="card-metric-linkedin-accepted"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-linkedin-acceptance-rate">{formatPercent(linkedinOverview?.acceptanceRate || 0)}</div><p className="text-xs text-muted-foreground">{linkedinOverview?.accepted || 0} accepted</p></CardContent></Card>
        <Card data-testid="card-metric-linkedin-response"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Response Rate</CardTitle><Reply className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-linkedin-response-rate">{formatPercent(linkedinOverview?.replyRate || 0)}</div><p className="text-xs text-muted-foreground">{linkedinOverview?.replied || 0} replies received</p></CardContent></Card>
      </>
    );
  }

  return (
    <>
      <Card data-testid="card-metric-combined-sent"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Total Messages</CardTitle><div className="flex gap-1"><Mail className="h-4 w-4 text-muted-foreground" /><MessageSquare className="h-4 w-4 text-muted-foreground" /><Linkedin className="h-4 w-4 text-muted-foreground" /></div></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-combined-total">{(overview?.totalSent || 0) + (smsOverview?.totalSent || 0) + (linkedinOverview?.totalSent || 0)}</div><p className="text-xs text-muted-foreground">{overview?.totalSent || 0} emails, {smsOverview?.totalSent || 0} SMS, {linkedinOverview?.totalSent || 0} LinkedIn</p></CardContent></Card>
      <Card data-testid="card-metric-email-summary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">Email Performance</CardTitle><Mail className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-email-open-rate">{formatPercent(overview?.openRate || 0)}</div><p className="text-xs text-muted-foreground">open rate ({overview?.totalReplies || 0} replies)</p></CardContent></Card>
      <Card data-testid="card-metric-sms-summary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">SMS Performance</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-sms-summary-response">{formatPercent(smsOverview?.responseRate || 0)}</div><p className="text-xs text-muted-foreground">response rate ({smsOverview?.totalReplies || 0} replies)</p></CardContent></Card>
      <Card data-testid="card-metric-linkedin-summary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2"><CardTitle className="text-sm font-medium">LinkedIn Performance</CardTitle><Linkedin className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold" data-testid="text-linkedin-summary-response">{formatPercent(linkedinOverview?.acceptanceRate || 0)}</div><p className="text-xs text-muted-foreground">acceptance rate ({linkedinOverview?.replied || 0} replies)</p></CardContent></Card>
    </>
  );
}
