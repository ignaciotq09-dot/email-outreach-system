import { X, Mail, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Contact } from "@shared/schema";

type OutreachChannel = 'email' | 'sms' | 'both';

interface ContactQueueChipProps {
  contact: Contact;
  onRemove: () => void;
  onClick?: () => void;
  outreachChannel?: OutreachChannel;
}

export default function ContactQueueChip({ contact, onRemove, onClick, outreachChannel = 'email' }: ContactQueueChipProps) {
  const hasEmail = Boolean(contact.email);
  const hasPhone = Boolean(contact.phone);
  
  // Check for channel-specific issues
  const missingEmail = outreachChannel !== 'sms' && !hasEmail;
  const missingPhone = outreachChannel !== 'email' && !hasPhone;
  const hasMissingData = missingEmail || missingPhone;
  
  return (
    <div 
      className={`flex items-center justify-between bg-muted px-3 py-2 rounded-md hover-elevate cursor-pointer active-elevate-2 ${
        hasMissingData ? 'border border-yellow-500/50' : ''
      }`}
      data-testid={`chip-contact-${contact.id}`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {contact.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {contact.company}
        </p>
      </div>
      
      {/* Channel availability indicators */}
      <div className="flex items-center gap-1 mx-2 flex-shrink-0">
        {(outreachChannel === 'email' || outreachChannel === 'both') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-0.5 ${hasEmail ? 'text-green-500' : 'text-muted-foreground/40'}`}>
                <Mail className="w-3 h-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {hasEmail ? contact.email : 'No email'}
            </TooltipContent>
          </Tooltip>
        )}
        {(outreachChannel === 'sms' || outreachChannel === 'both') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-0.5 ${hasPhone ? 'text-green-500' : 'text-muted-foreground/40'}`}>
                <Phone className="w-3 h-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {hasPhone ? contact.phone : 'No phone'}
            </TooltipContent>
          </Tooltip>
        )}
        {hasMissingData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-yellow-500 p-0.5">
                <AlertTriangle className="w-3 h-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {missingEmail && <p>No email - skip email send</p>}
              {missingPhone && <p>No phone - skip SMS send</p>}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="h-6 w-6 flex-shrink-0"
        data-testid={`button-remove-contact-${contact.id}`}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
