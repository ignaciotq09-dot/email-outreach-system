import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { useState, memo } from "react";
import FollowUpModal from "./follow-up-modal";

interface SentEmailRowProps {
  email: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SentEmailRow({ email, isExpanded, onToggleExpand }: SentEmailRowProps) {
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - new Date(date).getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} min ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else if (diffInMinutes < 10080) { // 7 days
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    } else {
      return format(new Date(date), "MMM d, yyyy");
    }
  };

  const getStatusIcon = () => {
    if (email.followUps && email.followUps.length > 0) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-status-yellow" data-testid={`status-icon-${email.id}`} />
          <span className="text-status-yellow">Follow-up Sent</span>
        </div>
      );
    } else if (email.replyReceived) {
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-status-green" data-testid={`status-icon-${email.id}`} />
          <span className="text-status-green font-medium">REPLIED</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-status-red" data-testid={`status-icon-${email.id}`} />
          <span className="text-status-red">No Reply</span>
        </div>
      );
    }
  };

  return (
    <div>
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between px-6 py-4 border border-border rounded-md hover-elevate cursor-pointer"
        data-testid={`row-email-${email.id}`}
      >
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <p className="font-semibold text-sm min-w-[150px]" data-testid={`text-name-${email.id}`}>
            {email.contact?.name || 'Unknown Contact'}
          </p>
          <p className="text-sm text-muted-foreground min-w-[120px]" data-testid={`text-company-${email.id}`}>
            {email.contact?.company || '—'}
          </p>
          <p className="text-sm text-muted-foreground truncate min-w-[180px]" data-testid={`text-email-${email.id}`}>
            {email.contact?.email || 'No email'}
          </p>
          <p className="text-sm text-muted-foreground min-w-[100px]" data-testid={`text-time-${email.id}`}>
            {formatTime(email.sentAt)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {getStatusIcon()}
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            data-testid={`button-expand-${email.id}`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <Card className="mt-2 ml-6" data-testid={`card-expanded-${email.id}`}>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Full Email Content</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Subject:</span>{" "}
                  <span className="font-medium" data-testid={`text-expanded-subject-${email.id}`}>{email.subject}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sent:</span>{" "}
                  <span data-testid={`text-expanded-date-${email.id}`}>
                    {format(new Date(email.sentAt), "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">To:</span>{" "}
                  <span data-testid={`text-expanded-to-${email.id}`}>{email.contact?.email || 'No email'}</span>
                </div>
                {email.contact?.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{" "}
                    <span data-testid={`text-expanded-phone-${email.id}`}>{email.contact.phone}</span>
                  </div>
                )}
                {email.contact?.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>{" "}
                    <span data-testid={`text-expanded-notes-${email.id}`}>{email.contact.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Message Body:</p>
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap" data-testid={`text-expanded-body-${email.id}`}>
                  {email.body}
                </p>
              </div>
            </div>

            {/* Display reply content if reply received */}
            {email.replyReceived && email.replies && email.replies.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Reply Received:</p>
                <div className="bg-status-green/10 border border-status-green/30 p-4 rounded-md">
                  {email.replies.map((reply: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="text-xs text-status-green font-medium" data-testid={`text-reply-date-${email.id}-${index}`}>
                        {format(new Date(reply.replyReceivedAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <p className="text-sm whitespace-pre-wrap" data-testid={`text-reply-content-${email.id}-${index}`}>
                        {reply.replyContent}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display follow-ups if sent */}
            {email.followUps && email.followUps.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Follow-up History:</p>
                <div className="space-y-2">
                  {email.followUps.map((followUp: any, index: number) => (
                    <div key={index} className="bg-status-yellow/10 border border-status-yellow/30 p-3 rounded-md">
                      <div className="text-xs text-status-yellow font-medium mb-1" data-testid={`text-followup-date-${email.id}-${index}`}>
                        Follow-up sent: {format(new Date(followUp.sentAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      <p className="text-sm whitespace-pre-wrap" data-testid={`text-followup-body-${email.id}-${index}`}>
                        {followUp.followUpBody}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={() => setShowFollowUpModal(true)}
                variant="default"
                className="bg-status-yellow hover:bg-status-yellow/90 text-white"
                data-testid={`button-send-followup-${email.id}`}
              >
                Send Follow-Up Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showFollowUpModal && (
        <FollowUpModal
          originalEmail={email}
          onClose={() => setShowFollowUpModal(false)}
          onSuccess={() => {
            setShowFollowUpModal(false);
            // Will refresh data in integration phase
          }}
        />
      )}
    </div>
  );
}

// Use default shallow comparison - parent should use useCallback for onToggleExpand
export default memo(SentEmailRow);
