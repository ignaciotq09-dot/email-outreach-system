import { Mail, MessageSquare, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { OutreachChannel } from "./types";

interface ChannelSelectorProps {
  outreachChannel: OutreachChannel;
  smsEnabled: boolean;
  onToggleChannel: (channel: 'email' | 'sms') => void;
}

export default function ChannelSelector({
  outreachChannel,
  smsEnabled,
  onToggleChannel
}: ChannelSelectorProps) {
  const isEmailEnabled = ['email', 'email_sms', 'all'].includes(outreachChannel);
  const isSmsEnabled = ['sms', 'email_sms', 'all'].includes(outreachChannel);

  return (
    <div className="border-b border-border p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Outreach Channels</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${isEmailEnabled
            ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10"
            : "border-border bg-background hover:border-purple-300"
            }`}
          onClick={() => onToggleChannel('email')}
          data-testid="compose-toggle-channel-email"
        >
          <div className="flex items-center justify-between mb-2">
            <Mail className={`w-6 h-6 ${isEmailEnabled ? "text-purple-600" : "text-muted-foreground"}`} />
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isEmailEnabled}
                onCheckedChange={() => onToggleChannel('email')}
                data-testid="compose-switch-channel-email"
              />
            </div>
          </div>
          <p className={`text-base font-semibold ${isEmailEnabled ? "text-purple-700 dark:text-purple-300" : ""}`}>Email</p>
          <p className="text-xs text-muted-foreground mt-1">Send personalized emails</p>
        </div>

        <div
          className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${isSmsEnabled
            ? "border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/10"
            : "border-border bg-background hover:border-green-300"
            } ${!smsEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => smsEnabled && onToggleChannel('sms')}
          data-testid="compose-toggle-channel-sms"
        >
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className={`w-6 h-6 ${isSmsEnabled ? "text-green-600" : "text-muted-foreground"}`} />
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={isSmsEnabled}
                onCheckedChange={() => smsEnabled && onToggleChannel('sms')}
                disabled={!smsEnabled}
                data-testid="compose-switch-channel-sms"
              />
            </div>
          </div>
          <p className={`text-base font-semibold ${isSmsEnabled ? "text-green-700 dark:text-green-300" : ""}`}>SMS</p>
          <p className="text-xs text-muted-foreground mt-1">
            {!smsEnabled ? "Setup in Settings" : "Send text messages"}
          </p>
        </div>
      </div>
    </div>
  );
}
