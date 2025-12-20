import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Phone, CheckCircle2, XCircle } from "lucide-react";
import type { NotificationSettings as NotificationSettingsType } from "../types";

interface NotificationSettingsProps {
  notificationSettings?: NotificationSettingsType;
  notificationPhone: string;
  isSaving: boolean;
  onPhoneChange: (val: string) => void;
  onSave: () => void;
}

export function NotificationSettings({ notificationSettings, notificationPhone, isSaving, onPhoneChange, onSave }: NotificationSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-blue-600" /><h3 className="text-base font-semibold">Booking Notifications</h3></div>
      <p className="text-sm text-muted-foreground">Get notified via SMS and email when someone books a meeting through your scheduling link</p>

      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 border border-border rounded-md">
          {notificationSettings?.emailEnabled ? (
            <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-email-notifications-enabled" /><div className="flex-1"><p className="text-sm font-medium">Email Notifications Active</p><p className="text-xs text-muted-foreground">Emails will be sent to {notificationSettings?.email}</p></div></>
          ) : (
            <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-email-notifications-disabled" /><div className="flex-1"><p className="text-sm font-medium">Email Not Configured</p><p className="text-xs text-muted-foreground">No email address on file</p></div></>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 border border-border rounded-md">
          {notificationSettings?.smsEnabled ? (
            <><CheckCircle2 className="w-5 h-5 text-status-green" data-testid="icon-sms-notifications-enabled" /><div className="flex-1"><p className="text-sm font-medium">SMS Notifications Active</p><p className="text-xs text-muted-foreground">Texts will be sent to {notificationSettings?.phone}</p></div></>
          ) : (
            <><XCircle className="w-5 h-5 text-muted-foreground" data-testid="icon-sms-notifications-disabled" /><div className="flex-1"><p className="text-sm font-medium">SMS Notifications Disabled</p><p className="text-xs text-muted-foreground">Add your phone number below to receive text alerts</p></div></>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="notification-phone" className="text-sm"><Phone className="w-4 h-4 inline mr-1" />Your Phone Number</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">This is where you'll receive SMS alerts when someone books a meeting</p>
        <Input id="notification-phone" value={notificationPhone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="+1234567890" className="mt-2" data-testid="input-notification-phone" />
      </div>

      <Button onClick={onSave} disabled={isSaving} data-testid="button-save-notification-settings">{isSaving ? "Saving..." : "Save Notification Settings"}</Button>
    </div>
  );
}
