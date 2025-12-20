import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

interface SenderInfoSettingsProps {
  senderName: string;
  senderPhone: string;
  checkInterval: string;
  isSaving: boolean;
  onSenderNameChange: (val: string) => void;
  onSenderPhoneChange: (val: string) => void;
  onCheckIntervalChange: (val: string) => void;
  onSave: () => void;
}

export function SenderInfoSettings({ senderName, senderPhone, checkInterval, isSaving, onSenderNameChange, onSenderPhoneChange, onCheckIntervalChange, onSave }: SenderInfoSettingsProps) {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-base font-semibold">OpenAI API Configuration</h3>
        <p className="text-sm text-muted-foreground">Using Replit AI Integrations - No API key required</p>
        <div className="flex items-center gap-3 p-4 border border-border rounded-md bg-muted/50">
          <CheckCircle2 className="w-5 h-5 text-status-green" />
          <div className="flex-1"><p className="text-sm font-medium">AI Integration Active</p><p className="text-xs text-muted-foreground">Charges billed to your Replit credits</p></div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Auto-Check for Replies</h3>
        <div>
          <Label htmlFor="check-interval" className="text-sm">Check every</Label>
          <Select value={checkInterval} onValueChange={onCheckIntervalChange}>
            <SelectTrigger id="check-interval" className="mt-2" data-testid="select-check-interval"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Sender Information</h3>
        <p className="text-sm text-muted-foreground">Your name and phone number will be automatically included as a signature in all emails</p>
        <div className="space-y-4">
          <div><Label htmlFor="sender-name" className="text-sm">Your Name</Label><Input id="sender-name" value={senderName} onChange={(e) => onSenderNameChange(e.target.value)} placeholder="Ignacio Torres" className="mt-2" data-testid="input-sender-name" /></div>
          <div><Label htmlFor="sender-phone" className="text-sm">Your Phone Number</Label><Input id="sender-phone" value={senderPhone} onChange={(e) => onSenderPhoneChange(e.target.value)} placeholder="786-572-4981" className="mt-2" data-testid="input-sender-phone" /></div>
        </div>
        <Button onClick={onSave} disabled={isSaving} data-testid="button-save-sender-info">{isSaving ? "Saving..." : "Save Sender Information"}</Button>
      </div>
    </>
  );
}
