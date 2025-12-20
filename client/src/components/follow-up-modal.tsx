import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Sparkles, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FollowUpModalProps {
  originalEmail: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface FollowUpRecommendation {
  success: boolean;
  recommendation: {
    sequenceNumber: number;
    type: string;
    expectedResponseBoost: string;
    recommendedDate: string;
    recommendedTime: string;
    bestDays: string[];
    psychology: string;
    message: string;
  };
  nextSteps: Array<{
    stepNumber: number;
    daysAfterOriginal: number;
    type: string;
    responseBoost: string;
  }>;
  autoFollowUpEnabled: boolean;
  stopOnReply: boolean;
}

export default function FollowUpModal({ originalEmail, onClose, onSuccess }: FollowUpModalProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [recommendations, setRecommendations] = useState<FollowUpRecommendation | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const firstName = originalEmail.contact.name.split(' ')[0];
  const [followUpMessage, setFollowUpMessage] = useState(
    `Hi ${firstName},\n\nI wanted to follow up on my previous email about collaboration.\n\n\n\nLooking forward to hearing from you.`
  );

  // Fetch recommended follow-up timing
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await apiRequest("GET", `/api/follow-up/recommendations?sequenceNumber=1&lastSentAt=${originalEmail.sentAt}`);
        setRecommendations(data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecommendations();
  }, [originalEmail.sentAt]);

  const handleSend = async () => {
    if (!followUpMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a follow-up message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      await apiRequest("POST", "/api/emails/follow-up", {
        originalEmailId: originalEmail.id,
        followUpMessage,
      });

      toast({
        title: "Follow-up Sent",
        description: `Follow-up email sent to ${originalEmail.contact.name}.`,
      });

      // Refresh sent emails
      queryClient.invalidateQueries({ queryKey: ['/api/emails/sent'] });

      onSuccess();
    } catch (error) {
      console.error("Error sending follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to send follow-up email.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-follow-up">
        <DialogHeader>
          <DialogTitle>Send Follow-Up Email</DialogTitle>
          <DialogDescription>
            Sending follow-up to {originalEmail.contact.name} ({originalEmail.contact.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AI Recommended Timing */}
          {loadingRecs ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-purple-700 dark:text-purple-300">Loading optimal timing...</span>
            </div>
          ) : recommendations?.success && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Recommended Timing</span>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                {recommendations.recommendation.message}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Best: {recommendations.recommendation.bestDays.join(", ")} at {recommendations.recommendation.recommendedTime}
                </span>
                <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300">
                  {recommendations.recommendation.expectedResponseBoost} higher response
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Auto-stops if they reply</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Original Email Thread</Label>
            <div className="bg-muted p-4 rounded-md max-h-48 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1">Subject: {originalEmail.subject}</p>
              <p className="text-sm whitespace-pre-wrap">{originalEmail.body}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="follow-up-message">Follow-Up Message</Label>
            <Textarea
              id="follow-up-message"
              value={followUpMessage}
              onChange={(e) => setFollowUpMessage(e.target.value)}
              className="mt-2 resize-none min-h-[200px]"
              placeholder="Enter your follow-up message..."
              data-testid="textarea-follow-up-message"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
            data-testid="button-cancel-follow-up"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            data-testid="button-send-follow-up"
          >
            {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Follow-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

