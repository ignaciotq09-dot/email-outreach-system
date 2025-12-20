import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Building2, Briefcase, Phone, FileText, Search } from "lucide-react";
import type { Contact } from "@shared/schema";
import { DeepDiveModal } from "./deep-dive-modal";

interface ContactProfileViewProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactProfileView({ contact, open, onOpenChange }: ContactProfileViewProps) {
  const [showDeepDive, setShowDeepDive] = useState(false);
  
  if (!contact) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-contact-profile">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Contact Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{contact.pronoun} {contact.name}</h3>
                  {contact.position && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Briefcase className="w-4 h-4" />
                      {contact.position}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDeepDive(true)}
                    data-testid="button-deep-dive"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Deep Dive
                  </Button>
                  <Badge variant="outline">
                    Contact
                  </Badge>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p className="text-sm text-muted-foreground">{contact.company}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground break-all">{contact.email}</p>
                </div>
              </div>

              {contact.phone && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                </div>
              )}

              {contact.notes && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 md:col-span-2">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <DeepDiveModal 
      contactId={contact.id} 
      contactName={contact.name} 
      open={showDeepDive} 
      onOpenChange={setShowDeepDive} 
    />
    </>
  );
}
