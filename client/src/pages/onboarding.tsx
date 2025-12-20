// Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Mail, Sparkles, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();

  // Check Gmail connection status
  const { data: gmailStatus } = useQuery<{ connected: boolean; email: string | null }>({
    queryKey: ['/api/connect/gmail/status'],
  });

  // Check Outlook connection status
  const { data: outlookStatus } = useQuery<{ connected: boolean; email: string | null }>({
    queryKey: ['/api/connect/outlook/status'],
  });

  // Check Yahoo connection status
  const { data: yahooStatus } = useQuery<{ connected: boolean; email: string | null }>({
    queryKey: ['/api/connect/yahoo/status'],
  });

  // Check OpenAI connection status
  const { data: openaiStatus } = useQuery<{ connected: boolean; model: string | null }>({
    queryKey: ['/api/openai/status'],
  });

  const gmailConnected = gmailStatus?.connected ?? false;
  const outlookConnected = outlookStatus?.connected ?? false;
  const yahooConnected = yahooStatus?.connected ?? false;
  const emailConnected = gmailConnected || outlookConnected || yahooConnected;
  const openaiConnected = openaiStatus?.connected ?? false;
  const allComplete = emailConnected && openaiConnected;

  // Auto-redirect when both integrations are complete
  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => {
        setLocation('/app');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-4">
              Welcome! Let's Get Started
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect your accounts to unlock the full power of AI-driven email outreach
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-6">
            {/* Email Provider Integration */}
            <Card className={emailConnected ? "border-status-green" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {emailConnected ? (
                      <CheckCircle2 className="w-6 h-6 text-status-green" data-testid="icon-email-complete" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" data-testid="icon-email-incomplete" />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Connect Email Provider
                      </CardTitle>
                      <CardDescription>
                        {emailConnected 
                          ? "Email provider connected successfully!" 
                          : "Choose Gmail, Outlook, or Yahoo to send emails"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {emailConnected ? (
                  <div className="flex items-center gap-2 text-sm text-status-green">
                    <CheckCircle2 className="w-4 h-4" />
                    <span data-testid="text-email-status">
                      Connected: {gmailConnected ? `Gmail (${gmailStatus?.email})` : outlookConnected ? `Outlook (${outlookStatus?.email})` : `Yahoo (${yahooStatus?.email})`}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect your email account to send and track emails through the platform.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button 
                        className="w-full"
                        data-testid="button-connect-gmail"
                        onClick={() => window.location.href = '/api/connect/gmail'}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Connect Gmail
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        data-testid="button-connect-outlook"
                        onClick={() => window.location.href = '/api/connect/outlook'}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Connect Outlook
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        data-testid="button-connect-yahoo"
                        onClick={() => window.location.href = '/api/connect/yahoo'}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Connect Yahoo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OpenAI Integration */}
            <Card className={openaiConnected ? "border-status-green" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {openaiConnected ? (
                      <CheckCircle2 className="w-6 h-6 text-status-green" data-testid="icon-openai-complete" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" data-testid="icon-openai-incomplete" />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Connect OpenAI
                      </CardTitle>
                      <CardDescription>
                        {openaiConnected 
                          ? "OpenAI connected successfully!" 
                          : "Generate AI-powered personalized content"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {openaiConnected ? (
                  <div className="flex items-center gap-2 text-sm text-status-green">
                    <CheckCircle2 className="w-4 h-4" />
                    <span data-testid="text-openai-status">Connected: {openaiStatus?.model}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connect OpenAI to generate personalized email variants and content.
                    </p>
                    <Button 
                      className="w-full sm:w-auto"
                      data-testid="button-connect-openai"
                      onClick={() => window.location.href = '/api/connections/openai/setup'}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Connect OpenAI
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Completion Message */}
          {allComplete && (
            <Card className="mt-8 border-status-green bg-status-green/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-status-green" />
                    <div>
                      <p className="font-semibold text-foreground">All set!</p>
                      <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation('/app')}
                    data-testid="button-go-to-app"
                  >
                    Go to App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skip Option */}
          {!allComplete && (
            <div className="mt-8 text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/app')}
                data-testid="button-skip-onboarding"
              >
                Skip for now
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                You can connect integrations later in Settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
