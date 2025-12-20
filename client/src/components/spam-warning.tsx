import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

interface SpamWarningProps {
  subject: string;
  body: string;
  enabled?: boolean;
}

interface SpamIssue {
  category: 'keywords' | 'links' | 'formatting' | 'structure' | 'sender';
  severity: 'low' | 'medium' | 'high';
  message: string;
  points: number;
}

interface SpamCheckResult {
  score: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  issues: SpamIssue[];
  recommendations: string[];
}

const RISK_CONFIG = {
  low: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    title: 'Low Spam Risk',
    message: 'Your email looks good! Low risk of being marked as spam.'
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    title: 'Medium Spam Risk',
    message: 'Your email has some spam indicators. Review recommendations below.'
  },
  high: {
    icon: XCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    title: 'High Spam Risk',
    message: 'Warning: Your email is likely to be flagged as spam.'
  },
  critical: {
    icon: AlertOctagon,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    title: 'Critical Spam Risk',
    message: 'Critical: This email will almost certainly be marked as spam!'
  }
};

export default function SpamWarning({ subject, body, enabled = true }: SpamWarningProps) {
  const { data: spamCheck, isLoading } = useQuery<SpamCheckResult>({
    queryKey: ['/api/deliverability/check-spam', subject, body],
    queryFn: async () => {
      return apiRequest<SpamCheckResult>('POST', '/api/deliverability/check-spam', {
        subject,
        body
      });
    },
    enabled: enabled && subject.length > 0 && body.length > 0,
    refetchOnWindowFocus: false,
    retry: false
  });

  if (!enabled || !subject || !body) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground" data-testid="spam-check-loading">
        Checking spam score...
      </div>
    );
  }

  if (!spamCheck) {
    return null;
  }

  const config = RISK_CONFIG[spamCheck.risk];
  const Icon = config.icon;

  // Only show if there's a risk
  if (spamCheck.risk === 'low' && spamCheck.issues.length === 0) {
    return null;
  }

  return (
    <Alert 
      className={`${config.bgColor} ${config.borderColor} border`}
      data-testid="spam-warning-alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.color} mt-0.5`} data-testid="spam-risk-icon" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTitle className="mb-0">{config.title}</AlertTitle>
            <Badge variant={spamCheck.risk === 'low' ? 'secondary' : 'destructive'} data-testid="spam-score-badge">
              Score: {spamCheck.score}
            </Badge>
          </div>
          <AlertDescription className="text-sm">
            {config.message}
          </AlertDescription>

          {spamCheck.issues.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium">Issues found:</p>
              <ul className="text-sm space-y-1 list-disc list-inside" data-testid="spam-issues-list">
                {spamCheck.issues.map((issue, idx) => (
                  <li key={idx} className="text-muted-foreground" data-testid={`spam-issue-${idx}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {spamCheck.recommendations.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium">Recommendations:</p>
              <ul className="text-sm space-y-1 list-disc list-inside" data-testid="spam-recommendations-list">
                {spamCheck.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-muted-foreground" data-testid={`spam-recommendation-${idx}`}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
