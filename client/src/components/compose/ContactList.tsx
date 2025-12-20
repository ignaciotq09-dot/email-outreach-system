import { Button } from "@/components/ui/button";
import { Trash2, Search, RefreshCw } from "lucide-react";
import ContactSelectorItem from "../contact-selector-item";
import type { Contact } from "@shared/schema";
import type { OutreachChannel } from "./types";

interface ContactListProps {
  contacts: Contact[];
  selectedContactIds: Set<number>;
  outreachChannel: OutreachChannel;
  isFetching: boolean;
  onToggleContact: (id: number) => void;
  onRemoveContact: (id: number) => void;
  onRefresh: () => void;
  onDeleteAll: () => void;
  onNavigateToLeadFinder?: () => void;
}

export default function ContactList({
  contacts,
  selectedContactIds,
  outreachChannel,
  isFetching,
  onToggleContact,
  onRemoveContact,
  onRefresh,
  onDeleteAll,
  onNavigateToLeadFinder,
}: ContactListProps) {
  return (
    <div className="p-6 border border-border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">
            Campaign Contacts {contacts.length > 0 && `(${selectedContactIds.size}/${contacts.length} selected)`}
          </h3>
          {contacts.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isFetching}
              className="h-7 w-7"
              title="Refresh contacts from database"
              data-testid="button-refresh-campaign-contacts"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {contacts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteAll}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid="button-delete-all-contacts"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete All
            </Button>
          )}
          {onNavigateToLeadFinder && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToLeadFinder}
              data-testid="button-find-contacts"
            >
              <Search className="w-4 h-4 mr-1" />
              Find Contacts
            </Button>
          )}
        </div>
      </div>
      
      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p data-testid="text-no-campaign-contacts">No contacts added yet</p>
          <p className="text-sm mt-1">Add contacts above or use Find Contacts to search leads</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <ContactSelectorItem
              key={contact.id}
              contact={contact}
              isSelected={selectedContactIds.has(contact.id)}
              onToggle={() => onToggleContact(contact.id)}
              onRemove={() => onRemoveContact(contact.id)}
              outreachChannel={outreachChannel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
