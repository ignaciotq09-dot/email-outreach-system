import { memo } from "react";
import { MessageSquare, CheckCircle2, XCircle, Clock, AlertCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SentSmsWithContact {
  id: number;
  contactId: number;
  toPhone: string;
  message: string;
  personalizedMessage: string | null;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  errorMessage: string | null;
  contact: {
    id: number;
    name: string;
    email: string;
    company: string | null;
  } | null;
}

interface SentSmsRowProps {
  sms: SentSmsWithContact;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SentSmsRow({ sms, isExpanded, onToggleExpand }: SentSmsRowProps) {
  const getStatusIcon = () => {
    switch (sms.status) {
      case "delivered":
        return <CheckCircle2 className="w-4 h-4 text-status-green" />;
      case "sent":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-status-red" />;
      case "pending":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (sms.status) {
      case "delivered":
        return <Badge variant="outline" className="text-status-green border-status-green">Delivered</Badge>;
      case "sent":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Sent</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-status-red border-status-red">Failed</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
      default:
        return <Badge variant="outline">{sms.status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayMessage = sms.personalizedMessage || sms.message;
  const truncatedMessage = displayMessage.length > 80 
    ? `${displayMessage.substring(0, 80)}...` 
    : displayMessage;

  return (
    <div 
      className="border border-border rounded-md p-4 hover-elevate cursor-pointer transition-all"
      onClick={onToggleExpand}
      data-testid={`sms-row-${sms.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <MessageSquare className="w-5 h-5 text-purple-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground">
              {sms.contact?.name || "Unknown"}
            </span>
            <span className="text-sm text-muted-foreground">
              {sms.contact?.company || ""}
            </span>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Phone className="w-3 h-3" />
            <span>{sms.toPhone}</span>
          </div>
          
          <p className="text-sm text-foreground/80 mt-1">
            {isExpanded ? displayMessage : truncatedMessage}
          </p>
          
          {isExpanded && sms.errorMessage && (
            <p className="text-sm text-status-red mt-2">
              Error: {sms.errorMessage}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {getStatusIcon()}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(sms.sentAt)}
          </span>
          {sms.deliveredAt && (
            <span className="text-xs text-status-green">
              Delivered {formatDate(sms.deliveredAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SentSmsRow);
