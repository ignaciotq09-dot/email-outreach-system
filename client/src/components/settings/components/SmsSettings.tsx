import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import type { SmsConfig } from "../types";

interface SmsSettingsProps {
  smsConfig?: SmsConfig;
  twilioPhoneNumber: string;
  isSaving: boolean;
  onTwilioPhoneChange: (val: string) => void;
  onSave: () => void;
}

export function SmsSettings({ smsConfig, twilioPhoneNumber, isSaving, onTwilioPhoneChange, onSave }: SmsSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-purple-600" />
        <h3 className="text-base font-semibold">SMS Outreach</h3>
      </div>
      <p className="text-sm text-muted-foreground">Configure your Twilio phone number to send SMS messages alongside emails</p>

      <div className="flex items-center gap-3 p-4 border border-border rounded-md">
        {smsConfig?.configured ? (
          <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-sms-configured" /><div className="flex-1"><p className="text-sm font-medium">Twilio Connected</p><p className="text-xs text-muted-foreground">SMS sending is available</p></div></>
        ) : (
          <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-sms-not-configured" /><div className="flex-1"><p className="text-sm font-medium">Twilio Not Configured</p><p className="text-xs text-muted-foreground">Add Twilio credentials to enable SMS</p></div></>
        )}
      </div>

      <div>
        <Label htmlFor="twilio-phone" className="text-sm">Your Twilio Phone Number</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">This is the phone number SMS messages will be sent from</p>
        <Input id="twilio-phone" value={twilioPhoneNumber} onChange={(e) => onTwilioPhoneChange(e.target.value)} placeholder="+1234567890" className="mt-2" data-testid="input-twilio-phone" />
      </div>

      <Button onClick={onSave} disabled={isSaving || !twilioPhoneNumber} data-testid="button-save-sms-settings">{isSaving ? "Saving..." : "Save SMS Settings"}</Button>
    </div>
  );
}
