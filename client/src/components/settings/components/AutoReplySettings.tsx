import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Calendar, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import type { AutoReplyLog } from "../types";

interface AutoReplySettingsProps {
  autoReplyEnabled: boolean;
  bookingLink: string;
  customAutoReplyMessage: string;
  autoReplyLogs?: { logs: AutoReplyLog[] };
  isSaving: boolean;
  onEnabledChange: (val: boolean) => void;
  onBookingLinkChange: (val: string) => void;
  onCustomMessageChange: (val: string) => void;
  onSave: () => void;
}

export function AutoReplySettings({ autoReplyEnabled, bookingLink, customAutoReplyMessage, autoReplyLogs, isSaving, onEnabledChange, onBookingLinkChange, onCustomMessageChange, onSave }: AutoReplySettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /><h3 className="text-base font-semibold">AI Auto-Reply</h3><Badge variant="secondary" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />New</Badge></div>
      <p className="text-sm text-muted-foreground">Automatically send your calendar link when prospects express clear interest in booking a meeting. The AI only responds when it's 90%+ confident the prospect wants to schedule.</p>

      <div className="flex items-center gap-3 p-4 border border-border rounded-md">
        {autoReplyEnabled ? (
          <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-auto-reply-enabled" /><div className="flex-1"><p className="text-sm font-medium">Auto-Reply Active</p><p className="text-xs text-muted-foreground">AI will respond to interested prospects</p></div></>
        ) : (
          <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-auto-reply-disabled" /><div className="flex-1"><p className="text-sm font-medium">Auto-Reply Disabled</p><p className="text-xs text-muted-foreground">Enable to automatically send booking links</p></div></>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border border-border rounded-md">
        <div className="flex-1"><Label htmlFor="auto-reply-toggle" className="text-sm font-medium cursor-pointer">Enable AI Auto-Reply</Label><p className="text-xs text-muted-foreground mt-1">When enabled, AI will analyze replies and send your booking link to interested prospects</p></div>
        <Switch id="auto-reply-toggle" checked={autoReplyEnabled} onCheckedChange={onEnabledChange} data-testid="switch-auto-reply" />
      </div>

      <div>
        <Label htmlFor="booking-link" className="text-sm"><Calendar className="w-4 h-4 inline mr-1" />Your Booking Link</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Calendly, Cal.com, or any scheduling link</p>
        <Input id="booking-link" value={bookingLink} onChange={(e) => onBookingLinkChange(e.target.value)} placeholder="https://calendly.com/your-name/30min" className="mt-2" data-testid="input-booking-link" />
      </div>

      <div>
        <Label htmlFor="custom-message" className="text-sm">Custom Message (Optional)</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Add a custom note to include in auto-replies. If blank, a default professional message will be used.</p>
        <Input id="custom-message" value={customAutoReplyMessage} onChange={(e) => onCustomMessageChange(e.target.value)} placeholder="Looking forward to our conversation!" className="mt-2" data-testid="input-custom-auto-reply-message" />
      </div>

      <Button onClick={onSave} disabled={isSaving || (autoReplyEnabled && !bookingLink)} data-testid="button-save-auto-reply-settings">{isSaving ? "Saving..." : "Save Auto-Reply Settings"}</Button>

      {autoReplyEnabled && !bookingLink && <p className="text-xs text-yellow-600 dark:text-yellow-400">Please add your booking link to enable auto-reply</p>}

      {autoReplyLogs?.logs && autoReplyLogs.logs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Recent Auto-Replies</h4>
          <div className="space-y-2">
            {autoReplyLogs.logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border border-border rounded-md text-sm" data-testid={`auto-reply-log-${log.id}`}>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-status-green" /><span>Auto-reply sent</span><Badge variant="outline" className="text-xs">{log.intentConfidence}% confidence</Badge></div>
                <span className="text-xs text-muted-foreground">{new Date(log.sentAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
