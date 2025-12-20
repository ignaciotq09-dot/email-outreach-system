import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import type { DeliverabilityMetrics } from "./types";

interface DeliverabilityCardProps {
  data?: DeliverabilityMetrics;
  isLoading: boolean;
}

export function DeliverabilityCard({ data, isLoading }: DeliverabilityCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="card-deliverability">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.hasEnoughData) {
    return (
      <Card data-testid="card-deliverability">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Deliverability Health
          </CardTitle>
          <CardDescription>Track your email delivery success</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Not enough data to calculate deliverability metrics</p>
            <p className="text-sm mt-1">Send at least 10 emails to see your stats</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const deliveryHealth = data.deliveryRate >= 95 ? 'Excellent' : data.deliveryRate >= 90 ? 'Good' : data.deliveryRate >= 80 ? 'Fair' : 'Needs Improvement';
  const healthColor = data.deliveryRate >= 95 ? 'text-green-600' : data.deliveryRate >= 90 ? 'text-green-600' : data.deliveryRate >= 80 ? 'text-yellow-600' : 'text-red-500';

  return (
    <Card data-testid="card-deliverability">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Deliverability Health
        </CardTitle>
        <CardDescription>Track your email delivery success and spam risk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-xs text-muted-foreground mb-1">Delivery Rate</div>
            <div className={`text-xl font-bold ${healthColor}`}>{data.deliveryRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">{deliveryHealth}</div>
          </div>
          
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-xs text-muted-foreground mb-1">Bounce Rate</div>
            <div className={`text-xl font-bold ${data.bounceRate <= 2 ? 'text-green-600' : data.bounceRate <= 5 ? 'text-yellow-600' : 'text-red-500'}`}>
              {data.bounceRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.bounces.total} total ({data.bounces.hard} hard, {data.bounces.soft} soft)
            </div>
          </div>
          
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-xs text-muted-foreground mb-1">Spam Score</div>
            <div className={`text-xl font-bold ${data.spam.averageScore <= 3 ? 'text-green-600' : data.spam.averageScore <= 6 ? 'text-yellow-600' : 'text-red-500'}`}>
              {data.spam.averageScore.toFixed(1)}/10
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.spam.lowRisk > 0 ? `${data.spam.lowRisk} low risk` : 'No spam data'}
            </div>
          </div>
          
          <div className="p-3 rounded-lg border bg-card text-center">
            <div className="text-xs text-muted-foreground mb-1">Emails Sent</div>
            <div className="text-xl font-bold">{data.totalSent}</div>
            <div className="text-xs text-muted-foreground mt-1">Total tracked</div>
          </div>
        </div>
        
        {(data.bounceRate > 5 || data.spam.highRisk > 0) && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Deliverability Warning</AlertTitle>
            <AlertDescription>
              {data.bounceRate > 5 && 'High bounce rate detected. Consider cleaning your contact list. '}
              {data.spam.highRisk > 0 && 'Some emails flagged as high spam risk. Review your email content.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
