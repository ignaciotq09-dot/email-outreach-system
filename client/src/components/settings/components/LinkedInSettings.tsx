import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Linkedin, Chrome, CheckCircle2, XCircle, Loader2, RefreshCw, Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LinkedinStatus, ExtensionStatus } from "../types";

interface LinkedInSettingsProps {
  linkedinStatus?: LinkedinStatus;
  extensionStatus?: ExtensionStatus;
  linkedinProfileUrl: string;
  linkedinDisplayName: string;
  linkedinDailyConnectionLimit: number;
  linkedinDailyMessageLimit: number;
  extensionToken: string;
  showExtensionToken: boolean;
  connectPending: boolean;
  disconnectPending: boolean;
  savePending: boolean;
  generateTokenPending: boolean;
  disconnectExtensionPending: boolean;
  verifyExtensionPending: boolean;
  onProfileUrlChange: (val: string) => void;
  onDisplayNameChange: (val: string) => void;
  onConnectionLimitChange: (val: number) => void;
  onMessageLimitChange: (val: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveSettings: () => void;
  onGenerateToken: () => void;
  onDisconnectExtension: () => void;
  onVerifyExtension: () => void;
}

export function LinkedInSettings({ linkedinStatus, extensionStatus, linkedinProfileUrl, linkedinDisplayName, linkedinDailyConnectionLimit, linkedinDailyMessageLimit, extensionToken, showExtensionToken, connectPending, disconnectPending, savePending, generateTokenPending, disconnectExtensionPending, verifyExtensionPending, onProfileUrlChange, onDisplayNameChange, onConnectionLimitChange, onMessageLimitChange, onConnect, onDisconnect, onSaveSettings, onGenerateToken, onDisconnectExtension, onVerifyExtension }: LinkedInSettingsProps) {
  const { toast } = useToast();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Linkedin className="w-5 h-5 text-[#0077b5]" /><h3 className="text-base font-semibold">LinkedIn Outreach</h3></div>
      <p className="text-sm text-muted-foreground">Connect your LinkedIn profile to send connection requests and messages alongside emails</p>

      <div className="flex items-center gap-3 p-4 border border-border rounded-md">
        {linkedinStatus?.connected ? (
          <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-linkedin-connected" /><div className="flex-1"><p className="text-sm font-medium">LinkedIn Connected</p><p className="text-xs text-muted-foreground">{linkedinStatus.displayName || linkedinStatus.profileUrl}</p><div className="flex gap-4 mt-2 text-xs text-muted-foreground"><span>Connections today: {linkedinStatus.connectionsSentToday ?? 0}/{linkedinStatus.dailyConnectionLimit ?? 20}</span><span>Messages today: {linkedinStatus.messagesSentToday ?? 0}/{linkedinStatus.dailyMessageLimit ?? 50}</span></div></div></>
        ) : (
          <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-linkedin-not-connected" /><div className="flex-1"><p className="text-sm font-medium">LinkedIn Not Connected</p><p className="text-xs text-muted-foreground">Add your LinkedIn profile to enable outreach</p></div></>
        )}
      </div>

      {!linkedinStatus?.connected ? (
        <div className="space-y-4">
          <div><Label htmlFor="linkedin-profile" className="text-sm">Your LinkedIn Profile URL</Label><p className="text-xs text-muted-foreground mt-1 mb-2">This helps us track your outreach activity</p><Input id="linkedin-profile" value={linkedinProfileUrl} onChange={(e) => onProfileUrlChange(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" className="mt-2" data-testid="input-linkedin-profile" /></div>
          <div><Label htmlFor="linkedin-name" className="text-sm">Your Display Name</Label><p className="text-xs text-muted-foreground mt-1 mb-2">How you appear on LinkedIn</p><Input id="linkedin-name" value={linkedinDisplayName} onChange={(e) => onDisplayNameChange(e.target.value)} placeholder="John Smith" className="mt-2" data-testid="input-linkedin-name" /></div>
          <Button onClick={onConnect} disabled={connectPending || !linkedinProfileUrl} data-testid="button-connect-linkedin">{connectPending ? "Connecting..." : "Connect LinkedIn"}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="linkedin-connection-limit" className="text-sm">Daily Connection Limit</Label><p className="text-xs text-muted-foreground mt-1 mb-2">Max connection requests per day</p><Input id="linkedin-connection-limit" type="number" min={1} max={100} value={linkedinDailyConnectionLimit} onChange={(e) => onConnectionLimitChange(parseInt(e.target.value) || 20)} className="mt-2" data-testid="input-linkedin-connection-limit" /></div>
            <div><Label htmlFor="linkedin-message-limit" className="text-sm">Daily Message Limit</Label><p className="text-xs text-muted-foreground mt-1 mb-2">Max messages per day</p><Input id="linkedin-message-limit" type="number" min={1} max={150} value={linkedinDailyMessageLimit} onChange={(e) => onMessageLimitChange(parseInt(e.target.value) || 50)} className="mt-2" data-testid="input-linkedin-message-limit" /></div>
          </div>
          <div className="flex gap-2"><Button onClick={onSaveSettings} disabled={savePending} data-testid="button-save-linkedin-settings">{savePending ? "Saving..." : "Save Settings"}</Button><Button onClick={onDisconnect} disabled={disconnectPending} variant="outline" data-testid="button-disconnect-linkedin">{disconnectPending ? "Disconnecting..." : "Disconnect"}</Button></div>
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-4">
        <div className="flex items-center gap-2"><Chrome className="w-5 h-5 text-[#4285F4]" /><h3 className="text-base font-semibold">Browser Extension</h3><Badge variant="secondary" className="text-xs">Required for Sending</Badge></div>
        <p className="text-sm text-muted-foreground">Install our Chrome extension to connect your LinkedIn account. This enables sending connection requests and messages directly from your browser.</p>

        <div className="flex items-center gap-3 p-4 border border-border rounded-md">
          {extensionStatus?.connected ? (
            <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-extension-connected" /><div className="flex-1"><p className="text-sm font-medium">LinkedIn Connected via Extension</p><p className="text-xs text-muted-foreground">{extensionStatus.lastVerified ? `Last verified: ${new Date(extensionStatus.lastVerified).toLocaleString()}` : "Connected and ready to send"}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={onVerifyExtension} disabled={verifyExtensionPending} data-testid="button-verify-extension">{verifyExtensionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</Button><Button variant="outline" size="sm" onClick={onDisconnectExtension} disabled={disconnectExtensionPending} data-testid="button-disconnect-extension">{disconnectExtensionPending ? "..." : "Disconnect"}</Button></div></>
          ) : (
            <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-extension-not-connected" /><div className="flex-1"><p className="text-sm font-medium">Extension Not Connected</p><p className="text-xs text-muted-foreground">Install the extension and connect your LinkedIn account</p></div></>
          )}
        </div>

        {!extensionStatus?.connected && (
          <div className="space-y-4 p-4 border border-border rounded-md bg-muted/30">
            <div className="flex items-center justify-between"><h4 className="text-sm font-medium">Install Extension</h4></div>
            <div className="space-y-3">
              <a href="https://chrome.google.com/webstore/detail/linkedin-outreach-connector/YOUR_EXTENSION_ID" target="_blank" rel="noopener noreferrer" className="inline-flex w-full"><Button className="w-full justify-start" data-testid="button-chrome-store"><Chrome className="w-4 h-4 mr-2" />Add to Chrome (Recommended)</Button></a>
              <p className="text-xs text-muted-foreground">Install from the Chrome Web Store with one click</p>
            </div>
            <Separator className="my-2" />
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Developer installation (manual)</summary>
              <ol className="text-muted-foreground space-y-2 list-decimal list-inside mt-3 pl-2"><li>Download the extension zip below</li><li>Extract the zip file</li><li>Go to <code className="bg-muted px-1 rounded">chrome://extensions</code></li><li>Enable "Developer mode" (top right)</li><li>Click "Load unpacked" and select the folder</li></ol>
              <div className="mt-3"><a href="/linkedin-extension.zip" download="linkedin-extension.zip" className="inline-flex"><Button variant="outline" size="sm" data-testid="button-download-extension"><Download className="w-4 h-4 mr-2" />Download Extension Zip</Button></a></div>
            </details>
            <Separator className="my-4" />
            <div>
              <Label className="text-sm">Connection Token</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">Generate a token and paste it into the extension to connect</p>
              {showExtensionToken && extensionToken ? (
                <div className="space-y-2">
                  <div className="flex gap-2"><Input value={extensionToken} readOnly className="font-mono text-xs" data-testid="input-extension-token" /><Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(extensionToken); toast({ title: "Copied", description: "Token copied to clipboard" }); }} data-testid="button-copy-token"><Copy className="w-4 h-4" /></Button></div>
                  <p className="text-xs text-muted-foreground">This token expires in 15 minutes and can only be used once. Paste it into the extension.</p>
                  <p className="text-xs text-muted-foreground">App URL: <code className="bg-muted px-1 rounded">{window.location.origin}</code></p>
                </div>
              ) : (
                <Button onClick={onGenerateToken} disabled={generateTokenPending} data-testid="button-generate-token">{generateTokenPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : "Generate Connection Token"}</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
