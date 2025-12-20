import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface SendBulkModalProps {
  emails: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendBulkModal({ emails, onClose, onSuccess }: SendBulkModalProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSend = async () => {
    setIsSending(true);
    setProgress(0);
    
    try {
      const result = await apiRequest<{ results: any[] }>("POST", "/api/emails/send-bulk", { emails });
      
      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;
      
      setProgress(100);
      
      if (failCount > 0) {
        toast({
          title: "Partial Success",
          description: `${successCount} emails sent, ${failCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `All ${successCount} emails sent successfully!`,
        });
      }
      
      // Invalidate sent emails cache
      queryClient.invalidateQueries({ queryKey: ['/api/emails/sent'] });
      
      onSuccess();
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "Error",
        description: "Failed to send emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="modal-send-bulk">
        <DialogHeader>
          <DialogTitle>Send {emails.length} Emails?</DialogTitle>
          <DialogDescription>
            This will send personalized emails to all {emails.length} contacts in your queue.
          </DialogDescription>
        </DialogHeader>

        {isSending && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Sending emails... {Math.round(progress)}%
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            data-testid="button-cancel-send"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            data-testid="button-confirm-send"
          >
            {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
