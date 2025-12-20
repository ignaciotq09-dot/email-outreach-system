import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { GmailStatus, ProviderStatus } from "../types";

interface EmailProviderSettingsProps {
  gmailStatus?: GmailStatus;
  outlookStatus?: ProviderStatus;
  yahooStatus?: ProviderStatus;
  disconnectPending: boolean;
  reconnectPending: boolean;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  onReconnectGmail: () => void;
  onConnectOutlook: () => void;
  onDisconnectOutlook: () => void;
  onConnectYahoo: () => void;
  onDisconnectYahoo: () => void;
}

export function EmailProviderSettings({ gmailStatus, outlookStatus, yahooStatus, disconnectPending, reconnectPending, onConnectGmail, onDisconnectGmail, onReconnectGmail, onConnectOutlook, onDisconnectOutlook, onConnectYahoo, onDisconnectYahoo }: EmailProviderSettingsProps) {
  const gmailConnected = gmailStatus?.connected ?? false;
  const gmailHasCustomOAuth = gmailStatus?.hasCustomOAuth ?? false;
  const outlookConnected = outlookStatus?.connected ?? false;
  const yahooConnected = yahooStatus?.connected ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-2">Email Provider</h3>
        <p className="text-sm text-muted-foreground">Connect your email account to send campaigns and track replies</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Gmail</h4>
        <div className="flex items-center gap-3 p-4 border border-border rounded-md">
          {gmailConnected && gmailHasCustomOAuth ? (
            <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-gmail-status" /><div className="flex-1"><p className="text-sm font-medium">Connected with Full Access</p><p className="text-xs text-muted-foreground" data-testid="text-gmail-email">{gmailStatus?.email}</p><p className="text-xs text-green-600 dark:text-green-400 mt-1">Full inbox reading and sending enabled</p></div></>
          ) : gmailConnected ? (
            <><AlertTriangle className="w-5 h-5 text-yellow-500" data-testid="icon-gmail-limited" /><div className="flex-1"><p className="text-sm font-medium">Limited Access</p><p className="text-xs text-muted-foreground" data-testid="text-gmail-email">{gmailStatus?.email}</p><p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Reconnect to enable inbox reading for reply detection</p></div></>
          ) : (
            <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-gmail-disconnected" /><div className="flex-1"><p className="text-sm font-medium">Not Connected</p><p className="text-xs text-muted-foreground">Connect your Gmail account to send emails and track replies</p></div></>
          )}
        </div>
        <div className="flex gap-2">
          {gmailConnected ? (
            <><Button onClick={onDisconnectGmail} variant="outline" disabled={disconnectPending} data-testid="button-disconnect-gmail">Disconnect Gmail</Button>{!gmailHasCustomOAuth && <Button onClick={onReconnectGmail} disabled={reconnectPending} data-testid="button-reconnect-gmail">{reconnectPending ? "Connecting..." : "Reconnect with Full Access"}</Button>}</>
          ) : (
            <Button onClick={onConnectGmail} data-testid="button-connect-gmail">Connect Gmail</Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Outlook</h4>
        <div className="flex items-center gap-3 p-4 border border-border rounded-md">
          {outlookConnected ? (<><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-outlook-status" /><div className="flex-1"><p className="text-sm font-medium">Connected</p><p className="text-xs text-muted-foreground" data-testid="text-outlook-email">{outlookStatus?.email}</p></div></>) : (<><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-outlook-disconnected" /><div className="flex-1"><p className="text-sm font-medium">Not Connected</p><p className="text-xs text-muted-foreground">Connect your Outlook account to send emails</p></div></>)}
        </div>
        <div className="flex gap-2">{outlookConnected ? <Button onClick={onDisconnectOutlook} variant="outline" disabled={disconnectPending} data-testid="button-disconnect-outlook">Disconnect Outlook</Button> : <Button onClick={onConnectOutlook} data-testid="button-connect-outlook">Connect Outlook</Button>}</div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Yahoo Mail</h4>
        <div className="flex items-center gap-3 p-4 border border-border rounded-md">
          {yahooConnected ? (<><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-yahoo-status" /><div className="flex-1"><p className="text-sm font-medium">Connected</p><p className="text-xs text-muted-foreground" data-testid="text-yahoo-email">{yahooStatus?.email}</p></div></>) : (<><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-yahoo-disconnected" /><div className="flex-1"><p className="text-sm font-medium">Not Connected</p><p className="text-xs text-muted-foreground">Connect your Yahoo account to send emails</p></div></>)}
        </div>
        <div className="flex gap-2">{yahooConnected ? <Button onClick={onDisconnectYahoo} variant="outline" disabled={disconnectPending} data-testid="button-disconnect-yahoo">Disconnect Yahoo</Button> : <Button onClick={onConnectYahoo} data-testid="button-connect-yahoo">Connect Yahoo</Button>}</div>
      </div>
    </div>
  );
}
