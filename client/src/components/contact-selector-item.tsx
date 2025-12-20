import { memo } from "react";
import { CheckCircle2, Circle, X, Mail, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Contact } from "@shared/schema";

type OutreachChannel = 'email' | 'sms' | 'both';

interface ContactSelectorItemProps {
  contact: Contact;
  isSelected: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  outreachChannel?: OutreachChannel;
}

function ContactSelectorItem({ contact, isSelected, onToggle, onRemove, outreachChannel = 'email' }: ContactSelectorItemProps) {
  const hasEmail = Boolean(contact.email);
  const hasPhone = Boolean(contact.phone);
  
  // Determine if contact can receive messages on selected channel(s)
  const canReceiveEmail = outreachChannel !== 'sms' && hasEmail;
  const canReceiveSms = outreachChannel !== 'email' && hasPhone;
  
  // Check for channel-specific issues
  const missingEmail = outreachChannel !== 'sms' && !hasEmail;
  const missingPhone = outreachChannel !== 'email' && !hasPhone;
  const hasMissingData = missingEmail || missingPhone;
  
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover-elevate transition-all ${
        isSelected ? 'bg-primary/10 border border-primary' : 'bg-muted/30 border border-transparent'
      } ${hasMissingData && isSelected ? 'border-yellow-500/50' : ''}`}
      data-testid={`contact-selector-${contact.id}`}
    >
      <div 
        className="flex-shrink-0"
        onClick={onToggle}
      >
        {isSelected ? (
          <CheckCircle2 className="w-5 h-5 text-primary" data-testid={`check-selected-${contact.id}`} />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground" data-testid={`check-unselected-${contact.id}`} />
        )}
      </div>
      <div 
        className="flex-1 min-w-0"
        onClick={onToggle}
      >
        <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
        <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
      </div>
      
      {/* Channel availability indicators */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {(outreachChannel === 'email' || outreachChannel === 'both') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-1 rounded ${hasEmail ? 'text-green-500' : 'text-muted-foreground/50'}`}>
                <Mail className="w-3.5 h-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasEmail ? contact.email : 'No email address'}
            </TooltipContent>
          </Tooltip>
        )}
        {(outreachChannel === 'sms' || outreachChannel === 'both') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`p-1 rounded ${hasPhone ? 'text-green-500' : 'text-muted-foreground/50'}`}>
                <Phone className="w-3.5 h-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasPhone ? contact.phone : 'No phone number'}
            </TooltipContent>
          </Tooltip>
        )}
        {hasMissingData && isSelected && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-yellow-500 p-1">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {missingEmail && <p>Missing email - cannot send email</p>}
                {missingPhone && <p>Missing phone - cannot send SMS</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          data-testid={`button-remove-contact-${contact.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Use default shallow comparison - parent should use useCallback for onToggle
export default memo(ContactSelectorItem);
