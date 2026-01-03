// Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { CompanyOnboarding } from "@/components/onboarding";

type OnboardingPhase = 'company' | 'complete';

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<OnboardingPhase | null>(null);

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

  // Check company onboarding status
  const { data: companyStatus, isLoading: companyLoading } = useQuery<{ complete: boolean; currentStep: string; hasProfile: boolean }>({
    queryKey: ['/api/onboarding/company/status'],
  });

  const gmailConnected = gmailStatus?.connected ?? false;
  const outlookConnected = outlookStatus?.connected ?? false;
  const yahooConnected = yahooStatus?.connected ?? false;
  const emailConnected = gmailConnected || outlookConnected || yahooConnected;
  const openaiConnected = openaiStatus?.connected ?? false;
  const integrationsComplete = emailConnected && openaiConnected;
  const companyComplete = companyStatus?.complete ?? false;

  // Determine initial phase based on status
  useEffect(() => {
    if (companyLoading) return; // Wait for status to load

    if (companyComplete) {
      // Company profile done, go to app
      setLocation('/app');
    } else if (phase === null) {
      // Start with company profile (prioritize this)
      setPhase('company');
    }
  }, [companyComplete, companyLoading, phase, setLocation]);

  const handleCompanyOnboardingComplete = () => {
    setPhase('complete');
    setLocation('/app');
  };

  // Show loading while checking status
  if (companyLoading || phase === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  // Show company onboarding if in company phase
  if (phase === 'company') {
    return <CompanyOnboarding onComplete={handleCompanyOnboardingComplete} />;
  }

  // If somehow we get past company phase, redirect to app
  // This should not normally happen since company phase redirects to /app on complete
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-status-green mx-auto mb-4" />
        <p className="text-lg font-semibold">Setup Complete!</p>
        <p className="text-muted-foreground mb-4">Redirecting to your dashboard...</p>
        <Button onClick={() => setLocation('/app')}>
          Go to App
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
