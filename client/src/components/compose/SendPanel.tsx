import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Linkedin, Zap, Loader2 } from "lucide-react";
import type { OutreachChannel, ChannelValidation } from "./types";

interface SendPanelProps {
  outreachChannel: OutreachChannel;
  smsEnabled: boolean;
  linkedinEnabled: boolean;
  smsMessage: string;
  linkedinMessage: string;
  linkedinMessageType: 'connection_request' | 'direct_message';
  channelValidation: ChannelValidation;
  selectedContactCount: number;
  isSending: boolean;
  onChannelChange: (channel: OutreachChannel) => void;
  onSmsMessageChange: (message: string) => void;
  onLinkedinMessageChange: (message: string) => void;
  onLinkedinTypeChange: (type: 'connection_request' | 'direct_message') => void;
  onSend: () => void;
}

export default function SendPanel({
  outreachChannel,
  smsEnabled,
  linkedinEnabled,
  smsMessage,
  linkedinMessage,
  linkedinMessageType,
  channelValidation,
  selectedContactCount,
  isSending,
  onChannelChange,
  onSmsMessageChange,
  onLinkedinMessageChange,
  onLinkedinTypeChange,
  onSend,
}: SendPanelProps) {
  if (selectedContactCount === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Outreach Channel</Label>
        <div className="flex gap-2 text-xs text-muted-foreground">
          {!smsEnabled && <span>Enable SMS in Settings</span>}
          {!linkedinEnabled && <span>Enable LinkedIn in Settings</span>}
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
          variant={outreachChannel === 'linkedin' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChannelChange('linkedin')}
          disabled={!linkedinEnabled}
          data-testid="button-channel-linkedin"
        >
          <Linkedin className="w-4 h-4 mr-1.5" />
          LinkedIn
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
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
        <Button
          variant={outreachChannel === 'email_linkedin' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChannelChange('email_linkedin')}
          disabled={!linkedinEnabled}
          data-testid="button-channel-email-linkedin"
        >
          <Zap className="w-4 h-4 mr-1.5" />
          Email + LI
        </Button>
        <Button
          variant={outreachChannel === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChannelChange('all')}
          disabled={!smsEnabled || !linkedinEnabled}
          data-testid="button-channel-all"
        >
          <Zap className="w-4 h-4 mr-1.5" />
          All 3
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

      {channelValidation.includesLinkedin && (
        <div className="space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/20">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-blue-600" />
              LinkedIn Message
            </Label>
            <span className={`text-xs ${linkedinMessage.length > 300 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {linkedinMessage.length}/300
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <Button
              variant={linkedinMessageType === 'connection_request' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLinkedinTypeChange('connection_request')}
              data-testid="button-linkedin-connection"
            >
              Connection Request
            </Button>
            <Button
              variant={linkedinMessageType === 'direct_message' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLinkedinTypeChange('direct_message')}
              data-testid="button-linkedin-dm"
            >
              Direct Message
            </Button>
          </div>
          <Textarea
            value={linkedinMessage}
            onChange={(e) => onLinkedinMessageChange(e.target.value)}
            placeholder={linkedinMessageType === 'connection_request' 
              ? "Hi {firstName}, I noticed you work at {company}. Would love to connect!"
              : "Professional message to send via LinkedIn DM..."
            }
            className="min-h-[80px] text-sm resize-none"
            data-testid="input-linkedin-message"
          />
          <p className="text-xs text-muted-foreground">
            {linkedinMessageType === 'connection_request' 
              ? "Connection request note (300 char limit). Will be sent to contacts with LinkedIn URLs."
              : "Direct message for already-connected contacts."
            }
          </p>
        </div>
      )}

      <Button
        onClick={onSend}
        disabled={isSending || 
          (channelValidation.includesSms && !smsMessage.trim()) ||
          (channelValidation.includesLinkedin && !linkedinMessage.trim())
        }
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
            {outreachChannel === 'linkedin' && <Linkedin className="w-5 h-5 mr-2" />}
            {(outreachChannel === 'email_sms' || outreachChannel === 'email_linkedin' || outreachChannel === 'all') && <Zap className="w-5 h-5 mr-2" />}
            {outreachChannel === 'email' && `Send Email to ${channelValidation.emailSends} Contact${channelValidation.emailSends !== 1 ? 's' : ''}`}
            {outreachChannel === 'sms' && `Send SMS to ${channelValidation.smsSends} Contact${channelValidation.smsSends !== 1 ? 's' : ''}`}
            {outreachChannel === 'linkedin' && `Send LinkedIn to ${channelValidation.linkedinSends} Contact${channelValidation.linkedinSends !== 1 ? 's' : ''}`}
            {outreachChannel === 'email_sms' && `Send ${channelValidation.emailSends} Email + ${channelValidation.smsSends} SMS`}
            {outreachChannel === 'email_linkedin' && `Send ${channelValidation.emailSends} Email + ${channelValidation.linkedinSends} LinkedIn`}
            {outreachChannel === 'all' && `Send to ${selectedContactCount} (3 channels)`}
          </>
        )}
      </Button>
    </div>
  );
}
