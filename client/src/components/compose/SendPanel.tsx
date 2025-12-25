import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Zap, Loader2 } from "lucide-react";
import type { OutreachChannel, ChannelValidation } from "./types";

interface SendPanelProps {
  outreachChannel: OutreachChannel;
  smsEnabled: boolean;
  smsMessage: string;
  channelValidation: ChannelValidation;
  selectedContactCount: number;
  isSending: boolean;
  onChannelChange: (channel: OutreachChannel) => void;
  onSmsMessageChange: (message: string) => void;
  onSend: () => void;
}

export default function SendPanel({
  outreachChannel,
  smsEnabled,
  smsMessage,
  channelValidation,
  selectedContactCount,
  isSending,
  onChannelChange,
  onSmsMessageChange,
  onSend,
}: SendPanelProps) {
  if (selectedContactCount === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Outreach Channel</Label>
        <div className="flex gap-2 text-xs text-muted-foreground">
          {!smsEnabled && <span>Enable SMS in Settings</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={outreachChannel === 'email' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChannelChange('email')}
          data-testid="button-channel-email"
        >
          <Mail className="w-4 h-4 mr-1.5" />
          Email
        </Button>
        <Button
          variant={outreachChannel === 'sms' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChannelChange('sms')}
          disabled={!smsEnabled}
          data-testid="button-channel-sms"
        >
          <MessageSquare className="w-4 h-4 mr-1.5" />
          SMS
        </Button>
        <Button
          variant={outreachChannel === 'email_sms' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChannelChange('email_sms')}
          disabled={!smsEnabled}
          data-testid="button-channel-email-sms"
        >
          <Zap className="w-4 h-4 mr-1.5" />
          Email + SMS
        </Button>
      </div>

      {channelValidation.includesSms && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
          <div className="flex items-center justify-between">
            <Label className="text-sm">SMS Message</Label>
            <span className={`text-xs ${smsMessage.length > 160 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {smsMessage.length}/160 {smsMessage.length > 160 && `(${Math.ceil(smsMessage.length / 160)} segments)`}
            </span>
          </div>
          <Textarea
            value={smsMessage}
            onChange={(e) => onSmsMessageChange(e.target.value)}
            placeholder="Short, punchy message. Include your name and a clear CTA."
            className="min-h-[80px] text-sm resize-none"
            data-testid="input-sms-message"
          />
          <p className="text-xs text-muted-foreground">
            Keep it brief. Phone numbers from Apollo enrichment.
          </p>
        </div>
      )}

      <Button
        onClick={onSend}
        disabled={isSending || (channelValidation.includesSms && !smsMessage.trim())}
        className="w-full"
        size="lg"
        data-testid="button-send-to-selected"
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Sending to {selectedContactCount} contacts...
          </>
        ) : (
          <>
            {outreachChannel === 'email' && <Mail className="w-5 h-5 mr-2" />}
            {outreachChannel === 'sms' && <MessageSquare className="w-5 h-5 mr-2" />}
            {outreachChannel === 'email_sms' && <Zap className="w-5 h-5 mr-2" />}
            {outreachChannel === 'email' && `Send Email to ${channelValidation.emailSends} Contact${channelValidation.emailSends !== 1 ? 's' : ''}`}
            {outreachChannel === 'sms' && `Send SMS to ${channelValidation.smsSends} Contact${channelValidation.smsSends !== 1 ? 's' : ''}`}
            {outreachChannel === 'email_sms' && `Send ${channelValidation.emailSends} Email + ${channelValidation.smsSends} SMS`}
            {outreachChannel === 'all' && `Send to ${selectedContactCount} (2 channels)`}
          </>
        )}
      </Button>
    </div>
  );
}
