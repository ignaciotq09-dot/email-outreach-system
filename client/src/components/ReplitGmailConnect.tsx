import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Mail, ExternalLink } from 'lucide-react';

export function ReplitGmailConnect() {
  const [status, setStatus] = useState<{ connected: boolean; email: string | null; loading: boolean }>({
    connected: false,
    email: null,
    loading: true
  });

  // Check Gmail connection status
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/replit-gmail/status');
      const data = await response.json();
      setStatus({
        connected: data.connected,
        email: data.email,
        loading: false
      });
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      setStatus({ connected: false, email: null, loading: false });
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectClick = () => {
    // Open Replit integrations panel in new tab
    window.open('/__replit/integrations', '_blank');
  };

  if (status.loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Checking Gmail connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status.connected) {
    return (
      <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Gmail Connected</AlertTitle>
        <AlertDescription>
          Connected to: {status.email}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Connect Gmail (Replit Integration)
        </CardTitle>
        <CardDescription>
          Use Replit's native Gmail integration - no OAuth restrictions!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Easy Setup - No 403 Errors!</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>This method uses Replit's official Gmail integration, which:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Bypasses Google's OAuth restrictions completely</li>
                <li>Automatically handles token refresh</li>
                <li>Works immediately without verification</li>
                <li>Provides full Gmail access (send, read, modify)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Steps to Connect:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click the button below to open Replit Integrations</li>
              <li>Find "Gmail" in the integrations list</li>
              <li>Click "Connect" next to Gmail</li>
              <li>Follow Google's authorization flow</li>
              <li>Return here - the connection will be detected automatically</li>
            </ol>
          </div>

          <Button 
            onClick={handleConnectClick}
            className="w-full"
            size="lg"
            data-testid="button-connect-replit-gmail"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Replit Integrations Panel
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will open in a new tab. Complete the Gmail connection there, then return here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}