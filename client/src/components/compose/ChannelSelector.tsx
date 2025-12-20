import { Mail, MessageSquare, Linkedin, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { OutreachChannel } from "./types";

interface ChannelSelectorProps {
  outreachChannel: OutreachChannel;
  smsEnabled: boolean;
  linkedinEnabled: boolean;
  onToggleChannel: (channel: 'email' | 'sms' | 'linkedin') => void;
}

export default function ChannelSelector({ 
  outreachChannel, 
  smsEnabled, 
  linkedinEnabled,
  onToggleChannel 
}: ChannelSelectorProps) {
  const isEmailEnabled = ['email', 'email_sms', 'email_linkedin', 'all'].includes(outreachChannel);
  const isSmsEnabled = ['sms', 'email_sms', 'all'].includes(outreachChannel);
  const isLinkedinEnabled = ['linkedin', 'email_linkedin', 'all'].includes(outreachChannel);

  return (
    <div className="border-b border-border p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Outreach Channels</span>
      </div>
      
      <div className="flex gap-2">
        <div 
          className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            isEmailEnabled 
              ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20" 
              : "border-border bg-background hover:border-purple-300"
          }`}
          onClick={() => onToggleChannel('email')}
          data-testid="compose-toggle-channel-email"
        >
          <div className="flex items-center justify-between mb-1">
            <Mail className={`w-4 h-4 ${isEmailEnabled ? "text-purple-600" : "text-muted-foreground"}`} />
            <div onClick={(e) => e.stopPropagation()}>
              <Switch 
                checked={isEmailEnabled} 
                onCheckedChange={() => onToggleChannel('email')}
                className="scale-75"
                data-testid="compose-switch-channel-email"
              />
            </div>
          </div>
          <p className={`text-xs font-medium ${isEmailEnabled ? "text-purple-700 dark:text-purple-300" : ""}`}>Email</p>
        </div>

        <div 
          className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            isSmsEnabled 
              ? "border-green-400 bg-green-50 dark:bg-green-900/20" 
              : "border-border bg-background hover:border-green-300"
          } ${!smsEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => smsEnabled && onToggleChannel('sms')}
          data-testid="compose-toggle-channel-sms"
        >
          <div className="flex items-center justify-between mb-1">
            <MessageSquare className={`w-4 h-4 ${isSmsEnabled ? "text-green-600" : "text-muted-foreground"}`} />
            <div onClick={(e) => e.stopPropagation()}>
              <Switch 
                checked={isSmsEnabled} 
                onCheckedChange={() => smsEnabled && onToggleChannel('sms')}
                disabled={!smsEnabled}
                className="scale-75"
                data-testid="compose-switch-channel-sms"
              />
            </div>
          </div>
          <p className={`text-xs font-medium ${isSmsEnabled ? "text-green-700 dark:text-green-300" : ""}`}>
            SMS {!smsEnabled && <span className="text-muted-foreground">(Setup in Settings)</span>}
          </p>
        </div>

        <div 
          className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            isLinkedinEnabled 
              ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20" 
              : "border-border bg-background hover:border-sky-300"
          } ${!linkedinEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => linkedinEnabled && onToggleChannel('linkedin')}
          data-testid="compose-toggle-channel-linkedin"
        >
          <div className="flex items-center justify-between mb-1">
            <Linkedin className={`w-4 h-4 ${isLinkedinEnabled ? "text-sky-600" : "text-muted-foreground"}`} />
            <div onClick={(e) => e.stopPropagation()}>
              <Switch 
                checked={isLinkedinEnabled} 
                onCheckedChange={() => linkedinEnabled && onToggleChannel('linkedin')}
                disabled={!linkedinEnabled}
                className="scale-75"
                data-testid="compose-switch-channel-linkedin"
              />
            </div>
          </div>
          <p className={`text-xs font-medium ${isLinkedinEnabled ? "text-sky-700 dark:text-sky-300" : ""}`}>
            LinkedIn {!linkedinEnabled && <span className="text-muted-foreground">(Setup in Settings)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
